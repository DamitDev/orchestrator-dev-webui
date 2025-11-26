import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTasks, groupTasksForInbox, tasksKeys } from '../hooks/useTasks'
import type { Task } from '../types/api'
import { useWebSocket } from '../ws/WebSocketProvider'
import { TaskIdBadge } from '../components/TaskIdBadge'
import { CheckCircle2, AlertCircle, MessageCircle, Play } from 'lucide-react'

/** Get the correct detail page URL for a task based on its workflow */
function getTaskDetailUrl(task: Task): string {
  if (task.workflow_id === 'self_managed') {
    return `/mio/${task.id}`
  }
  return `/task/${task.id}`
}

const sectionIcons = {
  'Pending Approvals': '●',
  'Help Required': '●',
  'User Turn': '●',
  'Running': '●'
}

const sectionColors = {
  'Pending Approvals': 'from-nord13/20 to-nord13/5 border-nord13/30',
  'Help Required': 'from-nord8/20 to-nord8/5 border-nord8/30',
  'User Turn': 'from-nord10/20 to-nord10/5 border-nord10/30',
  'Running': 'from-nord14/20 to-nord14/5 border-nord14/30'
}

function Section({ title, tasks }: { title: string; tasks: Task[] }) {
  const top = tasks.slice(0, 5)
  const icon = sectionIcons[title as keyof typeof sectionIcons] || '📋'
  const gradient = sectionColors[title as keyof typeof sectionColors] || 'from-nord8/10 to-nord8/5 border-nord8/20'
  
  return (
    <div className={`card p-5 bg-gradient-to-br ${gradient} hover:shadow-nord-lg transition-all border`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="font-semibold text-nord0 dark:text-nord6">{title}</h2>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          tasks.length === 0 
            ? 'bg-nord5 text-nord3 dark:bg-nord2 dark:text-nord4' 
            : 'bg-nord8 text-nord0 shadow-sm dark:bg-nord8/80'
        }`}>
          {tasks.length}
        </span>
      </div>
      {top.length === 0 ? (
        <div className="text-center py-8 text-nord3 dark:text-nord4">
          <p className="text-sm">No items</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {top.map(t => (
            <li key={t.id} className="group">
              <Link 
                to={getTaskDetailUrl(t)} 
                className="block p-3 rounded-lg bg-nord6/50 hover:bg-nord6 border border-nord5 hover:border-nord8/30 
                           dark:bg-nord1/50 dark:hover:bg-nord2 dark:border-nord2 dark:hover:border-nord8/30
                           transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm text-nord0 dark:text-nord6 truncate group-hover:text-nord10 transition-colors">
                    {t.ticket_id || t.goal_prompt || t.id}
                  </div>
                  <TaskIdBadge taskId={t.id} />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-nord8/20 text-nord10 font-medium dark:bg-nord8/10 dark:text-nord8">
                    {t.workflow_id}
                  </span>
                  <span className="text-nord3 dark:text-nord4">
                    {t.status.replace(/_/g,' ')}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 5 && (
        <div className="mt-3 pt-3 border-t border-nord5/50 dark:border-nord2 text-center">
          <Link 
            to="/tasks" 
            className="text-sm text-nord10 hover:text-nord8 font-medium transition-colors dark:text-nord8 dark:hover:text-nord7"
          >
            +{tasks.length - 5} more →
          </Link>
        </div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
            Inbox
          </h1>
          <p className="text-nord3 dark:text-nord4 mt-1">
            Triage view for approvals, help requests, user turns, and running tasks.
          </p>
        </div>
        {!isLoading && !error && (
          <div className="text-right">
            <div className="text-2xl font-bold text-nord10 dark:text-nord8">
              {tasks.length}
            </div>
            <div className="text-xs text-nord3 dark:text-nord4">
              Total Tasks
            </div>
          </div>
        )}
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
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Section title="Pending Approvals" tasks={grouped.approvals} />
          <Section title="Help Required" tasks={grouped.help} />
          <Section title="User Turn" tasks={grouped.userTurn} />
          <Section title="Running" tasks={grouped.running} />
        </div>
      )}
    </div>
  )
}


