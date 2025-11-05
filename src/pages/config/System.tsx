import { useHealth, useWSStatus } from '../../hooks/useConfig'

export default function ConfigSystem() {
  const { data: health } = useHealth()
  const { data: ws } = useWSStatus()
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h1 className="text-lg font-semibold">System Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3">API: <span className={`font-medium ${health?.status==='healthy' ? 'text-green-700' : 'text-amber-700'}`}>{health?.status || 'unknown'}</span></div>
        <div className="border rounded p-3">Redis: <span className="font-medium">{health?.components?.redis?.connected ? 'connected' : 'disconnected'}</span></div>
        <div className="border rounded p-3">WS Clients: <span className="font-medium">{ws?.connected_clients ?? 0}</span></div>
      </div>
    </div>
  )
}


