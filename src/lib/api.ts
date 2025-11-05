import axios, { AxiosInstance } from 'axios'
import { getRuntimeConfig } from './runtimeConfig'
import type { TasksQueryParams, TasksResponse, TaskCreateRequest, TaskCreateResponse, Task } from '../types/api'

let apiClient: AxiosInstance | null = null

function getApi(): AxiosInstance {
  if (apiClient) return apiClient
  const baseURL = getRuntimeConfig().apiBaseUrl
  apiClient = axios.create({ baseURL, timeout: 30000, headers: { 'Content-Type': 'application/json' } })
  return apiClient
}

export const tasksApi = {
  async getAll(params?: TasksQueryParams): Promise<TasksResponse> {
    const search = new URLSearchParams()
    if (params?.page) search.append('page', String(params.page))
    if (params?.limit) search.append('limit', String(params.limit))
    if (params?.order_by) search.append('order_by', params.order_by)
    if (params?.order_direction) search.append('order_direction', params.order_direction)
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

  async getConversation(taskId: string): Promise<{ task_id: string; conversation: any[] }> {
    const { data } = await getApi().get(`/task/conversation`, { params: { task_id: taskId } })
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
