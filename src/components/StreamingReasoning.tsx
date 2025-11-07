import { useEffect, useRef } from 'react'
import { TokenStream } from './TokenStream'
import { Loader2 } from 'lucide-react'
import { AnimatedDetails } from './AnimatedDetails'

interface StreamingReasoningProps {
  reasoning: string
}

export function StreamingReasoning({ reasoning }: StreamingReasoningProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom when reasoning updates
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [reasoning])
  
  return (
    <div className="text-xs mb-2">
      <AnimatedDetails 
        open={true}
        summaryClassName="text-nord3 dark:text-nord4 hover:text-nord10 dark:hover:text-nord8 flex items-center gap-2"
        summary={
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>▸ Thinking...</span>
          </>
        }
      >
        <div 
          ref={containerRef}
          className="reasoning mt-2 overflow-y-auto bg-nord5/30 dark:bg-nord2/30 rounded-lg p-2 border border-nord4/50 dark:border-nord3/50"
          style={{ maxHeight: '9rem' }} // ~6 lines at text-xs
        >
          <TokenStream text={reasoning} autoScroll={true} />
        </div>
      </AnimatedDetails>
    </div>
  )
}

