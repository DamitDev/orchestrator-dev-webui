import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import Keycloak from 'keycloak-js'
import {
  initKeycloak,
  isKeycloakEnabled,
  getUserInfo,
  logout as keycloakLogout,
  login as keycloakLogin,
} from '../lib/keycloak'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  keycloakEnabled: boolean
  keycloak: Keycloak | null
  userInfo: {
    username?: string
    email?: string
    name?: string
  }
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [keycloakEnabled, setKeycloakEnabled] = useState(false)
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null)
  const [userInfo, setUserInfo] = useState<{
    username?: string
    email?: string
    name?: string
  }>({})
  
  // Use ref to prevent re-initialization across re-renders and StrictMode
  const initializationAttempted = useRef(false)

  useEffect(() => {
    const initialize = async () => {
      // Prevent double initialization using ref
      if (initializationAttempted.current) {
        console.log('[AuthContext] Already attempted initialization, skipping')
        return
      }
      initializationAttempted.current = true
      
      try {
        console.log('[AuthContext] Starting authentication initialization...')
        setIsLoading(true)
        
        // Initialize Keycloak
        console.log('[AuthContext] Calling initKeycloak()...')
        const { authenticated, keycloakInstance } = await initKeycloak()
        console.log('[AuthContext] initKeycloak() returned:', { authenticated, hasInstance: !!keycloakInstance })
        
        const enabled = isKeycloakEnabled()
        console.log('[AuthContext] Keycloak enabled:', enabled)
        setKeycloakEnabled(enabled)
        setKeycloak(keycloakInstance)

        if (enabled && keycloakInstance) {
          // Keycloak is enabled
          console.log('[AuthContext] Setting authenticated state to:', authenticated)
          setIsAuthenticated(authenticated)
          if (authenticated) {
            const userInfo = getUserInfo()
            console.log('[AuthContext] User info:', userInfo)
            setUserInfo(userInfo)
          }
        } else {
          // Keycloak is disabled, allow access without authentication
          console.log('[AuthContext] Keycloak disabled, allowing access')
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('[AuthContext] Authentication initialization failed:', error)
        console.error('[AuthContext] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        
        // Check if it's a NetworkError (Keycloak server unreachable)
        if (error instanceof TypeError && error.message.includes('NetworkError')) {
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.error('❌ KEYCLOAK SERVER UNREACHABLE')
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.error('The frontend cannot connect to the Keycloak server.')
          console.error('')
          console.error('To fix this issue:')
          console.error('1. Verify Keycloak URL is correct in backend .env file')
          console.error('2. Check if Keycloak server is running and accessible')
          console.error('3. Add http://localhost:5173 to "Web Origins" in Keycloak client settings')
          console.error('4. Or temporarily disable Keycloak by removing env vars from backend')
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }
        
        // On error, check if Keycloak is enabled
        const enabled = isKeycloakEnabled()
        setKeycloakEnabled(enabled)
        if (!enabled) {
          console.log('[AuthContext] Error occurred but Keycloak disabled, allowing access')
          setIsAuthenticated(true)
        } else {
          console.log('[AuthContext] Error occurred and Keycloak enabled, staying unauthenticated')
          // Don't authenticate but set loading to false to show error state
          setIsAuthenticated(false)
        }
      } finally {
        console.log('[AuthContext] Authentication initialization complete')
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  const login = () => {
    if (keycloakEnabled && keycloak) {
      keycloakLogin()
    }
  }

  const logout = () => {
    if (keycloakEnabled && keycloak) {
      keycloakLogout()
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    keycloakEnabled,
    keycloak,
    userInfo,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

