import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'
import type { Task } from '../types/api'

export const taskKeys = {
  byId: (id: string) => ['task', id] as const,
  conversation: (id: string) => ['task', id, 'conversation'] as const
}

export function useTask(id: string | undefined) {
  return useQuery<Task>({
    queryKey: taskKeys.byId(id || ''),
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id
  })
}

export function useTaskConversation(id: string | undefined) {
  return useQuery<{ task_id: string; conversation: any[] }>({
    queryKey: taskKeys.conversation(id || ''),
    queryFn: () => tasksApi.getConversation(id!),
    enabled: !!id
  })
}

export function useMatrixConversation(id: string | undefined, phase: number) {
  return useQuery<{ task_id: string; conversation: any[] }>({
    queryKey: ['task', id || '', 'matrix', 'phase', phase],
    queryFn: () => tasksApi.getMatrixConversationByPhase(id!, phase),
    enabled: !!id && phase >= 1 && phase <= 4
  })
}


