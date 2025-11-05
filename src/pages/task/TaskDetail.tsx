import { useParams } from 'react-router-dom'
import { useTask } from '../../hooks/useTask'

function StatusBadge({ status }: { status: string }) {
  const color = status === 'completed' ? 'bg-green-100 text-green-800'
    : status === 'failed' ? 'bg-red-100 text-red-800'
    : status === 'action_required' ? 'bg-amber-100 text-amber-800'
    : status === 'help_required' ? 'bg-blue-100 text-blue-800'
    : ['in_progress','validation','function_execution','agent_turn'].includes(status) ? 'bg-primary-100 text-primary-800'
    : 'bg-gray-100 text-gray-700'
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status.replace(/_/g,' ')}</span>
}

function ProgressBar({ value, max, status }: { value: number; max: number; status: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100))
  const bar = status === 'completed' ? 'bg-green-600' : status === 'failed' ? 'bg-red-600' : 'bg-primary-600'
  return (
    <div className="w-full bg-gray-200 rounded h-2">
      <div className={`h-2 rounded ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function TaskDetail() {
  const { id } = useParams()
  const { data: task, isLoading, error } = useTask(id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Task Detail</h1>
        <div className="text-sm text-gray-500 font-mono">{id?.slice(0,8)}</div>
      </div>

      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load task</div>}

      {task && (
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={task.status} />
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{task.workflow_id.toUpperCase()}</span>
                  {task.ticket_id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{task.ticket_id}</span>
                  )}
                </div>
                <div className="text-lg text-gray-900 truncate" title={task.goal_prompt}>{task.goal_prompt || task.ticket_id || task.id}</div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div className="text-gray-600">Iteration <span className="font-medium text-gray-900">{task.iteration}/{task.max_iterations}</span></div>
                  <div className="text-gray-600">Updated <span className="font-medium text-gray-900">{new Date(task.updated_at).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={task.iteration} max={task.max_iterations} status={task.status} />
            </div>
          </div>

          {/* Critical banners */}
          {task.status === 'action_required' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
              <div className="text-sm text-amber-800 font-medium">Supervisor action required</div>
              {task.approval_reason && <div className="text-sm text-amber-700 whitespace-pre-wrap">{task.approval_reason}</div>}
            </div>
          )}
          {task.status === 'help_required' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-sm text-blue-800 font-medium">Agent needs help</div>
              {task.approval_reason && <div className="text-sm text-blue-700 whitespace-pre-wrap">{task.approval_reason}</div>}
            </div>
          )}

          {/* Placeholder for conversation and workflow-specific panels - next tasks will fill */}
          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-gray-600">Conversation and workflow-specific views will appear here.</div>
          </div>
        </div>
      )}
    </div>
  )
}


