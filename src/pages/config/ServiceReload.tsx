import { useReloadStatus, useReloadServices } from '../../hooks/useConfig'

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  
  if (diffMinutes < -60) {
    const hours = Math.round(-diffMinutes / 60)
    return `${hours}h ago`
  }
  if (diffMinutes < 0) return `${-diffMinutes}m ago`
  if (diffMinutes < 60) return `in ${diffMinutes}m`
  const hours = Math.round(diffMinutes / 60)
  return `in ${hours}h`
}

export default function ConfigServiceReload() {
  const { data: reloadStatus, isLoading } = useReloadStatus()
  const reloadServices = useReloadServices()

  if (isLoading) {
    return <div className="text-nord3 dark:text-nord4">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-nord3 dark:text-nord4">
        Reload MCP servers and LLM backends to refresh available tools and models.
        This is useful when new tools or models have been deployed.
      </p>

      {/* Status Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-nord6/50 dark:bg-nord1/50 rounded-lg p-4">
          <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide">Auto Reload</div>
          <div className="text-lg font-semibold text-nord0 dark:text-nord6 mt-1">
            {reloadStatus?.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div className="bg-nord6/50 dark:bg-nord1/50 rounded-lg p-4">
          <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide">Interval</div>
          <div className="text-lg font-semibold text-nord0 dark:text-nord6 mt-1">
            {reloadStatus?.interval_hours || 1} hour(s)
          </div>
        </div>
        <div className="bg-nord6/50 dark:bg-nord1/50 rounded-lg p-4">
          <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide">Last Reload</div>
          <div className="text-lg font-semibold text-nord0 dark:text-nord6 mt-1">
            {reloadStatus?.last_reload ? formatRelativeTime(reloadStatus.last_reload) : 'Never'}
          </div>
        </div>
        <div className="bg-nord6/50 dark:bg-nord1/50 rounded-lg p-4">
          <div className="text-xs text-nord3 dark:text-nord4 uppercase tracking-wide">Next Reload</div>
          <div className="text-lg font-semibold text-nord0 dark:text-nord6 mt-1">
            {reloadStatus?.next_scheduled_reload ? formatRelativeTime(reloadStatus.next_scheduled_reload) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Manual Reload */}
      <div className="border-t border-nord5 dark:border-nord2 pt-6">
        <h3 className="text-sm font-medium text-nord0 dark:text-nord6 mb-3">Manual Reload</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => reloadServices.mutate()}
            disabled={reloadServices.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {reloadServices.isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Reloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Services
              </>
            )}
          </button>
          
          {reloadServices.isSuccess && reloadServices.data && (
            <div className="text-sm text-nord14">
              Success: {reloadServices.data.llm_backends.refreshed}/{reloadServices.data.llm_backends.total} LLM backends, {reloadServices.data.mcp_servers.refreshed}/{reloadServices.data.mcp_servers.total} MCP servers
            </div>
          )}
          
          {reloadServices.isError && (
            <div className="text-sm text-nord11">
              Reload failed. Please try again.
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-nord3 dark:text-nord4 bg-nord6/30 dark:bg-nord1/30 rounded-lg p-4">
        <strong>What gets reloaded:</strong>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>LLM Backends - Refreshes the list of available models</li>
          <li>MCP Servers - Re-fetches OpenAPI specs to update available tools</li>
          <li>Slot MCP Servers - Re-discovers tools from AgentVM slots</li>
        </ul>
      </div>
    </div>
  )
}
