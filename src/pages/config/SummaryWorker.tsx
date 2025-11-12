import { useEffect } from 'react'
import { useSummaryWorkerStatus } from '../../hooks/useConfig'
import { useQueryClient } from '@tanstack/react-query'
import { configKeys } from '../../hooks/useConfig'
import { useWebSocket } from '../../ws/WebSocketProvider'
import type { SummaryWorkerStatusEvent } from '../../types/api'

function formatUptime(seconds: number | null): string {
  if (seconds === null) return 'N/A'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

export default function ConfigSummaryWorker() {
  const { data, isLoading, error } = useSummaryWorkerStatus()
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe } = useWebSocket()

  // Listen for summary_worker_status WebSocket events
  useEffect(() => {
    const subId = subscribe((event: any) => {
      if (event.event_type === 'summary_worker_status') {
        const statusEvent = event as SummaryWorkerStatusEvent
        // Update the cached data immediately
        queryClient.setQueryData(configKeys.summaryWorker, statusEvent.data)
      }
    }, { eventTypes: ['summary_worker_status'] })

    return () => unsubscribe(subId)
  }, [subscribe, unsubscribe, queryClient])

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">Failed to load summary worker status</div>
      )}
      {data && (
        <>
          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {/* Status */}
            <div
              className={`border-2 rounded-lg p-3 ${
                data.running
                  ? 'border-nord14/30 dark:border-nord14/20 bg-nord14/5 dark:bg-nord14/5'
                  : 'border-nord11/30 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5'
              }`}
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Status
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    data.running ? 'bg-nord14 dark:bg-nord14' : 'bg-nord11 dark:bg-nord11'
                  }`}
                ></div>
                <div
                  className={`text-xl font-bold ${
                    data.running ? 'text-nord14 dark:text-nord14' : 'text-nord11 dark:text-nord11'
                  }`}
                >
                  {data.running ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="border-2 border-nord9/30 rounded-lg p-3 dark:border-nord9/20 bg-nord9/5 dark:bg-nord9/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Uptime
              </div>
              <div className="text-2xl font-bold text-nord9 dark:text-nord9">
                {formatUptime(data.uptime_seconds)}
              </div>
            </div>

            {/* Max Concurrent */}
            <div className="border-2 border-nord8/30 rounded-lg p-3 dark:border-nord8/20 bg-nord8/5 dark:bg-nord8/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Max Concurrent
              </div>
              <div className="text-2xl font-bold text-nord8 dark:text-nord8">
                {data.max_concurrent_summaries}
              </div>
            </div>

            {/* Processed */}
            <div className="border-2 border-nord7/30 rounded-lg p-3 dark:border-nord7/20 bg-nord7/5 dark:bg-nord7/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Processed
              </div>
              <div className="text-2xl font-bold text-nord7 dark:text-nord7">
                {data.processed_count}
              </div>
            </div>
          </div>

          {/* Queue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {/* Pending */}
            <div className="border-2 border-nord10/30 rounded-lg p-3 dark:border-nord10/20 bg-nord10/5 dark:bg-nord10/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Currently Processing
              </div>
              <div className="text-2xl font-bold text-nord10 dark:text-nord10">
                {data.pending_count}
              </div>
            </div>

            {/* Queue Size */}
            <div className="border-2 border-nord13/30 rounded-lg p-3 dark:border-nord13/20 bg-nord13/5 dark:bg-nord13/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Queue Size
              </div>
              <div className="text-2xl font-bold text-nord13 dark:text-nord13">
                {data.queue_size}
              </div>
            </div>

            {/* Queued Total */}
            <div className="border-2 border-nord15/30 rounded-lg p-3 dark:border-nord15/20 bg-nord15/5 dark:bg-nord15/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Queued (Total)
              </div>
              <div className="text-2xl font-bold text-nord15 dark:text-nord15">
                {data.queued_count}
              </div>
            </div>

            {/* Errors */}
            <div
              className={`border-2 rounded-lg p-3 ${
                data.error_count > 0
                  ? 'border-nord11/30 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5'
                  : 'border-nord4/30 dark:border-nord4/20 bg-nord4/5 dark:bg-nord4/5'
              }`}
            >
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Errors
              </div>
              <div
                className={`text-2xl font-bold ${
                  data.error_count > 0
                    ? 'text-nord11 dark:text-nord11'
                    : 'text-nord4 dark:text-nord4'
                }`}
              >
                {data.error_count}
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-nord4/5 dark:bg-nord3/10 rounded-lg border border-nord4/20 dark:border-nord3/20">
            <p className="mb-1">
              <strong>AI Summary Worker</strong> generates AI-powered summaries for
              reasoning, tool calls, and tool outputs in real-time.
            </p>
            <p className="text-xs opacity-80">
              Status updates every 5 seconds via polling and WebSocket events.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

