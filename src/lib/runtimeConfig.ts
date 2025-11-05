export interface RuntimeConfig {
  apiBaseUrl: string
  wsUrl: string
  rootPath: string
}

let config: RuntimeConfig | null = null

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (config) return config
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (res.ok) {
      const json = await res.json()
      config = normalizeConfig(json)
      return config
    }
  } catch {
    // ignore and fall back
  }
  // Fallback defaults
  const host = window.location.hostname
  const apiPort = '8080'
  config = {
    apiBaseUrl: `http://${host}:${apiPort}`,
    wsUrl: `ws://${host}:${apiPort}/ws?client_id=webui`,
    rootPath: ''
  }
  return config
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!config) throw new Error('Runtime config not loaded. Call loadRuntimeConfig() first.')
  return config
}

function normalizeConfig(input: any): RuntimeConfig {
  const apiBaseUrl = String(input?.apiBaseUrl || '').replace(/\/$/, '')
  const wsUrl = String(input?.wsUrl || '')
  return {
    apiBaseUrl: apiBaseUrl || 'http://localhost:8080',
    wsUrl: wsUrl || 'ws://localhost:8080/ws?client_id=webui',
    rootPath: String(input?.rootPath || '')
  }
}


