import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { WEBSOCKET_URL } from '../lib/config'
import { useAuth } from './AuthContext'
import type {
  WebSocketMessage,
  WebSocketConnectionState,
  EventSubscription,
  WebSocketEventHandler,
} from '../types/websocket'

const RECONNECT_INTERVAL = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

interface WebSocketContextType {
  connectionState: WebSocketConnectionState
  subscribe: (handler: WebSocketEventHandler, options?: { eventTypes?: string[]; taskIds?: string[] }) => string
  unsubscribe: (subscriptionId: string) => void
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
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
  const subscriptionIdCounter = useRef(0)

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
      heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL)
    }
  }, [])

  // Connection handler
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.CONNECTING || wsRef.current?.readyState === WebSocket.OPEN) {
      return // Already connecting or connected
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

        sendHeartbeat()
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

            if (!eventData) {
              // connection_established, etc
              return;
            }

            // Check event type filter
            if (eventTypes && eventTypes.length > 0) {
              if (!eventData.event_type || !eventTypes.includes(eventData.event_type)) {
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
          console.error('Raw data:', event.data)
        }
      }

      wsRef.current.onclose = (event) => {
        // Code 1001 is normal during development (hot reload, page refresh)
        if (event.code !== 1001) {
          console.log('WebSocket disconnected:', event.code, event.reason)
        }

        setConnectionState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }))

        // Clear heartbeat
        clearTimeouts()

        // Auto-reconnect if not manual disconnect
        if (!isManualDisconnect.current && connectionState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setConnectionState(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1,
          }))

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, RECONNECT_INTERVAL)
        } else if (connectionState.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionState(prev => ({
            ...prev,
            error: 'Max reconnection attempts reached',
          }))
          toast.error('WebSocket connection failed after maximum retry attempts')
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
        }))
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      setConnectionState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to create WebSocket connection',
      }))
    }
  }, [connectionState.reconnectAttempts, clearTimeouts, sendHeartbeat])

  // Disconnect handler
  const disconnect = useCallback(() => {
    isManualDisconnect.current = true
    clearTimeouts()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnectionState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
    }))
  }, [clearTimeouts])

  // Subscribe to events
  const subscribe = useCallback((handler: WebSocketEventHandler, options?: { eventTypes?: string[]; taskIds?: string[] }) => {
    const subscriptionId = `sub_${++subscriptionIdCounter.current}`
    subscriptionsRef.current.set(subscriptionId, {
      handler,
      eventTypes: options?.eventTypes,
      taskIds: options?.taskIds,
    })
    return subscriptionId
  }, [])

  // Unsubscribe from events
  const unsubscribe = useCallback((subscriptionId: string) => {
    subscriptionsRef.current.delete(subscriptionId)
  }, [])

  // Auto-connect only after authentication is complete
  useEffect(() => {
    // Don't connect while authentication is loading
    if (isLoading) {
      return
    }

    // Only connect if authenticated
    if (isAuthenticated) {
      connect()
    }
    
    return () => {
      disconnect()
    }
  }, [isAuthenticated, isLoading, connect, disconnect])

  const contextValue: WebSocketContextType = {
    connectionState,
    subscribe,
    unsubscribe,
    isConnected: connectionState.connected,
    connect,
    disconnect,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}
