import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useMode } from '../state/ModeContext'
import { useTasks, tasksKeys, useCancelTask } from '../hooks/useTasks'
import type { Task, TasksQueryParams } from '../types/api'
import { useWebSocket } from '../ws/WebSocketProvider'
import { tasksApi } from '../lib/api'
import { formatTimestamp } from '../lib/time'
import { TaskIdBadge } from '../components/TaskIdBadge'
import toast from 'react-hot-toast'
import { XCircle } from 'lucide-react'

type WorkflowFilter = 'all' | 'ticket' | 'matrix' | 'proactive' | 'interactive'

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${
    status === 'completed' ? 'status--completed'
    : status === 'failed' ? 'status--failed'
    : status === 'action_required' ? 'status--action_required'
    : status === 'help_required' ? 'status--help_required'
    : ['in_progress','validation','function_execution','agent_turn'].includes(status) ? 'status--running'
    : 'badge'
  }`}>{status.replace(/_/g,' ')}</span>
}

function TaskCard({ task, selected, onToggle, onCancel }: { task: Task; selected: boolean; onToggle: (id: string, checked: boolean) => void; onCancel: (id: string) => void }) {
  const canCancel = !['completed', 'failed', 'cancelled', 'canceled'].includes(task.status)
  
  return (
    <div className={`card p-5 transition-all ${selected ? 'ring-2 ring-nord8 bg-nord8/5 dark:bg-nord8/5' : 'hover:shadow-nord-lg'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <StatusBadge status={task.status} />
            <TaskIdBadge taskId={task.id} />
            <span className="badge bg-nord8/20 text-nord10 border-nord8/30 dark:bg-nord8/10 dark:text-nord8">
              {task.workflow_id}
            </span>
            {task.ticket_id && (
              <span className="badge bg-nord15/20 text-nord15 border-nord15/30">
                {task.ticket_id}
              </span>
            )}
          </div>
          <Link to={`/task/${task.id}`} className="block text-sm font-medium link-muted truncate hover:text-nord8">
            {task.goal_prompt || task.ticket_id || task.id}
          </Link>
          <div className="flex items-center gap-3 mt-2 text-xs">
            {(['ticket','proactive'].includes(task.workflow_id)) && (
              <div className="text-nord3 dark:text-nord4">
                Iteration <span className="font-semibold text-nord10 dark:text-nord8">{task.iteration}/{task.max_iterations}</span>
              </div>
            )}
            {task.workflow_id === 'matrix' && (
              <div className="text-nord3 dark:text-nord4">
                Phase <span className="font-semibold text-nord10 dark:text-nord8">{(task.workflow_data?.phase ?? 0)}/4</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onCancel(task.id)
              }}
              className="p-1.5 rounded hover:bg-nord11/10 text-nord11 transition-colors"
              title="Cancel task"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          <input 
            type="checkbox" 
            checked={selected} 
            onChange={e => onToggle(task.id, e.target.checked)} 
            className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3" 
          />
        </div>
      </div>
    </div>
  )
}

function TasksTable({ tasks, selected, onToggle, onCancel }: { tasks: Task[]; selected: Set<string>; onToggle: (id: string, checked: boolean) => void; onCancel: (id: string) => void }) {
  return (
    <div className="overflow-auto card shadow-nord-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-nord5 to-nord6 text-nord0 dark:from-nord2 dark:to-nord1 dark:text-nord6 border-b-2 border-nord8/30">
          <tr>
            <th className="px-4 py-3 text-left w-8"></th>
            <th className="px-4 py-3 text-left font-semibold">ID</th>
            <th className="px-4 py-3 text-left font-semibold">Workflow</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Goal / Ticket</th>
            <th className="px-4 py-3 text-left font-semibold">Progress</th>
            <th className="px-4 py-3 text-left font-semibold">Updated</th>
            <th className="px-4 py-3 text-left w-16"></th>
          </tr>
        </thead>
        <tbody className="text-nord0 dark:text-nord6">
          {tasks.map((t, idx) => (
            <tr key={t.id} className={`border-t border-nord4 dark:border-nord2 hover:bg-nord8/5 transition-colors ${
              selected.has(t.id) ? 'bg-nord8/10 dark:bg-nord8/5' : ''
            }`}>
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selected.has(t.id)} 
                  onChange={e => onToggle(t.id, e.target.checked)}
                  className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3"
                />
              </td>
              <td className="px-4 py-3">
                <TaskIdBadge taskId={t.id} />
              </td>
              <td className="px-4 py-3">
                <span className="badge bg-nord8/20 text-nord10 border-nord8/30 dark:bg-nord8/10 dark:text-nord8">
                  {t.workflow_id}
                </span>
              </td>
              <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
              <td className="px-4 py-3 max-w-[420px]">
                <Link to={`/task/${t.id}`} className="link-muted truncate inline-block max-w-full align-top hover:text-nord8 font-medium">
                  {t.ticket_id || t.goal_prompt || t.id}
                </Link>
              </td>
              <td className="px-4 py-3 text-nord3 dark:text-nord4">
                {(['ticket','proactive'].includes(t.workflow_id)) && (
                  <span className="font-medium">
                    <span className="text-nord10 dark:text-nord8">{t.iteration}</span>/{t.max_iterations}
                  </span>
                )}
                {t.workflow_id === 'matrix' && (
                  <span className="font-medium">
                    Phase <span className="text-nord10 dark:text-nord8">{(t.workflow_data?.phase ?? 0)}</span>/4
                  </span>
                )}
                {t.workflow_id === 'interactive' && (
                  <span className="text-nord3 dark:text-nord4">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-nord3 dark:text-nord4">{formatTimestamp(t.updated_at)}</td>
              <td className="px-4 py-3">
                {!['completed', 'failed', 'cancelled', 'canceled'].includes(t.status) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onCancel(t.id)
                    }}
                    className="p-1.5 rounded hover:bg-nord11/10 text-nord11 transition-colors"
                    title="Cancel task"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </td>
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
  const cancelTaskMutation = useCancelTask()

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

  const params: TasksQueryParams = { 
    page, 
    limit, 
    order_by: orderBy, 
    order_direction: orderDirection,
    workflow_id: workflow === 'all' ? undefined : workflow
  }
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
      matchesSearch(t) &&
      ((showApprovals || t.status !== 'action_required')) &&
      ((showHelp || t.status !== 'help_required')) &&
      ((showUserTurn || t.status !== 'user_turn')) &&
      ((showRunning || !isRunning(t.status)))
    ))
  }, [tasks, search, showApprovals, showHelp, showUserTurn, showRunning])

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
            Tasks
          </h1>
          <p className="text-nord3 dark:text-nord4 mt-1">
            Manage and monitor all orchestrator tasks
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-nord10 dark:text-nord8">
            {data?.pagination?.total_items ?? 0}
          </div>
          <div className="text-xs text-nord3 dark:text-nord4">
            Total Tasks
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-5 space-y-4 shadow-nord-lg">
        <div className="flex flex-wrap items-center gap-3">
          <select value={workflow} onChange={e => { setWorkflow(e.target.value as WorkflowFilter); setPage(1) }} className="select">
            <option value="all">All workflows</option>
            <option value="ticket">Ticket</option>
            <option value="matrix">Matrix</option>
            <option value="proactive">Proactive</option>
            <option value="interactive">Interactive</option>
          </select>
          <div className="flex-1 min-w-[240px]">
              <input 
                id="tasks-search" 
                aria-label="Search tasks" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="🔍 Search by ID, goal, or ticket" 
                className="input text-sm w-full font-normal"
            />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={() => { setOrderBy('updated_at'); setOrderDirection(orderDirection === 'desc' ? 'asc' : 'desc') }} 
              className={`btn-outline text-sm ${orderBy === 'updated_at' ? 'bg-nord8/10 border-nord8' : ''}`}
            >
              {orderBy === 'updated_at' ? (orderDirection === 'desc' ? '↓' : '↑') : ''} Updated
            </button>
            <button 
              onClick={() => { setOrderBy('created_at'); setOrderDirection(orderDirection === 'desc' ? 'asc' : 'desc') }} 
              className={`btn-outline text-sm ${orderBy === 'created_at' ? 'bg-nord8/10 border-nord8' : ''}`}
            >
              {orderBy === 'created_at' ? (orderDirection === 'desc' ? '↓' : '↑') : ''} Created
            </button>
            <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} className="select">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-nord4 dark:border-nord2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-nord0 dark:text-nord6 cursor-pointer">
              <input type="checkbox" checked={!showApprovals} onChange={e => setShowApprovals(!e.target.checked)} className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3" /> 
              Hide approvals
            </label>
            <label className="flex items-center gap-2 text-sm text-nord0 dark:text-nord6 cursor-pointer">
              <input type="checkbox" checked={!showHelp} onChange={e => setShowHelp(!e.target.checked)} className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3" /> 
              Hide help
            </label>
            <label className="flex items-center gap-2 text-sm text-nord0 dark:text-nord6 cursor-pointer">
              <input type="checkbox" checked={!showUserTurn} onChange={e => setShowUserTurn(!e.target.checked)} className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3" /> 
              Hide user turn
            </label>
            <label className="flex items-center gap-2 text-sm text-nord0 dark:text-nord6 cursor-pointer">
              <input type="checkbox" checked={!showRunning} onChange={e => setShowRunning(!e.target.checked)} className="rounded border-nord4 text-nord8 focus:ring-nord8 dark:border-nord3" /> 
              Hide running
            </label>
          </div>
          
          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-nord10 dark:text-nord8 font-semibold">
                {selected.size} selected
              </span>
              <button onClick={selectAllVisible} className="btn-outline text-sm">Select visible</button>
              <button onClick={clearSelection} className="btn-outline text-sm">Clear</button>
              <button onClick={bulkCancel} className="btn-outline text-sm">Cancel</button>
              <button onClick={bulkDelete} className="btn-danger text-sm">Delete</button>
            </div>
          )}
          {selected.size === 0 && (
            <button onClick={selectAllVisible} className="btn-outline text-sm ml-auto">Select all visible</button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-nord8 border-t-transparent"></div>
          <p className="mt-4 text-nord3 dark:text-nord4">Loading tasks...</p>
        </div>
      )}
      
      {error && (
        <div className="card p-6 bg-nord11/10 border border-nord11/30 text-center">
          <div className="text-nord11 font-semibold">Failed to load tasks</div>
        </div>
      )}

      {/* Content */}
      {mode === 'expert' ? (
        <TasksTable tasks={filtered} selected={selected} onToggle={toggleSelected} onCancel={(id) => cancelTaskMutation.mutate(id)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TaskCard key={t.id} task={t} selected={selected.has(t.id)} onToggle={toggleSelected} onCancel={(id) => cancelTaskMutation.mutate(id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && (
        <div className="card p-4 flex items-center justify-between text-sm">
          <div className="text-nord0 dark:text-nord6">
            Page <span className="font-bold text-nord10 dark:text-nord8">{data?.pagination?.current_page ?? page}</span> 
            {' '}/{' '}
            <span className="font-bold">{data?.pagination?.total_pages ?? 1}</span>
            <span className="text-nord3 dark:text-nord4 ml-2">
              ({filtered.length} of {data?.pagination?.total_items ?? 0} items)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p-1))} 
              disabled={!data?.pagination?.has_prev} 
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button 
              onClick={() => setPage(p => p+1)} 
              disabled={!data?.pagination?.has_next} 
              className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


