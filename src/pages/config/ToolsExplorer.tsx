import { useMemo, useState } from 'react'
import { useToolsAll } from '../../hooks/useConfig'

export default function ConfigTools() {
  const { data, isLoading, error } = useToolsAll()
  const [q, setQ] = useState('')
  const tools = data?.tools || []
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return tools
    return tools.filter((t: any) => t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || String(t.server).toLowerCase().includes(s))
  }, [tools, q])
  const byServer = useMemo(() => {
    const map: Record<string, any[]> = {}
    filtered.forEach((t: any) => {
      map[t.server] = map[t.server] || []
      map[t.server].push(t)
    })
    return map
  }, [filtered])
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Tools Explorer</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Total: {data?.total_tools ?? 0}</div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools" className="input w-full" />
      </div>
      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      <div className="space-y-3">
        {Object.entries(byServer).map(([server, list]) => (
          <div key={server} className="card">
            <div className="px-3 py-2 border-b bg-gray-50 text-sm text-gray-700 flex items-center gap-2 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700">
              <span className="font-medium">{server === 'builtin' ? 'Built-in' : server}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({(list as any[]).length} tools)</span>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {(list as any[]).map((t: any, idx: number) => (
                <div key={idx} className="px-3 py-2 text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.name}</div>
                  <div className="text-gray-600 dark:text-gray-400 text-xs">{t.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


