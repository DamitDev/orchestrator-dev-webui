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
  }
}


