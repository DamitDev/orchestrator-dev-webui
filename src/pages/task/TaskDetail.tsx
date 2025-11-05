import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTask, useTaskConversation, useMatrixConversation, taskKeys } from '../../hooks/useTask'
import { MessageContent } from '../../lib/markdown'
import { formatTimestamp, formatMessageTimestamp } from '../../lib/time'
import { useMode } from '../../state/ModeContext'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { tasksApi } from '../../lib/api'
import { Send, CheckCircle2, XCircle } from 'lucide-react'

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
  const pct = (status === 'completed' || status === 'failed')
    ? 100
    : Math.min(100, Math.round((value / Math.max(1, max)) * 100))
  const bar = status === 'completed' ? 'bg-green-600' : status === 'failed' ? 'bg-red-600' : 'bg-primary-600'
  return (
    <div className="w-full bg-gray-200 rounded h-2">
      <div className={`h-2 rounded ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PhaseProgressBar({ phase, total = 4, status }: { phase: number; total?: number; status: string }) {
  const clamped = Math.max(0, Math.min(total, phase))
  const pct = (status === 'completed' || status === 'failed') ? 100 : Math.round((clamped / total) * 100)
  const bar = status === 'completed' ? 'bg-green-600' : status === 'failed' ? 'bg-red-600' : 'bg-orange-600'
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
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const convRef = useRef<HTMLDivElement | null>(null)

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

  // Scroll to bottom on new messages if enabled
  useEffect(() => {
    if (!autoScroll) return
    const el = convRef.current
    if (el) {
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight }, 50)
    }
  }, [conv?.conversation, autoScroll])

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
          <div className="bg-white border rounded-lg p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={task.status} />
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{task.workflow_id.toUpperCase()}</span>
                  {task.ticket_id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{task.ticket_id}</span>
                  )}
                </div>
                <div className="text-lg text-gray-900 truncate dark:text-gray-100" title={task.goal_prompt}>{task.goal_prompt || task.ticket_id || task.id}</div>
                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                  {(['ticket','proactive'].includes(task.workflow_id)) && (
                    <div className="text-gray-600 dark:text-gray-300">Iteration <span className="font-medium text-gray-900 dark:text-gray-100">{task.iteration}/{task.max_iterations}</span></div>
                  )}
                  {task.workflow_id === 'matrix' && (
                    <div className="text-gray-600 dark:text-gray-300">Phase <span className="font-medium text-gray-900 dark:text-gray-100">{(task.workflow_data?.phase ?? 0)}/4</span></div>
                  )}
                  <div className="text-gray-600 dark:text-gray-300">Updated <span className="font-medium text-gray-900 dark:text-gray-100">{formatTimestamp(task.updated_at)}</span></div>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2 flex-wrap">
                  <span className="">Available tools:</span>
                  {task.available_tools === null && <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">All</span>}
                  {Array.isArray(task.available_tools) && task.available_tools.length === 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">None</span>
                  )}
                  {Array.isArray(task.available_tools) && task.available_tools.length > 0 && (
                    <>
                      {task.available_tools.slice(0, 5).map((tname, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">{tname}</span>
                      ))}
                      {task.available_tools.length > 5 && (
                        <span className="text-gray-500">+{task.available_tools.length - 5} more</span>
                      )}
                    </>
                  )}
                  <Link to="/config/tools" className="ml-2 underline decoration-dotted">Tools Explorer</Link>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {(['ticket','proactive'].includes(task.workflow_id)) && (
                <ProgressBar value={task.iteration} max={task.max_iterations} status={task.status} />
              )}
              {task.workflow_id === 'matrix' && (
                <PhaseProgressBar phase={(task.workflow_data?.phase ?? 0)} status={task.status} />
              )}
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

          {/* Conversation: hidden for matrix, shown otherwise */}
          {task.workflow_id !== 'matrix' && (
            <div className="bg-white border rounded-lg p-4 space-y-3 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium dark:text-gray-100">Conversation</h2>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} /> Auto-scroll
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{conv?.conversation?.length ?? 0} messages</span>
                </div>
              </div>
              <div ref={convRef} className="space-y-2 max-h-[420px] overflow-auto">
                {(() => {
                  const msgs = (conv?.conversation || []).filter((m: any) => mode === 'expert' ? true : (m.role !== 'system' && m.role !== 'developer'))
                  let lastToolIndex = -1
                  for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === 'tool') { lastToolIndex = i; break } }
                  return msgs.map((m: any, idx: number) => (
                    <div key={idx} className={`border rounded p-2 ${m.role==='assistant' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} dark:border-gray-700`}>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="uppercase">{m.role}</span>
                        {m.created_at && <span>{formatMessageTimestamp(m.created_at)}</span>}
                      </div>
                      {/* Reasoning should appear above assistant content */}
                      {m.role === 'assistant' && mode === 'expert' && m.reasoning && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-700 cursor-pointer">Reasoning</summary>
                          <div className="text-xs text-gray-900 whitespace-pre-wrap bg-gray-100 rounded p-2 mt-1">{m.reasoning}</div>
                        </details>
                      )}
                      {m.content && <MessageContent role={m.role} content={m.content} isLatestTool={idx === lastToolIndex} />}
                      {/* For non-assistant roles, keep reasoning below content */}
                      {m.role !== 'assistant' && mode === 'expert' && m.reasoning && (
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
                  ))
                })()}
              </div>
            </div>
          )}

          {task.workflow_id === 'matrix' && <MatrixPhasePanel taskId={task.id} />}
          {task.workflow_id === 'ticket' && <TicketTodoPanel conv={conv?.conversation || []} taskId={task.id} />}

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
  const [busy, setBusy] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries()
  }

  const onApprove = async (approved: boolean) => {
    setBusy(true)
    try {
      if (workflowId === 'interactive') await tasksApi.workflows.interactive.action(taskId, approved)
      else if (workflowId === 'proactive') await tasksApi.workflows.proactive.action(taskId, approved)
      else if (workflowId === 'ticket') await tasksApi.workflows.ticket.action(taskId, approved)
      else if (workflowId === 'matrix') await tasksApi.workflows.matrix.action(taskId, approved)
    } finally {
      setBusy(false)
      invalidate()
    }
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
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSendMessage() }
                else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage() }
              }}
              rows={2}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Type your message… (Enter to send, Shift+Enter newline)"
            />
            <button onClick={onSendMessage} disabled={!message.trim() || busy} className="px-3 py-2 border rounded bg-blue-600 text-white border-blue-600 disabled:opacity-50 flex items-center gap-1">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button onClick={onMarkComplete} disabled={busy} className="px-3 py-1.5 border rounded text-sm text-green-700 hover:bg-green-50 disabled:opacity-50 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Mark Complete
            </button>
            <button onClick={onMarkFailed} disabled={busy} className="px-3 py-1.5 border rounded text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Mark Failed
            </button>
          </div>
        </div>
      )}

      {/* Proactive/Ticket guide box (always visible) */}
      {(workflowId === 'proactive' || workflowId === 'ticket') && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-sm text-gray-900 font-medium mb-2 dark:text-gray-100">Guide Task</div>
          <div className="flex gap-2">
            <textarea
              value={guide}
              onChange={e => setGuide(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onGuide() } }}
              rows={2}
              className="textarea"
              placeholder="Provide guidance message… (Ctrl/Cmd+Enter to send)"
            />
            <button onClick={onGuide} disabled={!guide.trim() || busy} className="btn bg-gray-800 text-white disabled:opacity-50">Send Guidance</button>
          </div>
        </div>
      )}

      {/* Proactive/Ticket help box when needed */}
      {(workflowId === 'proactive' || workflowId === 'ticket') && status === 'help_required' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-900 font-medium mb-2">Provide Help</div>
          <div className="flex gap-2">
            <textarea value={help} onChange={e => setHelp(e.target.value)} rows={2} className="flex-1 px-3 py-2 border rounded" placeholder="Type your help response..." />
            <button onClick={onHelp} disabled={!help.trim() || busy} className="px-3 py-2 border rounded bg-blue-600 text-white border-blue-600 disabled:opacity-50">Send Help</button>
          </div>
        </div>
      )}

      {/* Cancel Task */}
      {!['completed','failed','canceled','cancelled'].includes(status) && (
        <div className="flex items-center">
          <button onClick={async () => { setBusy(true); try { await tasksApi.cancel(taskId) } finally { setBusy(false); invalidate() } }} className="px-3 py-1.5 border rounded text-sm text-red-700 hover:bg-red-50">Cancel Task</button>
        </div>
      )}
    </div>
  )
}

function MatrixPhasePanel({ taskId }: { taskId: string }) {
  const [phase, setPhase] = useState<number>(1)
  const { data, isLoading, error } = useMatrixConversation(taskId, phase)
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3 dark:bg-gray-800 dark:border-gray-700">
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
        {(() => {
          const msgs = (data?.conversation || [])
          let lastToolIndex = -1
          for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === 'tool') { lastToolIndex = i; break } }
          return msgs.map((m: any, idx: number) => (
            <div key={idx} className={`border rounded p-2 ${m.role==='assistant' ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} dark:border-gray-700`}>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span className="uppercase">{m.role}</span>
                {m.created_at && <span>{formatMessageTimestamp(m.created_at)}</span>}
              </div>
              {m.content && <MessageContent role={m.role} content={m.content} isLatestTool={idx === lastToolIndex} />}
            </div>
          ))
        })()}
      </div>
    </div>
  )
}

function extractTicketTodoFromConversation(conversation: any[]): string {
  let content = ''
  for (const m of conversation) {
    const calls = (m?.tool_calls || []) as any[]
    for (const tc of calls) {
      const fname = tc?.function?.name
      if (fname === 'ticket_todo') {
        try {
          const args = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {}
          const action = args?.action
          if (action === 'set' && typeof args?.content === 'string') {
            content = args.content
          } else if (action === 'append' && typeof args?.content === 'string') {
            content = content ? `${content}\n${args.content}` : args.content
          }
        } catch {}
      }
    }
  }
  return content
}

function TicketTodoPanel({ conv, taskId }: { conv: any[]; taskId: string }) {
  const [value, setValue] = useState<string>(() => extractTicketTodoFromConversation(conv))
  useEffect(() => {
    setValue(extractTicketTodoFromConversation(conv))
  }, [conv])
  const onSend = async () => {
    const msg = `Update the ticket_todo to the following Markdown exactly:\n\n${value}`
    await tasksApi.workflows.ticket.guide(taskId, msg)
  }
  return (
    <div className="bg-white border rounded-lg p-4 space-y-2 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Ticket TODO</h2>
        <button onClick={onSend} className="px-3 py-1.5 border rounded text-sm">Send Update</button>
      </div>
      <textarea aria-label="Ticket todo content" value={value} onChange={e => setValue(e.target.value)} rows={8} className="w-full px-3 py-2 border rounded font-mono dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="# TODO\n- [ ] item" />
      <div className="text-xs text-gray-500 dark:text-gray-400">This updates the TODO by sending guidance to the agent, which will apply it using the built-in ticket_todo tool.</div>
    </div>
  )
}


