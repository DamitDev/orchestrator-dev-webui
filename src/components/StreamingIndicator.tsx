import { Loader2 } from 'lucide-react'

export function StreamingIndicator() {
  return (
    <div className="text-xs text-nord3 dark:text-nord4 flex items-center gap-2">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>▸ Thinking...</span>
    </div>
  )
}

