import { useState } from 'react'
import { useTaskHandlerStatus, useSetMaxConcurrent } from '../../hooks/useConfig'

export default function ConfigTaskHandler() {
  const { data, isLoading, error } = useTaskHandlerStatus()
  const setMax = useSetMaxConcurrent()
  const [value, setValue] = useState('')
  return (
    <div className="card p-4 space-y-3">
      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className={`border-2 rounded-lg p-3 ${data.running ? 'border-nord14/30 dark:border-nord14/20 bg-nord14/5 dark:bg-nord14/5' : 'border-nord11/30 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5'}`}>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${data.running ? 'bg-nord14 dark:bg-nord14' : 'bg-nord11 dark:bg-nord11'}`}></div>
              <div className={`text-xl font-bold ${data.running ? 'text-nord14 dark:text-nord14' : 'text-nord11 dark:text-nord11'}`}>
                {data.running ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
          <div className="border-2 border-nord9/30 rounded-lg p-3 dark:border-nord9/20 bg-nord9/5 dark:bg-nord9/5">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Concurrent</div>
            <div className="text-2xl font-bold text-nord9 dark:text-nord9">{data.max_concurrent_tasks}</div>
          </div>
          <div className="border-2 border-nord8/30 rounded-lg p-3 dark:border-nord8/20 bg-nord8/5 dark:bg-nord8/5">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Tasks</div>
            <div className="text-2xl font-bold text-nord8 dark:text-nord8">{data.current_running_tasks ?? 0}</div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => setValue(e.target.value)} placeholder="Set max concurrent" className="input" />
        <button onClick={() => value && setMax.mutate(parseInt(value))} disabled={!value || setMax.isPending} className="btn-outline">Update</button>
      </div>
    </div>
  )
}


