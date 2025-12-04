import { ReactNode, useRef, useState, useEffect } from 'react'
import { MessageContent } from '../lib/markdown'
import { AnimatedDetails } from './AnimatedDetails'
import { StreamingIndicator } from './StreamingIndicator'
import { StreamingReasoning } from './StreamingReasoning'
import { StreamingToolCall } from './StreamingToolCall'
import { StreamingContent } from './StreamingContent'
import { formatMessageTimestamp } from '../lib/time'

// Icon components
export function LightBulbIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

export function WrenchIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

// Helper to parse markdown summary
export function parseSummary(summary: string | null | undefined): { title: string; sections: Array<{ subtitle?: string; content: string }> } | null {
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

// Reasoning activity component
function ReasoningActivity({ 
  reasoning, 
  reasoningSummary, 
  mode 
}: { 
  reasoning: string; 
  reasoningSummary?: string | null;
  mode: string;
}) {
  const parsed = reasoningSummary ? parseSummary(reasoningSummary) : null
  
  if (parsed) {
    return (
      <AnimatedDetails 
        className="text-xs mb-2"
        summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
        defaultOpen={false}
        summary={<span className="flex items-center gap-1.5"><LightBulbIcon />{parsed.title}</span>}
      >
        <div className="reasoning mt-2 ml-4">
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
    )
  }
  
  return (
    <AnimatedDetails 
      className="text-xs mb-2"
      summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
      defaultOpen={false}
      summary={<span className="flex items-center gap-1.5"><LightBulbIcon />Thought</span>}
    >
      <div className="reasoning mt-2 ml-4">{reasoning}</div>
    </AnimatedDetails>
  )
}

// Tool interaction component
function ToolInteractionActivity({
  interaction,
  toolKey,
  isToolOpen,
  onToggle,
  mode
}: {
  interaction: any;
  toolKey: string;
  isToolOpen: boolean;
  onToggle: (newState: boolean) => void;
  mode: string;
}) {
  const toolCall = interaction.toolCall
  const toolResponse = interaction.toolResponse
  const toolName = toolCall?.function?.name || 'unknown'
  
  return (
    <AnimatedDetails 
      className="text-xs mb-2"
      summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
      open={isToolOpen}
      onToggle={onToggle}
      summary={
        mode === 'simple' && interaction.tool_call_summary ? (() => {
          const parsed = parseSummary(interaction.tool_call_summary)
          return parsed ? <span className="flex items-center gap-1.5"><WrenchIcon />{parsed.title}</span> : <span className="flex items-center gap-1.5"><WrenchIcon />Using tool: <code className="text-nord10 dark:text-nord8 font-medium">{toolName}</code></span>
        })() : <span className="flex items-center gap-1.5"><WrenchIcon />Using tool: <code className="text-nord10 dark:text-nord8 font-medium">{toolName}</code></span>
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
            <div className="tool-response-box p-3 bg-nord5/30 rounded-lg border border-nord4/50 dark:bg-nord2/30 dark:border-nord3/50 text-xs max-h-[7.5rem] overflow-auto">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre font-mono m-0">{toolResponse.content}</pre>
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
  )
}

// Orphan tool message component (system-injected notifications)
function OrphanToolActivity({
  toolMsg,
  toolKey,
  isToolOpen,
  onToggle,
  mode
}: {
  toolMsg: any;
  toolKey: string;
  isToolOpen: boolean;
  onToggle: (newState: boolean) => void;
  mode: string;
}) {
  const summaryParsed = toolMsg.tool_output_summary ? parseSummary(toolMsg.tool_output_summary) : null
  const title = summaryParsed?.title || 'System Notification'
  
  return (
    <AnimatedDetails 
      className="text-xs mb-2"
      summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
      open={isToolOpen}
      onToggle={onToggle}
      summary={<span className="flex items-center gap-1.5"><WrenchIcon />{title}</span>}
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
  )
}

export interface AssistantTurnProps {
  group: any;
  groupIdx: number;
  mode: string;
  streamingMessage?: any;
  isStreaming?: boolean;
  manuallyToggledTools: Record<string, boolean>;
  setManuallyToggledTools: (tools: Record<string, boolean>) => void;
  /** Enable height tracking to prevent shrinking when sections close */
  enableHeightTracking?: boolean;
}

// Main AssistantTurn component
export function AssistantTurn({ 
  group, 
  groupIdx,
  mode, 
  streamingMessage, 
  isStreaming,
  manuallyToggledTools,
  setManuallyToggledTools,
  enableHeightTracking = false
}: AssistantTurnProps) {
  const hasContent = group.finalContent && group.finalContent.trim()
  const hasToolCalls = group.toolInteractions && group.toolInteractions.length > 0
  const hasOrphanToolMessages = group.orphanToolMessages && group.orphanToolMessages.length > 0
  const lastMsg = group.assistantMessages[group.assistantMessages.length - 1]
  
  // Height tracking to prevent shrinking when sections close
  const containerRef = useRef<HTMLDivElement>(null)
  const [minHeight, setMinHeight] = useState<number>(0)
  const prevHasContentRef = useRef<boolean>(false)
  const prevIsStreamingRef = useRef<boolean>(false)
  
  useEffect(() => {
    if (!enableHeightTracking) return
    
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
  }, [hasContent, isStreaming, enableHeightTracking])
  
  const isEmpty = isStreaming && streamingMessage && !streamingMessage.content && !streamingMessage.reasoning && (!streamingMessage.tool_calls || streamingMessage.tool_calls.length === 0)
  const isStreamingReasoning = isStreaming && streamingMessage?.reasoning && (!streamingMessage?.tool_calls || streamingMessage.tool_calls.length === 0) && !streamingMessage?.content
  const isStreamingToolCalls = isStreaming && streamingMessage?.tool_calls && streamingMessage.tool_calls.length > 0
  const isStreamingContent = isStreaming && streamingMessage?.content && streamingMessage.content.length > 0
  
  return (
    <div 
      ref={enableHeightTracking ? containerRef : undefined}
      className="message message--assistant"
      style={{ minHeight: enableHeightTracking && minHeight > 0 ? `${minHeight}px` : undefined }}
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
          const reasoning = interaction.reasoning
          const toolKey = `${groupIdx}-${idx}`
          const shouldAutoOpen = !hasContent && !isStreaming && idx === group.toolInteractions.length - 1
          const isToolOpen = manuallyToggledTools[toolKey] !== undefined 
            ? manuallyToggledTools[toolKey] 
            : shouldAutoOpen
          
          return (
            <div key={idx}>
              {/* Show reasoning before this tool call if it exists */}
              {reasoning && (
                <ReasoningActivity 
                  reasoning={reasoning} 
                  reasoningSummary={interaction.reasoning_summary}
                  mode={mode}
                />
              )}
              
              {/* Content that came with tool calls (intermediate response) */}
              {interaction.contentWithToolCalls && (
                <div className="mb-2 p-3 bg-nord6/50 dark:bg-nord1/50 rounded-lg border border-nord5 dark:border-nord2">
                  <div className="text-sm leading-relaxed">
                    <MessageContent role="assistant" content={interaction.contentWithToolCalls} isLatestTool={false} />
                  </div>
                </div>
              )}
              
              {/* Tool call + response in one collapsible */}
              <ToolInteractionActivity
                interaction={interaction}
                toolKey={toolKey}
                isToolOpen={isToolOpen}
                onToggle={(newState) => {
                  setManuallyToggledTools({ ...manuallyToggledTools, [toolKey]: newState })
                }}
                mode={mode}
              />
            </div>
          )
        })}
        
        {/* Orphan tool messages (system-injected, like wake notifications) */}
        {hasOrphanToolMessages && group.orphanToolMessages.map((toolMsg: any, idx: number) => {
          const toolKey = `${groupIdx}-orphan-${idx}`
          const isToolOpen = manuallyToggledTools[toolKey] !== undefined 
            ? manuallyToggledTools[toolKey] 
            : true // Default open for notifications
          
          return (
            <OrphanToolActivity
              key={toolKey}
              toolMsg={toolMsg}
              toolKey={toolKey}
              isToolOpen={isToolOpen}
              onToggle={(newState) => {
                setManuallyToggledTools({ ...manuallyToggledTools, [toolKey]: newState })
              }}
              mode={mode}
            />
          )
        })}
        
        {/* Final reasoning before the response */}
        {hasContent && group.finalReasoning && (
          <ReasoningActivity 
            reasoning={group.finalReasoning} 
            reasoningSummary={group.finalReasoningSummary}
            mode={mode}
          />
        )}
        
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

// Simple message component for non-assistant messages
export interface SimpleMessageProps {
  message: any;
}

export function SimpleMessage({ message }: SimpleMessageProps) {
  const m = message
  return (
    <div className={`message ${m.role === 'user' ? 'message--user' : m.role === 'system' ? 'message--system' : m.role === 'developer' ? 'message--developer' : 'message--tool'}`}>
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
}

