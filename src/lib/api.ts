import axios from 'axios'
import type { 
  Task, 
  TaskConversation, 
  ConfigurationStatus, 
  TaskCreateRequest, 
  TaskActionRequest,
  LLMBackendInfo,
  MCPServerInfo
} from '../types/api'

const API_BASE_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Task API
export const tasksApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks')
    return response.data.tasks
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get(`/task/status?task_id=${id}`)
    return response.data
  },

  getConversation: async (id: string): Promise<TaskConversation> => {
    const response = await api.get(`/task/conversation?task_id=${id}`)
    return response.data
  },

  create: async (data: TaskCreateRequest): Promise<{ task_id: string; status: string }> => {
    const response = await api.post('/task/create', data)
    return response.data
  },

  cancel: async (taskId: string): Promise<void> => {
    await api.post('/task/cancel', { task_id: taskId })
  },

  action: async (data: TaskActionRequest): Promise<void> => {
    await api.post('/task/action', data)
  },

  guide: async (taskId: string, message: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/task/guide', { task_id: taskId, message })
    return response.data
  },
}

// Configuration API
export const configApi = {
  getStatus: async (): Promise<ConfigurationStatus> => {
    const response = await api.get('/configuration/status')
    return response.data
  },

  setAgent: async (modelName: string): Promise<void> => {
    await api.post('/configuration/agent', { model_name: modelName })
  },

  setOrchestrator: async (modelName: string): Promise<void> => {
    await api.post('/configuration/orchestrator', { model_name: modelName })
  },

  getLLMBackends: async (): Promise<{ backends: LLMBackendInfo[]; total_backends: number; all_available_models: string[] }> => {
    const response = await api.get('/configuration/llmbackend/status')
    return response.data
  },

  getMCPServers: async (): Promise<{ servers: MCPServerInfo[]; total_servers: number; all_available_tools: string[] }> => {
    const response = await api.get('/configuration/mcpserver/status')
    return response.data
  },

  getTaskHandlerStatus: async (): Promise<any> => {
    const response = await api.get('/configuration/taskhandler/status')
    return response.data
  },

  // LLM Backend management
  addLLMBackend: async (host: string, apiKey: string): Promise<void> => {
    await api.post('/configuration/llmbackend/add', { 
      hosts: [host], 
      api_keys: [apiKey] 
    })
  },

  removeLLMBackend: async (host: string): Promise<void> => {
    await api.post('/configuration/llmbackend/remove', { host })
  },

  // MCP Server management
  addMCPServer: async (host: string, apiKey: string): Promise<void> => {
    await api.post('/configuration/mcpserver/add', { 
      hosts: [host], 
      api_keys: [apiKey] 
    })
  },

  removeMCPServer: async (host: string): Promise<void> => {
    await api.post('/configuration/mcpserver/remove', { host })
  },
}

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string }> => {
    const response = await api.get('/health')
    return response.data
  },
}

export default api
