import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, tasksKeys } from '../../hooks/useTasks'
import type { Task, TasksQueryParams } from '../../types/api'

function Card({ t }: { t: Task }) {
  const phase = (t.workflow_data?.phase ?? 0) as number
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded">Phase {phase}</span>
        <span className="text-xs text-gray-500 font-mono">{t.id.slice(0,8)}</span>
        <span className="text-xs text-gray-500">{t.status.replace(/_/g,' ')}</span>
      </div>
      <Link to={`/task/${t.id}`} className="text-sm text-gray-900 underline decoration-dotted truncate block">{t.goal_prompt || t.id}</Link>
    </div>
  )
}

export default function WorkflowMatrix() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()
  const [phaseFilter, setPhaseFilter] = useState<number| 'all'>('all')
  const params: TasksQueryParams = { page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }
  const { data, isLoading, error } = useTasks(params)

  useEffect(() => {
    const id = subscribe(() => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.list(params) })
    }, { eventTypes: ['task_status_changed','task_deleted','task_workflow_data_changed'] })
    return () => {}
  }, [subscribe, queryClient, params])

  const items = useMemo(() => {
    let list = (data?.tasks || []).filter(t => t.workflow_id === 'matrix')
    if (phaseFilter !== 'all') list = list.filter(t => (t.workflow_data?.phase ?? 0) === phaseFilter)
    return list
  }, [data, phaseFilter])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Matrix</h1>
        <div className="text-sm text-gray-500">{items.length} items</div>
      </div>
      <div className="bg-white border rounded p-3 flex items-center gap-2">
        <span className="text-sm text-gray-700">Phase:</span>
        <select value={phaseFilter as any} onChange={e => setPhaseFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))} className="px-2 py-1 border rounded text-sm">
          <option value="all">All</option>
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
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


