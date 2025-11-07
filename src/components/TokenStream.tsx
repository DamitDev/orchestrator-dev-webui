import { useEffect, useRef } from 'react'

interface TokenStreamProps {
  text: string
  autoScroll?: boolean
}

export function TokenStream({ text, autoScroll = false }: TokenStreamProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  
  // Split text into tokens (words and punctuation)
  // This regex preserves spaces and punctuation as separate tokens
  const tokens = text.match(/\S+|\s+/g) || []
  
  // Auto-scroll to the end when new tokens arrive
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      const container = containerRef.current
      const parent = container.parentElement
      if (parent && parent.scrollHeight > parent.clientHeight) {
        parent.scrollTop = parent.scrollHeight
      }
    }
  }, [text, autoScroll])
  
  return (
    <span ref={containerRef} className="inline">
      {tokens.map((token, index) => (
        <span
          key={`token-${index}`}
          className="token-stream inline"
          style={{
            // Each token animates independently with no delay
            // The wave effect comes from tokens arriving over time via WebSocket
            animationDelay: '0ms'
          }}
        >
          {token}
        </span>
      ))}
    </span>
  )
}

