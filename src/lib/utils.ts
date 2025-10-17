import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function formatMessageTimestamp(utcTimestamp: string): string {
  try {
    // Parse the UTC timestamp and format it in the browser's local timezone
    const date = new Date(utcTimestamp)
    const now = new Date()
    
    // Get dates without time for comparison
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    
    // Format time in 24h format with seconds
    const timeFormat = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date)
    
    if (messageDate.getTime() === today.getTime()) {
      // Today: show only time
      return timeFormat
    } else if (messageDate.getTime() === yesterday.getTime()) {
      // Yesterday: show "yesterday" + time
      return `yesterday ${timeFormat}`
    } else {
      // Older: show ISO date + time
      const isoDate = date.getFullYear() + '-' + 
        String(date.getMonth() + 1).padStart(2, '0') + '-' + 
        String(date.getDate()).padStart(2, '0')
      return `${isoDate} ${timeFormat}`
    }
  } catch (error) {
    return 'Invalid time'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'cancelling':
      return 'bg-red-200 text-red-900'
    case 'action_required':
      return 'bg-orange-100 text-orange-800'
    case 'help_required':
      return 'bg-blue-100 text-blue-800'
    case 'in_progress':
    case 'agent_turn':
    case 'orchestrator_turn':
    case 'validation':
      return 'bg-yellow-100 text-yellow-800'
    case 'user_turn':
      return 'bg-cyan-100 text-cyan-800'
    case 'function_execution':
      return 'bg-purple-100 text-purple-800'
    case 'queued':
    case 'queued_for_function_execution':
    case 'start':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return '✅'
    case 'failed':
      return '❌'
    case 'canceled':
    case 'cancelled':
      return '🚫'
    case 'cancelling':
      return '⏹️'
    case 'action_required':
      return '🔶'
    case 'help_required':
      return '💬'
    case 'in_progress':
    case 'agent_turn':
    case 'orchestrator_turn':
      return '🔄'
    case 'user_turn':
      return '👤'
    case 'validation':
    case 'validating':
      return '🔍'
    case 'function_execution':
      return '⚡'
    case 'queued':
      return '⏳'
    case 'queued_for_function_execution':
      return '📋'
    case 'start':
      return '🚀'
    default:
      return '❓'
  }
}

export function isRunningStatus(status: string): boolean {
  return ['in_progress', 'agent_turn', 'orchestrator_turn', 'user_turn', 'validation', 'validating'].includes(status)
}
