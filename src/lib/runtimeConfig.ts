export interface RuntimeConfig {
  apiBaseUrl: string
  wsUrl: string
}

let config: RuntimeConfig | null = null

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (config) return config
  
  // Get config from Vite environment variables or default to relative paths for proxying
  // Note: In production/docker with proxy, these should be relative.
  // The build args or env vars can override them, but defaults should support proxy.
  // If VITE_ORCHESTRATOR_API_URL is not set, we default to '/api' to use the proxy.
  const apiBaseUrl = (import.meta.env.VITE_ORCHESTRATOR_API_URL || '/api').replace(/\/$/, '')
  
  // For WebSocket, we use '/ws' relative path. The client code will need to construct the full URL
  // since WebSocket constructor requires absolute URL.
  const wsUrl = import.meta.env.VITE_ORCHESTRATOR_WS_URL || '/ws'
  
  config = {
    apiBaseUrl,
    wsUrl
  }
  
  return config
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!config) throw new Error('Runtime config not loaded. Call loadRuntimeConfig() first.')
  return config
}


