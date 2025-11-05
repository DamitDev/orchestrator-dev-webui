import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface TaskIdBadgeProps {
  taskId: string
  className?: string
}

export function TaskIdBadge({ taskId, className = '' }: TaskIdBadgeProps) {
  const [copied, setCopied] = useState(false)
  
  const shortId = taskId.split('-')[0]
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(taskId)
      setCopied(true)
      toast.success('Task ID copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy task ID')
    }
  }
  
  return (
    <button
      onClick={handleCopy}
      title={`${taskId}\nClick to copy`}
      className={`group inline-flex items-center gap-1.5 font-mono text-xs bg-nord5/50 px-2 py-0.5 rounded text-nord3 dark:bg-nord2 dark:text-nord4 hover:bg-nord8/20 dark:hover:bg-nord8/10 transition-colors cursor-pointer ${className}`}
    >
      <span>{shortId}…</span>
      {copied ? (
        <Check className="w-3 h-3 text-nord14" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}

