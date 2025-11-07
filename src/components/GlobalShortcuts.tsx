import { useEffect } from 'react'

export default function GlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only intercept "/" if user is not typing in an input/textarea
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      if (e.key === '/' && !isTyping) {
        const evt = new CustomEvent('focus-search')
        window.dispatchEvent(evt)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return null
}


