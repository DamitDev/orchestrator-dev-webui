import { useEffect, useState } from 'react'
import { useMode } from '../state/ModeContext'

export default function Preferences() {
  const { mode, setMode } = useMode()
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'light')
  const [density, setDensity] = useState<string>(() => localStorage.getItem('density') || 'comfortable')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    if (density === 'compact') root.classList.add('density-compact'); else root.classList.remove('density-compact')
    localStorage.setItem('density', density)
  }, [density])
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-2">Default Mode</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode('simple')} className={`px-3 py-2 text-sm rounded-md border ${mode === 'simple' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Simple</button>
          <button onClick={() => setMode('expert')} className={`px-3 py-2 text-sm rounded-md border ${mode === 'expert' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Expert</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-2">Theme</h2>
        <div className="flex gap-2">
          <button onClick={() => setTheme('light')} className={`px-3 py-2 text-sm rounded-md border ${theme === 'light' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Light</button>
          <button onClick={() => setTheme('dark')} className={`px-3 py-2 text-sm rounded-md border ${theme === 'dark' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Dark</button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-medium mb-2">Density</h2>
        <div className="flex gap-2">
          <button onClick={() => setDensity('comfortable')} className={`px-3 py-2 text-sm rounded-md border ${density === 'comfortable' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Comfortable</button>
          <button onClick={() => setDensity('compact')} className={`px-3 py-2 text-sm rounded-md border ${density === 'compact' ? 'bg-primary-600 text-white border-primary-600' : 'hover:bg-gray-50'}`}>Compact</button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Compact density will be applied to global UI gradually.</p>
      </div>
    </div>
  )
}


