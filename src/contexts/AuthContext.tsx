import React, { createContext, useContext, useState, useEffect } from 'react'
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

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        
        // Initialize Keycloak
        const { authenticated, keycloakInstance } = await initKeycloak()
        
        const enabled = isKeycloakEnabled()
        setKeycloakEnabled(enabled)
        setKeycloak(keycloakInstance)

        if (enabled && keycloakInstance) {
          // Keycloak is enabled
          setIsAuthenticated(authenticated)
          if (authenticated) {
            setUserInfo(getUserInfo())
          }
        } else {
          // Keycloak is disabled, allow access without authentication
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error)
        // On error, check if Keycloak is enabled
        // If not enabled, allow access; if enabled, don't authenticate
        const enabled = isKeycloakEnabled()
        setKeycloakEnabled(enabled)
        if (!enabled) {
          setIsAuthenticated(true)
        }
      } finally {
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

