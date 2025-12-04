import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useTask, useSelfManagedConversation, taskKeys } from '../../hooks/useTask'
import { MessageContent } from '../../lib/markdown'
import { formatTimestamp, formatMessageTimestamp } from '../../lib/time'
import { groupMessages } from '../../lib/messageGrouping'
import { useMode } from '../../state/ModeContext'
import { useWebSocket } from '../../ws/WebSocketProvider'
import { tasksApi } from '../../lib/api'
import type { SelfManagedMemory } from '../../types/api'
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Brain,
  ListTodo,
  Clock,
  Archive,
  AlertCircle
} from 'lucide-react'
import { StreamingIndicator } from '../../components/StreamingIndicator'
import { StreamingReasoning } from '../../components/StreamingReasoning'
import { StreamingToolCall } from '../../components/StreamingToolCall'
import { StreamingContent } from '../../components/StreamingContent'
import { AnimatedDetails } from '../../components/AnimatedDetails'
import { AnimatedMount } from '../../components/AnimatedMount'
import toast from 'react-hot-toast'

// Icon components (from TaskDetail)
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

// Helper to parse markdown summary (from TaskDetail)
function parseSummary(summary: string | null | undefined): { title: string; sections: Array<{ subtitle?: string; content: string }> } | null {
  if (!summary || !summary.trim()) return null
  
  const lines = summary.trim().split('\n')
  let mainTitle = ''
  const sections: Array<{ subtitle?: string; content: string }> = []
  let currentSection: { subtitle?: string; content: string } = { content: '' }
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      mainTitle = line.substring(2).trim()
    } else if (line.startsWith('## ')) {
      if (currentSection.content.trim() || currentSection.subtitle) {
        sections.push(currentSection)
      }
      currentSection = { subtitle: line.substring(3).trim(), content: '' }
    } else if (line.trim()) {
      currentSection.content += (currentSection.content ? '\n' : '') + line
    }
  }
  
  if (currentSection.content.trim() || currentSection.subtitle) {
    sections.push(currentSection)
  }
  
  if (sections.length === 0 && lines.length > 1) {
    const contentLines = lines.filter(l => !l.startsWith('# '))
    if (contentLines.length > 0) {
      sections.push({ content: contentLines.join('\n').trim() })
    }
  }
  
  return mainTitle ? { title: mainTitle, sections } : null
}

// groupMessages is imported from ../../lib/messageGrouping

// Assistant turn component (simplified from TaskDetail)
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
  
  const isEmpty = isStreaming && streamingMessage && !streamingMessage.content && !streamingMessage.reasoning && (!streamingMessage.tool_calls || streamingMessage.tool_calls.length === 0)
  const isStreamingReasoning = isStreaming && streamingMessage?.reasoning && (!streamingMessage?.tool_calls || streamingMessage.tool_calls.length === 0) && !streamingMessage?.content
  const isStreamingToolCalls = isStreaming && streamingMessage?.tool_calls && streamingMessage.tool_calls.length > 0
  const isStreamingContent = isStreaming && streamingMessage?.content && streamingMessage.content.length > 0
  
  return (
    <div className="message message--assistant">
      <div className="message-header mb-3">
        <span className="uppercase font-bold text-xs tracking-wide text-nord10 dark:text-nord8">ASSISTANT</span>
        {lastMsg?.created_at && (
          <span className="text-xs bg-nord5/70 px-2 py-0.5 rounded dark:bg-nord2">
            {formatMessageTimestamp(lastMsg.created_at)}
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {hasToolCalls && group.toolInteractions.map((interaction: any, idx: number) => {
          const toolCall = interaction.toolCall
          const toolResponse = interaction.toolResponse
          const reasoning = interaction.reasoning
          const toolName = toolCall?.function?.name || 'unknown'
          
          const toolKey = `${groupIdx}-${idx}`
          const shouldAutoOpen = !hasContent && !isStreaming && idx === group.toolInteractions.length - 1
          const isToolOpen = manuallyToggledTools[toolKey] !== undefined 
            ? manuallyToggledTools[toolKey] 
            : shouldAutoOpen
          
          return (
            <div key={idx}>
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
              
              {/* Content that came with tool calls (intermediate response) */}
              {interaction.contentWithToolCalls && (
                <div className="mb-2 p-3 bg-nord6/50 dark:bg-nord1/50 rounded-lg border border-nord5 dark:border-nord2">
                  <div className="text-sm leading-relaxed">
                    <MessageContent role="assistant" content={interaction.contentWithToolCalls} isLatestTool={false} />
                  </div>
                </div>
              )}
              
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
                  {mode === 'simple' && interaction.tool_call_summary && (() => {
                    const parsed = parseSummary(interaction.tool_call_summary)
                    return parsed && parsed.sections.length > 0 && (
                      <div className="text-nord3 dark:text-nord4 whitespace-pre-wrap">{parsed.sections[0].content}</div>
                    )
                  })()}
                  
                  {mode === 'expert' && toolCall?.function?.arguments && (
                    <div className="text-xs">
                      <div className="text-xs text-nord3 dark:text-nord4 mb-1">Parameters:</div>
                      <pre className="overflow-auto bg-nord5 rounded-lg p-2 text-nord0 dark:bg-nord2 dark:text-nord6 text-xs">
                        {toolCall.function.arguments}
                      </pre>
                    </div>
                  )}
                  
                  {toolResponse && mode === 'expert' && (
                    <div className="mt-2 content-expanding">
                      <div className="text-xs text-nord3 dark:text-nord4 mb-1">Response:</div>
                      <div className="tool-response-box p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs max-h-[7.5rem] overflow-auto">
                        <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre font-mono m-0">{toolResponse.content}</pre>
                      </div>
                    </div>
                  )}
                  
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
        
        {/* Orphan tool messages (system-injected, like wake notifications) */}
        {group.orphanToolMessages && group.orphanToolMessages.length > 0 && group.orphanToolMessages.map((toolMsg: any, idx: number) => {
          const toolKey = `${groupIdx}-orphan-${idx}`
          const isToolOpen = manuallyToggledTools[toolKey] !== undefined 
            ? manuallyToggledTools[toolKey] 
            : true // Default open for notifications
          
          // Try to get a title from the summary or use a default
          const summaryParsed = toolMsg.tool_output_summary ? parseSummary(toolMsg.tool_output_summary) : null
          const title = summaryParsed?.title || 'System Notification'
          
          return (
            <div key={toolKey}>
              <AnimatedDetails 
                className="text-xs mb-2"
                summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
                open={isToolOpen}
                onToggle={(newState) => {
                  setManuallyToggledTools({ ...manuallyToggledTools, [toolKey]: newState })
                }}
                summary={<span className="flex items-center gap-1.5">▸ <WrenchIcon />{title}</span>}
              >
                <div className="mt-2 ml-4 space-y-2">
                  {mode === 'simple' && summaryParsed && summaryParsed.sections.length > 0 ? (
                    <div className="p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs">
                      {summaryParsed.sections.map((section, sidx) => (
                        <div key={sidx}>
                          <MessageContent role="assistant" content={section.content} isLatestTool={false} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tool-response-box p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs max-h-[7.5rem] overflow-auto">
                      <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre font-mono m-0">{toolMsg.content}</pre>
                    </div>
                  )}
                </div>
              </AnimatedDetails>
            </div>
          )
        })}
        
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
        
        {isStreamingContent && (
          <div className="mt-2">
            <StreamingContent content={streamingMessage.content} />
          </div>
        )}
        
        {!isStreaming && hasContent && (
          <div className="text-sm leading-relaxed mt-2">
            <MessageContent role="assistant" content={group.finalContent} isLatestTool={false} />
          </div>
        )}
        
        {isStreamingReasoning && mode === 'expert' && (
          <StreamingReasoning reasoning={streamingMessage.reasoning} />
        )}
        
        {isStreamingToolCalls && streamingMessage.tool_calls.map((tc: any, idx: number) => {
          const toolName = tc?.function?.name || 'unknown'
          const parameters = tc?.function?.arguments || ''
          return (
            <StreamingToolCall key={idx} toolName={toolName} parameters={parameters} mode={mode} />
          )
        })}
        
        {isEmpty && <StreamingIndicator />}
      </div>
    </div>
  )
}

// Mode indicator badge
function ModeIndicator({ status, workflowData }: { status: string; workflowData?: Record<string, any> }) {
  if (status === 'sleeping') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-nord3/20 rounded-lg dark:bg-nord3/30">
        <Moon className="w-5 h-5 text-nord3 dark:text-nord4" />
        <span className="text-sm font-medium text-nord3 dark:text-nord4">Sleeping</span>
      </div>
    )
  }
  
  // Background active state - user is away, assistant is working
  if (status === 'background_active') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-nord15/20 rounded-lg dark:bg-nord15/30">
        <svg className="w-5 h-5 text-nord15 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-nord15">Background Active</span>
      </div>
    )
  }
  
  const lastMode = workflowData?.last_mode
  if (lastMode === 'background') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-nord10/20 rounded-lg dark:bg-nord10/30">
        <svg className="w-5 h-5 text-nord10 dark:text-nord8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-nord10 dark:text-nord8">Background</span>
      </div>
    )
  }
  
  // Interactive (default)
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-nord14/20 rounded-lg dark:bg-nord14/30">
      <Sun className="w-5 h-5 text-nord14" />
      <span className="text-sm font-medium text-nord14">Interactive</span>
    </div>
  )
}

// Memory item component
function MemoryItem({ memory }: { memory: SelfManagedMemory }) {
  const [expanded, setExpanded] = useState(false)
  const isCommon = !memory.task_id
  const isLongContent = memory.content.length > 100
  
  return (
    <div 
      className={`p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 transition-all ${
        isLongContent ? 'cursor-pointer hover:border-nord8/50 dark:hover:border-nord8/30' : ''
      }`}
      onClick={() => isLongContent && setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isLongContent && (
            <svg 
              className={`w-3 h-3 text-nord3 dark:text-nord4 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <h4 className="text-sm font-medium text-nord0 dark:text-nord6 truncate">{memory.title}</h4>
        </div>
        {isCommon && (
          <span className="text-[10px] bg-nord8/20 text-nord10 px-1.5 py-0.5 rounded dark:bg-nord8/30 dark:text-nord8 flex-shrink-0">
            Common
          </span>
        )}
      </div>
      <div className="mb-2">
        <div className={`text-xs text-nord3 dark:text-nord4 overflow-hidden transition-all ${expanded ? 'max-h-[1000px]' : 'max-h-[2.5rem]'}`}>
          <MessageContent role="assistant" content={memory.content} isLatestTool={false} />
        </div>
        {!expanded && isLongContent && (
          <span className="text-[10px] text-nord8/60 dark:text-nord8/50 mt-0.5 block">more...</span>
        )}
      </div>
      {memory.tags && memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map((tag, idx) => (
            <span key={idx} className="text-[10px] bg-nord4/50 text-nord3 px-1.5 py-0.5 rounded dark:bg-nord3/30 dark:text-nord4">
              {tag}
            </span>
          ))}
        </div>
      )}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-nord4/30 dark:border-nord3/30 text-[10px] text-nord3 dark:text-nord4">
          Created: {new Date(memory.created_at).toLocaleString()}
          {memory.updated_at !== memory.created_at && (
            <span className="ml-2">• Updated: {new Date(memory.updated_at).toLocaleString()}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function SelfManagedDetail() {
  const { id } = useParams()
  const { mode } = useMode()
  const { subscribe } = useWebSocket()
  const queryClient = useQueryClient()
  const { data: task, isLoading, error } = useTask(id)
  const { data: conv } = useSelfManagedConversation(id)
  
  // Panel state
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  
  // Chat state
  const [autoScroll, setAutoScroll] = useState<boolean>(true)
  const [streamingMessage, setStreamingMessage] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const convRef = useRef<HTMLDivElement | null>(null)
  const [manuallyToggledTools, setManuallyToggledTools] = useState<Record<string, boolean>>({})
  
  // Memory state
  const [memorySearch, setMemorySearch] = useState('')
  const [includeCommon, setIncludeCommon] = useState(true)
  
  // Fetch memories
  const { data: memoriesData } = useQuery({
    queryKey: ['self-managed-memories', id, includeCommon],
    queryFn: () => id ? tasksApi.workflows.selfManaged.getMemories(id, includeCommon) : Promise.resolve({ memories: [], total: 0 }),
    enabled: !!id && rightPanelOpen,
    refetchInterval: 30000, // Refresh every 30s when panel is open
  })
  
  // Filter memories by search
  const filteredMemories = useMemo(() => {
    if (!memoriesData?.memories) return []
    if (!memorySearch.trim()) return memoriesData.memories
    const q = memorySearch.toLowerCase()
    return memoriesData.memories.filter(m => 
      m.title.toLowerCase().includes(q) || 
      m.content.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    )
  }, [memoriesData, memorySearch])
  
  // Extract job list from workflow data
  const jobList = task?.workflow_data?.job_list || ''
  
  // WebSocket subscription
  useEffect(() => {
    const unsub = subscribe((evt) => {
      if (!id) return
      
      if (evt.event_type === 'message_streaming' && evt.task_id === id) {
        const streamData = {
          message_id: evt.message_id,
          role: evt.role,
          content: evt.content || '',
          reasoning: evt.reasoning || '',
          tool_calls: evt.tool_calls || null,
          is_complete: evt.is_complete || false,
        }
        
        if (streamData.is_complete) {
          setStreamingMessage(null)
          queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
        } else {
          setStreamingMessage(streamData)
        }
        return
      }
      
      if (evt.event_type === 'message_summary_generated' && evt.task_id === id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.conversation(id) })
        return
      }
      
      // Handle memory events
      if (['mio_memory_created', 'mio_memory_updated', 'mio_memory_deleted'].includes(evt.event_type) && evt.task_id === id) {
        queryClient.invalidateQueries({ queryKey: ['self-managed-memories', id] })
        return
      }
      
      // Handle messages_archived event - refresh conversation when assistant archives old messages
      if (evt.event_type === 'messages_archived' && evt.task_id === id) {
        queryClient.invalidateQueries({ queryKey: ['task', id, 'self-managed-conversation'] })
        return
      }
      
      if (evt.task_id === id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.byId(id) })
        if (evt.event_type !== 'message_streaming') {
          queryClient.invalidateQueries({ queryKey: ['task', id, 'self-managed-conversation'] })
        }
      }
    }, { eventTypes: ['task_status_changed', 'message_added', 'message_streaming', 'message_summary_generated', 'approval_requested', 'task_workflow_data_changed', 'mio_memory_created', 'mio_memory_updated', 'mio_memory_deleted', 'messages_archived'] })
    return () => {}
  }, [subscribe, queryClient, id])
  
  // Auto-scroll
  useEffect(() => {
    if (!autoScroll) return
    const el = convRef.current
    if (el) {
      setTimeout(() => { if (el) el.scrollTop = el.scrollHeight }, 50)
    }
  }, [conv?.conversation, streamingMessage, autoScroll])
  
  // Handlers
  const invalidate = () => {
    queryClient.invalidateQueries()
  }
  
  const onSendMessage = async () => {
    if (!message.trim() || !id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.sendMessage(id, message.trim())
      setMessage('')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to send message')
    } finally {
      setBusy(false)
    }
  }
  
  const onWake = async () => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.wake(id)
      toast.success('Waking up...')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to wake assistant')
    } finally {
      setBusy(false)
    }
  }
  
  const onMarkAway = async () => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.userAway(id)
      toast.success('Marked user as away')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to mark away')
    } finally {
      setBusy(false)
    }
  }
  
  const onArchive = async () => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.archive(id)
      toast.success('Session archived')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to archive')
    } finally {
      setBusy(false)
    }
  }
  
  const onMarkComplete = async () => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.markComplete(id)
      toast.success('Marked complete')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to mark complete')
    } finally {
      setBusy(false)
    }
  }
  
  const onMarkFailed = async () => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.markFailed(id)
      toast.success('Marked failed')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to mark failed')
    } finally {
      setBusy(false)
    }
  }
  
  const onApprove = async (approved: boolean) => {
    if (!id) return
    setBusy(true)
    try {
      await tasksApi.workflows.selfManaged.action(id, approved)
      toast.success(approved ? 'Action approved' : 'Action rejected')
      invalidate()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to respond')
    } finally {
      setBusy(false)
    }
  }
  
  const workflowData = task?.workflow_data || {}
  const isSleeping = task?.status === 'sleeping'
  const isBackgroundActive = task?.status === 'background_active'
  const canWake = isSleeping || isBackgroundActive  // Both states can be woken
  const isActionRequired = task?.status === 'action_required'
  const isTerminal = ['completed', 'failed', 'cancelled', 'archived'].includes(task?.status || '')
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-nord8 border-t-transparent"></div>
          <p className="mt-4 text-nord3 dark:text-nord4">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-nord11 mx-auto mb-4" />
          <div className="text-nord11 font-semibold mb-2">Failed to load session</div>
          <p className="text-sm text-nord3 dark:text-nord4 mb-4">
            The task could not be found or there was an error loading it.
          </p>
          <Link to="/workflows/self-managed" className="btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to list
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-[calc(100vh-4rem)] relative">
      {/* Left Panel: Status & Controls - Absolute positioned from left edge */}
      <div className={`absolute left-0 top-0 h-full z-10 transition-transform duration-300 ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full w-64 border-r border-nord4 dark:border-nord3 bg-nord6/90 dark:bg-nord1/90 backdrop-blur-sm flex flex-col shadow-lg relative">
          {/* Header */}
          <div className="p-4 border-b border-nord4 dark:border-nord3">
            <Link to="/workflows/self-managed" className="flex items-center gap-2 text-sm text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8 mb-3">
              <ArrowLeft className="w-4 h-4" />
              Back to list
            </Link>
            <h2 className="text-lg font-bold text-nord0 dark:text-nord6">Self-Managed</h2>
            <div className="text-xs text-nord3 dark:text-nord4 font-mono">{id?.slice(0, 8)}</div>
          </div>
          
          {/* Task Status */}
          <div className="p-4 border-b border-nord4 dark:border-nord3">
            <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide mb-2">State</div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                task.status === 'sleeping' ? 'bg-nord3/20 text-nord3 dark:text-nord4' :
                task.status === 'background_active' ? 'bg-nord15/20 text-nord15' :
                task.status === 'user_turn' ? 'bg-nord14/20 text-nord14' :
                task.status === 'agent_turn' || task.status === 'background_turn' ? 'bg-nord8/20 text-nord8' :
                task.status === 'queued' || task.status === 'queued_for_function_execution' ? 'bg-nord13/20 text-nord13' :
                task.status === 'action_required' ? 'bg-nord12/20 text-nord12' :
                task.status === 'completed' ? 'bg-nord14/20 text-nord14' :
                task.status === 'failed' ? 'bg-nord11/20 text-nord11' :
                task.status === 'archived' ? 'bg-nord3/20 text-nord3 dark:text-nord4' :
                'bg-nord4/20 text-nord3 dark:text-nord4'
              }`}>
                {task.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          
          {/* Mode indicator */}
          <div className="p-4 border-b border-nord4 dark:border-nord3">
            <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide mb-2">Mode</div>
            <ModeIndicator status={task.status} workflowData={workflowData} />
          </div>
          
          {/* Status info */}
          <div className="p-4 border-b border-nord4 dark:border-nord3 space-y-3">
            {workflowData.last_user_activity_at && (
              <div>
                <div className="text-xs text-nord3 dark:text-nord4 mb-1">Last Activity</div>
                <div className="text-sm text-nord0 dark:text-nord6">{formatTimestamp(workflowData.last_user_activity_at)}</div>
              </div>
            )}
            {isSleeping && workflowData.next_wakeup_at && (
              <div>
                <div className="text-xs text-nord3 dark:text-nord4 mb-1">Wakes At</div>
                <div className="text-sm text-nord0 dark:text-nord6 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-nord8" />
                  {formatTimestamp(workflowData.next_wakeup_at)}
                </div>
              </div>
            )}
            {isBackgroundActive && (
              <div>
                <div className="text-xs text-nord3 dark:text-nord4 mb-1">Status</div>
                <div className="text-sm text-nord0 dark:text-nord6">User away, working in background</div>
              </div>
            )}
            {workflowData.safety_profile && (
              <div>
                <div className="text-xs text-nord3 dark:text-nord4 mb-1">Safety Profile</div>
                <div className="text-sm text-nord0 dark:text-nord6 capitalize">{workflowData.safety_profile}</div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="p-4 space-y-2 flex-1">
            <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide mb-2">Actions</div>
            
            {canWake && (
              <button 
                onClick={onWake} 
                disabled={busy}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <Sun className="w-4 h-4" />
                {isSleeping ? 'Wake' : 'Return to Chat'}
              </button>
            )}
            
            {!isTerminal && !canWake && (
              <button 
                onClick={onMarkAway} 
                disabled={busy}
                className="w-full btn-outline flex items-center justify-center gap-2"
              >
                <Moon className="w-4 h-4" />
                Mark Away
              </button>
            )}
            
            {!isTerminal && (
              <>
                <button 
                  onClick={onArchive} 
                  disabled={busy}
                  className="w-full btn-outline flex items-center justify-center gap-2"
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
                
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={onMarkComplete} 
                    disabled={busy}
                    className="flex-1 btn-outline text-nord14 border-nord14/50 hover:bg-nord14/10 flex items-center justify-center gap-1 text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </button>
                  <button 
                    onClick={onMarkFailed} 
                    disabled={busy}
                    className="flex-1 btn-outline text-nord11 border-nord11/50 hover:bg-nord11/10 flex items-center justify-center gap-1 text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Toggle button - Attached to panel's right edge */}
        <button 
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className={`absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-20 flex items-center justify-center rounded-r-lg shadow-xl transition-all border border-l-0 ${
            leftPanelOpen 
              ? 'bg-nord4 dark:bg-nord3 hover:bg-nord4/80 dark:hover:bg-nord3/80 border-nord4 dark:border-nord3' 
              : 'bg-gradient-to-r from-nord8 to-nord10 hover:from-nord8/90 hover:to-nord10/90 border-nord8'
          }`}
        >
          {leftPanelOpen ? <ChevronLeft className={`w-5 h-5 ${leftPanelOpen ? 'text-nord3 dark:text-nord4' : 'text-nord6'}`} /> : <ChevronRight className="w-5 h-5 text-nord6" />}
        </button>
      </div>
      
      {/* Center: Chat - Fixed width, always centered */}
      <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-nord4 dark:border-nord3 bg-nord6/30 dark:bg-nord1/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-nord0 dark:text-nord6">Conversation</h3>
            <span className="text-xs bg-nord5 dark:bg-nord2 px-2 py-0.5 rounded text-nord3 dark:text-nord4">
              {conv?.conversation?.length ?? 0} messages
            </span>
          </div>
          <label className="flex items-center gap-2 text-sm text-nord3 dark:text-nord4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScroll} 
              onChange={e => setAutoScroll(e.target.checked)} 
              className="rounded"
            />
            Auto-scroll
          </label>
        </div>
        
        {/* Messages */}
        <div ref={convRef} className="flex-1 overflow-auto p-4 space-y-4 bg-nord5/20 dark:bg-nord0/30">
          {(() => {
            const msgs = (conv?.conversation || []).filter((m: any) => 
              mode === 'expert' ? true : (m.role !== 'system' && m.role !== 'developer')
            )
            const groups = groupMessages(msgs)
            const shouldShowStreaming = streamingMessage && groups.length > 0
            
            const elements = groups.map((group: any, idx: number) => {
              if (group.type === 'assistant') {
                const isStreaming = shouldShowStreaming && idx === groups.length - 1
                return (
                  <AssistantTurn 
                    key={idx} 
                    groupIdx={idx} 
                    group={group} 
                    mode={mode} 
                    streamingMessage={streamingMessage} 
                    isStreaming={isStreaming} 
                    manuallyToggledTools={manuallyToggledTools} 
                    setManuallyToggledTools={setManuallyToggledTools} 
                  />
                )
              }
              
              const m = group.message
              return (
                <div key={idx} className={`message ${m.role === 'user' ? 'message--user' : m.role === 'system' ? 'message--system' : m.role === 'developer' ? 'message--developer' : 'message--tool'}`}>
                  <div className="message-header mb-2">
                    <span className="uppercase font-bold text-xs tracking-wide">
                      {m.role === 'user' ? 'YOU' : m.role === 'system' ? 'SYSTEM' : m.role === 'developer' ? 'DEVELOPER' : 'TOOL'}
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
            })
            
            // Show thinking indicator when agent is processing but no streaming yet
            const isThinking = ['agent_turn', 'background_turn', 'queued', 'queued_for_function_execution', 'function_execution', 'validation'].includes(task?.status || '') && !streamingMessage
            elements.push(
              <AnimatedMount key="thinking" show={isThinking} duration={200}>
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-nord8/10 rounded-full border border-nord8/30 dark:bg-nord8/5">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-nord8 border-t-transparent"></div>
                    <span className="text-sm text-nord10 dark:text-nord8 font-medium">
                      {task?.status === 'background_turn' ? 'Assistant is thinking in background...' : 'Assistant is thinking...'}
                    </span>
                  </div>
                </div>
              </AnimatedMount>
            )
            
            return elements
          })()}
        </div>
        
        {/* Action Required Banner */}
        {isActionRequired && (
          <div className="p-4 bg-nord13/20 border-t border-nord13/40 dark:bg-nord13/10">
            <div className="text-sm text-nord0 dark:text-nord6 font-semibold mb-2">Supervisor action required</div>
            {task.approval_reason && (
              <div className="text-sm text-nord0 dark:text-nord6 mb-3 p-3 bg-white rounded-lg border border-nord13/30 dark:bg-nord0 dark:border-nord13/20">
                {task.approval_reason}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => onApprove(true)} disabled={busy} className="btn-primary disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => onApprove(false)} disabled={busy} className="btn-danger disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
        
        {/* Chat input */}
        {!isTerminal && !isActionRequired && (
          <div className="p-4 border-t border-nord4 dark:border-nord3 bg-nord6 dark:bg-nord1">
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSendMessage() }
                  else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage() }
                }}
                rows={2}
                disabled={isSleeping}
                className="textarea flex-1 disabled:opacity-50"
                placeholder={isSleeping ? "Assistant is sleeping. Wake to chat." : isBackgroundActive ? "Send a message to return to interactive mode..." : "Type a message... (Enter to send)"}
              />
              <button 
                onClick={onSendMessage} 
                disabled={!message.trim() || busy || isSleeping} 
                className="btn-primary disabled:opacity-50 self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Panel: Memory & Jobs - Absolute positioned from right edge */}
      <div className={`absolute right-0 top-0 h-full z-10 transition-transform duration-300 ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full w-80 border-l border-nord4 dark:border-nord3 bg-nord6/90 dark:bg-nord1/90 backdrop-blur-sm flex flex-col shadow-lg relative">
          {/* Jobs Section */}
          <div className="border-b border-nord4 dark:border-nord3">
            <div className="p-4 flex items-center gap-2 border-b border-nord4/50 dark:border-nord3/50">
              <ListTodo className="w-4 h-4 text-nord8" />
              <h3 className="font-semibold text-nord0 dark:text-nord6 text-sm">Jobs</h3>
            </div>
            <div className="p-4 max-h-48 overflow-auto">
              {jobList ? (
                <div className="text-sm">
                  <MessageContent role="assistant" content={jobList} isLatestTool={false} />
                </div>
              ) : (
                <div className="text-sm text-nord3 dark:text-nord4 italic">No jobs</div>
              )}
            </div>
          </div>
          
          {/* Memories Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-nord4/50 dark:border-nord3/50">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-nord8" />
                <h3 className="font-semibold text-nord0 dark:text-nord6 text-sm">Memories</h3>
                <span className="text-xs bg-nord5 dark:bg-nord2 px-1.5 py-0.5 rounded text-nord3 dark:text-nord4">
                  {filteredMemories.length}
                </span>
              </div>
              <input
                type="text"
                value={memorySearch}
                onChange={e => setMemorySearch(e.target.value)}
                placeholder="Search memories..."
                className="input w-full text-sm mb-2"
              />
              <label className="flex items-center gap-2 text-xs text-nord3 dark:text-nord4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeCommon} 
                  onChange={e => setIncludeCommon(e.target.checked)} 
                  className="rounded text-xs"
                />
                Include common memories
              </label>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {filteredMemories.length > 0 ? (
                filteredMemories.map(mem => <MemoryItem key={mem.id} memory={mem} />)
              ) : (
                <div className="text-sm text-nord3 dark:text-nord4 italic text-center py-4">
                  {memorySearch ? 'No matching memories' : 'No memories yet'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Toggle button - Attached to panel's left edge */}
        <button 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className={`absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-20 flex items-center justify-center rounded-l-lg shadow-xl transition-all border border-r-0 ${
            rightPanelOpen 
              ? 'bg-nord4 dark:bg-nord3 hover:bg-nord4/80 dark:hover:bg-nord3/80 border-nord4 dark:border-nord3' 
              : 'bg-gradient-to-l from-nord8 to-nord10 hover:from-nord8/90 hover:to-nord10/90 border-nord8'
          }`}
        >
          {rightPanelOpen ? <ChevronRight className={`w-5 h-5 ${rightPanelOpen ? 'text-nord3 dark:text-nord4' : 'text-nord6'}`} /> : <ChevronLeft className="w-5 h-5 text-nord6" />}
        </button>
      </div>
    </div>
  )
}

