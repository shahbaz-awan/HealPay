import { apiPost } from './api'
import { LoginCredentials, RegisterData, AuthResponse } from '@/types'

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await apiPost<AuthResponse>('/auth/login', credentials)

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
        return apiPost<{ message: string; email: string }>('/auth/register', backendData)
    },

    logout: async (): Promise<void> => {
        return apiPost('/auth/logout')
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        return apiPost<AuthResponse>('/auth/refresh', { refreshToken })
    },
}
