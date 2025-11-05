import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'
import type { TasksQueryParams, TasksResponse, Task } from '../types/api'
import toast from 'react-hot-toast'

export const tasksKeys = {
  list: (params?: TasksQueryParams) => ['tasks', params] as const
}

export function useTasks(params?: TasksQueryParams) {
  return useQuery<TasksResponse>({
    queryKey: tasksKeys.list(params),
    queryFn: () => tasksApi.getAll(params)
  })
}

export function useCancelTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.cancel(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task cancelled successfully')
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.error || error?.message || 'Failed to cancel task'
      toast.error(msg)
    }
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


