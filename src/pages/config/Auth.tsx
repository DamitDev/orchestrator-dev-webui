import { useAuthConfig } from '../../hooks/useConfig'

export default function ConfigAuth() {
  const { data, isLoading, error } = useAuthConfig()
  return (
    <div className="card p-4 space-y-3">
      {isLoading && <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      <div className="text-sm text-gray-800 dark:text-gray-200">
        <div>Keycloak enabled: <span className="font-medium">{String(data?.keycloak_enabled ?? false)}</span></div>
        {data?.keycloak_enabled && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="border rounded p-2 dark:border-gray-700 dark:bg-gray-800">URL: <span className="font-mono">{data.keycloak_url}</span></div>
            <div className="border rounded p-2 dark:border-gray-700 dark:bg-gray-800">Realm: <span className="font-mono">{data.keycloak_realm}</span></div>
            <div className="border rounded p-2 dark:border-gray-700 dark:bg-gray-800">Client ID: <span className="font-mono">{data.keycloak_client_id}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}


