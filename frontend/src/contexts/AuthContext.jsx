import { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export const AuthContext = createContext()

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
}

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await authAPI.getMe()
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: response.data.user,
              token
            }
          })
        } catch (error) {
          localStorage.removeItem('token')
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error.response?.data?.message || 'Authentication failed'
          })
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: null })
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authAPI.login(email, password)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      toast.success(`Welcome back, ${user.firstName || user.username}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: message
      })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const response = await authAPI.register(userData)
      const { user, token } = response.data
      
      localStorage.setItem('token', token)
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      })
      
      toast.success(`Welcome to ScriptureStream, ${user.firstName || user.username}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: message
      })
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  const updateProfile = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.user
      })
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const value = {
    ...state,
    isAuthenticated: !!state.user && !!state.token,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

