import { useState, useRef, useEffect, ReactNode } from 'react'

interface AnimatedDetailsProps {
  open?: boolean
  defaultOpen?: boolean
  summary: ReactNode
  children: ReactNode
  className?: string
  summaryClassName?: string
  onToggle?: (isOpen: boolean) => void
}

export function AnimatedDetails({ 
  open: controlledOpen,
  defaultOpen = false,
  summary, 
  children, 
  className = '',
  summaryClassName = '',
  onToggle
}: AnimatedDetailsProps) {
  // Determine if this is a controlled component
  const isControlled = controlledOpen !== undefined
  
  // Internal state for uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(isControlled ? controlledOpen : defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Use controlled value if provided, otherwise use internal state
  const isOpen = isControlled ? controlledOpen : internalOpen
  
  // Sync shouldRender with controlled open prop
  useEffect(() => {
    if (isControlled) {
      if (controlledOpen) {
        setShouldRender(true)
      } else if (!isAnimating) {
        // Delay hiding until animation completes
        const timer = setTimeout(() => setShouldRender(false), 300)
        return () => clearTimeout(timer)
      }
    }
  }, [controlledOpen, isControlled, isAnimating])
  
  const toggle = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    const newOpenState = !isOpen
    
    if (newOpenState) {
      // Opening
      setShouldRender(true)
      requestAnimationFrame(() => {
        if (!isControlled) {
          setInternalOpen(true)
        }
        setTimeout(() => setIsAnimating(false), 300)
      })
    } else {
      // Closing
      if (!isControlled) {
        setInternalOpen(false)
      }
      setTimeout(() => {
        if (!isControlled) {
          setShouldRender(false)
        }
        setIsAnimating(false)
      }, 300) // Match animation duration
    }
    
    // Call onToggle callback if provided
    if (onToggle) {
      onToggle(newOpenState)
    }
  }
  
  return (
    <div className={`animated-details overflow-hidden ${className}`}>
      <div 
        onClick={toggle}
        className={`cursor-pointer select-none transition-all duration-200 hover:translate-x-0.5 ${summaryClassName}`}
      >
        {summary}
      </div>
      
      {shouldRender && (
        <div 
          ref={contentRef}
          className={`animated-details-content overflow-hidden ${isOpen ? 'opening' : 'closing'}`}
          style={{
            animation: isOpen 
              ? 'slideDownFade 0.3s ease-out forwards' 
              : 'slideUpFade 0.3s ease-out forwards'
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

