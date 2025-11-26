import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '../lib/api'
import type { Task, ConversationResponse } from '../types/api'

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
  return useQuery<ConversationResponse>({
    queryKey: taskKeys.conversation(id || ''),
    queryFn: () => tasksApi.getConversation(id!),
    enabled: !!id
  })
}

/**
 * Hook for Mio conversation that excludes archived messages.
 * This shows the conversation as Mio sees it.
 */
export function useMioConversation(id: string | undefined) {
  return useQuery<ConversationResponse>({
    queryKey: ['task', id || '', 'mio-conversation'] as const,
    queryFn: () => tasksApi.getConversation(id!, true), // exclude_archived = true
    enabled: !!id
  })
}

export function useMatrixConversation(id: string | undefined, phase: number) {
  return useQuery<ConversationResponse>({
    queryKey: ['task', id || '', 'matrix', 'phase', phase],
    queryFn: () => tasksApi.getMatrixConversationByPhase(id!, phase),
    enabled: !!id && phase >= 1 && phase <= 4
  })
}


