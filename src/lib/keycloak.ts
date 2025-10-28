import Keycloak from 'keycloak-js'
import axios from 'axios'

// Auth configuration fetched from backend
export interface AuthConfig {
  keycloak_enabled: boolean
  keycloak_url: string | null
  keycloak_realm: string | null
  keycloak_client_id: string | null
}

// Keycloak instance (singleton)
let keycloakInstance: Keycloak | null = null
let authConfig: AuthConfig | null = null

/**
 * Fetch authentication configuration from the backend
 */
export async function fetchAuthConfig(): Promise<AuthConfig> {
  if (authConfig) {
    return authConfig
  }

  try {
    // Get API URL from environment or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://oapi.iris.work/uat'
    const response = await axios.get<AuthConfig>(`${apiUrl}/auth/config`)
    authConfig = response.data
    return authConfig
  } catch (error) {
    console.error('Failed to fetch auth config:', error)
    // Default to disabled if we can't reach the backend
    authConfig = {
      keycloak_enabled: false,
      keycloak_url: null,
      keycloak_realm: null,
      keycloak_client_id: null,
    }
    return authConfig
  }
}

/**
 * Initialize Keycloak instance
 */
export async function initKeycloak(): Promise<{
  authenticated: boolean
  keycloakInstance: Keycloak | null
}> {
  const config = await fetchAuthConfig()

  // If Keycloak is not enabled, return immediately
  if (!config.keycloak_enabled || !config.keycloak_url || !config.keycloak_realm || !config.keycloak_client_id) {
    console.log('Keycloak authentication is disabled')
    return { authenticated: false, keycloakInstance: null }
  }

  // Create Keycloak instance
  keycloakInstance = new Keycloak({
    url: config.keycloak_url,
    realm: config.keycloak_realm,
    clientId: config.keycloak_client_id,
  })

  try {
    // Initialize Keycloak with login-required
    const authenticated = await keycloakInstance.init({
      onLoad: 'login-required', // Automatically redirect to login if not authenticated
      checkLoginIframe: false, // Disable iframe check for better compatibility
      pkceMethod: 'S256', // Use PKCE for security
    })

    console.log('Keycloak initialized, authenticated:', authenticated)

    // Setup token refresh
    if (authenticated) {
      setupTokenRefresh()
    }

    return { authenticated, keycloakInstance }
  } catch (error) {
    console.error('Keycloak initialization failed:', error)
    throw error
  }
}

/**
 * Setup automatic token refresh
 */
function setupTokenRefresh() {
  if (!keycloakInstance) return

  // Update token every 60 seconds
  setInterval(() => {
    keycloakInstance
      ?.updateToken(70) // Refresh if token expires in less than 70 seconds
      .then((refreshed) => {
        if (refreshed) {
          console.log('Token was successfully refreshed')
        }
      })
      .catch(() => {
        console.error('Failed to refresh token, redirecting to login')
        keycloakInstance?.login()
      })
  }, 60000) // Check every 60 seconds
}

/**
 * Get current access token
 */
export function getToken(): string | undefined {
  return keycloakInstance?.token
}

/**
 * Get Keycloak instance
 */
export function getKeycloakInstance(): Keycloak | null {
  return keycloakInstance
}

/**
 * Check if Keycloak is enabled
 */
export function isKeycloakEnabled(): boolean {
  return authConfig?.keycloak_enabled ?? false
}

/**
 * Get user information from token
 */
export function getUserInfo(): {
  username?: string
  email?: string
  name?: string
} {
  if (!keycloakInstance?.tokenParsed) {
    return {}
  }

  const tokenParsed = keycloakInstance.tokenParsed as any
  return {
    username: tokenParsed.preferred_username,
    email: tokenParsed.email,
    name: tokenParsed.name,
  }
}

/**
 * Logout from Keycloak
 */
export function logout(): void {
  if (keycloakInstance) {
    keycloakInstance.logout({
      redirectUri: window.location.origin,
    })
  }
}

/**
 * Login to Keycloak (redirect to login page)
 */
export function login(): void {
  if (keycloakInstance) {
    keycloakInstance.login()
  }
}

