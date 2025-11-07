import { useState } from 'react'
import { useLLMBackends, useAddLLMBackend, useRemoveLLMBackend } from '../../hooks/useConfig'

export default function ConfigLLM() {
  const { data, isLoading, error } = useLLMBackends()
  const add = useAddLLMBackend()
  const remove = useRemoveLLMBackend()
  const [host, setHost] = useState('')
  const [apiKey, setApiKey] = useState('')
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


