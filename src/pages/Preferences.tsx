import { useMode } from '../state/ModeContext'

export default function Preferences() {
  const { mode, setMode } = useMode()
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
    </div>
  )
}


