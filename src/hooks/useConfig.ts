import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { configApi } from '../lib/api'

export const configKeys = {
  status: ['config','status'] as const,
  llm: ['config','llm'] as const,
  mcp: ['config','mcp'] as const,
  taskHandler: ['config','taskHandler'] as const,
  summaryWorker: ['config','summaryWorker'] as const,
  tools: ['config','tools'] as const,
  auth: ['config','auth'] as const,
  health: ['config','health'] as const,
  ws: ['config','ws'] as const,
}

export function useConfigStatus() {
  return useQuery({ queryKey: configKeys.status, queryFn: () => configApi.getStatus() })
}

export function useLLMBackends() {
  return useQuery({ queryKey: configKeys.llm, queryFn: () => configApi.getLLMBackends() })
}

export function useMCPServers() {
  return useQuery({ queryKey: configKeys.mcp, queryFn: () => configApi.getMCPServers() })
}

export function useTaskHandlerStatus() {
  return useQuery({ queryKey: configKeys.taskHandler, queryFn: () => configApi.getTaskHandlerStatus() })
}

export function useSummaryWorkerStatus() {
  return useQuery({ 
    queryKey: configKeys.summaryWorker, 
    queryFn: () => configApi.getSummaryWorkerStatus(),
    refetchInterval: 5000 // Refetch every 5 seconds
  })
}

export function useToolsAll() {
  return useQuery({ queryKey: configKeys.tools, queryFn: () => configApi.getTools() })
}

export function useAuthConfig() {
  return useQuery({ queryKey: configKeys.auth, queryFn: () => configApi.getAuthConfig() })
}

export function useHealth() {
  return useQuery({ queryKey: configKeys.health, queryFn: () => configApi.getHealth() })
}

export function useWSStatus() {
  return useQuery({ queryKey: configKeys.ws, queryFn: () => configApi.getWebSocketStatus() })
}

export function useSetAgent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (model: string) => configApi.setAgent(model),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.status })
  })
}

export function useSetOrchestrator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (model: string) => configApi.setOrchestrator(model),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.status })
  })
}

export function useAddLLMBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ host, apiKey }: { host: string; apiKey: string }) => configApi.addLLMBackend(host, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.llm })
      qc.invalidateQueries({ queryKey: configKeys.status })
    }
  })
}

export function useRemoveLLMBackend() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (host: string) => configApi.removeLLMBackend(host),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.llm })
      qc.invalidateQueries({ queryKey: configKeys.status })
    }
  })
}

export function useAddMCPServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ host, apiKey }: { host: string; apiKey: string }) => configApi.addMCPServer(host, apiKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.mcp })
      qc.invalidateQueries({ queryKey: configKeys.tools })
      qc.invalidateQueries({ queryKey: configKeys.status })
    }
  })
}

export function useRemoveMCPServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (host: string) => configApi.removeMCPServer(host),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: configKeys.mcp })
      qc.invalidateQueries({ queryKey: configKeys.tools })
      qc.invalidateQueries({ queryKey: configKeys.status })
    }
  })
}

export function useSetMaxConcurrent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (max: number) => configApi.setMaxConcurrentTasks(max),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.taskHandler })
  })
}
