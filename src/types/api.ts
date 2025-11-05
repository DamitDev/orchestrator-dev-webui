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
  workflow_id: 'proactive' | 'interactive' | 'ticket' | 'matrix'
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


