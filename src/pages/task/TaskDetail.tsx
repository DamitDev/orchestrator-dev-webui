import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTask, useTaskConversation, useMatrixConversation, taskKeys } from '../../hooks/useTask'
import { useMode } from '../../state/ModeContext'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { tasksApi } from '../../lib/api'

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
  const { mode } = useMode()
  const { subscribe } = useWebSocket()
  const queryClient = useQueryClient()
  const { data: task, isLoading, error } = useTask(id)
  const { data: conv } = useTaskConversation(id)

  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (!id) return
      // invalidate on any task updates or conversation changes
      if (evt.task_id === id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byId(id) })
        queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
      }
    }, { eventTypes: ['task_status_changed','message_added','message_streaming','approval_requested','help_requested','task_result_updated','task_workflow_data_changed'] })
    return () => { /* ws provider handles cleanup */ }
  }, [subscribe, queryClient, id])

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
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Conversation</h2>
              <span className="text-xs text-gray-500">{conv?.conversation?.length ?? 0} messages</span>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-auto">
              {(conv?.conversation || []).filter((m: any) => mode === 'expert' ? true : (m.role !== 'system' && m.role !== 'developer')).map((m: any, idx: number) => (
                <div key={idx} className={`border rounded p-2 ${m.role==='assistant' ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="uppercase">{m.role}</span>
                    {m.created_at && <span>{new Date(m.created_at).toLocaleString()}</span>}
                  </div>
                  {m.content && <div className="text-sm text-gray-900 whitespace-pre-wrap">{m.content}</div>}
                  {mode === 'expert' && m.reasoning && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-700 cursor-pointer">Reasoning</summary>
                      <div className="text-xs text-gray-900 whitespace-pre-wrap bg-gray-100 rounded p-2 mt-1">{m.reasoning}</div>
                    </details>
                  )}
                  {mode === 'expert' && m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-700 cursor-pointer">Tool calls ({m.tool_calls.length})</summary>
                      <div className="mt-1 space-y-2">
                        {m.tool_calls.map((tc: any, i: number) => (
                          <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                            <div className="font-medium text-yellow-800">{tc.function?.name || tc.type}</div>
                            {tc.function?.arguments && (
                              <pre className="overflow-auto bg-yellow-100 rounded p-2 mt-1">{tc.function.arguments}</pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>

          {task.workflow_id === 'matrix' && <MatrixPhasePanel taskId={task.id} />}

          <ActionPanel taskId={id!} workflowId={task.workflow_id} status={task.status} />
        </div>
      )}
    </div>
  )
}

function ActionPanel({ taskId, workflowId, status }: { taskId: string; workflowId: string; status: string }) {
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [message, setMessage] = useState('')
  const [guide, setGuide] = useState('')
  const [help, setHelp] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries()
  }

  const onApprove = async (approved: boolean) => {
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.action(taskId, approved)
    else if (workflowId === 'proactive') await tasksApi.workflows.proactive.action(taskId, approved)
    else if (workflowId === 'ticket') await tasksApi.workflows.ticket.action(taskId, approved)
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.action(taskId, approved)
    invalidate()
  }

  const onSendMessage = async () => {
    if (!message.trim()) return
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.sendMessage(taskId, message.trim())
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.sendMessage(taskId, message.trim())
    setMessage('')
    invalidate()
  }

  const onGuide = async () => {
    if (!guide.trim()) return
    if (workflowId === 'proactive') await tasksApi.workflows.proactive.guide(taskId, guide.trim())
    else if (workflowId === 'ticket') await tasksApi.workflows.ticket.guide(taskId, guide.trim())
    setGuide('')
    invalidate()
  }

  const onHelp = async () => {
    if (!help.trim()) return
    if (workflowId === 'proactive') await tasksApi.workflows.proactive.help(taskId, help.trim())
    else if (workflowId === 'ticket') await tasksApi.workflows.ticket.help(taskId, help.trim())
    setHelp('')
    invalidate()
  }

  const onMarkComplete = async () => {
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.markComplete(taskId)
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.markComplete(taskId)
    invalidate()
  }
  const onMarkFailed = async () => {
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.markFailed(taskId)
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.markFailed(taskId)
    invalidate()
  }

  return (
    <div className="space-y-4">
      {/* Approvals */}
      {status === 'action_required' && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-center gap-2">
          <span className="text-sm text-amber-900 font-medium">Approval required</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => onApprove(true)} className="px-3 py-1.5 border rounded text-sm text-green-700 hover:bg-green-50">Approve</button>
            <button onClick={() => onApprove(false)} className="px-3 py-1.5 border rounded text-sm text-red-700 hover:bg-red-50">Reject</button>
          </div>
        </div>
      )}

      {/* Interactive/Matrix user_turn message input */}
      {(workflowId === 'interactive' || workflowId === 'matrix') && status === 'user_turn' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-900 font-medium mb-2">Your Message</div>
          <div className="flex gap-2">
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} className="flex-1 px-3 py-2 border rounded" placeholder="Type your message..." />
            <button onClick={onSendMessage} disabled={!message.trim()} className="px-3 py-2 border rounded bg-blue-600 text-white border-blue-600 disabled:opacity-50">Send</button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={onMarkComplete} className="px-3 py-1.5 border rounded text-sm text-green-700 hover:bg-green-50">Mark Complete</button>
            <button onClick={onMarkFailed} className="px-3 py-1.5 border rounded text-sm text-red-700 hover:bg-red-50">Mark Failed</button>
          </div>
        </div>
      )}

      {/* Proactive/Ticket guide box (always visible) */}
      {(workflowId === 'proactive' || workflowId === 'ticket') && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="text-sm text-gray-900 font-medium mb-2">Guide Task</div>
          <div className="flex gap-2">
            <textarea value={guide} onChange={e => setGuide(e.target.value)} rows={2} className="flex-1 px-3 py-2 border rounded" placeholder="Provide guidance message..." />
            <button onClick={onGuide} disabled={!guide.trim()} className="px-3 py-2 border rounded bg-gray-800 text-white disabled:opacity-50">Send Guidance</button>
          </div>
        </div>
      )}

      {/* Proactive/Ticket help box when needed */}
      {(workflowId === 'proactive' || workflowId === 'ticket') && status === 'help_required' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-900 font-medium mb-2">Provide Help</div>
          <div className="flex gap-2">
            <textarea value={help} onChange={e => setHelp(e.target.value)} rows={2} className="flex-1 px-3 py-2 border rounded" placeholder="Type your help response..." />
            <button onClick={onHelp} disabled={!help.trim()} className="px-3 py-2 border rounded bg-blue-600 text-white border-blue-600 disabled:opacity-50">Send Help</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MatrixPhasePanel({ taskId }: { taskId: string }) {
  const [phase, setPhase] = useState<number>(1)
  const { data, isLoading, error } = useMatrixConversation(taskId, phase)
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Matrix Phases</h2>
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(p => (
            <button key={p} onClick={() => setPhase(p)} className={`px-2 py-1 rounded border text-sm ${phase===p ? 'bg-orange-600 text-white border-orange-600' : 'hover:bg-orange-50'}`}>Phase {p}</button>
          ))}
        </div>
      </div>
      {isLoading && <div className="text-sm text-gray-500">Loading phase {phase}…</div>}
      {error && <div className="text-sm text-red-600">Failed to load phase</div>}
      <div className="space-y-2 max-h-[320px] overflow-auto">
        {(data?.conversation || []).map((m: any, idx: number) => (
          <div key={idx} className={`border rounded p-2 ${m.role==='assistant' ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className="uppercase">{m.role}</span>
              {m.created_at && <span>{new Date(m.created_at).toLocaleString()}</span>}
            </div>
            {m.content && <div className="text-sm text-gray-900 whitespace-pre-wrap">{m.content}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}


