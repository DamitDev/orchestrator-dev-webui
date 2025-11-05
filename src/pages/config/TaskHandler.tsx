import { useState } from 'react'
import { useTaskHandlerStatus, useSetMaxConcurrent } from '../../hooks/useConfig'

export default function ConfigTaskHandler() {
  const { data, isLoading, error } = useTaskHandlerStatus()
  const setMax = useSetMaxConcurrent()
  const [value, setValue] = useState('')
  return (
    <div className="card p-4 space-y-3">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Handler</h1>
      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">Running: <span className="font-medium">{String(data.running)}</span></div>
          <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">Max concurrent: <span className="font-medium">{data.max_concurrent_tasks}</span></div>
          <div className="border rounded p-3 dark:border-gray-700 dark:bg-gray-800">Current running: <span className="font-medium">{data.current_running_tasks}</span></div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Set max concurrent" className="input" />
        <button onClick={() => value && setMax.mutate(parseInt(value))} disabled={!value || setMax.isPending} className="btn-outline">Update</button>
      </div>
    </div>
  )
}


