/**
 * Shared message grouping logic for conversation displays.
 * Groups assistant messages with their tool calls and responses until
 * a user/developer/system message is encountered.
 */

export interface ToolInteraction {
  reasoning: string | null
  reasoning_summary: string | null
  tool_call_summary: string | null
  // Content from the same assistant message (displayed above tool calls)
  contentWithToolCalls: string | null
  toolCall: any
  toolResponse: any | null
  tool_output_summary: string | null
}

export interface AssistantGroup {
  type: 'assistant'
  assistantMessages: any[]
  toolInteractions: ToolInteraction[]
  orphanToolMessages: any[]
  // Final content (last content without tool calls, or last content before user/dev/system)
  finalContent: string | null
  finalReasoning: string | null
  finalReasoningSummary: string | null
}

export interface MessageGroup {
  type: string
  message?: any
  // Assistant-specific fields (when type === 'assistant')
  assistantMessages?: any[]
  toolInteractions?: ToolInteraction[]
  orphanToolMessages?: any[]
  finalContent?: string | null
  finalReasoning?: string | null
  finalReasoningSummary?: string | null
}

/**
 * Groups messages for display. Assistant messages are aggregated together
 * with their tool calls and responses until a user/developer/system message
 * is encountered.
 * 
 * Key behaviors:
 * - Assistant messages with content AND tool_calls: content is stored with the tool interaction
 * - Assistant messages with only content: becomes finalContent (overwritten if more assistant msgs follow)
 * - Aggregation stops only at user/developer/system messages
 */
export function groupMessages(messages: any[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let i = 0
  
  while (i < messages.length) {
    const msg = messages[i]
    
    // For assistant messages, group everything until we hit user/developer/system
    if (msg.role === 'assistant') {
      const group: AssistantGroup = {
        type: 'assistant',
        assistantMessages: [],
        toolInteractions: [],
        orphanToolMessages: [],
        finalContent: null,
        finalReasoning: null,
        finalReasoningSummary: null
      }
      
      let j = i
      
      // Keep going through assistant + tool sequences until we hit user/developer/system
      while (j < messages.length) {
        const current = messages[j]
        
        if (current.role === 'assistant') {
          group.assistantMessages.push(current)
          
          const hasContent = current.content && current.content.trim()
          const hasToolCalls = current.tool_calls && Array.isArray(current.tool_calls) && current.tool_calls.length > 0
          
          if (hasToolCalls) {
            // Assistant message with tool calls
            const toolCallIds = new Set(current.tool_calls.map((tc: any) => tc.id))
            
            // Add tool calls - first one gets the content (if any) and reasoning
            for (let tcIdx = 0; tcIdx < current.tool_calls.length; tcIdx++) {
              const tc = current.tool_calls[tcIdx]
              group.toolInteractions.push({
                reasoning: tcIdx === 0 ? current.reasoning : null, // Only first tool gets reasoning
                reasoning_summary: tcIdx === 0 ? current.reasoning_summary : null,
                tool_call_summary: current.tool_call_summary,
                // Content appears above the first tool call
                contentWithToolCalls: tcIdx === 0 && hasContent ? current.content : null,
                toolCall: tc,
                toolResponse: null,
                tool_output_summary: null
              })
            }
            
            j++
            
            // Collect matching tool responses
            while (j < messages.length && messages[j].role === 'tool') {
              const toolMsg = messages[j]
              if (toolCallIds.has(toolMsg.tool_call_id)) {
                const interaction = group.toolInteractions.find((ti) => ti.toolCall.id === toolMsg.tool_call_id)
                if (interaction) {
                  interaction.toolResponse = toolMsg
                  interaction.tool_output_summary = toolMsg.tool_output_summary
                }
              } else {
                // Orphan tool message - no matching tool call
                group.orphanToolMessages.push(toolMsg)
              }
              j++
            }
          } else if (hasContent) {
            // Assistant message with only content (no tool calls)
            // This becomes the "final" content (may be overwritten if more assistant messages follow)
            group.finalContent = current.content
            group.finalReasoning = current.reasoning
            group.finalReasoningSummary = current.reasoning_summary
            j++
          } else {
            // Assistant with no content and no tool calls - just move on
            j++
          }
        } else if (current.role === 'tool') {
          // Orphan tool message (no preceding assistant with matching tool_call)
          group.orphanToolMessages.push(current)
          j++
        } else {
          // Hit user/developer/system message - stop grouping
          break
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

