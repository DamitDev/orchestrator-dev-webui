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
      <div className="bg-white border rounded-lg p-4">
        <h1 className="text-lg font-semibold mb-2">LLM Backends</h1>
        <div className="text-sm text-gray-600 mb-3">Total: {data?.total_backends ?? 0}</div>
        {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {error && <div className="text-sm text-red-600">Failed to load</div>}
        <div className="space-y-2">
          {(data?.backends || []).map((b: any, idx: number) => (
            <div key={idx} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">{b.base_url}</div>
                <div className="text-xs text-gray-600">{b.models.length} model(s)</div>
              </div>
              <button onClick={() => remove.mutate(b.base_url)} className="px-3 py-1.5 border rounded text-sm text-red-700 hover:bg-red-50">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-md font-medium mb-2">Add Backend</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={host} onChange={e => setHost(e.target.value)} placeholder="https://api.openai.com/v1" className="px-3 py-2 border rounded md:col-span-3" />
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="api key" className="px-3 py-2 border rounded md:col-span-1" />
          <button onClick={() => add.mutate({ host, apiKey })} disabled={!host || !apiKey || add.isPending} className="px-3 py-2 border rounded md:col-span-1">Add</button>
        </div>
      </div>
    </div>
  )
}


