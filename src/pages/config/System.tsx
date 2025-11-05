import { useHealth, useWSStatus } from '../../hooks/useConfig'

export default function ConfigSystem() {
  const { data: health } = useHealth()
  const { data: ws } = useWSStatus()
  return (
    <div className="card p-4 space-y-3">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">API: <span className={`${health?.status==='healthy' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'} font-medium`}>{health?.status || 'unknown'}</span></div>
        <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">Redis: <span className="font-medium">{health?.components?.redis?.connected ? 'connected' : 'disconnected'}</span></div>
        <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">WS Clients: <span className="font-medium">{ws?.connected_clients ?? 0}</span></div>
      </div>
    </div>
  )
}


