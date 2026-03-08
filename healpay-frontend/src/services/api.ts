import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track if a refresh is already in progress to prevent concurrent refreshes
let _refreshing = false
let _refreshQueue: Array<(token: string) => void> = []

const _tryRefresh = async (): Promise<string | null> => {
  const { refreshToken, setAuth, logout, user } = useAuthStore.getState()
  if (!refreshToken) return null

  if (_refreshing) {
    // Wait for the in-progress refresh
    return new Promise((resolve) => {
      _refreshQueue.push(resolve)
    })
  }

  _refreshing = true
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/v1/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    const newToken: string = data.token
    const newRefresh: string = data.refreshToken
    if (user) setAuth(user, newToken, newRefresh)
    _refreshQueue.forEach((cb) => cb(newToken))
    _refreshQueue = []
    return newToken
  } catch {
    logout()
    _refreshQueue = []
    return null
  } finally {
    _refreshing = false
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      const message = data?.detail || data?.message || error.message

      if (status === 401 && !originalRequest._retried) {
        // Attempt silent refresh once before forcing logout
        originalRequest._retried = true
        const newToken = await _tryRefresh()
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      switch (status) {
        case 400:
          toast.error(typeof message === 'string' ? message : 'Invalid request.')
          break
        case 403:
          toast.error('You do not have permission to perform this action.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 422:
          if (Array.isArray(data?.detail)) {
            const errors = data.detail.map((err: any) => err.msg).join(', ')
            toast.error(`Validation error: ${errors}`)
          } else {
            toast.error(typeof message === 'string' ? message : 'Validation failed.')
          }
          console.error('Validation errors:', data?.detail)
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          if (status !== 401) {
            toast.error(typeof message === 'string' ? message : 'An error occurred.')
          }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred.')
    }

    return Promise.reject(error)
  }
)

export default api

// Helper functions for common HTTP methods
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  api.get<T>(url, config).then((res) => res.data)

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.post<T>(url, data, config).then((res) => res.data)

export const apiPut = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.put<T>(url, data, config).then((res) => res.data)

export const apiPatch = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
  api.patch<T>(url, data, config).then((res) => res.data)

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  api.delete<T>(url, config).then((res) => res.data)

