import { useEffect, useCallback, useMemo } from 'react'
import { useWebSocket } from './useWebSocket'
import { useStreamingMessages } from './useStreamingMessages'
import { useTaskConversation } from './useApi'
import type { MessageStreamingEvent } from '../types/websocket'
import type { ConversationMessage } from '../types/api'

export interface UnifiedConversationMessage extends ConversationMessage {
  isStreaming?: boolean
  message_index?: number
}

export const useStreamingConversation = (taskId: string) => {
  const { subscribe, unsubscribe } = useWebSocket()
  const { data: conversationData, isLoading, error } = useTaskConversation(taskId)
  const {
    streamingMessages,
    handleStreamingEvent,
    clearStreamingMessages,
    isMessageStreaming,
    isMessageCompleted,
  } = useStreamingMessages()

  // Subscribe to streaming events for this specific task
  useEffect(() => {
    const subscriptionId = subscribe((event: any) => {
      if (event.event_type === 'message_streaming' && event.task_id === taskId) {
        handleStreamingEvent(event as MessageStreamingEvent)
      }
    }, {
      eventTypes: ['message_streaming'],
      taskIds: [taskId],
    })

    return () => {
      unsubscribe(subscriptionId)
    }
  }, [taskId, subscribe, unsubscribe, handleStreamingEvent])

  // Clear streaming messages when task changes
  useEffect(() => {
    return () => {
      clearStreamingMessages()
    }
  }, [taskId, clearStreamingMessages])

  // Get streaming messages for this task
  const getStreamingMessagesForTask = useCallback(() => {
    return streamingMessages.filter(() => 
      // Since we don't have task_id in the streaming message structure,
      // we'll filter by the subscription - all messages here should be for this task
      true
    )
  }, [streamingMessages])

  // Combine persisted and streaming messages
  const unifiedConversation = useMemo(() => {
    const persistedMessages = conversationData?.conversation || []
    const taskStreamingMessages = getStreamingMessagesForTask()
    const combined: UnifiedConversationMessage[] = []

    // Add persisted messages that have valid IDs
    persistedMessages.forEach(persistedMsg => {
      if (persistedMsg.id) {
        combined.push(persistedMsg)
      }
    })

    // Add streaming messages, replacing persisted ones with same ID
    taskStreamingMessages.forEach(streamingMsg => {
      if (!streamingMsg.id) {
        console.warn('Streaming message missing ID:', streamingMsg)
        return
      }

      // Check if a persisted message with the same ID already exists
      const existingPersistedIndex = combined.findIndex(
        msg => msg.id === streamingMsg.id
      )

      if (existingPersistedIndex !== -1) {
        // Replace persisted message with streaming version
        combined[existingPersistedIndex] = { ...streamingMsg, isStreaming: true }
      } else {
        // Add new streaming message
        combined.push({ ...streamingMsg, isStreaming: true })
      }
    })

    // Sort by message_index or created_at to maintain order
    return combined.sort((a, b) => {
      const aIndex = a.message_index ?? (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bIndex = b.message_index ?? (b.created_at ? new Date(b.created_at).getTime() : 0)
      return aIndex - bIndex
    })
  }, [conversationData, getStreamingMessagesForTask])

  return {
    conversation: unifiedConversation,
    streamingMessages: getStreamingMessagesForTask(),
    isMessageStreaming,
    isMessageCompleted,
    clearStreamingMessages,
    isLoading,
    error,
  }
}
