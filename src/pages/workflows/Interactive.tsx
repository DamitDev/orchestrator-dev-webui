import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, tasksKeys } from '../../hooks/useTasks'
import type { Task, TasksQueryParams } from '../../types/api'

function Card({ t }: { t: Task }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-500 font-mono">{t.id.slice(0,8)}</span>
        <span className="text-xs text-gray-500">{t.status.replace(/_/g,' ')}</span>
      </div>
      <Link to={`/task/${t.id}`} className="text-sm link-muted truncate block">{t.goal_prompt || t.id}</Link>
      {t.status === 'user_turn' && <div className="text-xs text-blue-700 mt-1">Waiting for your input</div>}
    </div>
  )
}

export default function WorkflowInteractive() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()
  const [filter, setFilter] = useState<'all'|'user_turn'|'running'>('all')
  const params: TasksQueryParams = { page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }
  const { data, isLoading, error } = useTasks(params)

  useEffect(() => {
    const id = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
    }, { eventTypes: ['task_status_changed','task_deleted','message_added'] })
    return () => {}
  }, [subscribe, queryClient, params])

  const items = useMemo(() => {
    const list = (data?.tasks || []).filter(t => t.workflow_id === 'interactive')
    if (filter === 'all') return list
    if (filter === 'running') return list.filter(t => ['in_progress','validation','function_execution','agent_turn'].includes(t.status))
    return list.filter(t => t.status === filter)
  }, [data, filter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Interactive</h1>
        <div className="text-sm text-gray-500">{items.length} items</div>
      </div>
      <div className="toolbar flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">Quick filter:</span>
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="select">
          <option value="all">All</option>
          <option value="user_turn">User turn</option>
          <option value="running">Running</option>
        </select>
      </div>
      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tasks</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(t => <Card key={t.id} t={t} />)}
      </div>
    </div>
  )
}
  