import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import Keycloak from 'keycloak-js'
import { configApi } from '../lib/api'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  keycloak: Keycloak | null
  login: () => void
  logout: () => void
  token: string | undefined
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(false)
  const refreshTimerRef = useRef<number | null>(null)

  // Fetch auth config from API
  useEffect(() => {
    let mounted = true

    const checkAuthConfig = async () => {
      try {
        const config = await configApi.getAuthConfig()
        if (!mounted) return

        if (config.keycloak_enabled) {
          setAuthEnabled(true)
          
          // Initialize Keycloak
          const kc = new Keycloak({
            url: config.keycloak_url,
            realm: config.keycloak_realm,
            clientId: config.keycloak_client_id,
          })

          try {
            const authenticated = await kc.init({
              onLoad: 'check-sso',
              checkLoginIframe: false,
              pkceMethod: 'S256',
            })

            if (mounted) {
              setKeycloak(kc)
              setIsAuthenticated(authenticated)
              setIsLoading(false)

              // Setup automatic token refresh
              if (authenticated) {
                setupTokenRefresh(kc)
              }
            }
          } catch (error) {
            console.error('Keycloak initialization failed:', error)
            if (mounted) {
              setIsLoading(false)
            }
          }
        } else {
          // Auth is disabled, proceed without authentication
          if (mounted) {
            setAuthEnabled(false)
            setIsLoading(false)
            setIsAuthenticated(true) // Consider user as authenticated when auth is disabled
          }
        }
      } catch (error) {
        console.error('Failed to fetch auth config:', error)
        // If we can't fetch config, assume auth is disabled to allow access
        if (mounted) {
          setAuthEnabled(false)
          setIsLoading(false)
          setIsAuthenticated(true)
        }
      }
    }

    checkAuthConfig()

    return () => {
      mounted = false
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const setupTokenRefresh = useCallback((kc: Keycloak) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }

    // Refresh token every 30 seconds if needed
    refreshTimerRef.current = window.setInterval(async () => {
      try {
        // Refresh if token expires in less than 70 seconds
        const refreshed = await kc.updateToken(70)
        if (refreshed) {
          console.log('Token refreshed')
        }
      } catch (error) {
        console.error('Failed to refresh token:', error)
        setIsAuthenticated(false)
        // Optionally redirect to login
      }
    }, 30000)
  }, [])

  const login = useCallback(() => {
    if (keycloak) {
      keycloak.login()
    }
  }, [keycloak])

  const logout = useCallback(() => {
    if (keycloak) {
      keycloak.logout()
    }
  }, [keycloak])

  const refreshToken = useCallback(async () => {
    if (keycloak) {
      try {
        await keycloak.updateToken(5)
      } catch (error) {
        console.error('Failed to refresh token:', error)
        setIsAuthenticated(false)
      }
    }
  }, [keycloak])

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    keycloak,
    login,
    logout,
    token: keycloak?.token,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

