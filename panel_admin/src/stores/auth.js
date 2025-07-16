import { reactive, ref } from 'vue'
import ApiService from '../services/api.js'

const api = new ApiService()

export const useAuthStore = () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('auth_token'))
  const isAuthenticated = ref(!!token.value)
  const isLoading = ref(false)

  const authState = reactive({
    user: user.value,
    token: token.value,
    isAuthenticated: isAuthenticated.value,
    isLoading: isLoading.value
  })

  const login = async (telegramId) => {
    try {
      isLoading.value = true
      await api.requestAccess(telegramId)
    } catch (error) {
      console.error('Error requesting access:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const verifyCode = async (code) => {
    try {
      isLoading.value = true
      const response = await api.verifyAccess(code)
      
      // Soporta ambos formatos de respuesta
      let userData, tokenData
      if (response.user && response.token) {
        userData = response.user
        tokenData = response.token
      } else if (response.success && response.data) {
        userData = response.data.user
        tokenData = response.data.token
      }
      if (userData && tokenData) {
        localStorage.setItem('auth_token', tokenData)
        localStorage.setItem('user', JSON.stringify(userData))
        user.value = userData
        token.value = tokenData
        isAuthenticated.value = true
        // Actualizar el estado reactivo
        Object.assign(authState, {
          user: userData,
          token: tokenData,
          isAuthenticated: true,
          isLoading: false
        })
      } else {
        throw new Error(response.message || 'Error de verificación')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await api.logout()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      user.value = null
      token.value = null
      isAuthenticated.value = false
      
      // Actualizar el estado reactivo
      Object.assign(authState, {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  const refreshUser = async () => {
    try {
      const response = await api.getProfile()
      if (response.success && response.data) {
        const userData = response.data
        localStorage.setItem('user', JSON.stringify(userData))
        
        user.value = userData
        
        // Actualizar el estado reactivo
        authState.user = userData
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      await logout()
    }
  }

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        
        user.value = userData
        token.value = storedToken
        isAuthenticated.value = true
        
        // Actualizar el estado reactivo
        Object.assign(authState, {
          user: userData,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false
        })
        
        // Verificar que el token sigue siendo válido
        refreshUser()
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        logout()
      }
    } else {
      isLoading.value = false
      authState.isLoading = false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    authState,
    login,
    verifyCode,
    logout,
    refreshUser,
    initializeAuth
  }
} 