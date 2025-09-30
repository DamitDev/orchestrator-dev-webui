import React, { useEffect } from 'react'
import { useWebSocketEvents } from '../hooks/useWebSocketEvents'

/**
 * Component that initializes WebSocket events inside QueryClientProvider context
 * This must be rendered inside QueryClientProvider to have access to queryClient
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize WebSocket events for real-time updates
  const { isConnected } = useWebSocketEvents()
  
  // Log connection status for debugging
  useEffect(() => {
    console.log('WebSocket connection status:', isConnected ? 'Connected' : 'Disconnected')
  }, [isConnected])
  
  return <>{children}</>
}