import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type UIMode = 'simple' | 'expert'

interface ModeContextValue {
  mode: UIMode
  setMode: (m: UIMode) => void
  toggle: () => void
}

const ModeContext = createContext<ModeContextValue | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UIMode>(() => {
    const stored = localStorage.getItem('uiMode')
    return (stored === 'expert' || stored === 'simple') ? stored : 'simple'
  })

  useEffect(() => {
    localStorage.setItem('uiMode', mode)
  }, [mode])

  const value = useMemo<ModeContextValue>(() => ({
    mode,
    setMode,
    toggle: () => setMode(prev => prev === 'simple' ? 'expert' : 'simple')
  }), [mode])

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode() {
  const ctx = useContext(ModeContext)
  if (!ctx) throw new Error('useMode must be used within ModeProvider')
  return ctx
}


