import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi, configApi, healthApi } from '../lib/api'
import { toast } from 'react-hot-toast'
import type { TaskCreateRequest, TaskActionRequest, TasksQueryParams } from '../types/api'

// Query keys
export const queryKeys = {
  tasks: (params?: TasksQueryParams) => ['tasks', params] as const,
  task: (id: string) => ['task', id] as const,
  taskConversation: (id: string) => ['task', id, 'conversation'] as const,
  config: ['config'] as const,
  health: ['health'] as const,
  llmBackends: ['llmBackends'] as const,
  mcpServers: ['mcpServers'] as const,
  taskHandler: ['taskHandler'] as const,
}

// Tasks hooks
export const useTasks = (params?: TasksQueryParams, refetchInterval?: number) => {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => tasksApi.getAll(params),
    refetchInterval: refetchInterval || 5000, // Default 5 seconds
    refetchIntervalInBackground: true,
  })
}

export const useTask = (id: string | null, refetchInterval?: number) => {
  return useQuery({
    queryKey: queryKeys.task(id || ''),
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id,
    refetchInterval: refetchInterval || 2000, // Default 2 seconds for individual task
    refetchIntervalInBackground: true,
  })
}

export const useTaskConversation = (id: string | null, refetchInterval?: number) => {
  return useQuery({
    queryKey: queryKeys.taskConversation(id || ''),
    queryFn: () => tasksApi.getConversation(id!),
    enabled: !!id,
    refetchInterval: refetchInterval || 3000, // Default 3 seconds for conversation
    refetchIntervalInBackground: true,
  })
}

// Configuration hooks
export const useConfig = (refetchInterval?: number) => {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: configApi.getStatus,
    refetchInterval: refetchInterval || 10000, // Default 10 seconds
    refetchIntervalInBackground: true,
  })
}

export const useLLMBackends = () => {
  return useQuery({
    queryKey: queryKeys.llmBackends,
    queryFn: configApi.getLLMBackends,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
  })
}

export const useMCPServers = () => {
  return useQuery({
    queryKey: queryKeys.mcpServers,
    queryFn: configApi.getMCPServers,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchIntervalInBackground: true,
  })
}

export const useTaskHandler = () => {
  return useQuery({
    queryKey: queryKeys.taskHandler,
    queryFn: configApi.getTaskHandlerStatus,
  })
}

// Health check hook
export const useHealth = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthApi.check,
    retry: 3,
    retryDelay: 1000,
  })
}

// Mutations
export const useCreateTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: TaskCreateRequest) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Task created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create task')
    },
  })
}

export const useCancelTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.cancel(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Task cancelled successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel task')
    },
  })
}

export const useTaskAction = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: TaskActionRequest) => tasksApi.action(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.task_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success(variables.approved ? 'Task approved!' : 'Task rejected!')
    },
    onError: (error: any) => {
      toast.error(`Failed to perform task action: ${error.message}`)
    },
  })
}

export const useGuideTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) => 
      tasksApi.guide(taskId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Guidance message sent successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to send guidance: ${error.response?.data?.error || error.message}`)
    },
  })
}

// LLM Backend management mutations
export const useAddLLMBackend = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ host, apiKey }: { host: string; apiKey: string }) => 
      configApi.addLLMBackend(host, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmBackends })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('LLM Backend added successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to add LLM Backend: ${error.response?.data?.error || error.message}`)
    },
  })
}

export const useRemoveLLMBackend = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (host: string) => configApi.removeLLMBackend(host),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.llmBackends })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('LLM Backend removed successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to remove LLM Backend: ${error.response?.data?.error || error.message}`)
    },
  })
}

// MCP Server management mutations
export const useAddMCPServer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ host, apiKey }: { host: string; apiKey: string }) => 
      configApi.addMCPServer(host, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('MCP Server added successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to add MCP Server: ${error.response?.data?.error || error.message}`)
    },
  })
}

export const useRemoveMCPServer = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (host: string) => configApi.removeMCPServer(host),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mcpServers })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('MCP Server removed successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to remove MCP Server: ${error.response?.data?.error || error.message}`)
    },
  })
}

export const useSetAgent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (modelName: string) => configApi.setAgent(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Agent model updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update agent model')
    },
  })
}

export const useSetOrchestrator = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (modelName: string) => configApi.setOrchestrator(modelName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Orchestrator model updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update orchestrator model')
    },
  })
}
