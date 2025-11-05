import { useState } from 'react'
import { useTaskHandlerStatus, useSetMaxConcurrent } from '../../hooks/useConfig'

export default function ConfigTaskHandler() {
  const { data, isLoading, error } = useTaskHandlerStatus()
  const setMax = useSetMaxConcurrent()
  const [value, setValue] = useState('')
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h1 className="text-lg font-semibold">Task Handler</h1>
      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="border rounded p-3">Running: <span className="font-medium">{String(data.running)}</span></div>
          <div className="border rounded p-3">Max concurrent: <span className="font-medium">{data.max_concurrent_tasks}</span></div>
          <div className="border rounded p-3">Current running: <span className="font-medium">{data.current_running_tasks}</span></div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Set max concurrent" className="px-3 py-2 border rounded" />
        <button onClick={() => value && setMax.mutate(parseInt(value))} disabled={!value || setMax.isPending} className="px-3 py-2 border rounded">Update</button>
      </div>
    </div>
  )
}


