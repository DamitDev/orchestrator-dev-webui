import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getRuntimeConfig } from './runtimeConfig'
import type { TasksQueryParams, TasksResponse, TaskCreateRequest, TaskCreateResponse, Task, ConversationResponse, SummaryWorkerStatus } from '../types/api'

let apiClient: AxiosInstance | null = null
let tokenGetter: (() => string | undefined) | null = null

// Set the token getter function from AuthContext
export function setTokenGetter(getter: () => string | undefined) {
  tokenGetter = getter
}

function getApi(): AxiosInstance {
  if (apiClient) return apiClient
  const baseURL = getRuntimeConfig().apiBaseUrl
  apiClient = axios.create({ baseURL, timeout: 30000, headers: { 'Content-Type': 'application/json' } })
  
  // Add request interceptor to include auth token
  apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenGetter?.()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Add response interceptor to handle 401 errors
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Unauthorized access - authentication required')
        // The auth context will handle redirecting to login
      }
      return Promise.reject(error)
    }
  )
  
  return apiClient
}

export const tasksApi = {
  async getAll(params?: TasksQueryParams): Promise<TasksResponse> {
    const search = new URLSearchParams()
    if (params?.page) search.append('page', String(params.page))
    if (params?.limit) search.append('limit', String(params.limit))
    if (params?.order_by) search.append('order_by', params.order_by)
    if (params?.order_direction) search.append('order_direction', params.order_direction)
    if (params?.workflow_id) search.append('workflow_id', params.workflow_id)
    const url = `/tasks${search.toString() ? `?${search.toString()}` : ''}`
    const { data } = await getApi().get(url)
    return data
  },

  async cancel(taskId: string): Promise<void> {
    await getApi().post('/task/cancel', { task_id: taskId })
  },

  async delete(taskId: string): Promise<void> {
    await getApi().post('/task/delete', { task_id: taskId })
  },

  async deleteMultiple(taskIds: string[]): Promise<{ deleted_tasks: string[]; failed_tasks: string[] }> {
    const { data } = await getApi().post('/task/delete/multiple', { task_ids: taskIds })
    return data
  },

  async create(body: TaskCreateRequest): Promise<TaskCreateResponse> {
    const { data } = await getApi().post('/task/create', body)
    return data
  },

  async getById(taskId: string): Promise<Task> {
    const { data } = await getApi().get(`/task/status`, { params: { task_id: taskId } })
    return data
  },

  async getConversation(taskId: string): Promise<ConversationResponse> {
    const { data } = await getApi().get(`/task/conversation`, { params: { task_id: taskId } })
    return data
  },

  async getMatrixConversationByPhase(taskId: string, phase: number): Promise<ConversationResponse> {
    const { data } = await getApi().get(`/task/matrix/conversation`, { params: { task_id: taskId, phase } })
    return data
  },

  workflows: {
    interactive: {
      async sendMessage(taskId: string, message: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/interactive/message', { task_id: taskId, message })
        return data
      },
      async markComplete(taskId: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/interactive/mark_complete', { task_id: taskId })
        return data
      },
      async markFailed(taskId: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/interactive/mark_failed', { task_id: taskId })
        return data
      },
      async action(taskId: string, approved: boolean): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/interactive/action', { task_id: taskId, approved })
        return data
      }
    },
    proactive: {
      async guide(taskId: string, message: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/proactive/guide', { task_id: taskId, message })
        return data
      },
      async help(taskId: string, response: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/proactive/help', { task_id: taskId, response })
        return data
      },
      async action(taskId: string, approved: boolean): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/proactive/action', { task_id: taskId, approved })
        return data
      }
    },
    ticket: {
      async guide(taskId: string, message: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/ticket/guide', { task_id: taskId, message })
        return data
      },
      async help(taskId: string, response: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/ticket/help', { task_id: taskId, response })
        return data
      },
      async action(taskId: string, approved: boolean): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/ticket/action', { task_id: taskId, approved })
        return data
      }
    },
    matrix: {
      async sendMessage(taskId: string, message: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/matrix/message', { task_id: taskId, message })
        return data
      },
      async markComplete(taskId: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/matrix/mark_complete', { task_id: taskId })
        return data
      },
      async markFailed(taskId: string): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/matrix/mark_failed', { task_id: taskId })
        return data
      },
      async action(taskId: string, approved: boolean): Promise<{ message: string }> {
        const { data } = await getApi().post('/task/matrix/action', { task_id: taskId, approved })
        return data
      }
    }
  }
}

export const configApi = {
  async getStatus(): Promise<any> {
    const { data } = await getApi().get('/configuration/status')
    return data
  },
  async setAgent(modelName: string): Promise<void> {
    await getApi().post('/configuration/agent', { model_name: modelName })
  },
  async setOrchestrator(modelName: string): Promise<void> {
    await getApi().post('/configuration/orchestrator', { model_name: modelName })
  },
  async getLLMBackends(): Promise<any> {
    const { data } = await getApi().get('/configuration/llmbackend/status')
    return data
  },
  async addLLMBackend(host: string, apiKey: string): Promise<void> {
    await getApi().post('/configuration/llmbackend/add', { backends: [{ url: host, api_key: apiKey }] })
  },
  async removeLLMBackend(host: string): Promise<void> {
    await getApi().post('/configuration/llmbackend/remove', { host })
  },
  async getMCPServers(): Promise<any> {
    const { data } = await getApi().get('/configuration/mcpserver/status')
    return data
  },
  async addMCPServer(host: string, apiKey: string): Promise<void> {
    await getApi().post('/configuration/mcpserver/add', { servers: [{ url: host, api_key: apiKey }] })
  },
  async removeMCPServer(host: string): Promise<void> {
    await getApi().post('/configuration/mcpserver/remove', { host })
  },
  async getTaskHandlerStatus(): Promise<any> {
    const { data } = await getApi().get('/configuration/taskhandler/status')
    return data
  },
  async setMaxConcurrentTasks(max: number): Promise<void> {
    await getApi().post('/configuration/taskhandler/concurrent', undefined, { params: { max_tasks: max } })
  },
  async getSummaryWorkerStatus(): Promise<SummaryWorkerStatus> {
    const { data } = await getApi().get('/configuration/summary-worker/status')
    return data
  },
  async getTools(): Promise<any> {
    const { data } = await getApi().get('/tools/all')
    return data
  },
  async getAuthConfig(): Promise<any> {
    const { data } = await getApi().get('/auth/config')
    return data
  },
  async getHealth(): Promise<any> {
    const { data } = await getApi().get('/health')
    return data
  },
  async getWebSocketStatus(): Promise<any> {
    const { data } = await getApi().get('/websocket/status')
    return data
  }
}
