import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { WEBSOCKET_URL } from '../lib/api'
import type {
  WebSocketMessage,
  WebSocketConnectionState,
  EventSubscription,
  WebSocketEventHandler,
} from '../types/websocket'
const RECONNECT_INTERVAL = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

interface UseWebSocketOptions {
  autoConnect?: boolean
  enableHeartbeat?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    enableHeartbeat = true,
    onConnect,
    onDisconnect,
    onError,
  } = options

  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastEventTime: null,
    reconnectAttempts: 0,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map())
  const isManualDisconnect = useRef(false)

  // Clear timeouts helper
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
  }, [])

  // Heartbeat mechanism
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }))
      if (enableHeartbeat) {
        heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL)
      }
    }
  }, [enableHeartbeat])

  // Connection handler
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      return // Already connecting
    }

    setConnectionState(prev => ({
      ...prev,
      connecting: true,
      error: null,
    }))

    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setConnectionState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          reconnectAttempts: 0,
          error: null,
        }))

        if (enableHeartbeat) {
          sendHeartbeat()
        }

        onConnect?.()
        toast.success('Connected to real-time updates')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          
          // Update last event time
          setConnectionState(prev => ({
            ...prev,
            lastEventTime: new Date(),
          }))

          // Handle heartbeat response
          if ((message as any).type === 'pong') {
            return
          }

          // Dispatch to subscribers
          subscriptionsRef.current.forEach((subscription) => {
            const { eventTypes, taskIds, handler } = subscription
            const eventData = message.event

            // Check event type filter
            if (eventTypes && eventTypes.length > 0) {
              if (!eventTypes.includes(eventData.event_type)) {
                return
              }
            }

            // Check task ID filter (if applicable)
            if (taskIds && taskIds.length > 0) {
              if ('task_id' in eventData && !taskIds.includes(eventData.task_id)) {
                return
              }
            }

            // Execute handler
            handler(eventData)
          })
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        // Code 1001 is normal during development (hot reload, page refresh)
        if (event.code !== 1001) {
          console.log('WebSocket disconnected:', event.code, event.reason)
        }
        clearTimeouts()

        setConnectionState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }))

        onDisconnect?.()

        // Don't reconnect if manually disconnected or during development hot reload
        if (!isManualDisconnect.current && event.code !== 1001) {
          // Auto-reconnect logic
          setConnectionState(prev => {
            const newAttempts = prev.reconnectAttempts + 1
            
            if (newAttempts <= MAX_RECONNECT_ATTEMPTS) {
              console.log(`Attempting to reconnect... (${newAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
              reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL)
              
              if (newAttempts === 1) {
                toast.error('Connection lost, attempting to reconnect...')
              }
            } else {
              toast.error('Failed to reconnect after multiple attempts')
            }

            return {
              ...prev,
              reconnectAttempts: newAttempts,
            }
          })
        } else {
          isManualDisconnect.current = false
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionState(prev => {
          // Show toast only on first connection attempt
          if (prev.reconnectAttempts === 0) {
            toast.error('WebSocket server is not available. Real-time updates disabled.')
          }
          
          return {
            ...prev,
            connecting: false,
            error: 'WebSocket server unavailable',
          }
        })
        
        onError?.(error)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to create connection',
      }))
    }
  }, [enableHeartbeat, sendHeartbeat, onConnect, onDisconnect, onError])

  // Disconnect handler
  const disconnect = useCallback(() => {
    isManualDisconnect.current = true
    clearTimeouts()
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
    }

    setConnectionState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
      reconnectAttempts: 0,
    }))
  }, [clearTimeouts])

  // Subscribe to events
  const subscribe = useCallback((
    handler: WebSocketEventHandler,
    options: { eventTypes?: string[]; taskIds?: string[] } = {}
  ): string => {
    const subscriptionId = Math.random().toString(36).substr(2, 9)
    
    subscriptionsRef.current.set(subscriptionId, {
      ...options,
      handler,
    })

    return subscriptionId
  }, [])

  // Unsubscribe from events
  const unsubscribe = useCallback((subscriptionId: string) => {
    subscriptionsRef.current.delete(subscriptionId)
  }, [])

  // Send message
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // Auto-connect on mount (deferred to avoid setState during render)
  useEffect(() => {
    if (autoConnect) {
      // Use setTimeout to defer connection until after render
      const timer = setTimeout(() => {
        connect()
      }, 0)
      
      return () => clearTimeout(timer)
    }
  }, [autoConnect, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts()
      if (wsRef.current) {
        isManualDisconnect.current = true
        wsRef.current.close()
      }
    }
  }, [clearTimeouts])

  return {
    connectionState,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    isConnected: connectionState.connected,
    isConnecting: connectionState.connecting,
  }
}