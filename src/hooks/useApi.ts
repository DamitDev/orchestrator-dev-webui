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
export const useTasks = (params?: TasksQueryParams) => {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => tasksApi.getAll(params),
  })
}

export const useTask = (id: string | null) => {
  return useQuery({
    queryKey: queryKeys.task(id || ''),
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id,
  })
}

export const useTaskConversation = (id: string | null) => {
  return useQuery({
    queryKey: queryKeys.taskConversation(id || ''),
    queryFn: () => tasksApi.getConversation(id!),
    enabled: !!id,
  })
}

// Configuration hooks
export const useConfig = () => {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => configApi.getStatus(),
  })
}

export const useLLMBackends = () => {
  return useQuery({
    queryKey: queryKeys.llmBackends,
    queryFn: () => configApi.getLLMBackends(),
  })
}

export const useMCPServers = () => {
  return useQuery({
    queryKey: queryKeys.mcpServers,
    queryFn: () => configApi.getMCPServers(),
  })
}

export const useTaskHandler = () => {
  return useQuery({
    queryKey: queryKeys.taskHandler,
    queryFn: () => configApi.getTaskHandlerStatus(),
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

export const useHelpTask = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, response }: { taskId: string; response: string }) => 
      tasksApi.help(taskId, response),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Help response sent successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to send help response: ${error.response?.data?.error || error.message}`)
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

// Interactive task mutations
export const useSendInteractiveMessage = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message: string }) => 
      tasksApi.sendMessage(taskId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.taskConversation(variables.taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Message sent successfully!')
    },
    onError: (error: any) => {
      toast.error(`Failed to send message: ${error.response?.data?.error || error.message}`)
    },
  })
}

export const useMarkTaskComplete = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.markComplete(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Task marked as complete!')
    },
    onError: (error: any) => {
      toast.error(`Failed to mark task complete: ${error.response?.data?.error || error.message}`)
    },
  })
}

export const useMarkTaskFailed = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.markFailed(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.config })
      toast.success('Task marked as failed!')
    },
    onError: (error: any) => {
      toast.error(`Failed to mark task failed: ${error.response?.data?.error || error.message}`)
    },
  })
}
