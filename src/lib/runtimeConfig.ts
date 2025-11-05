export interface RuntimeConfig {
  apiBaseUrl: string
  wsUrl: string
}

let config: RuntimeConfig | null = null

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (config) return config
  
  // Get config from Vite environment variables
  const apiBaseUrl = (import.meta.env.VITE_ORCHESTRATOR_API_URL || 'http://localhost:8080').replace(/\/$/, '')
  const wsUrl = import.meta.env.VITE_ORCHESTRATOR_WS_URL || 'ws://localhost:8080/ws?client_id=webui'
  
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


