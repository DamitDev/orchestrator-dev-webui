import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, tasksKeys } from '../../hooks/useTasks'
import type { Task, TasksQueryParams } from '../../types/api'

function TicketCard({ t }: { t: Task }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        {t.ticket_id && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{t.ticket_id}</span>}
        <span className="text-xs text-gray-500 font-mono">{t.id.slice(0,8)}</span>
        <span className="text-xs text-gray-500">{t.status.replace(/_/g,' ')}</span>
      </div>
      <Link to={`/task/${t.id}`} className="text-sm link-muted truncate block">{t.goal_prompt || t.ticket_id || t.id}</Link>
      <div className="text-xs text-gray-500 mt-1">Iteration {t.iteration}/{t.max_iterations}</div>
    </div>
  )
}

export default function WorkflowTickets() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()
  const [statusFilter, setStatusFilter] = useState<'all'|'action_required'|'help_required'>('all')
  const params: TasksQueryParams = { page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }
  const { data, isLoading, error } = useTasks(params)

  useEffect(() => {
    const id = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
    }, { eventTypes: ['task_status_changed','task_deleted','approval_requested','help_requested'] })
    return () => { /* cleanup */ }
  }, [subscribe, queryClient, params])

  const tickets = useMemo(() => {
    const list = (data?.tasks || []).filter(t => t.workflow_id === 'ticket')
    if (statusFilter === 'all') return list
    return list.filter(t => t.status === statusFilter)
  }, [data, statusFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <div className="text-sm text-gray-500">{tickets.length} items</div>
      </div>
      <div className="toolbar flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Status:</span>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="select">
          <option value="all">All</option>
          <option value="action_required">Action required</option>
          <option value="help_required">Help required</option>
        </select>
      </div>
      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tasks</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickets.map(t => <TicketCard key={t.id} t={t} />)}
      </div>
    </div>
  )
}


