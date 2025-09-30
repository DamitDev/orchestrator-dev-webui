// WebSocket types based on Python websocket_models.py
// Ported TypeScript interfaces for real-time events

export interface BaseWebSocketEvent {
  event_type: string
  timestamp: string // ISO datetime string
  data: Record<string, any>
  metadata?: Record<string, any>
}

export interface TaskEvent extends BaseWebSocketEvent {
  task_id: string
}

export interface ConversationEvent extends TaskEvent {
  message_index?: number
}

export interface SystemEvent extends BaseWebSocketEvent {
  component: string
}

// === TASK LIFECYCLE EVENTS ===

export interface TaskCreatedEvent extends TaskEvent {
  event_type: 'task_created'
  ticket_id: string
  goal_prompt: string
  max_iterations: number
  reasoning_effort: string
}

export interface TaskStatusChangedEvent extends TaskEvent {
  event_type: 'task_status_changed'
  old_status: string
  new_status: string
  iteration: number
  max_iterations: number
}

export interface TaskIterationChangedEvent extends TaskEvent {
  event_type: 'task_iteration_changed'
  old_iteration: number
  new_iteration: number
  max_iterations: number
  remaining_iterations: number
}

export interface TaskDeletedEvent extends TaskEvent {
  event_type: 'task_deleted'
  deleted_by: string
}

export interface TaskBulkDeletedEvent extends BaseWebSocketEvent {
  event_type: 'task_bulk_deleted'
  deleted_task_ids: string[]
  failed_task_ids: string[]
  total_deleted: number
}

export interface TaskResultUpdatedEvent extends TaskEvent {
  event_type: 'task_result_updated'
  result: string
}

// === CONVERSATION EVENTS ===

export interface MessageAddedEvent extends ConversationEvent {
  event_type: 'message_added'
  role: string
  content?: string
  name?: string
  tool_calls?: any[]
  tool_call_id?: string
  reasoning?: string
  has_tool_calls: boolean
  tool_call_count: number
}

export interface IterationReminderAddedEvent extends ConversationEvent {
  event_type: 'iteration_reminder_added'
  remaining_iterations: number
  reminder_type: string
}

// === HUMAN INTERACTION EVENTS ===

export interface ApprovalRequestedEvent extends TaskEvent {
  event_type: 'approval_requested'
  tool_name: string
  reason: string
}

export interface ApprovalProvidedEvent extends TaskEvent {
  event_type: 'approval_provided'
  approved: boolean
  provided_by: string
}

export interface HelpRequestedEvent extends TaskEvent {
  event_type: 'help_requested'
  help_message: string
}

export interface HelpProvidedEvent extends TaskEvent {
  event_type: 'help_provided'
  response: string
  provided_by: string
}

export interface UserMessageAddedEvent extends ConversationEvent {
  event_type: 'user_message_added'
  message: string
  sender: string
}

// === SYSTEM & CONFIGURATION EVENTS ===

export interface LLMBackendChangedEvent extends SystemEvent {
  event_type: 'llm_backend_changed'
  component: 'llm_backend'
  action: string
  backend_url: string
  available_models: string[]
}

export interface MCPServerChangedEvent extends SystemEvent {
  event_type: 'mcp_server_changed'
  component: 'mcp_server'
  action: string
  server_url: string
  available_tools: string[]
}

export interface ModelConfigChangedEvent extends SystemEvent {
  event_type: 'model_config_changed'
  component: 'model_config'
  model_type: string
  old_model: string
  new_model: string
}

export interface TaskHandlerStatusChangedEvent extends SystemEvent {
  event_type: 'task_handler_status_changed'
  component: 'task_handler'
  running: boolean
  max_concurrent_tasks: number
  currently_running_tasks: number
}

export interface SubprocessEvent extends TaskEvent {
  event_type: `subprocess_${string}`
  subprocess_event_type: string
  subprocess_id?: string
  exit_code?: number
  error_message?: string
}

// Union type for all possible WebSocket events
export type WebSocketEventUnion =
  // Task lifecycle
  | TaskCreatedEvent
  | TaskStatusChangedEvent
  | TaskIterationChangedEvent
  | TaskDeletedEvent
  | TaskBulkDeletedEvent
  | TaskResultUpdatedEvent
  // Conversation
  | MessageAddedEvent
  | IterationReminderAddedEvent
  // Human interaction
  | ApprovalRequestedEvent
  | ApprovalProvidedEvent
  | HelpRequestedEvent
  | HelpProvidedEvent
  | UserMessageAddedEvent
  // System & configuration
  | LLMBackendChangedEvent
  | MCPServerChangedEvent
  | ModelConfigChangedEvent
  | TaskHandlerStatusChangedEvent
  | SubprocessEvent

// WebSocket message wrapper for client communication
export interface WebSocketMessage {
  event: WebSocketEventUnion
  client_id?: string
  subscription_filters?: Record<string, any>
}

// Client subscription model
export interface WebSocketSubscription {
  event_types?: string[]
  task_ids?: string[]
  exclude_system_events?: boolean
  include_metadata?: boolean
}

// WebSocket connection state
export interface WebSocketConnectionState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastEventTime: Date | null
  reconnectAttempts: number
}

// Event handler type
export type WebSocketEventHandler<T extends WebSocketEventUnion = WebSocketEventUnion> = (event: T) => void

// Subscription with handler
export interface EventSubscription {
  eventTypes?: string[]
  taskIds?: string[]
  handler: WebSocketEventHandler
}