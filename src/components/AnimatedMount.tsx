import { useState, useEffect, useRef, ReactNode, CSSProperties } from 'react'

interface AnimatedMountProps {
  show: boolean
  children: ReactNode
  duration?: number
  skipInitialAnimation?: boolean
}

export function AnimatedMount({ 
  show, 
  children, 
  duration = 300,
  skipInitialAnimation = false
}: AnimatedMountProps) {
  const [shouldRender, setShouldRender] = useState(show)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationState, setAnimationState] = useState<'entering' | 'entered' | 'exiting' | 'exited'>('exited')
  const isInitialMount = useRef(true)
  
  useEffect(() => {
    // Skip animation on initial mount if requested (for always-visible panels)
    if (isInitialMount.current && skipInitialAnimation) {
      isInitialMount.current = false
      if (show) {
        setShouldRender(true)
        setAnimationState('entered')
      }
      return
    }
    
    isInitialMount.current = false
    
    if (show && !shouldRender) {
      // Mounting - start enter animation
      setShouldRender(true)
      setAnimationState('entering')
      setIsAnimating(true)
      
      // Use RAF to trigger the transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationState('entered')
        })
      })
      
      // After duration, mark as not animating
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, duration)
      return () => clearTimeout(timer)
    } else if (!show && shouldRender) {
      // Unmounting - start exit animation
      setAnimationState('exiting')
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setShouldRender(false)
        setAnimationState('exited')
        setIsAnimating(false)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, shouldRender, duration, skipInitialAnimation])
  
  if (!shouldRender) return null
  
  // Determine styles based on animation state
  const getStyles = (): CSSProperties => {
    let styles: CSSProperties
    
    if (animationState === 'entering') {
      // Initial state - NO TRANSITION yet, just set the starting position
      styles = {
        opacity: 0,
        transform: 'translateY(20px)',
      }
    } else if (animationState === 'entered') {
      // Final state - NOW apply transition to animate from entering to entered
      styles = {
        transition: `all ${duration}ms ease-out`,
        opacity: 1,
        transform: 'translateY(0)',
      }
    } else if (animationState === 'exiting') {
      // Exiting state - transition to hidden
      styles = {
        transition: `all ${duration}ms ease-out`,
        opacity: 0,
        transform: 'translateY(20px)',
      }
    } else {
      // Default state
      styles = {
        opacity: 1,
        transform: 'translateY(0)',
      }
    }
    
    return styles
  }
  
  return (
    <div style={getStyles()}>
      {children}
    </div>
  )
}

