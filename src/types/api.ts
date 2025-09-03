export interface Task {
  id: string
  ticket_id: string
  status: string
  iteration: number
  max_iterations: number
  goal_prompt: string
  result: string
  approval_reason: string
  created_at: string
  updated_at: string
}

export interface TaskConversation {
  task_id: string
  conversation: ConversationMessage[]
}

export interface ConversationMessage {
  role: string
  content: string
  reasoning?: string
  tool_calls?: any[]
  tool_call_id?: string
  created_at?: string // UTC timestamp from the API
}

export interface ConfigurationStatus {
  agent_model: string
  orchestrator_model: string
  llm_backends_count: number
  mcp_servers_count: number
  total_tasks: number
  queued_tasks: number
  active_tasks: number
  pending_approval_tasks: number
}

export interface LLMBackendInfo {
  base_url: string
  models: string[]
}

export interface MCPServerInfo {
  base_url: string
  tools: string[]
}

export interface TaskCreateRequest {
  ticket_id: string
  goal_prompt?: string
  ticket_text?: string
  summary?: string
  problem_summary?: string
  solution_strategy?: string
  max_iterations?: number
  system_prompt?: string
  developer_prompt?: string
  reasoning_effort?: 'low' | 'medium' | 'high'
}

export interface TaskActionRequest {
  task_id: string
  approved: boolean
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  error?: string
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

export interface TasksQueryParams {
  page?: number
  limit?: number
  order_by?: 'created_at' | 'updated_at'
  order_direction?: 'asc' | 'desc'
}
