import { useAuthConfig } from '../../hooks/useConfig'

export default function ConfigAuth() {
  const { data, isLoading, error } = useAuthConfig()
  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <h1 className="text-lg font-semibold">Auth</h1>
      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">Failed to load</div>}
      <div className="text-sm">
        <div>Keycloak enabled: <span className="font-medium">{String(data?.keycloak_enabled ?? false)}</span></div>
        {data?.keycloak_enabled && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="border rounded p-2">URL: <span className="font-mono">{data.keycloak_url}</span></div>
            <div className="border rounded p-2">Realm: <span className="font-mono">{data.keycloak_realm}</span></div>
            <div className="border rounded p-2">Client ID: <span className="font-mono">{data.keycloak_client_id}</span></div>
          </div>
        )}
      </div>
    </div>
  )
}


