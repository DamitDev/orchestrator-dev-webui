import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMode } from '../state/ModeContext'
import { useTasks, tasksKeys } from '../hooks/useTasks'
import type { Task, TasksQueryParams } from '../types/api'
import { useWebSocket } from '../ws/WebSocketProvider'
import { tasksApi } from '../lib/api'
import { formatTimestamp } from '../lib/time'
import toast from 'react-hot-toast'

type WorkflowFilter = 'all' | 'ticket' | 'matrix' | 'proactive' | 'interactive'

function StatusBadge({ status }: { status: string }) {
  const color = status === 'completed' ? 'bg-green-100 text-green-800'
    : status === 'failed' ? 'bg-red-100 text-red-800'
    : status === 'action_required' ? 'bg-amber-100 text-amber-800'
    : status === 'help_required' ? 'bg-blue-100 text-blue-800'
    : ['in_progress','validation','function_execution','agent_turn'].includes(status) ? 'bg-primary-100 text-primary-800'
    : 'bg-gray-100 text-gray-700'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status.replace(/_/g,' ')}</span>
}

function TaskCard({ task, selected, onToggle }: { task: Task; selected: boolean; onToggle: (id: string, checked: boolean) => void }) {
  return (
    <div className={`card p-4 ${selected ? 'ring-2 ring-primary-400' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={task.status} />
            <span className="text-xs font-mono text-gray-500 dark:text-gray-300">{task.id.slice(0,8)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-300">{task.workflow_id}</span>
            {task.ticket_id && (
              <span className="badge">{task.ticket_id}</span>
            )}
          </div>
          <Link to={`/task/${task.id}`} className="block text-sm link-muted truncate">
            {task.goal_prompt || task.ticket_id || task.id}
          </Link>
          {(['ticket','proactive'].includes(task.workflow_id)) && (
            <div className="small-muted mt-1">Iteration {task.iteration}/{task.max_iterations}</div>
          )}
          {task.workflow_id === 'matrix' && (
            <div className="small-muted mt-1">Phase {(task.workflow_data?.phase ?? 0)}/4</div>
          )}
        </div>
        <input type="checkbox" checked={selected} onChange={e => onToggle(task.id, e.target.checked)} className="mt-1" />
      </div>
    </div>
  )
}

function TasksTable({ tasks, selected, onToggle }: { tasks: Task[]; selected: Set<string>; onToggle: (id: string, checked: boolean) => void }) {
  return (
    <div className="overflow-auto card">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <tr>
            <th className="px-3 py-2 text-left w-8"></th>
            <th className="px-3 py-2 text-left">ID</th>
            <th className="px-3 py-2 text-left">Workflow</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Goal / Ticket</th>
            <th className="px-3 py-2 text-left">Progress</th>
            <th className="px-3 py-2 text-left">Updated</th>
          </tr>
        </thead>
        <tbody className="dark:text-gray-200">
          {tasks.map(t => (
            <tr key={t.id} className="border-t dark:border-gray-700">
              <td className="px-3 py-2"><input type="checkbox" checked={selected.has(t.id)} onChange={e => onToggle(t.id, e.target.checked)} /></td>
              <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{t.id.slice(0,8)}</td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{t.workflow_id}</td>
              <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
              <td className="px-3 py-2 max-w-[420px]">
                <Link to={`/task/${t.id}`} className="link-muted truncate inline-block max-w-full align-top">
                  {t.ticket_id || t.goal_prompt || t.id}
                </Link>
              </td>
              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                {(['ticket','proactive'].includes(t.workflow_id)) && (
                  <span>{t.iteration}/{t.max_iterations}</span>
                )}
                {t.workflow_id === 'matrix' && (
                  <span>Phase {(t.workflow_data?.phase ?? 0)}/4</span>
                )}
                {t.workflow_id === 'interactive' && (
                  <span>-</span>
                )}
              </td>
              <td className="px-3 py-2 small-muted">{formatTimestamp(t.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Tasks() {
  const { mode } = useMode()
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const [workflow, setWorkflow] = useState<WorkflowFilter>('all')
  const [search, setSearch] = useState('')
  const searchRef = useState<HTMLInputElement | null>(null)[0]
  useEffect(() => {
    const onFocus = () => {
      (document.getElementById('tasks-search') as HTMLInputElement | null)?.focus()
    }
    window.addEventListener('focus-search', onFocus as any)
    return () => window.removeEventListener('focus-search', onFocus as any)
  }, [])
  const [showApprovals, setShowApprovals] = useState(true)
  const [showHelp, setShowHelp] = useState(true)
  const [showUserTurn, setShowUserTurn] = useState(true)
  const [showRunning, setShowRunning] = useState(true)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [orderBy, setOrderBy] = useState<TasksQueryParams['order_by']>('updated_at')
  const [orderDirection, setOrderDirection] = useState<TasksQueryParams['order_direction']>('desc')

  const params: TasksQueryParams = { page, limit, order_by: orderBy, order_direction: orderDirection }
  const { data, isLoading, error, refetch } = useTasks(params)

  useEffect(() => {
    const id = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
    }, { eventTypes: ['task_status_changed','task_deleted','message_added','approval_requested','help_requested'] })
    return () => { /* WS will be cleaned up by provider on unmount */ }
  }, [subscribe, queryClient, params])

  const tasks = data?.tasks || []
  const filtered = useMemo(() => {
    const matchesSearch = (t: Task) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (t.goal_prompt?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || (t.ticket_id || '').toLowerCase().includes(q))
    }
    const isRunning = (s: string) => ['in_progress','validation','function_execution','agent_turn'].includes(s)
    return tasks.filter(t => (
      (workflow === 'all' || t.workflow_id === workflow) &&
      matchesSearch(t) &&
      ((showApprovals || t.status !== 'action_required')) &&
      ((showHelp || t.status !== 'help_required')) &&
      ((showUserTurn || t.status !== 'user_turn')) &&
      ((showRunning || !isRunning(t.status)))
    ))
  }, [tasks, workflow, search, showApprovals, showHelp, showUserTurn, showRunning])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggleSelected = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }
  const selectAllVisible = () => setSelected(new Set(filtered.map(t => t.id)))
  const clearSelection = () => setSelected(new Set())

  const bulkCancel = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    await Promise.all(ids.map(id => tasksApi.cancel(id).catch(() => null)))
    toast.success('Cancel requested')
    clearSelection()
    queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
  }
  const bulkDelete = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    try {
      const res = await tasksApi.deleteMultiple(ids)
      toast.success(`Deleted ${res.deleted_tasks.length} tasks`)
    } catch {
      toast.error('Failed to delete tasks')
    }
    clearSelection()
    queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="text-sm text-gray-500">Total: {data?.pagination?.total_items ?? 0}</div>
      </div>

      {/* Controls */}
      <div className="toolbar flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select value={workflow} onChange={e => setWorkflow(e.target.value as WorkflowFilter)} className="select">
            <option value="all">All workflows</option>
            <option value="ticket">Ticket</option>
            <option value="matrix">Matrix</option>
            <option value="proactive">Proactive</option>
            <option value="interactive">Interactive</option>
          </select>
          <input id="tasks-search" aria-label="Search tasks" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search (ID, goal, ticket)" className="input text-sm min-w-[240px]" />
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => { setOrderBy('updated_at'); setOrderDirection(orderDirection === 'desc' ? 'asc' : 'desc') }} className="btn-outline text-sm">Updated {orderBy==='updated_at' ? `(${orderDirection})` : ''}</button>
            <button onClick={() => { setOrderBy('created_at'); setOrderDirection(orderDirection === 'desc' ? 'asc' : 'desc') }} className="btn-outline text-sm">Created {orderBy==='created_at' ? `(${orderDirection})` : ''}</button>
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="select">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={showApprovals} onChange={e => setShowApprovals(e.target.checked)} /> Hide approvals</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={showHelp} onChange={e => setShowHelp(e.target.checked)} /> Hide help</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={showUserTurn} onChange={e => setShowUserTurn(e.target.checked)} /> Hide user turn</label>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={showRunning} onChange={e => setShowRunning(e.target.checked)} /> Hide running</label>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={selectAllVisible} className="btn-outline text-sm">Select visible</button>
            <button onClick={clearSelection} className="btn-outline text-sm">Clear</button>
            <button onClick={bulkCancel} disabled={selected.size===0} className="btn-outline text-sm disabled:opacity-50">Cancel</button>
            <button onClick={bulkDelete} disabled={selected.size===0} className="btn-danger text-sm disabled:opacity-50">Delete</button>
          </div>
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tasks</div>}

      {/* Content */}
      {mode === 'expert' ? (
        <TasksTable tasks={filtered} selected={selected} onToggle={toggleSelected} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} selected={selected.has(t.id)} onToggle={toggleSelected} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>Page {data?.pagination?.current_page ?? page} / {data?.pagination?.total_pages ?? 1}</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={!data?.pagination?.has_prev} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
          <button onClick={() => setPage(p => p+1)} disabled={!data?.pagination?.has_next} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  )
}


