import { useState, useMemo } from 'react'
import { useLLMBackends, useAddLLMBackend, useRemoveLLMBackend } from '../../hooks/useConfig'

export default function ConfigLLM() {
  const { data, isLoading, error } = useLLMBackends()
  const add = useAddLLMBackend()
  const remove = useRemoveLLMBackend()
  const [host, setHost] = useState('')
  const [apiKey, setApiKey] = useState('')

  // Group models by name with their supporting backends
  const modelsByName = useMemo(() => {
    if (!data?.backends) return {}
    
    const grouped: Record<string, string[]> = {}
    
    data.backends.forEach((backend: any) => {
      backend.models.forEach((model: string) => {
        if (!grouped[model]) {
          grouped[model] = []
        }
        grouped[model].push(backend.base_url)
      })
    })
    
    return grouped
  }, [data?.backends])

  const sortedModels = useMemo(() => {
    return Object.keys(modelsByName).sort()
  }, [modelsByName])

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Total: {data?.total_backends ?? 0}</div>
        {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-600">Failed to load</div>}
        <div className="space-y-2">
          {(data?.backends || []).map((b: any, idx: number) => (
            <div key={idx} className="border rounded p-3 flex items-center justify-between dark:border-gray-700 dark:bg-gray-800">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{b.base_url}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{b.models.length} model(s)</div>
              </div>
              <button onClick={() => remove.mutate(b.base_url)} className="btn-danger">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100">Available Models</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Total: {sortedModels.length} unique model{sortedModels.length !== 1 ? 's' : ''}
        </div>
        {sortedModels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedModels.map((modelName) => {
              const backends = modelsByName[modelName]
              const multipleBackends = backends.length > 1
              
              return (
                <div 
                  key={modelName} 
                  className="border rounded-lg p-3 dark:border-nord3 bg-nord6 dark:bg-nord1"
                >
                  <div className="font-mono text-sm font-medium text-nord0 dark:text-nord6 mb-2 break-all">
                    {modelName}
                  </div>
                  
                  {multipleBackends && (
                    <div className="space-y-1">
                      <div className="text-xs text-nord3 dark:text-nord4 font-semibold uppercase tracking-wide">
                        Available on {backends.length} backend{backends.length !== 1 ? 's' : ''}:
                      </div>
                      {backends.map((url, idx) => (
                        <div 
                          key={idx}
                          className="text-xs text-nord10 dark:text-nord8 font-mono pl-2 border-l-2 border-nord8/30"
                        >
                          {url}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!multipleBackends && (
                    <div className="text-xs text-nord3 dark:text-nord4 font-mono">
                      {backends[0]}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            No models available. Add a backend to see available models.
          </div>
        )}
      </div>

      <div className="card p-4">
        <h2 className="text-md font-medium mb-2 text-gray-900 dark:text-gray-100">Add Backend</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="https://api.openai.com/v1" className="input md:col-span-3" />
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="api key" className="input md:col-span-1" />
          <button onClick={() => add.mutate({ host, apiKey })} disabled={!host || !apiKey || add.isPending} className="btn-outline md:col-span-1">Add</button>
        </div>
      </div>
    </div>
  )
}


