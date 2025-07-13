import { useState, useEffect, createContext, useContext } from 'react'
import { User, AuthState } from '../types'
import apiService from '../services/api'

interface AuthContextType extends AuthState {
  login: (telegramId: string) => Promise<void>
  verifyCode: (code: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
        
        // Verificar que el token sigue siendo válido
        refreshUser()
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const login = async (telegramId: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      await apiService.requestAccess(telegramId)
    } catch (error) {
      console.error('Error requesting access:', error)
      throw error
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const verifyCode = async (code: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      const response = await apiService.verifyAccess(code)
      
      if (response.success && response.data) {
        const { user, token } = response.data
        
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        throw new Error(response.message || 'Error de verificación')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      throw error
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const logout = async () => {
    try {
      if (authState.token) {
        await apiService.logout()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiService.getProfile()
      if (response.success && response.data) {
        const user = response.data
        localStorage.setItem('user', JSON.stringify(user))
        setAuthState(prev => ({
          ...prev,
          user,
        }))
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      // Si hay error al refrescar, hacer logout
      await logout()
    }
  }

  const value: AuthContextType = {
    ...authState,
    login,
    verifyCode,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 