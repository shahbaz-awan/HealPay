import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'

const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
    firstName: z
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters')
        .regex(/^[A-Za-z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters')
        .regex(/^[A-Za-z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    phone: z
        .string()
        .regex(/^[\d\s\-\(\)\+]*$/, 'Phone number can only contain digits and formatting characters (+, -, (), spaces)')
        .min(10, 'Phone number must be at least 10 digits')
        .optional()
        .or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const RegisterPage = () => {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)
    const [otp, setOtp] = useState('')
    const [userEmail, setUserEmail] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onBlur', // Only validate on blur, not on every keystroke
    })

    const onSendOTP = async (data: RegisterFormData) => {
        setIsLoading(true)
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
            const response = await fetch(`${API_BASE_URL}/auth/register/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    first_name: data.firstName,
                    last_name: data.lastName,
                    phone: data.phone,
                    role: 'PATIENT'
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || 'Failed to send OTP')
            }

            toast.success(result.message || 'OTP sent to your email!')
            setOtpSent(true)
            setUserEmail(data.email)
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to send OTP. Please try again.'
            toast.error(errorMessage)
            console.error('OTP Send Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const onVerifyOTP = async () => {
        if (!otp || otp.length !== 4) {
            toast.error('Please enter a valid 4-digit OTP')
            return
        }

        setIsLoading(true)
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
            const response = await fetch(
                `${API_BASE_URL}/auth/register/verify-otp?email=${encodeURIComponent(userEmail)}&otp=${encodeURIComponent(otp)}`,
                {
                    method: 'POST',
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.detail || 'Invalid OTP')
            }

            toast.success(result.message || 'Registration successful! You can now log in.')
            navigate('/login')
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to verify OTP. Please try again.'
            toast.error(errorMessage)
            console.error('OTP Verify Error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const onSubmit = async (data: RegisterFormData) => {
        if (!otpSent) {
            await onSendOTP(data)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="mb-8">
                        <Logo size="md" />
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-secondary-900 mb-2">Create Account</h2>
                        <p className="text-secondary-600">Sign up to get started with HealPay</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                type="text"
                                placeholder="John"
                                leftIcon={<User className="w-5 h-5" />}
                                error={errors.firstName?.message}
                                {...register('firstName')}
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                placeholder="Doe"
                                leftIcon={<User className="w-5 h-5" />}
                                error={errors.lastName?.message}
                                {...register('lastName')}
                            />
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="you@example.com"
                            leftIcon={<Mail className="w-5 h-5" />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Input
                            label="Phone Number (Optional)"
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            leftIcon={<Phone className="w-5 h-5" />}
                            error={errors.phone?.message}
                            {...register('phone')}
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            leftIcon={<Lock className="w-5 h-5" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="cursor-pointer hover:text-gray-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            }
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <Input
                            label="Confirm Password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            leftIcon={<Lock className="w-5 h-5" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="cursor-pointer hover:text-gray-600"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            }
                            error={errors.confirmPassword?.message}
                            {...register('confirmPassword')}
                        />

                        {otpSent && (
                            <div className="space-y-2">
                                <label htmlFor="otp" className="block text-sm font-medium text-secondary-700">
                                    Enter OTP Code
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    maxLength={4}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                                    placeholder="0000"
                                />
                                <p className="text-xs text-secondary-600">
                                    Check your email for the OTP code. It expires in 3 minutes.
                                </p>
                            </div>
                        )}

                        {!otpSent ? (
                            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                                Send OTP
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={onVerifyOTP}
                                className="w-full"
                                size="lg"
                                isLoading={isLoading}
                            >
                                Verify & Create Account
                            </Button>
                        )}
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-secondary-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-secondary-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full flex items-center justify-center px-4 py-2 border border-secondary-300 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Google
                            </motion.button>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-secondary-600">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Right Side - Image/Illustration */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 items-center justify-center relative overflow-hidden"
            >
                {/* Floating elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float" />
                <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full animate-float" style={{ animationDelay: '4s' }} />

                <div className="relative z-10 text-white text-center max-w-md">
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="mb-6 flex justify-center"
                    >
                        <Logo size="xl" />
                    </motion.div>
                    <h2 className="text-4xl font-bold mb-4">Join HealPay Today</h2>
                    <p className="text-xl opacity-90">
                        Experience the future of medical billing with AI-powered automation
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default RegisterPage
