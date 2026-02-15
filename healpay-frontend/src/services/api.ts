import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api'

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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data as any
      const message = data?.detail || data?.message || error.message

      switch (status) {
        case 400:
          // Bad request (e.g., email already registered)
          toast.error(typeof message === 'string' ? message : 'Invalid request.')
          break
        case 401:
          useAuthStore.getState().logout()
          toast.error('Session expired. Please login again.')
          window.location.href = '/login'
          break
        case 403:
          toast.error('You do not have permission to perform this action.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 422:
          // Validation error
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
          toast.error(typeof message === 'string' ? message : 'An error occurred.')
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

