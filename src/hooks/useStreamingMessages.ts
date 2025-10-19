import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { MessageStreamingEvent } from '../types/websocket'
import type { ConversationMessage } from '../types/api'
import { queryKeys } from './useApi'

export interface StreamingMessage extends ConversationMessage {
  id: number
  isStreaming: boolean
  streamIndex: number
  isComplete: boolean
}

export const useStreamingMessages = () => {
  const [streamingMessages, setStreamingMessages] = useState<Map<number, StreamingMessage>>(new Map())
  const completedMessagesRef = useRef<Set<number>>(new Set())
  const queryClient = useQueryClient()

  const handleStreamingEvent = useCallback((event: MessageStreamingEvent) => {
    const messageId = event.message_id
    
    setStreamingMessages(prev => {
      const newMap = new Map(prev)
      
      // If this is a new streaming message, create it
      if (!newMap.has(messageId)) {
        newMap.set(messageId, {
          id: messageId,
          role: event.role,
          content: event.content,
          reasoning: event.reasoning,
          tool_calls: event.tool_calls,
          tool_call_id: event.tool_call_id,
          name: event.name,
          created_at: new Date().toISOString(),
          isStreaming: true,
          streamIndex: event.stream_index,
          isComplete: event.is_complete,
        })
      } else {
        // Update existing streaming message
        const existingMessage = newMap.get(messageId)!
        newMap.set(messageId, {
          ...existingMessage,
          content: event.content,
          reasoning: event.reasoning,
          tool_calls: event.tool_calls,
          tool_call_id: event.tool_call_id,
          name: event.name,
          streamIndex: event.stream_index,
          isComplete: event.is_complete,
          isStreaming: !event.is_complete,
        })
      }
      
      return newMap
    })

    // If the message is complete, mark it as completed and invalidate conversation
    if (event.is_complete) {
      completedMessagesRef.current.add(messageId)
      
      // Immediately remove completed streaming messages to prevent duplicates
      setStreamingMessages(prev => {
        const newMap = new Map(prev)
        newMap.delete(messageId)
        return newMap
      })
      
      // Invalidate the conversation query to fetch the final message from database
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.taskConversation(event.task_id) 
      })
      
      // Clean up the completed messages ref after a short delay
      setTimeout(() => {
        completedMessagesRef.current.delete(messageId)
      }, 1000)
    }
  }, [queryClient])

  const getStreamingMessagesForTask = useCallback(() => {
    return Array.from(streamingMessages.values()).filter(msg => 
      // Only return messages that are not completed
      // Completed messages are immediately removed from the map
      !msg.isComplete
    )
  }, [streamingMessages])

  const clearStreamingMessages = useCallback(() => {
    setStreamingMessages(new Map())
    completedMessagesRef.current.clear()
  }, [])

  const isMessageStreaming = useCallback((messageId: number) => {
    return streamingMessages.has(messageId)
  }, [streamingMessages])

  const isMessageCompleted = useCallback((messageId: number) => {
    return completedMessagesRef.current.has(messageId)
  }, [])

  return {
    streamingMessages: Array.from(streamingMessages.values()),
    handleStreamingEvent,
    getStreamingMessagesForTask,
    clearStreamingMessages,
    isMessageStreaming,
    isMessageCompleted,
  }
}
