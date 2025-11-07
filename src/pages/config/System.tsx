import { useHealth, useWSStatus } from '../../hooks/useConfig'

export default function ConfigSystem() {
  const { data: health } = useHealth()
  const { data: ws } = useWSStatus()
  return (
    <div className="card p-4 space-y-3">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="border-2 border-nord14/30 rounded-lg p-3 dark:border-nord14/20 bg-nord14/5 dark:bg-nord14/5">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">API Status</div>
          <div className={`text-xl font-bold ${health?.status==='healthy' ? 'text-nord14 dark:text-nord14' : 'text-nord13 dark:text-nord13'}`}>
            {health?.status || 'unknown'}
          </div>
        </div>
        <div className="border-2 border-nord13/30 rounded-lg p-3 dark:border-nord13/20 bg-nord13/5 dark:bg-nord13/5">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Redis</div>
          <div className={`text-xl font-bold ${health?.components?.redis?.connected ? 'text-nord14 dark:text-nord14' : 'text-nord11 dark:text-nord11'}`}>
            {health?.components?.redis?.connected ? 'connected' : 'disconnected'}
          </div>
        </div>
        <div className="border-2 border-nord10/30 rounded-lg p-3 dark:border-nord10/20 bg-nord10/5 dark:bg-nord10/5">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">WebSocket Clients</div>
          <div className="text-2xl font-bold text-nord10 dark:text-nord10">{ws?.connected_clients ?? 0}</div>
        </div>
      </div>
    </div>
  )
}


