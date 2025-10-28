export interface Task {
  id: string
  workflow_id: string
  status: string
  iteration: number
  max_iterations: number
  goal_prompt: string
  result: string
  approval_reason: string
  ticket_id?: string // Optional, only for ticket workflow
  available_tools?: string[] // Optional, list of allowed tools for this task
  workflow_data?: Record<string, any> & {
    // Matrix workflow fields
    phase?: number           // 0-4, current phase in matrix workflow
    aspect_goal?: string     // from Phase 1 in matrix workflow
    strategy?: string        // implementation_spec from Phase 3 in matrix workflow
    // Other workflows can add their own fields here
  }
  created_at: string
  updated_at: string
}

export interface TaskConversation {
  task_id: string
  conversation: ConversationMessage[]
}

export interface ConversationMessage {
  id: number
  role: string
  content: string
  reasoning?: string
  name?: string
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

export interface LLMBackendConfig {
  url: string
  api_key: string
}

export interface MCPServerInfo {
  base_url: string
  tools: string[]
}

export interface MCPServerConfig {
  url: string
  api_key: string
}

export interface TaskCreateRequest {
  workflow_id?: string // Defaults to 'proactive' in backend
  goal_prompt?: string
  max_iterations?: number
  system_prompt?: string
  developer_prompt?: string
  reasoning_effort?: 'low' | 'medium' | 'high'
  available_tools?: string[] // Optional, list of allowed tools for this task
  
  // Workflow-specific fields
  // For ticket workflow:
  ticket_id?: string
  ticket_text?: string
  summary?: string
  problem_summary?: string
  solution_strategy?: string
  
  // Model configuration (for proactive and ticket workflows):
  agent_model_id?: string
  orchestrator_model_id?: string
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

export interface ToolInfo {
  name: string
  description: string
  server: string
}

export interface AllToolsResponse {
  tools: ToolInfo[]
  total_tools: number
  servers: string[]
}
