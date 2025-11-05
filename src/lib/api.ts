import axios, { AxiosInstance } from 'axios'
import { getRuntimeConfig } from './runtimeConfig'
import type { TasksQueryParams, TasksResponse } from '../types/api'

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
  }
}


