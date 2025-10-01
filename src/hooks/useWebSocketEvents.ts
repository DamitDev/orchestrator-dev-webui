import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useWebSocket } from './useWebSocket'
import { queryKeys } from './useApi'
import type {
  TaskCreatedEvent,
  TaskStatusChangedEvent,
  TaskIterationChangedEvent,
  TaskDeletedEvent,
  TaskBulkDeletedEvent,
  TaskResultUpdatedEvent,
  MessageAddedEvent,
  ApprovalRequestedEvent,
  ApprovalProvidedEvent,
  HelpRequestedEvent,
  HelpProvidedEvent,
  LLMBackendChangedEvent,
  MCPServerChangedEvent,
  ModelConfigChangedEvent,
  TaskHandlerStatusChangedEvent,
  WebSocketEventUnion,
} from '../types/websocket'
import type { Task, ConversationMessage } from '../types/api'

export const useWebSocketEvents = () => {
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe, isConnected } = useWebSocket()

  useEffect(() => {
    if (!isConnected) {
      console.log('WebSocket not connected, skipping event subscription')
      return
    }

    console.log('WebSocket connected, setting up event subscriptions')

    const handleWebSocketEvent = (event: WebSocketEventUnion) => {
      switch (event.event_type) {
        // === TASK LIFECYCLE EVENTS ===
        case 'task_created': {
          const taskEvent = event as TaskCreatedEvent
          
          // Update all tasks list caches by invalidating (new task needs to be fetched)
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          toast.success(`New task created: ${taskEvent.ticket_id}`)
          break
        }

        case 'task_status_changed': {
          const taskEvent = event as TaskStatusChangedEvent
          
          // Update specific task cache
          queryClient.setQueryData(queryKeys.task(taskEvent.task_id), (oldTask: Task | undefined) => {
            if (!oldTask) return oldTask
            return {
              ...oldTask,
              status: taskEvent.new_status,
              iteration: taskEvent.iteration,
              updated_at: event.timestamp,
            }
          })
          
          // Update all tasks list caches
          const queryCache = queryClient.getQueryCache()
          queryCache.getAll().forEach((query) => {
            const queryKey = query.queryKey
            if (queryKey[0] === 'tasks' && query.state.data) {
              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.tasks) return oldData
                return {
                  ...oldData,
                  tasks: oldData.tasks.map((task: Task) => 
                    task.id === taskEvent.task_id
                      ? {
                          ...task,
                          status: taskEvent.new_status,
                          iteration: taskEvent.iteration,
                          updated_at: event.timestamp,
                        }
                      : task
                  ),
                }
              })
            }
          })
          
          // Update config for task counts
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          // For statuses that need additional data (like help/approval messages), invalidate to fetch fresh data
          if (['help_required', 'action_required'].includes(taskEvent.new_status)) {
            queryClient.invalidateQueries({ queryKey: queryKeys.task(taskEvent.task_id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
          }
          
          // Show status change notifications for important changes
          if (['completed', 'failed', 'pending_approval', 'help_required', 'action_required'].includes(taskEvent.new_status)) {
            const status = taskEvent.new_status.replace(/_/g, ' ')
            if (taskEvent.new_status === 'help_required') {
              toast(`Task ${taskEvent.task_id.slice(0, 8)}: Help needed`, {
                icon: '�',
                duration: 10000,
              })
            } else if (taskEvent.new_status === 'action_required') {
              toast(`Task ${taskEvent.task_id.slice(0, 8)}: Action required`, {
                icon: '⚠️',
                duration: 10000,
              })
            } else {
              toast.success(`Task ${taskEvent.task_id.slice(0, 8)} is now ${status}`)
            }
          }
          break
        }

        case 'task_iteration_changed': {
          const taskEvent = event as TaskIterationChangedEvent
          
          // Update specific task cache
          queryClient.setQueryData(queryKeys.task(taskEvent.task_id), (oldTask: Task | undefined) => {
            if (!oldTask) return oldTask
            return {
              ...oldTask,
              iteration: taskEvent.new_iteration,
              updated_at: event.timestamp,
            }
          })
          
          // Update all tasks list caches
          const queryCache = queryClient.getQueryCache()
          queryCache.getAll().forEach((query) => {
            const queryKey = query.queryKey
            if (queryKey[0] === 'tasks' && query.state.data) {
              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.tasks) return oldData
                return {
                  ...oldData,
                  tasks: oldData.tasks.map((task: Task) => 
                    task.id === taskEvent.task_id
                      ? {
                          ...task,
                          iteration: taskEvent.new_iteration,
                          updated_at: event.timestamp,
                        }
                      : task
                  ),
                }
              })
            }
          })
          break
        }

        case 'task_deleted': {
          const taskEvent = event as TaskDeletedEvent
          
          // Remove from tasks list cache
          queryClient.setQueryData(queryKeys.tasks(), (oldData: any) => {
            if (!oldData?.tasks) return oldData
            return {
              ...oldData,
              tasks: oldData.tasks.filter((task: Task) => task.id !== taskEvent.task_id),
            }
          })
          
          // Remove specific task cache
          queryClient.removeQueries({ queryKey: queryKeys.task(taskEvent.task_id) })
          queryClient.removeQueries({ queryKey: queryKeys.taskConversation(taskEvent.task_id) })
          
          // Invalidate config for updated counts
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          toast.success(`Task ${taskEvent.task_id.slice(0, 8)} deleted`)
          break
        }

        case 'task_bulk_deleted': {
          const taskEvent = event as TaskBulkDeletedEvent
          
          // Remove multiple tasks from cache
          queryClient.setQueryData(queryKeys.tasks(), (oldData: any) => {
            if (!oldData?.tasks) return oldData
            return {
              ...oldData,
              tasks: oldData.tasks.filter(
                (task: Task) => !taskEvent.deleted_task_ids.includes(task.id)
              ),
            }
          })
          
          // Remove specific task caches
          taskEvent.deleted_task_ids.forEach(taskId => {
            queryClient.removeQueries({ queryKey: queryKeys.task(taskId) })
            queryClient.removeQueries({ queryKey: queryKeys.taskConversation(taskId) })
          })
          
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          toast.success(`${taskEvent.total_deleted} tasks deleted`)
          break
        }

        case 'task_result_updated': {
          const taskEvent = event as TaskResultUpdatedEvent
          
          // Update specific task cache
          queryClient.setQueryData(queryKeys.task(taskEvent.task_id), (oldTask: Task | undefined) => {
            if (!oldTask) return oldTask
            return {
              ...oldTask,
              result: taskEvent.result,
              updated_at: event.timestamp,
            }
          })
          
          // Update all tasks list caches
          const queryCache = queryClient.getQueryCache()
          queryCache.getAll().forEach((query) => {
            const queryKey = query.queryKey
            if (queryKey[0] === 'tasks' && query.state.data) {
              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.tasks) return oldData
                return {
                  ...oldData,
                  tasks: oldData.tasks.map((task: Task) => 
                    task.id === taskEvent.task_id
                      ? {
                          ...task,
                          result: taskEvent.result,
                          updated_at: event.timestamp,
                        }
                      : task
                  ),
                }
              })
            }
          })
          break
        }

        // === CONVERSATION EVENTS ===
        case 'message_added': {
          const messageEvent = event as MessageAddedEvent
          
          // Update conversation cache
          queryClient.setQueryData(
            queryKeys.taskConversation(messageEvent.task_id),
            (oldConversation: any) => {
              if (!oldConversation) return oldConversation
              
              const newMessage: ConversationMessage = {
                role: messageEvent.role,
                content: messageEvent.content || '',
                created_at: event.timestamp,
                ...(messageEvent.reasoning && { reasoning: messageEvent.reasoning }),
                ...(messageEvent.name && { name: messageEvent.name }),
                ...(messageEvent.tool_call_id && { tool_call_id: messageEvent.tool_call_id }),
                ...(messageEvent.has_tool_calls && { 
                  tool_calls: messageEvent.tool_calls || [] 
                }),
              }
              
              return {
                ...oldConversation,
                conversation: [...oldConversation.conversation, newMessage],
              }
            }
          )
          
          // Update task updated_at timestamp
          queryClient.setQueryData(queryKeys.task(messageEvent.task_id), (oldTask: Task | undefined) => {
            if (!oldTask) return oldTask
            return {
              ...oldTask,
              updated_at: event.timestamp,
            }
          })
          
          // Update all tasks list caches with new updated_at timestamp
          const queryCache = queryClient.getQueryCache()
          queryCache.getAll().forEach((query) => {
            const queryKey = query.queryKey
            if (queryKey[0] === 'tasks' && query.state.data) {
              queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData?.tasks) return oldData
                return {
                  ...oldData,
                  tasks: oldData.tasks.map((task: Task) => 
                    task.id === messageEvent.task_id
                      ? {
                          ...task,
                          updated_at: event.timestamp,
                        }
                      : task
                  ),
                }
              })
            }
          })
          break
        }

        case 'iteration_reminder_added': {
          // Similar to message_added but with specific handling for reminders
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.taskConversation(event.task_id) 
          })
          break
        }

        // === HUMAN INTERACTION EVENTS ===
        case 'approval_requested': {
          const approvalEvent = event as ApprovalRequestedEvent
          
          // Update task status to pending_approval
          queryClient.setQueryData(queryKeys.task(approvalEvent.task_id), (oldTask: Task | undefined) => {
            if (!oldTask) return oldTask
            return {
              ...oldTask,
              status: 'pending_approval',
              approval_reason: approvalEvent.reason,
              updated_at: event.timestamp,
            }
          })
          
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          toast(`Approval needed for ${approvalEvent.tool_name}`, {
            icon: '⚠️',
            duration: 10000,
          })
          break
        }

        case 'approval_provided': {
          const approvalEvent = event as ApprovalProvidedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.task(approvalEvent.task_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
          
          const status = approvalEvent.approved ? 'approved' : 'rejected'
          toast.success(`Task ${approvalEvent.task_id.slice(0, 8)} ${status}`)
          break
        }

        case 'help_requested': {
          const helpEvent = event as HelpRequestedEvent
          
          // Invalidate queries to fetch updated task data with help message
          queryClient.invalidateQueries({ queryKey: queryKeys.task(helpEvent.task_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks() })
          
          toast(`Help requested: ${helpEvent.help_message}`, {
            icon: '?',
            duration: 10000,
          })
          break
        }

        case 'help_provided': {
          const helpEvent = event as HelpProvidedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.task(helpEvent.task_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(helpEvent.task_id) })
          
          toast.success('Help response provided')
          break
        }

        case 'user_message_added': {
          // Handle user guidance messages
          queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(event.task_id) })
          queryClient.invalidateQueries({ queryKey: queryKeys.task(event.task_id) })
          break
        }

        // === SYSTEM & CONFIGURATION EVENTS ===
        case 'llm_backend_changed': {
          const backendEvent = event as LLMBackendChangedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.llmBackends })
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          const action = backendEvent.action === 'added' ? 'added' : 'removed'
          toast.success(`LLM Backend ${action}: ${backendEvent.backend_url}`)
          break
        }

        case 'mcp_server_changed': {
          const serverEvent = event as MCPServerChangedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers })
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          const action = serverEvent.action === 'added' ? 'added' : 'removed'
          toast.success(`MCP Server ${action}: ${serverEvent.server_url}`)
          break
        }

        case 'model_config_changed': {
          const configEvent = event as ModelConfigChangedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          toast.success(`${configEvent.model_type} model updated to ${configEvent.new_model}`)
          break
        }

        case 'task_handler_status_changed': {
          const handlerEvent = event as TaskHandlerStatusChangedEvent
          
          queryClient.invalidateQueries({ queryKey: queryKeys.taskHandler })
          queryClient.invalidateQueries({ queryKey: queryKeys.config })
          
          const status = handlerEvent.running ? 'started' : 'stopped'
          toast.success(`Task handler ${status}`)
          break
        }

        // Subprocess events
        default: {
          if (event.event_type.startsWith('subprocess_')) {
            // Handle subprocess events
            queryClient.invalidateQueries({ queryKey: queryKeys.task(event.task_id) })
            queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(event.task_id) })
          }
          break
        }
      }
    }

    // Subscribe to all events
    const subscriptionId = subscribe((event: WebSocketEventUnion) => {
      console.log('Received WebSocket event:', event.event_type, event)

      // Defer all state updates to avoid setState during render
      setTimeout(() => {
        handleWebSocketEvent(event)
      }, 0)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe(subscriptionId)
    }
  }, [isConnected, subscribe, unsubscribe, queryClient])

  return {
    isConnected,
  }
}