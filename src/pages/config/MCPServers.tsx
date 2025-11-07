import { useState } from 'react'
import { useMCPServers, useAddMCPServer, useRemoveMCPServer } from '../../hooks/useConfig'

export default function ConfigMCP() {
  const { data, isLoading, error } = useMCPServers()
  const add = useAddMCPServer()
  const remove = useRemoveMCPServer()
  const [host, setHost] = useState('')
  const [apiKey, setApiKey] = useState('')
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Total: <span className="font-bold text-lg text-nord14 dark:text-nord14">{data?.total_servers ?? 0}</span>
        </div>
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600">Failed to load</div>}
        <div className="space-y-3">
          {(data?.servers || []).map((s: any, idx: number) => {
            return (
              <div key={idx} className="border rounded-lg p-4 dark:border-nord3 bg-nord6 dark:bg-nord1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-nord0 dark:text-nord6 mb-1">
                      {s.name || s.base_url}
                    </div>
                    <div className="text-xs text-nord3 dark:text-nord4 font-mono mb-2">
                      {s.base_url}
                    </div>
                    {s.description && (
                      <div className="text-sm text-nord3 dark:text-nord4 mb-2 italic">
                        {s.description}
                      </div>
                    )}
                    <div className="text-xs text-nord14 dark:text-nord14 font-medium">
                      <span className="font-bold">{s.tools.length}</span> tool{s.tools.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                  <button onClick={() => remove.mutate(s.base_url)} className="btn-danger text-sm">
                    Remove
                  </button>
                </div>
                
                {s.tools.length > 0 && (
                  <div className="border-t border-nord4 dark:border-nord3 pt-3">
                    <div className="text-xs font-semibold text-nord3 dark:text-nord4 uppercase tracking-wide mb-2">
                      Tools
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.tools.map((tool: string, toolIdx: number) => (
                        <span 
                          key={toolIdx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-nord8/10 text-nord10 border border-nord8/20 dark:bg-nord8/5 dark:text-nord8 dark:border-nord8/10"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">Add Server</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="http://localhost:8000/" className="input md:col-span-3" />
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="api key" className="input md:col-span-1" />
          <button onClick={() => add.mutate({ host, apiKey })} disabled={!host || add.isPending} className="btn-outline md:col-span-1">Add</button>
        </div>
      </div>
    </div>
  )
}


