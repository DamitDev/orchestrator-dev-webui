import { PropsWithChildren } from 'react'
import { useMode } from './ModeContext'

export function ExpertOnly({ children }: PropsWithChildren) {
  const { mode } = useMode()
  if (mode !== 'expert') return null
  return <>{children}</>
}

export function SimpleOnly({ children }: PropsWithChildren) {
  const { mode } = useMode()
  if (mode !== 'simple') return null
  return <>{children}</>
}


