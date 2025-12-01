import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTask, useTaskConversation, useMatrixConversation, taskKeys } from '../../hooks/useTask'
import { useCancelTask } from '../../hooks/useTasks'
import { MessageContent } from '../../lib/markdown'
import { formatTimestamp, formatMessageTimestamp } from '../../lib/time'
import { useMode } from '../../state/ModeContext'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { tasksApi } from '../../lib/api'
import { Send, CheckCircle2, XCircle, MessageSquare, X, ArrowLeft } from 'lucide-react'
import { StreamingIndicator } from '../../components/StreamingIndicator'
import { StreamingReasoning } from '../../components/StreamingReasoning'
import { StreamingToolCall } from '../../components/StreamingToolCall'
import { StreamingContent } from '../../components/StreamingContent'
import { AnimatedDetails } from '../../components/AnimatedDetails'
import { AnimatedMount } from '../../components/AnimatedMount'

// Icon components
function LightBulbIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

function WrenchIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

// Helper to parse markdown summary with title and content
function parseSummary(summary: string | null | undefined): { title: string; sections: Array<{ subtitle?: string; content: string }> } | null {
  if (!summary || !summary.trim()) return null
  
  const lines = summary.trim().split('\n')
  let mainTitle = ''
  const sections: Array<{ subtitle?: string; content: string }> = []
  let currentSection: { subtitle?: string; content: string } = { content: '' }
  
  for (const line of lines) {
    // Main title (# Title)
    if (line.startsWith('# ')) {
      mainTitle = line.substring(2).trim()
    }
    // Subtitle (## Subtitle)
    else if (line.startsWith('## ')) {
      // Save previous section if it has content
      if (currentSection.content.trim() || currentSection.subtitle) {
        sections.push(currentSection)
      }
      // Start new section
      currentSection = { subtitle: line.substring(3).trim(), content: '' }
    }
    // Regular content
    else if (line.trim()) {
      currentSection.content += (currentSection.content ? '\n' : '') + line
    }
  }
  
  // Push last section
  if (currentSection.content.trim() || currentSection.subtitle) {
    sections.push(currentSection)
  }
  
  // If no sections, treat all non-title content as single section
  if (sections.length === 0 && lines.length > 1) {
    const contentLines = lines.filter(l => !l.startsWith('# '))
    if (contentLines.length > 0) {
      sections.push({ content: contentLines.join('\n').trim() })
    }
  }
  
  return mainTitle ? { title: mainTitle, sections } : null
}

// Helper to parse ticket text with pipe-separated fields
interface ParsedTicket {
  partner?: string
  name?: string
  operationServiceLevel?: string
  type?: string
  priority?: string
  supportGrade?: string
  subject?: string
  message?: string
}

function parseTicketText(ticketText: string | null | undefined): ParsedTicket | null {
  if (!ticketText || !ticketText.trim()) return null
  
  const parsed: ParsedTicket = {}
  
  // Split by pipe and parse each field
  const parts = ticketText.split('|').map(p => p.trim())
  
  for (const part of parts) {
    const colonIndex = part.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = part.substring(0, colonIndex).trim().toLowerCase()
    const value = part.substring(colonIndex + 1).trim()
    
    if (!value) continue
    
    switch (key) {
      case 'partner':
        parsed.partner = value
        break
      case 'name':
        parsed.name = value
        break
      case 'operation service level':
        parsed.operationServiceLevel = value
        break
      case 'type':
        parsed.type = value
        break
      case 'priority':
        parsed.priority = value
        break
      case 'support grade':
        parsed.supportGrade = value
        break
      case 'subject':
        parsed.subject = value
        break
      case 'message':
        // Keep HTML but clean up inline styles for security
        parsed.message = value
          .replace(/style="[^"]*"/g, '')
          .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers for security
          .trim()
        break
    }
  }
  
  return Object.keys(parsed).length > 0 ? parsed : null
}

// Component to display parsed ticket fields
function TicketFields({ ticketText }: { ticketText: string }) {
  const parsed = parseTicketText(ticketText)
  
  if (!parsed) {
    // Fallback to plain text display if parsing fails
    return <div className="whitespace-pre-wrap break-words overflow-auto max-h-[300px]">{ticketText}</div>
  }
  
  const Field = ({ label, value, highlight = false }: { label: string; value?: string; highlight?: boolean }) => {
    if (!value) return null
    return (
      <div className={`flex gap-3 min-w-0 ${highlight ? 'col-span-2' : ''}`}>
        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide min-w-[140px] flex-shrink-0">
          {label}
        </div>
        <div className={`text-sm text-nord0 dark:text-nord6 break-words min-w-0 ${highlight ? 'font-medium' : ''}`}>
          {value}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3 min-w-0">
      {/* Header fields in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-nord6/30 dark:bg-nord1/30 rounded-lg border border-nord4/50 dark:border-nord3/50 min-w-0">
        <Field label="Partner" value={parsed.partner} />
        <Field label="Contact" value={parsed.name} />
        <Field label="Service Level" value={parsed.operationServiceLevel} />
        <Field label="Support Grade" value={parsed.supportGrade} />
        <Field label="Type" value={parsed.type} />
        <Field label="Priority" value={parsed.priority} />
      </div>
      
      {/* Subject - highlighted */}
      {parsed.subject && (
        <div className="p-4 bg-nord8/10 dark:bg-nord8/5 rounded-lg border border-nord8/30 dark:border-nord8/20 min-w-0">
          <div className="text-xs font-semibold text-nord8 uppercase tracking-wide mb-2">
            Subject
          </div>
          <div className="text-base font-medium text-nord0 dark:text-nord6 break-words">
            {parsed.subject}
          </div>
        </div>
      )}
      
      {/* Message - main content */}
      {parsed.message && (
        <div className="p-4 bg-nord5/20 dark:bg-nord2/20 rounded-lg border border-nord4/50 dark:border-nord3/50 min-w-0 overflow-auto max-h-[400px]">
          <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide mb-2">
            Message
          </div>
          <div 
            className="text-sm text-nord0 dark:text-nord6 break-words leading-relaxed ticket-message"
            dangerouslySetInnerHTML={{ __html: parsed.message }}
          />
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'completed' ? 'status-badge status--completed'
    : status === 'failed' ? 'status-badge status--failed'
    : status === 'action_required' ? 'status-badge status--action_required'
    : status === 'help_required' ? 'status-badge status--help_required'
    : status === 'sleeping' ? 'status-badge status--sleeping'
    : status === 'background_active' ? 'status-badge status--background_active'
    : ['in_progress','validation','function_execution','agent_turn','queued','queued_for_function_execution'].includes(status) ? 'status-badge status--running'
    : 'badge'
  return <span className={cls}>{status.replace(/_/g,' ')}</span>
}

function CancelButton({ taskId }: { taskId: string }) {
  const cancelMutation = useCancelTask()
  
  return (
    <button
      onClick={() => cancelMutation.mutate(taskId)}
      disabled={cancelMutation.isPending}
      className="btn-danger text-sm flex items-center gap-2"
      title="Cancel task"
    >
      <XCircle className="w-4 h-4" />
      Cancel
    </button>
  )
}

// Group messages: assistant messages with their tool calls/responses
// Continue grouping through multiple assistant turns until we hit content
function groupMessages(messages: any[]) {
  const groups: any[] = []
  let i = 0
  
  while (i < messages.length) {
    const msg = messages[i]
    
    // For assistant messages, group everything until we get content
    if (msg.role === 'assistant') {
      const group: any = {
        type: 'assistant',
        assistantMessages: [], // Track all assistant messages in this turn
        toolInteractions: [],
        finalContent: null,
        finalReasoning: null
      }
      
      let j = i
      let keepGoing = true
      
      // Keep going through assistant + tool sequences until we hit content or a different role
      while (j < messages.length && keepGoing) {
        const current = messages[j]
        
        if (current.role === 'assistant') {
          group.assistantMessages.push(current)
          
          // If this assistant has content, this is the end of the turn
          if (current.content && current.content.trim()) {
            group.finalContent = current.content
            group.finalReasoning = current.reasoning
            group.finalReasoningSummary = current.reasoning_summary
            j++
            keepGoing = false
          } else if (current.tool_calls && Array.isArray(current.tool_calls) && current.tool_calls.length > 0) {
            // This assistant has tool calls, collect them and their responses
            const toolCallIds = new Set(current.tool_calls.map((tc: any) => tc.id))
            
            // Add tool calls with their reasoning and summaries
            for (const tc of current.tool_calls) {
              group.toolInteractions.push({
                reasoning: current.reasoning, // Reasoning before this tool call
                reasoning_summary: current.reasoning_summary,
                tool_call_summary: current.tool_call_summary,
                toolCall: tc,
                toolResponse: null
              })
            }
            
            j++
            
            // Now collect matching tool responses
            while (j < messages.length && messages[j].role === 'tool') {
              const toolMsg = messages[j]
              if (toolCallIds.has(toolMsg.tool_call_id)) {
                // Find the interaction to attach this response to
                const interaction = group.toolInteractions.find((ti: any) => ti.toolCall.id === toolMsg.tool_call_id)
                if (interaction) {
                  interaction.toolResponse = toolMsg
                  interaction.tool_output_summary = toolMsg.tool_output_summary
                }
              }
              j++
            }
          } else {
            // Assistant with no content and no tool calls - shouldn't happen but move on
            j++
          }
        } else {
          // Hit a non-assistant message, stop grouping
          keepGoing = false
        }
      }
      
      i = j
      groups.push(group)
    } else {
      // Non-assistant messages stay as single messages
      groups.push({
        type: msg.role,
        message: msg
      })
      i++
    }
  }
  
  return groups
}

// Render a grouped assistant turn
function AssistantTurn({ 
  group, 
  groupIdx,
  mode, 
  streamingMessage, 
  isStreaming,
  manuallyToggledTools,
  setManuallyToggledTools
}: { 
  group: any;
  groupIdx: number;
  mode: string; 
  streamingMessage?: any; 
  isStreaming?: boolean;
  manuallyToggledTools: Record<string, boolean>;
  setManuallyToggledTools: (tools: Record<string, boolean>) => void;
}) {
  const hasContent = group.finalContent && group.finalContent.trim()
  const hasToolCalls = group.toolInteractions && group.toolInteractions.length > 0
  // Use the last message's timestamp so it updates as new messages arrive
  const lastMsg = group.assistantMessages[group.assistantMessages.length - 1]
  
  // Track height to prevent shrinking when sections close
  const containerRef = useRef<HTMLDivElement>(null)
  const [minHeight, setMinHeight] = useState<number>(0)
  const prevHasContentRef = useRef<boolean>(false)
  const prevIsStreamingRef = useRef<boolean>(false)
  
  // Determine what streaming phase we're in
  const isEmpty = isStreaming && streamingMessage && !streamingMessage.content && !streamingMessage.reasoning && (!streamingMessage.tool_calls || streamingMessage.tool_calls.length === 0)
  const isStreamingReasoning = isStreaming && streamingMessage?.reasoning && (!streamingMessage?.tool_calls || streamingMessage.tool_calls.length === 0) && !streamingMessage?.content
  const isStreamingToolCalls = isStreaming && streamingMessage?.tool_calls && streamingMessage.tool_calls.length > 0
  const isStreamingContent = isStreaming && streamingMessage?.content && streamingMessage.content.length > 0
  
  // Track when sections are about to close
  useEffect(() => {
    const prevHasContent = prevHasContentRef.current
    const prevIsStreaming = prevIsStreamingRef.current
    
    // Sections close when hasContent becomes true OR isStreaming becomes false
    if ((!prevHasContent && hasContent) || (prevIsStreaming && !isStreaming)) {
      // Capture current height before sections close
      if (containerRef.current) {
        const currentHeight = containerRef.current.getBoundingClientRect().height
        setMinHeight(currentHeight)
      }
      
      // Clear minHeight after sections finish closing
      setTimeout(() => setMinHeight(0), 400)
    } else if (!prevIsStreaming && isStreaming) {
      // Streaming just started - clear minHeight
      setMinHeight(0)
    }
    
    prevHasContentRef.current = hasContent
    prevIsStreamingRef.current = !!isStreaming
  }, [hasContent, isStreaming])
  
  return (
    <div 
      ref={containerRef}
      className="message message--assistant"
      style={{ minHeight: minHeight > 0 ? `${minHeight}px` : undefined }}
    >
      <div className="message-header mb-3">
        <span className="uppercase font-bold text-xs tracking-wide">ASSISTANT</span>
        {lastMsg?.created_at && (
          <span className="text-xs bg-nord5/70 px-2 py-0.5 rounded dark:bg-nord2">
            {formatMessageTimestamp(lastMsg.created_at)}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Tool interactions (completed) - render these FIRST */}
        {hasToolCalls && group.toolInteractions.map((interaction: any, idx: number) => {
          const toolCall = interaction.toolCall
          const toolResponse = interaction.toolResponse
          const reasoning = interaction.reasoning
          const toolName = toolCall?.function?.name || 'unknown'
          
          // Try to get a short summary from tool response
          const responseSummary = toolResponse?.content 
            ? (toolResponse.content.length > 80 ? toolResponse.content.slice(0, 80) + '...' : toolResponse.content)
            : 'No response'
          
          // Create unique key for this tool call
          const toolKey = `${groupIdx}-${idx}`
          
          // Determine if this tool should be auto-opened
          const shouldAutoOpen = !hasContent && !isStreaming && idx === group.toolInteractions.length - 1
          
          // Get the open state: use manual state if it exists, otherwise use auto-open logic
          const isToolOpen = manuallyToggledTools[toolKey] !== undefined 
            ? manuallyToggledTools[toolKey] 
            : shouldAutoOpen
          
          return (
            <div key={idx}>
              {/* Show reasoning before this tool call if it exists */}
              {reasoning && (() => {
                const parsed = interaction.reasoning_summary ? parseSummary(interaction.reasoning_summary) : null
                return parsed ? (
                  <AnimatedDetails 
                    className="text-xs mb-2"
                    summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
                    defaultOpen={false}
                    summary={<span className="flex items-center gap-1.5">▸ <LightBulbIcon />{parsed.title}</span>}
                  >
                    <div className="reasoning mt-2">
                      {mode === 'simple' ? (
                        <div className="space-y-2">
                          {parsed.sections.map((section, sidx) => (
                            <div key={sidx}>
                              {section.subtitle && (
                                <div className="font-medium text-nord10 dark:text-nord8 mb-1">{section.subtitle}</div>
                              )}
                              <MessageContent role="assistant" content={section.content} isLatestTool={false} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        reasoning
                      )}
                    </div>
                  </AnimatedDetails>
                ) : (
                  <AnimatedDetails 
                    className="text-xs mb-2"
                    summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
                    defaultOpen={false}
                    summary={<span className="flex items-center gap-1.5">▸ <LightBulbIcon />Thought</span>}
                  >
                    <div className="reasoning mt-2">{reasoning}</div>
                  </AnimatedDetails>
                )
              })()}
              
              {/* Tool call + response in one collapsible */}
              {/* Only keep last tool open if there's no final content yet and not streaming */}
              <AnimatedDetails 
                className="text-xs mb-2"
                summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
                open={isToolOpen}
                onToggle={(newState) => {
                  setManuallyToggledTools({ ...manuallyToggledTools, [toolKey]: newState })
                }}
                summary={
                  mode === 'simple' && interaction.tool_call_summary ? (() => {
                    const parsed = parseSummary(interaction.tool_call_summary)
                    return parsed ? <span className="flex items-center gap-1.5">▸ <WrenchIcon />{parsed.title}</span> : <span className="flex items-center gap-1.5">▸ <WrenchIcon />Using tool: <code className="text-nord10 dark:text-nord8 font-medium">{toolName}</code></span>
                  })() : <span className="flex items-center gap-1.5">▸ <WrenchIcon />Using tool: <code className="text-nord10 dark:text-nord8 font-medium">{toolName}</code></span>
                }
              >
                <div className="mt-2 ml-4 space-y-2">
                  {/* Tool call summary content in simple mode */}
                  {mode === 'simple' && interaction.tool_call_summary && (() => {
                    const parsed = parseSummary(interaction.tool_call_summary)
                    return parsed && parsed.sections.length > 0 && (
                      <div className="text-nord3 dark:text-nord4 whitespace-pre-wrap">{parsed.sections[0].content}</div>
                    )
                  })()}
                  
                  {/* Tool call parameters - always visible in expert mode */}
                  {mode === 'expert' && toolCall?.function?.arguments && (
                    <div className="text-xs">
                      <div className="text-xs text-nord3 dark:text-nord4 mb-1">Parameters:</div>
                      <pre className="overflow-auto bg-nord5 rounded-lg p-2 text-nord0 dark:bg-nord2 dark:text-nord6 text-xs">
                        {toolCall.function.arguments}
                      </pre>
                    </div>
                  )}
                  
                  {/* Tool response - expert mode shows full content */}
                  {toolResponse && mode === 'expert' && (
                    <div className="mt-2 content-expanding">
                      <div className="text-xs text-nord3 dark:text-nord4 mb-1">Response:</div>
                      <div className="tool-response-box p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs max-h-[7.5rem] overflow-y-auto">
                        <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                          {toolResponse.content}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Tool output summary in simple mode - with markdown formatting */}
                  {toolResponse && mode === 'simple' && interaction.tool_output_summary && (() => {
                    const parsed = parseSummary(interaction.tool_output_summary)
                    return parsed && (
                      <div className="mt-2 content-expanding">
                        <div className="text-xs text-nord3 dark:text-nord4 mb-1 font-medium">{parsed.title}:</div>
                        <div className="p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs">
                          {parsed.sections.map((section, sidx) => (
                            <div key={sidx}>
                              <MessageContent role="assistant" content={section.content} isLatestTool={false} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </AnimatedDetails>
            </div>
          )
        })}
        
        {/* Final reasoning before the response */}
        {hasContent && group.finalReasoning && (() => {
          const parsed = group.finalReasoningSummary ? parseSummary(group.finalReasoningSummary) : null
          return parsed ? (
            <AnimatedDetails 
              className="text-xs mb-2"
              summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
              defaultOpen={false}
              summary={<span className="flex items-center gap-1.5">▸ <LightBulbIcon />{parsed.title}</span>}
            >
              <div className="reasoning mt-2">
                {mode === 'simple' ? (
                  <div className="space-y-2">
                    {parsed.sections.map((section, sidx) => (
                      <div key={sidx}>
                        {section.subtitle && (
                          <div className="font-medium text-nord10 dark:text-nord8 mb-1">{section.subtitle}</div>
                        )}
                        <MessageContent role="assistant" content={section.content} isLatestTool={false} />
                      </div>
                    ))}
                  </div>
                ) : (
                  group.finalReasoning
                )}
              </div>
            </AnimatedDetails>
          ) : (
            <AnimatedDetails 
              className="text-xs mb-2"
              summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
              defaultOpen={false}
              summary={<span className="flex items-center gap-1.5">▸ <LightBulbIcon />Thought</span>}
            >
              <div className="reasoning mt-2">{group.finalReasoning}</div>
            </AnimatedDetails>
          )
        })()}
        
        {/* Streaming content */}
        {isStreamingContent && (
          <div className="mt-2">
            <StreamingContent content={streamingMessage.content} />
          </div>
        )}
        
        {/* Main content (when not streaming) */}
        {!isStreaming && hasContent && (
          <div className="text-sm leading-relaxed mt-2">
            <MessageContent role="assistant" content={group.finalContent} isLatestTool={false} />
          </div>
        )}
        
        {/* STREAMING ITEMS BELOW - these appear at the bottom after all completed content */}
        
        {/* Show streaming reasoning */}
        {isStreamingReasoning && mode === 'expert' && (
          <StreamingReasoning reasoning={streamingMessage.reasoning} />
        )}
        
        {/* Show streaming tool calls */}
        {isStreamingToolCalls && streamingMessage.tool_calls.map((tc: any, idx: number) => {
          const toolName = tc?.function?.name || 'unknown'
          const parameters = tc?.function?.arguments || ''
          return (
            <StreamingToolCall key={idx} toolName={toolName} parameters={parameters} mode={mode} />
          )
        })}
        
        {/* Show streaming indicator when message is empty (prefill) - appears at the very bottom */}
        {isEmpty && <StreamingIndicator />}
      </div>
    </div>
  )
}

function ProgressBar({ value, max, status }: { value: number; max: number; status: string }) {
  const pct = (status === 'completed' || status === 'failed')
    ? 100
    : Math.min(100, Math.round((value / Math.max(1, max)) * 100))
  const bar = status === 'completed' ? 'progress-bar-green' : status === 'failed' ? 'progress-bar-red' : 'progress-bar-primary'
  return (
    <div className="progress">
      <div className={bar} style={{ width: `${pct}%` }} />
    </div>
  )
}

function PhaseProgressBar({ phase, total = 4, status }: { phase: number; total?: number; status: string }) {
  const clamped = Math.max(0, Math.min(total, phase))
  const pct = (status === 'completed' || status === 'failed') ? 100 : Math.round((clamped / total) * 100)
  const bar = status === 'completed' ? 'progress-bar-green' : status === 'failed' ? 'progress-bar-red' : 'progress-bar-primary'
  return (
    <div className="progress">
      <div className={bar} style={{ width: `${pct}%` }} />
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
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)
  const [streamingMessage, setStreamingMessage] = useState<any>(null)
  const blockInvalidateRef = useRef<boolean>(false)
  const convRef = useRef<HTMLDivElement | null>(null)
  
  // Track manually toggled tool calls: key is `${groupIdx}-${toolIdx}`, value is open state
  const [manuallyToggledTools, setManuallyToggledTools] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (!id) return
      
      // Handle streaming messages
      if (evt.event_type === 'message_streaming' && evt.task_id === id) {
        const streamData = {
          message_id: evt.message_id,
          role: evt.role,
          content: evt.content || '',
          reasoning: evt.reasoning || '',
          tool_calls: evt.tool_calls || null,
          tool_call_id: evt.tool_call_id || null,
          name: evt.name || null,
          is_complete: evt.is_complete || false,
          stream_index: evt.stream_index || 0,
          has_tool_calls: evt.has_tool_calls || false,
          tool_call_count: evt.tool_call_count || 0
        }
        
        if (streamData.is_complete) {
          // Clear streaming state and invalidate to show final message
          setStreamingMessage(null)
          queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
        } else {
          // Update streaming state
          setStreamingMessage(streamData)
        }
        return
      }
      
      // Handle summary generation
      if (evt.event_type === 'message_summary_generated' && evt.task_id === id) {
        // Invalidate conversation to show updated summaries
        queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
        return
      }
      
      // Handle other task updates
      if (evt.task_id === id) {
        // Skip invalidation if we're in the middle of an exit animation
        if (blockInvalidateRef.current) {
          return
        }
        
        queryClient.invalidateQueries({ queryKey: taskKeys.byId(id) })
        
        // Only invalidate conversation for non-streaming events
        if (evt.event_type !== 'message_streaming') {
        queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
        }
      }
    }, { eventTypes: ['task_status_changed','message_added','message_streaming','message_summary_generated','approval_requested','help_requested','task_result_updated','task_workflow_data_changed'] })
    return () => { /* ws provider handles cleanup */ }
  }, [subscribe, queryClient, id])

  // Scroll to bottom on new messages or streaming updates if enabled
  useEffect(() => {
    if (!autoScroll) return
    const el = convRef.current
    if (el) {
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight }, 50)
    }
  }, [conv?.conversation, streamingMessage, autoScroll])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/tasks" 
            className="p-2 hover:bg-nord5/50 dark:hover:bg-nord3/30 rounded-lg transition-colors group"
            title="Back to Tasks"
          >
            <ArrowLeft className="w-6 h-6 text-nord3 dark:text-nord4 group-hover:text-nord10 dark:group-hover:text-nord8 transition-colors" />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-nord10 to-nord8 bg-clip-text text-transparent">
            Task Detail
          </h1>
          <div className="text-sm text-nord3 dark:text-nord4 font-mono bg-nord5/50 px-3 py-1 rounded-lg dark:bg-nord2">
            {id?.slice(0,8)}
          </div>
        </div>
        
        {/* Toggle Chat Panel Button */}
        {task && (
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="btn-primary flex items-center gap-2"
            title={isPanelOpen ? 'Close Chat' : 'Open Chat'}
          >
            <MessageSquare className="w-4 h-4" />
            {isPanelOpen ? 'Close Chat' : 'Open Chat'}
          </button>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-nord8 border-t-transparent"></div>
          <p className="mt-4 text-nord3 dark:text-nord4">Loading task...</p>
        </div>
      )}
      
      {error && (
        <div className="card p-6 bg-nord11/10 border border-nord11/30 text-center">
          <div className="text-nord11 font-semibold">Failed to load task</div>
        </div>
      )}

      {task && (
        <>
          {/* Full-Width Task Info Panel */}
          <div className="w-full space-y-6">
            {/* Main Task Info Card */}
            <div className="card p-6 bg-gradient-to-br from-nord6 to-nord5 dark:from-nord1 dark:to-nord2 border-2 space-y-4">
              {/* Header with badges */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={task.status} />
                  <span className="badge bg-nord8/20 text-nord10 border-nord8/30 dark:bg-nord8/10 dark:text-nord8">{task.workflow_id.toUpperCase()}</span>
                  {task.ticket_id && (
                    <span className="badge bg-nord15/20 text-nord15 border-nord15/30">🎫 {task.ticket_id}</span>
                  )}
                </div>
                {!['completed', 'failed', 'cancelled', 'canceled'].includes(task.status) && (
                  <CancelButton taskId={task.id} />
                )}
              </div>

              {/* Task Result for completed/failed tasks */}
              {(task.status === 'completed' || task.status === 'failed') && task.result && (
                <div className="p-4 bg-nord14/10 border-2 border-nord14/30 rounded-lg dark:bg-nord14/5">
                  <div className="text-xs font-semibold text-nord14 uppercase tracking-wide mb-2">
                    Task Result
                  </div>
                  <div className="text-base font-medium text-nord0 dark:text-nord6">
                    {task.result}
                  </div>
                </div>
              )}

              {/* Structured Information Grid */}
              <div className="space-y-3">
                {/* Status */}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                  <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                    Status
                  </div>
                  <div className="text-sm text-nord0 dark:text-nord6">
                    <StatusBadge status={task.status} />
                  </div>
                </div>

                {/* Type */}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                  <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                    Type
                  </div>
                  <div className="text-sm text-nord0 dark:text-nord6 font-medium">
                    {task.workflow_id === 'ticket' ? '🎫 Ticket' : 
                     task.workflow_id === 'matrix' ? '🔢 Matrix' : 
                     task.workflow_id === 'proactive' ? '⚡ Proactive' : 
                     '💬 Interactive'}
                  </div>
                </div>

                {/* Progress */}
                {task.workflow_id === 'ticket' || task.workflow_id === 'proactive' ? (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                    <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                      Iteration
                    </div>
                    <div className="text-sm text-nord0 dark:text-nord6">
                      <span className="font-bold text-nord10 dark:text-nord8">{task.iteration}</span> / {task.max_iterations}
                    </div>
                  </div>
                ) : task.workflow_id === 'matrix' ? (
                  <>
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                    <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                      Phase
                    </div>
                    <div className="text-sm text-nord0 dark:text-nord6">
                      <span className="font-bold text-nord12 dark:text-nord12">{task.workflow_data?.phase ?? 0}</span> / 4
                    </div>
                  </div>
                    
                    {/* Algorithm ID - shown when task is complete */}
                    {task.workflow_data?.algorithm_id && (
                      <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Algorithm ID
                        </div>
                        <div className="text-sm">
                          <span className="font-mono bg-nord14/20 text-nord14 px-2 py-0.5 rounded border border-nord14/30 dark:bg-nord14/10">
                            {task.workflow_data.algorithm_id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Timestamps */}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                  <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                    Created
                  </div>
                  <div className="text-sm text-nord0 dark:text-nord6">
                    {formatTimestamp(task.created_at)}
                  </div>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                  <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                    Updated
                  </div>
                  <div className="text-sm text-nord0 dark:text-nord6">
                    {formatTimestamp(task.updated_at)}
                  </div>
                </div>

                {/* Ticket-specific fields */}
                {task.workflow_id === 'ticket' && (
                  <>
                    {task.ticket_id && (
                      <div className="grid grid-cols-[120px_1fr] gap-2 items-start pt-2 border-t border-nord4 dark:border-nord3">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Ticket ID
                        </div>
                        <div className="text-sm text-nord0 dark:text-nord6 font-mono">
                          {task.ticket_id}
                        </div>
                      </div>
                    )}
                    
                    {task.workflow_data?.ticket_text && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Ticket Details
                        </div>
                        <div className="min-w-0">
                          <TicketFields ticketText={task.workflow_data.ticket_text} />
                        </div>
                      </div>
                    )}
                    
                    {task.workflow_data?.summary && (
                      <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Summary
                        </div>
                        <div className="text-sm text-nord0 dark:text-nord6 min-w-0">
                          <div className="bg-nord5/30 p-3 rounded-lg border border-nord4 dark:bg-nord2/30 dark:border-nord3 overflow-auto max-h-[300px] break-words">
                            <MessageContent role="user" content={task.workflow_data.summary} isLatestTool={false} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {task.workflow_data?.problem_summary && (
                      <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Problem
                        </div>
                        <div className="text-sm text-nord0 dark:text-nord6 min-w-0">
                          <div className="bg-nord11/5 p-3 rounded-lg border border-nord11/20 dark:bg-nord11/5 overflow-auto max-h-[300px] break-words">
                            <MessageContent role="user" content={task.workflow_data.problem_summary} isLatestTool={false} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {task.workflow_data?.solution_strategy && (
                      <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                        <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                          Strategy
                        </div>
                        <div className="text-sm text-nord0 dark:text-nord6 min-w-0">
                          <div className="bg-nord8/5 p-3 rounded-lg border border-nord8/20 dark:bg-nord8/5 overflow-auto max-h-[300px] break-words">
                            <MessageContent role="user" content={task.workflow_data.solution_strategy} isLatestTool={false} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Matrix-specific fields */}
                {task.workflow_id === 'matrix' && (
                  <>
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start pt-2 border-t border-nord4 dark:border-nord3">
                      <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                        Aspect Goal
                      </div>
                      <div className="text-sm text-nord0 dark:text-nord6 min-w-0">
                        {task.workflow_data?.aspect_goal ? (
                          <div className="bg-nord12/5 p-3 rounded-lg border border-nord12/20 dark:bg-nord12/5 overflow-auto max-h-[300px] break-words">
                            <MessageContent role="user" content={task.workflow_data.aspect_goal} isLatestTool={false} />
                          </div>
                        ) : (
                          <span className="text-nord3 dark:text-nord4">-</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-[120px_1fr] gap-2 items-start">
                      <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                        Strategy
                      </div>
                      <div className="text-sm text-nord0 dark:text-nord6 min-w-0">
                        {task.workflow_data?.strategy ? (
                          <div className="bg-nord8/5 p-3 rounded-lg border border-nord8/20 dark:bg-nord8/5 overflow-auto max-h-[300px] break-words">
                            <MessageContent role="user" content={task.workflow_data.strategy} isLatestTool={false} />
                          </div>
                        ) : (
                          <span className="text-nord3 dark:text-nord4">-</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Goal prompt for non-ticket workflows or if no ticket-specific data */}
                {(task.workflow_id !== 'ticket' || !task.workflow_data?.ticket_text) && task.goal_prompt && (
                  <div className="grid grid-cols-[120px_1fr] gap-2 items-start pt-2 border-t border-nord4 dark:border-nord3">
                    <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                      Goal
                    </div>
                    <div className="text-sm text-nord0 dark:text-nord6">
                      {task.goal_prompt.length > 200 ? (
                        <AnimatedDetails
                          defaultOpen={false}
                          summaryClassName="hover:text-nord10 dark:hover:text-nord8"
                          summary={<>{task.goal_prompt.slice(0, 200)}...</>}
                        >
                          <div className="mt-2 p-3 bg-nord5/50 rounded-lg border border-nord4 dark:bg-nord2/50 dark:border-nord3">
                            {task.goal_prompt}
                          </div>
                        </AnimatedDetails>
                      ) : (
                        task.goal_prompt
                      )}
                    </div>
                  </div>
                )}

                {/* Available Tools */}
                <div className="grid grid-cols-[120px_1fr] gap-2 items-start pt-2 border-t border-nord4 dark:border-nord3">
                  <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide">
                    Tools
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {task.available_tools === null ? (
                      <span className="badge bg-nord14/20 text-nord14 border-nord14/40">All</span>
                    ) : Array.isArray(task.available_tools) && task.available_tools.length === 0 ? (
                      <span className="badge bg-nord11/20 text-nord11 border-nord11/40">None</span>
                    ) : Array.isArray(task.available_tools) ? (
                      <>
                        {task.available_tools.slice(0, 5).map((tname, i) => (
                          <span key={i} className="badge">{tname}</span>
                        ))}
                        {task.available_tools.length > 5 && (
                          <span className="text-xs text-nord3 dark:text-nord4">+{task.available_tools.length - 5} more</span>
                        )}
                      </>
                    ) : null}
                    <Link to="/config/tools" className="link-muted text-xs">Explorer</Link>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {(task.workflow_id === 'ticket' || task.workflow_id === 'proactive') && (
                <div className="pt-3 border-t border-nord4 dark:border-nord3">
                  <ProgressBar value={task.iteration} max={task.max_iterations} status={task.status} />
                </div>
              )}
              {task.workflow_id === 'matrix' && (
                <div className="pt-3 border-t border-nord4 dark:border-nord3">
                  <PhaseProgressBar phase={(task.workflow_data?.phase ?? 0)} status={task.status} />
                </div>
              )}
            </div>

            {task.workflow_id === 'ticket' && <TicketTodoPanel conv={conv?.conversation || []} taskId={task.id} />}

            {/* Action buttons for non-conversational tasks */}
            {!['interactive', 'matrix', 'ticket', 'proactive'].includes(task.workflow_id) && (
              <ActionPanel taskId={id!} workflowId={task.workflow_id} status={task.status} />
            )}
          </div>

          {/* Overlay Chat/Phase Panel */}
          <div className={`fixed top-10 right-0 h-[calc(100vh-2.5rem)] w-[750px] z-40 transition-transform duration-300 ease-in-out ${
            isPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          {task.workflow_id === 'matrix' ? (
              <MatrixPhasePanel 
                taskId={task.id} 
                currentPhase={task.workflow_data?.phase ?? 0} 
                status={task.status}
                onClose={() => setIsPanelOpen(false)}
                streamingMessage={streamingMessage}
                blockInvalidateRef={blockInvalidateRef}
              />
          ) : (
              <div className="w-full h-full flex flex-col card border-2 border-nord8/30 dark:border-nord8/20 bg-nord6 dark:bg-nord1 shadow-nord-xl">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b-2 border-nord8/30 dark:border-nord8/20 bg-gradient-to-r from-nord8/10 to-nord9/10 dark:from-nord8/5 dark:to-nord9/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-nord8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h2 className="text-lg font-bold text-nord0 dark:text-nord6">Conversation</h2>
                    <span className="badge bg-nord8/30 text-nord10 border-nord8/40 dark:bg-nord8/20 dark:text-nord8 font-semibold">
                      {conv?.conversation?.length ?? 0}
                    </span>
                  </div>
                    <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-nord3 dark:text-nord4 cursor-pointer hover:text-nord10 transition-colors">
                    <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="rounded" /> 
                    Auto-scroll
                  </label>
                      <button
                        onClick={() => setIsPanelOpen(false)}
                        className="p-1 hover:bg-nord4/20 dark:hover:bg-nord3/20 rounded transition-colors"
                        title="Close chat"
                      >
                        <X className="w-5 h-5 text-nord3 dark:text-nord4" />
                      </button>
                    </div>
                </div>
              </div>
              
              {/* Chat Messages */}
                <div ref={convRef} className="flex-1 overflow-auto p-4 pb-8 space-y-4 bg-nord5/30 dark:bg-nord0/50">
                {(() => {
                  const msgs = (conv?.conversation || []).filter((m: any) => mode === 'expert' ? true : (m.role !== 'system' && m.role !== 'developer'))
                  const groups = groupMessages(msgs)
                  
                    // Check if we should show streaming for the last group
                    const isLastGroup = (idx: number) => idx === groups.length - 1
                    const shouldShowStreaming = streamingMessage && groups.length > 0
                    
                    // Show thinking indicator when agent is processing but no streaming yet
                    const isThinking = ['agent_turn', 'queued', 'queued_for_function_execution', 'function_execution', 'validation', 'in_progress'].includes(task?.status || '') && !streamingMessage
                    
                    return (
                      <>
                        {groups.map((group: any, idx: number) => {
                    // Render assistant turns with grouped tool calls
                    if (group.type === 'assistant') {
                            const isStreaming = shouldShowStreaming && isLastGroup(idx)
                            return <AssistantTurn key={idx} groupIdx={idx} group={group} mode={mode} streamingMessage={streamingMessage} isStreaming={isStreaming} manuallyToggledTools={manuallyToggledTools} setManuallyToggledTools={setManuallyToggledTools} />
                    }
                    
                    // Render other message types normally
                    const m = group.message
                    return (
                      <div key={idx} className={`message ${m.role==='user' ? 'message--user' : m.role==='system' ? 'message--system' : m.role==='developer' ? 'message--developer' : 'message--tool'}`}>
                        <div className="message-header mb-2">
                          <span className="uppercase font-bold text-xs tracking-wide">
                            {m.role === 'user' ? 'USER' : m.role === 'system' ? 'SYSTEM' : m.role === 'developer' ? 'DEVELOPER' : 'TOOL'}
                          </span>
                          {m.created_at && (
                            <span className="text-xs bg-nord5/70 px-2 py-0.5 rounded dark:bg-nord2">
                              {formatMessageTimestamp(m.created_at)}
                            </span>
                          )}
                        </div>
                        {m.content && <MessageContent role={m.role} content={m.content} isLatestTool={false} />}
                      </div>
                    )
                        })}
                        <AnimatedMount show={isThinking} duration={200}>
                          <div className="flex justify-center py-4">
                            <div className="flex items-center gap-3 px-4 py-2 bg-nord8/10 rounded-full border border-nord8/30 dark:bg-nord8/5">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-nord8 border-t-transparent"></div>
                              <span className="text-sm text-nord10 dark:text-nord8 font-medium">Agent is thinking...</span>
                            </div>
                          </div>
                        </AnimatedMount>
                      </>
                    )
                })()}
              </div>
              
              {/* Chat Input Area */}
                {/* Only show when there's actually content to display */}
              <AnimatedMount
                show={
                  task.status === 'action_required' ||
                  (task.status === 'help_required' && !!task.approval_reason) ||
                  ((task.workflow_id === 'interactive' || task.workflow_id === 'matrix') && task.status === 'user_turn') ||
                  task.workflow_id === 'proactive' ||
                  task.workflow_id === 'ticket'
                }
              >
                <ChatInputPanel taskId={id!} workflowId={task.workflow_id} status={task.status} approvalReason={task.approval_reason} blockInvalidateRef={blockInvalidateRef} />
              </AnimatedMount>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  )
}

function ChatInputPanel({ taskId, workflowId, status, approvalReason, blockInvalidateRef }: { taskId: string; workflowId: string; status: string; approvalReason?: string | null; blockInvalidateRef: React.MutableRefObject<boolean> }) {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [guide, setGuide] = useState('')
  const [help, setHelp] = useState('')
  const [busy, setBusy] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries()
  }

  const onApprove = async (approved: boolean) => {
    setBusy(true)
    blockInvalidateRef.current = true
    try {
      if (workflowId === 'interactive') await tasksApi.workflows.interactive.action(taskId, approved)
      else if (workflowId === 'proactive') await tasksApi.workflows.proactive.action(taskId, approved)
      else if (workflowId === 'ticket') await tasksApi.workflows.ticket.action(taskId, approved)
      else if (workflowId === 'matrix') await tasksApi.workflows.matrix.action(taskId, approved)
    } finally {
      setBusy(false)
      // Delay invalidate to allow exit animation to play
      setTimeout(() => {
        blockInvalidateRef.current = false
      invalidate()
      }, 350)
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
    setIsExiting(true)
    blockInvalidateRef.current = true
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.markComplete(taskId)
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.markComplete(taskId)
    // Delay invalidate to allow exit animation to play
    setTimeout(() => {
      blockInvalidateRef.current = false
    invalidate()
    }, 350)
  }
  
  const onMarkFailed = async () => {
    setIsExiting(true)
    blockInvalidateRef.current = true
    if (workflowId === 'interactive') await tasksApi.workflows.interactive.markFailed(taskId)
    else if (workflowId === 'matrix') await tasksApi.workflows.matrix.markFailed(taskId)
    // Delay invalidate to allow exit animation to play
    setTimeout(() => {
      blockInvalidateRef.current = false
    invalidate()
    }, 350)
  }

  return (
    <div className="border-t-2 border-nord8/30 dark:border-nord8/20 bg-nord6 dark:bg-nord1">
      {/* Critical banners */}
      {status === 'action_required' && (
        <div className="p-4 pb-12 bg-nord13/20 border-b-2 border-nord13/40 dark:bg-nord13/10 dark:border-nord13/30">
          <div className="text-sm text-nord0 dark:text-nord6 font-semibold mb-2">Supervisor action required</div>
          {approvalReason && (
            <div className="text-sm text-nord0 dark:text-nord6 mb-3 p-3 bg-white rounded-lg border border-nord13/30 shadow-sm dark:bg-nord0 dark:border-nord13/20">
              {approvalReason}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => onApprove(true)} disabled={busy} className="btn-primary disabled:opacity-50 flex-1">
              <CheckCircle2 className="w-4 h-4 inline mr-1" /> Approve
            </button>
            <button onClick={() => onApprove(false)} disabled={busy} className="btn-danger disabled:opacity-50 flex-1">
              <XCircle className="w-4 h-4 inline mr-1" /> Reject
            </button>
          </div>
        </div>
      )}

      {status === 'help_required' && approvalReason && (
        <div className="p-4 pb-12 bg-nord13/20 border-b-2 border-nord13/40 dark:bg-nord13/10 dark:border-nord13/30">
          <div className="text-xs text-nord13 dark:text-nord13 font-semibold mb-2 uppercase tracking-wide">Agent needs help</div>
          <div className="text-sm text-nord0 dark:text-nord6 mb-3 p-3 bg-nord6/70 rounded-lg border border-nord13/30 dark:bg-nord2/70 dark:border-nord13/20">
            <MessageContent role="user" content={approvalReason} isLatestTool={false} />
          </div>
        </div>
      )}

      {/* Interactive/Matrix user_turn message input */}
      {!isExiting && (workflowId === 'interactive' || workflowId === 'matrix') && status === 'user_turn' && (
        <div className="p-4 pb-12 space-y-2">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSendMessage() }
                else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage() }
              }}
              rows={3}
              className="textarea flex-1"
              placeholder="Type your message… (Enter to send, Shift+Enter newline)"
            />
            <button onClick={onSendMessage} disabled={!message.trim() || busy} className="btn-primary disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onMarkComplete} disabled={busy || isExiting} className="btn-outline disabled:opacity-50 text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </button>
            <button onClick={onMarkFailed} disabled={busy || isExiting} className="btn-danger disabled:opacity-50 text-xs flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Failed
            </button>
          </div>
        </div>
      )}

      {/* Proactive/Ticket input box - dynamically show Guide or Help based on status */}
      {(workflowId === 'proactive' || workflowId === 'ticket') && (
        <div className="p-4 pb-12">
          {status === 'help_required' ? (
            <>
              <div className="text-sm text-nord0 dark:text-nord6 font-semibold mb-2">Provide Help</div>
              <div className="flex gap-2">
                <textarea 
                  value={help} 
                  onChange={e => setHelp(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onHelp() } }}
                  rows={3} 
                  className="textarea flex-1" 
                  placeholder="Type your help response... (Ctrl/Cmd+Enter to send)" 
                />
                <button onClick={onHelp} disabled={!help.trim() || busy} className="btn-primary disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-nord0 dark:text-nord6 font-semibold mb-2">Guide Task</div>
              <div className="flex gap-2">
                <textarea
                  value={guide}
                  onChange={e => setGuide(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onGuide() } }}
                  rows={3}
                  className="textarea flex-1"
                  placeholder="Provide guidance message… (Ctrl/Cmd+Enter to send)"
                />
                <button onClick={onGuide} disabled={!guide.trim() || busy} className="btn-primary disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ActionPanel({ taskId, workflowId, status }: { taskId: string; workflowId: string; status: string }) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries()
  }

  return (
    <div className="space-y-4">
      {/* Cancel Task */}
      {!['completed','failed','canceled','cancelled'].includes(status) && (
        <div className="flex items-center">
          <button onClick={async () => { setBusy(true); try { await tasksApi.cancel(taskId) } finally { setBusy(false); invalidate() } }} className="btn-danger">Cancel Task</button>
        </div>
      )}
    </div>
  )
}

function MatrixPhasePanel({ taskId, currentPhase, status, onClose, streamingMessage, blockInvalidateRef }: { taskId: string; currentPhase: number; status: string; onClose: () => void; streamingMessage: any; blockInvalidateRef: React.MutableRefObject<boolean> }) {
  const { mode } = useMode()
  const [phase, setPhase] = useState<number>(Math.max(1, currentPhase || 1))
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const { data, isLoading, error} = useMatrixConversation(taskId, phase)
  const convRef = useRef<HTMLDivElement | null>(null)
  const previousPhaseRef = useRef<number>(currentPhase)
  
  // Track manually toggled tool calls: key is `${groupIdx}-${toolIdx}`, value is open state
  const [manuallyToggledTools, setManuallyToggledTools] = useState<Record<string, boolean>>({})
  
  // Auto-advance to next phase when current phase changes (but not when user manually selects a phase)
  useEffect(() => {
    if (currentPhase > 0 && currentPhase > previousPhaseRef.current) {
      setPhase(currentPhase)
      previousPhaseRef.current = currentPhase
    } else if (currentPhase > 0) {
      previousPhaseRef.current = currentPhase
    }
  }, [currentPhase])
  
  // Scroll to bottom on new messages if enabled
  useEffect(() => {
    if (!autoScroll) return
    const el = convRef.current
    if (el) {
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight }, 50)
    }
  }, [data?.conversation, autoScroll])
  
  // Determine if we're viewing a past phase
  const isViewingPastPhase = phase < currentPhase && currentPhase > 0
  
  return (
    <div className="w-full h-full flex flex-col card border-2 border-nord8/30 dark:border-nord8/20 bg-nord6 dark:bg-nord1 shadow-nord-xl">
      {/* Phase Header */}
      <div className="px-6 py-4 border-b-2 border-nord8/30 dark:border-nord8/20 bg-gradient-to-r from-nord12/10 to-nord13/10 dark:from-nord12/5 dark:to-nord13/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-nord12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h2 className="text-lg font-bold text-nord0 dark:text-nord6">Matrix Phase {phase}</h2>
            <span className="badge bg-nord12/30 text-nord12 border-nord12/40 font-semibold">
              {data?.conversation?.length ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-nord3 dark:text-nord4 cursor-pointer hover:text-nord10 transition-colors">
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="rounded" /> 
              Auto-scroll
            </label>
            <button
              onClick={onClose}
              className="p-1 hover:bg-nord4/20 dark:hover:bg-nord3/20 rounded transition-colors"
              title="Close panel"
            >
              <X className="w-5 h-5 text-nord3 dark:text-nord4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[1,2,3,4].map(p => {
            const isAccessible = p <= currentPhase || currentPhase === 0
            const isActive = phase === p
            return (
              <button 
                key={p} 
                onClick={() => isAccessible && setPhase(p)} 
                disabled={!isAccessible}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-nord12 to-nord13 text-nord0 border-transparent shadow-md' 
                    : isAccessible 
                      ? 'bg-nord6 text-nord0 border-nord4 hover:bg-nord5 hover:border-nord12 dark:bg-nord2 dark:text-nord6 dark:border-nord3 dark:hover:bg-nord3' 
                      : 'bg-nord5/50 text-nord3 border-nord4 cursor-not-allowed opacity-50 dark:bg-nord2/50 dark:text-nord4 dark:border-nord3'
                }`}
              >
                Phase {p}
              </button>
            )
          })}
        </div>
        {isViewingPastPhase && (
          <div className="mt-3 text-xs font-medium text-nord12 dark:text-nord13 bg-nord13/15 dark:bg-nord13/10 px-3 py-1.5 rounded-lg border border-nord13/40 dark:border-nord13/30">
            📜 Viewing past phase (read-only)
          </div>
        )}
      </div>
      
      {/* Phase Messages */}
      <div ref={convRef} className="flex-1 overflow-auto p-4 pb-8 space-y-3 bg-nord5/30 dark:bg-nord0/50">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-nord12 border-t-transparent"></div>
            <p className="mt-2 text-sm text-nord3 dark:text-nord4">Loading phase {phase}…</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8 text-nord11">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm font-semibold">Failed to load phase</div>
          </div>
        )}
        {!isLoading && !error && (() => {
          const msgs = (data?.conversation || []).filter((m: any) => mode === 'expert' ? true : (m.role !== 'system' && m.role !== 'developer'))
          const groups = groupMessages(msgs)
          
          // Check if we should show streaming for the last group in Matrix phase
          const isLastGroup = (idx: number) => idx === groups.length - 1
          const shouldShowStreaming = streamingMessage && groups.length > 0 && !isViewingPastPhase
          
          // Show thinking indicator when agent is processing but no streaming yet
          const isThinking = ['agent_turn', 'queued', 'queued_for_function_execution', 'function_execution', 'validation', 'in_progress'].includes(status || '') && !streamingMessage && !isViewingPastPhase
          
          return (
            <>
              {groups.map((group: any, idx: number) => {
            // Render assistant turns with grouped tool calls
            if (group.type === 'assistant') {
                  const isStreaming = shouldShowStreaming && isLastGroup(idx)
                  return <AssistantTurn key={idx} groupIdx={idx} group={group} mode={mode} streamingMessage={streamingMessage} isStreaming={isStreaming} manuallyToggledTools={manuallyToggledTools} setManuallyToggledTools={setManuallyToggledTools} />
            }
            
            // Render other message types normally
            const m = group.message
            return (
              <div key={idx} className={`message ${m.role==='user' ? 'message--user' : m.role==='system' ? 'message--system' : m.role==='developer' ? 'message--developer' : 'message--tool'}`}>
                <div className="message-header mb-2">
                  <span className="uppercase font-bold text-xs tracking-wide">
                    {m.role === 'user' ? 'USER' : m.role === 'system' ? 'SYSTEM' : m.role === 'developer' ? 'DEVELOPER' : 'TOOL'}
                  </span>
                  {m.created_at && (
                    <span className="text-xs bg-nord5/70 px-2 py-0.5 rounded dark:bg-nord2">
                      {formatMessageTimestamp(m.created_at)}
                    </span>
                  )}
                </div>
                {m.content && <MessageContent role={m.role} content={m.content} isLatestTool={false} />}
              </div>
            )
              })}
              <AnimatedMount show={isThinking} duration={200}>
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-nord8/10 rounded-full border border-nord8/30 dark:bg-nord8/5">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-nord8 border-t-transparent"></div>
                    <span className="text-sm text-nord10 dark:text-nord8 font-medium">Agent is thinking...</span>
                  </div>
                </div>
              </AnimatedMount>
            </>
          )
        })()}
      </div>
      
      {/* Chat Input Area - only show for current phase */}
      <AnimatedMount show={!isViewingPastPhase}>
        <ChatInputPanel taskId={taskId} workflowId="matrix" status={status} approvalReason={null} blockInvalidateRef={blockInvalidateRef} />
      </AnimatedMount>
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

function renderMarkdownTodo(markdown: string) {
  if (!markdown || !markdown.trim()) return null
  
  const lines = markdown.split('\n')
  const elements: JSX.Element[] = []
  
  lines.forEach((line, idx) => {
    // Count leading spaces for indentation
    const match = line.match(/^(\s*)(.*)$/)
    if (!match) return
    const indent = match[1].length
    const content = match[2]
    
    // Todo item: - [ ] or - [x]
    const todoMatch = content.match(/^-\s*\[([ xX])\]\s*(.+)$/)
    if (todoMatch) {
      const checked = todoMatch[1].toLowerCase() === 'x'
      const text = todoMatch[2]
      elements.push(
        <div key={idx} className="flex items-start gap-2 py-1" style={{ paddingLeft: `${indent * 8}px` }}>
          <input 
            type="checkbox" 
            checked={checked} 
            readOnly 
            className="mt-1 rounded border-nord4 text-nord8 cursor-default dark:border-nord3"
          />
          <span className={`text-sm ${checked ? 'line-through text-nord3 dark:text-nord4' : 'text-nord0 dark:text-nord6'}`}>
            {text}
          </span>
        </div>
      )
      return
    }
    
    // Regular list item: - text
    const listMatch = content.match(/^-\s+(.+)$/)
    if (listMatch) {
      elements.push(
        <div key={idx} className="flex items-start gap-2 py-1" style={{ paddingLeft: `${indent * 8}px` }}>
          <span className="text-nord8 dark:text-nord8 mt-0.5">•</span>
          <span className="text-sm text-nord0 dark:text-nord6">{listMatch[1]}</span>
        </div>
      )
      return
    }
    
    // Heading: # text
    const headingMatch = content.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-xs']
      const className = `${sizes[level - 1]} font-semibold text-nord0 dark:text-nord6 mt-3 mb-2`
      elements.push(
        <div key={idx} className={className} style={{ paddingLeft: `${indent * 8}px` }}>
          {text}
        </div>
      )
      return
    }
    
    // Empty line
    if (!content.trim()) {
      elements.push(<div key={idx} className="h-2" />)
      return
    }
    
    // Regular text
    elements.push(
      <div key={idx} className="text-sm text-nord0 dark:text-nord6 py-0.5" style={{ paddingLeft: `${indent * 8}px` }}>
        {content}
      </div>
    )
  })
  
  return <div className="space-y-0.5">{elements}</div>
}

function TicketTodoPanel({ conv, taskId }: { conv: any[]; taskId: string }) {
  const [value, setValue] = useState<string>(() => extractTicketTodoFromConversation(conv))
  const [isEditing, setIsEditing] = useState(false)
  
  useEffect(() => {
    setValue(extractTicketTodoFromConversation(conv))
  }, [conv])
  
  const onSend = async () => {
    const msg = `Update the ticket_todo to the following Markdown exactly:\n\n${value}`
    await tasksApi.workflows.ticket.guide(taskId, msg)
    setIsEditing(false)
  }
  
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-nord0 dark:text-nord6 flex items-center gap-2">
          <svg className="w-5 h-5 text-nord8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Ticket TODO
        </h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-outline text-sm">
                Cancel
              </button>
              <button onClick={onSend} className="btn-primary text-sm">
                Send Update
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="btn-outline text-sm">
              ✏️ Edit
            </button>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <>
          <textarea 
            aria-label="Ticket todo content" 
            value={value} 
            onChange={e => setValue(e.target.value)} 
            rows={12} 
            className="textarea font-mono text-sm w-full" 
            placeholder="# TODO&#10;- [ ] Unchecked item&#10;- [x] Checked item&#10;  - [ ] Nested item"
          />
          <div className="text-xs text-nord3 dark:text-nord4">
            This updates the TODO by sending guidance to the agent, which will apply it using the built-in ticket_todo tool.
          </div>
        </>
      ) : (
        <div className="bg-nord5/30 dark:bg-nord0/30 rounded-lg p-4 border border-nord4 dark:border-nord3">
          {value && value.trim() ? (
            renderMarkdownTodo(value)
          ) : (
            <div className="text-sm text-nord3 dark:text-nord4 italic text-center py-4">
              No TODO items yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}


