import { useWebSocketContext } from '../contexts/WebSocketContext'

interface UseWebSocketOptions {
  autoConnect?: boolean
  enableHeartbeat?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export const useWebSocket = (_options: UseWebSocketOptions = {}) => {
  // Use the shared WebSocket context instead of creating a new connection
  const context = useWebSocketContext()
  
  // Return the context values for backward compatibility
  return {
    connectionState: context.connectionState,
    subscribe: context.subscribe,
    unsubscribe: context.unsubscribe,
    isConnected: context.isConnected,
    connect: context.connect,
    disconnect: context.disconnect,
  }
}