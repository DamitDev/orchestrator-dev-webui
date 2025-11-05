import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'
import type { TasksQueryParams, TasksResponse, Task } from '../types/api'

export const tasksKeys = {
  list: (params?: TasksQueryParams) => ['tasks', params] as const
}

export function useTasks(params?: TasksQueryParams) {
  return useQuery<TasksResponse>({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksApi.getAll(params)
  })
}

export function groupTasksForInbox(tasks: Task[]) {
  const isRunning = (s: string) => ['in_progress', 'agent_turn', 'validation', 'function_execution'].includes(s)
  return {
    approvals: tasks.filter(t => t.status === 'action_required'),
    help: tasks.filter(t => t.status === 'help_required'),
    userTurn: tasks.filter(t => t.status === 'user_turn'),
    running: tasks.filter(t => isRunning(t.status))
  }
}


