import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

type EventHandler = (event: any) => void

interface Subscription {
  id: string
  handler: EventHandler
  eventTypes?: string[]
  taskIds?: string[]
}

interface WSContextValue {
  isConnected: boolean
  subscribe: (handler: EventHandler, opts?: { eventTypes?: string[], taskIds?: string[] }) => string
  unsubscribe: (id: string) => void
}

const WSContext = createContext<WSContextValue | null>(null)

import { getRuntimeConfig } from '../lib/runtimeConfig'

function getWsUrl(): string {
  try {
    return getRuntimeConfig().wsUrl
  } catch {
    const host = window.location.hostname
    const port = '8080'
    return `ws://${host}:${port}/ws?client_id=webui`
  }
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const subsRef = useRef<Map<string, Subscription>>(new Map())
  const idRef = useRef(0)

  const subscribe = useCallback((handler: EventHandler, opts?: { eventTypes?: string[], taskIds?: string[] }) => {
    const id = `sub_${++idRef.current}`
    subsRef.current.set(id, { id, handler, eventTypes: opts?.eventTypes, taskIds: opts?.taskIds })
    // Optionally send subscription message to server in the future
    return id
  }, [])

  const unsubscribe = useCallback((id: string) => {
    subsRef.current.delete(id)
  }, [])

  useEffect(() => {
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data)
        const evt = msg?.event ?? msg
        subsRef.current.forEach(s => {
          if (s.eventTypes && evt?.event_type && !s.eventTypes.includes(evt.event_type)) return
          if (s.taskIds && evt?.task_id && !s.taskIds.includes(evt.task_id)) return
          s.handler(evt)
        })
      } catch {
        // ignore parse errors for scaffold
      }
    }
    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  const value = useMemo<WSContextValue>(() => ({
    isConnected,
    subscribe,
    unsubscribe
  }), [isConnected, subscribe, unsubscribe])

  return <WSContext.Provider value={value}>{children}</WSContext.Provider>
}

export function useWebSocket() {
  const ctx = useContext(WSContext)
  if (!ctx) throw new Error('useWebSocket must be used within WebSocketProvider')
  return ctx
}


