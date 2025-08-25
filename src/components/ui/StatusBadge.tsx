import React from 'react'
import { cn, getStatusColor, getStatusIcon, isRunningStatus } from '../../lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const isRunning = isRunningStatus(status)
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      getStatusColor(status),
      className
    )}>
      {showIcon && (
        <span className={isRunning ? 'animate-spin' : ''}>
          {getStatusIcon(status)}
        </span>
      )}
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

export default StatusBadge
