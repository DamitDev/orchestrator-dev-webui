import { useAuthConfig } from '../../hooks/useConfig'

export default function ConfigAuth() {
  const { data, isLoading, error } = useAuthConfig()
  return (
    <div className="card p-4 space-y-3">
      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      <div className="text-sm text-gray-800 dark:text-gray-200">
        <div className="mb-3">
          Keycloak enabled: <span className={`font-bold text-lg ${data?.keycloak_enabled ? 'text-nord11 dark:text-nord11' : 'text-nord3 dark:text-nord4'}`}>
            {String(data?.keycloak_enabled ?? false)}
          </span>
        </div>
        {data?.keycloak_enabled && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="border-2 border-nord11/20 rounded-lg p-3 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">URL</div>
              <div className="font-mono text-xs text-nord11 dark:text-nord11 break-all">{data.keycloak_url}</div>
            </div>
            <div className="border-2 border-nord11/20 rounded-lg p-3 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Realm</div>
              <div className="font-mono text-xs text-nord11 dark:text-nord11">{data.keycloak_realm}</div>
            </div>
            <div className="border-2 border-nord11/20 rounded-lg p-3 dark:border-nord11/20 bg-nord11/5 dark:bg-nord11/5">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Client ID</div>
              <div className="font-mono text-xs text-nord11 dark:text-nord11">{data.keycloak_client_id}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


