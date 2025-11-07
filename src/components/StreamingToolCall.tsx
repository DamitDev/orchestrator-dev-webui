import { useEffect, useRef } from 'react'
import { TokenStream } from './TokenStream'
import { Loader2 } from 'lucide-react'
import { AnimatedDetails } from './AnimatedDetails'

interface StreamingToolCallProps {
  toolName: string
  parameters: string
  mode: string
}

export function StreamingToolCall({ toolName, parameters, mode }: StreamingToolCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when parameters update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [parameters])
  
  return (
    <div className="text-xs mb-2">
      <AnimatedDetails 
        open={true}
        summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8 flex items-center gap-2"
        summary={
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Using tool: <code className="text-nord10 dark:text-nord8 font-medium">{toolName}</code></span>
          </>
        }
      >
        <div className="mt-2 ml-4">
          {mode === 'expert' && (
            <AnimatedDetails 
              open={true}
              className="text-xs"
              summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8"
              summary={<>Parameters</>}
            >
              <div 
                ref={containerRef}
                className="mt-1 overflow-y-auto bg-nord5 dark:bg-nord2 rounded-lg p-2 border border-nord4 dark:border-nord3 font-mono"
                style={{ maxHeight: '9rem' }} // ~6 lines
              >
                <TokenStream text={parameters} autoScroll={true} />
              </div>
            </AnimatedDetails>
          )}
        </div>
      </AnimatedDetails>
    </div>
  )
}

