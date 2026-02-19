import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-toastify'
import { UserRole } from '@/types'

const GoogleCallback = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token')

            if (!token) {
                toast.error('Login failed: No token received')
                navigate('/login')
                return
            }

            try {
                // Fetch user profile using the token
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch user profile')
                }

                const user = await response.json()

                setAuth(user, token)
                toast.success('Login successful!')

                // Redirect based on role
                const role = user.role as UserRole
                const rolePaths: Record<UserRole, string> = {
                    [UserRole.PATIENT]: '/patient/dashboard',
                    [UserRole.DOCTOR]: '/doctor/dashboard',
                    [UserRole.CODER]: '/coder/dashboard',
                    [UserRole.BILLING]: '/billing/dashboard',
                    [UserRole.ADMIN]: '/admin/dashboard',
                }

                navigate(rolePaths[role] || '/login')

            } catch (error) {
                console.error('Google login error:', error)
                toast.error('Failed to complete Google login')
                navigate('/login')
            }
        }

        handleCallback()
    }, [searchParams, navigate, setAuth])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Completing login...</h2>
                <p className="text-gray-500">Please wait while we redirect you.</p>
            </div>
        </div>
    )
}

export default GoogleCallback
