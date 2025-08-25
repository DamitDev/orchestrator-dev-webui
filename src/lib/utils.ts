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

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
    case 'canceled':
      return 'bg-red-100 text-red-800'
    case 'action_required':
      return 'bg-orange-100 text-orange-800'
    case 'in_progress':
    case 'validation':
      return 'bg-yellow-100 text-yellow-800'
    case 'function_execution':
      return 'bg-purple-100 text-purple-800'
    case 'queued':
    case 'queued_for_function_execution':
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
      return '🚫'
    case 'action_required':
      return '🔶'
    case 'in_progress':
      return '🔄'
    case 'validation':
      return '🔍'
    case 'function_execution':
      return '⚡'
    case 'queued':
      return '⏳'
    case 'queued_for_function_execution':
      return '📋'
    default:
      return '❓'
  }
}

export function isRunningStatus(status: string): boolean {
  return ['in_progress'].includes(status)
}
