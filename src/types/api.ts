export interface Task {
  id: string
  workflow_id: string
  status: string
  iteration: number
  max_iterations: number
  goal_prompt: string
  result: string
  approval_reason: string
  ticket_id?: string | null
  available_tools?: string[] | null
  created_at: string
  updated_at: string
  workflow_data?: Record<string, any>
}

export interface PaginationInfo {
  current_page: number
  per_page: number
  total_items: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface TasksResponse {
  tasks: Task[]
  pagination: PaginationInfo
}

export type OrderBy = 'created_at' | 'updated_at'
export type OrderDirection = 'asc' | 'desc'

export interface TasksQueryParams {
  page?: number
  limit?: number
  order_by?: OrderBy
  order_direction?: OrderDirection
  workflow_id?: string
}

export type ReasoningEffort = 'low' | 'medium' | 'high'

export interface TaskCreateRequest {
  workflow_id: 'proactive' | 'interactive' | 'ticket' | 'matrix' | 'self_managed'
  goal_prompt?: string
  max_iterations?: number
  reasoning_effort?: ReasoningEffort
  system_prompt?: string | null
  developer_prompt?: string | null
  available_tools?: string[] | null
  agent_model_id?: string | null
  orchestrator_model_id?: string | null
  // ticket
  ticket_id?: string
  ticket_text?: string | null
  summary?: string | null
  problem_summary?: string | null
  solution_strategy?: string | null
}

export interface TaskCreateResponse {
  task_id: string
  status: string
}

// Conversation message types
export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface ConversationMessage {
  id?: number
  role: 'system' | 'user' | 'assistant' | 'tool' | 'developer'
  content: string | null
  name?: string | null
  reasoning?: string | null
  tool_calls?: ToolCall[] | null
  tool_call_id?: string | null
  // Summary fields (optional, generated asynchronously)
  reasoning_summary?: string | null
  tool_call_summary?: string | null
  tool_output_summary?: string | null
  created_at?: string
}

export interface ConversationResponse {
  task_id: string
  conversation: ConversationMessage[]
}

// Mio Memory types
export interface MioMemory {
  id: string
  task_id: string | null
  title: string
  content: string
  tags: string[]
  linked_task_id: string | null
  created_at: string
  updated_at: string
}

export interface MioMemoriesResponse {
  memories: MioMemory[]
  total: number
}

// Summary Worker Status
export interface SummaryWorkerStatus {
  running: boolean
  uptime_seconds: number | null
  max_concurrent_summaries: number
  processed_count: number
  queued_count: number
  pending_count: number
  queue_size: number
  error_count: number
}

// Slot Status Types
export interface SlotInfo {
  id: string
  ip: string
  status: 'available' | 'occupied' | 'error'
  task_id: string | null
  last_activity: string | null
  idle_seconds: number | null
}

export interface SlotStatusResponse {
  enabled: boolean
  total_slots: number
  available_slots: number
  slot_tools: string[]
  acquire_timeout_seconds: number
  slots: SlotInfo[]
}

// MCP Server Status
export interface MCPServerInfo {
  base_url: string
  name: string
  description: string
  tools: string[]
}

export interface MCPServersResponse {
  servers: MCPServerInfo[]
  total_servers: number
  all_available_tools: string[]
}

// Task Handler Status
export interface TaskHandlerStatus {
  running: boolean
  max_concurrent_tasks: number
  current_running_tasks: number
}

// WebSocket event types
export interface BaseWebSocketEvent {
  event_type: string
  task_id: string
  timestamp?: string
}

export interface MessageAddedEvent extends BaseWebSocketEvent {
  event_type: 'message_added'
  message_id: number
  role: string
  content: string
  reasoning?: string
  tool_calls?: ToolCall[]
  has_tool_calls?: boolean
}

export interface MessageStreamingEvent extends BaseWebSocketEvent {
  event_type: 'message_streaming'
  message_id: number
  role: string
  content: string
  reasoning: string
  tool_calls: ToolCall[] | null
  tool_call_id: string | null
  name: string | null
  is_complete: boolean
  stream_index: number
  has_tool_calls: boolean
  tool_call_count: number
}

export interface MessageSummaryGeneratedEvent extends BaseWebSocketEvent {
  event_type: 'message_summary_generated'
  message_id: number
  summary_id: number
  reasoning_summary?: string | null
  tool_call_summary?: string | null
  tool_output_summary?: string | null
  has_reasoning_summary: boolean
  has_tool_call_summary: boolean
  has_tool_output_summary: boolean
}

export interface TaskStatusChangedEvent extends BaseWebSocketEvent {
  event_type: 'task_status_changed'
  status: string
  iteration?: number
}

export interface ApprovalRequestedEvent extends BaseWebSocketEvent {
  event_type: 'approval_requested'
  approval_reason: string
}

export interface HelpRequestedEvent extends BaseWebSocketEvent {
  event_type: 'help_requested'
  help_question: string
}

export interface SummaryWorkerStatusEvent {
  event_type: 'summary_worker_status'
  data: SummaryWorkerStatus
}

export type WebSocketEvent = 
  | MessageAddedEvent
  | MessageStreamingEvent
  | MessageSummaryGeneratedEvent
  | TaskStatusChangedEvent
  | ApprovalRequestedEvent
  | HelpRequestedEvent
  | SummaryWorkerStatusEvent
  | BaseWebSocketEvent


