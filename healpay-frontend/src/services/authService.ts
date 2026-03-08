import { apiPost } from './api'
import { LoginCredentials, RegisterData, AuthResponse } from '@/types'

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiPost<AuthResponse>('/v1/auth/login', credentials)

        // Transform snake_case fields from backend to camelCase for frontend
        if (response.user) {
            response.user = {
                ...response.user,
                firstName: response.user.first_name || response.user.firstName,
                lastName: response.user.last_name || response.user.lastName,
                zipCode: response.user.zip_code || response.user.zipCode,
                isActive: response.user.is_active !== undefined ? response.user.is_active : response.user.isActive,
                isVerified: response.user.is_verified !== undefined ? response.user.is_verified : response.user.isVerified,
                createdAt: response.user.created_at || response.user.createdAt,
                updatedAt: response.user.updated_at || response.user.updatedAt,
            } as any
        }

        return response
    },

    register: async (data: RegisterData): Promise<{ message: string; email: string }> => {
        // Transform camelCase to snake_case for backend
        const backendData: any = {
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'PATIENT',  // Default to PATIENT, backend will use this
        }
        // Add phone if provided
        if (data.phone) {
            backendData.phone = data.phone
        }
        return apiPost<{ message: string; email: string }>('/v1/auth/register/send-otp', backendData)
    },

    verifyOtp: async (email: string, otp: string): Promise<{ message: string; email: string }> => {
        return apiPost<{ message: string; email: string }>('/v1/auth/register/verify-otp', { email, otp })
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        return apiPost<{ message: string }>('/v1/auth/forgot-password/send-code', { email })
    },

    resetPassword: async (email: string, otp: string, new_password: string): Promise<{ message: string }> => {
        return apiPost<{ message: string }>('/v1/auth/forgot-password/verify-and-reset', { email, otp, new_password })
    },

    logout: async (): Promise<void> => {
        return apiPost('/v1/auth/logout')
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        return apiPost<AuthResponse>('/v1/auth/refresh', { refresh_token: refreshToken })
    },
}
