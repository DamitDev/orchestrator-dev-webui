import React from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { Wifi, WifiOff } from 'lucide-react'

export const ConnectionStatus: React.FC = () => {
  const { connectionState } = useWebSocket({ autoConnect: false })
  
  if (connectionState.connected) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Wifi className="h-4 w-4" />
        <span>Real-time</span>
      </div>
    )
  }
  
  if (connectionState.connecting) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        <span>Connecting...</span>
      </div>
    )
  }
  
  if (connectionState.error) {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
      </div>
    )
  }
  
  return null
}