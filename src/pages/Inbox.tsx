import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, groupTasksForInbox, tasksKeys } from '../hooks/useTasks'
import type { Task } from '../types/api'
import { useWebSocket } from '../ws/WebSocketProvider'

function Section({ title, tasks }: { title: string; tasks: Task[] }) {
  const top = tasks.slice(0, 5)
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium text-gray-900 dark:text-gray-100">{title}</h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">{tasks.length}</span>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No items</p>
      ) : (
        <ul className="space-y-2">
          {top.map(t => (
            <li key={t.id} className="text-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-gray-900 dark:text-gray-100">
                  <Link className="link-muted" to={`/task/${t.id}`}>{t.ticket_id || t.goal_prompt || t.id}</Link>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t.workflow_id} • {t.status.replace(/_/g,' ')}</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{t.id.slice(0,8)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Inbox() {
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()
  const { data, isLoading, error } = useTasks({ page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' })

  useEffect(() => {
    const id = subscribe(() => {
      // Invalidate tasks on relevant events for fresh inbox
      queryClient.invalidateQueries({ queryKey: tasksKeys.list({ page: 1, limit: 250, order_by: 'updated_at', order_direction: 'desc' }) })
    }, { eventTypes: ['task_status_changed', 'approval_requested', 'help_requested', 'message_added', 'task_deleted'] })
    return () => { /* cleanup */ }
  }, [subscribe, queryClient])

  const tasks = data?.tasks || []
  const grouped = groupTasksForInbox(tasks)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <p className="text-gray-600">Triage view for approvals, help requests, user turns, and running tasks.</p>
      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tasks</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Section title="Pending Approvals" tasks={grouped.approvals} />
        <Section title="Help Required" tasks={grouped.help} />
        <Section title="User Turn" tasks={grouped.userTurn} />
        <Section title="Running" tasks={grouped.running} />
      </div>
    </div>
  )
}


