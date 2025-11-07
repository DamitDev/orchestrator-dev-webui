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
    let reconnectTimeout: number | null = null
    let isUnmounting = false
    let reconnectAttempts = 0
    const maxReconnectDelay = 30000 // Max 30 seconds
    
    const connect = () => {
      if (isUnmounting) return
      
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws
      
      ws.onopen = () => {
        setConnected(true)
        reconnectAttempts = 0 // Reset on successful connection
        console.log('✅ WebSocket connected to orchestrator')
      }
      
      ws.onclose = (ev) => {
        setConnected(false)
        
        // Only log if it's not a normal closure and we had a successful connection before
        if (ev.code !== 1000 && reconnectAttempts > 0) {
          console.log(`⚠️ WebSocket disconnected (code: ${ev.code})`)
        }
        
        // Reconnect with exponential backoff if not unmounting and not a normal closure
        if (!isUnmounting && ev.code !== 1000) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), maxReconnectDelay)
          
          if (reconnectAttempts === 1) {
            console.log('🔄 Connecting to orchestrator WebSocket...')
          } else if (reconnectAttempts <= 3) {
            console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts})`)
          }
          
          reconnectTimeout = window.setTimeout(() => {
            connect()
          }, delay)
        }
      }
      
      ws.onerror = () => {
        // Don't log errors, they're redundant with onclose
        setConnected(false)
      }
      
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
    }
    
    connect()
    
    return () => {
      isUnmounting = true
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      wsRef.current = null
      }
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


