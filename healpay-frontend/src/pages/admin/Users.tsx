import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Lock,
  MapPin
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { UserRole } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { apiPost, apiGet, apiDelete, apiPut } from '@/services/api'

// Create User Schema
const createUserSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[A-Za-z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[A-Za-z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  phone: z.string()
    .regex(/^[\d\s\-\(\)\+]*$/, 'Phone can only contain digits and formatting characters (+, -, (), spaces)')
    .refine(val => {
      if (!val || val.trim() === '') return true
      const digits = val.replace(/\D/g, '')
      return digits.length >= 10 && digits.length <= 15
    }, 'Phone must contain 10-15 digits')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  city: z.string()
    .regex(/^[A-Za-z\s\-']*$/, 'City can only contain letters, spaces, hyphens, and apostrophes')
    .optional()
    .or(z.literal('')),
  state: z.string()
    .regex(/^[A-Z]{0,2}$/, 'State must be 2 uppercase letters (e.g., NY, CA)')
    .optional()
    .or(z.literal('')),
  zipCode: z.string()
    .regex(/^(\d{5}(-\d{4})?)?$/, 'ZIP code must be 5 digits (or 5+4 format)')
    .optional()
    .or(z.literal('')),
  role: z.nativeEnum(UserRole),
  specialization: z.string().max(100, 'Specialization too long').optional().or(z.literal('')),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const AdminUsers = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: UserRole.PATIENT,
    },
  })

  const selectedRole = watch('role')

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const data = await apiGet<any[]>('/v1/admin/users')
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    try {
      // Transform to backend format
      const backendData = {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zipCode || null,
        role: data.role,
        specialization: data.role === UserRole.DOCTOR ? (data.specialization || null) : null
      }

      console.log('Creating user with data:', backendData)

      // Call admin endpoint
      const response = await apiPost('/v1/admin/create-user', backendData)

      console.log('User created successfully:', response)

      toast.success(`User created successfully! ${data.firstName} ${data.lastName} can now login.`)
      reset()
      setShowCreateModal(false)

      // Refresh users list
      fetchUsers()
    } catch (error: any) {
      console.error('Error creating user:', error)
      console.error('Error response:', error.response)

      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create user. Please try again.'

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit user
  const handleEdit = (user: any) => {
    setEditingUser(user)
    setShowEditModal(true)
    reset({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      password: '', // Don't populate password for security
      phone: user.phone || '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      role: user.role,
      specialization: user.specialization || ''
    })
  }

  // Handle edit submission
  const onEditSubmit = async (data: CreateUserFormData) => {
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const updateData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        specialization: data.role === UserRole.DOCTOR ? (data.specialization || null) : null
      }

      // Only include password if it was changed
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password
      }

      await apiPut(`/v1/admin/users/${editingUser.id}`, updateData)

      toast.success('User updated successfully!')
      reset()
      setShowEditModal(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update user'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDeleteUser = async (userId: number) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    // Prevent deleting admin users
    if (userToDelete.role === 'ADMIN') {
      toast.error('Cannot delete admin users for security reasons')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${userToDelete.first_name} ${userToDelete.last_name}? This action cannot be undone.`)) {
      return
    }

    try {
      await apiDelete(`/v1/admin/users/${userId}`)
      toast.success(`User ${userToDelete.first_name} ${userToDelete.last_name} deleted successfully`)
      fetchUsers()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete user'
      toast.error(errorMessage)
    }
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, JSX.Element> = {
      PATIENT: <Badge variant="primary">Patient</Badge>,
      DOCTOR: <Badge variant="success">Doctor</Badge>,
      CODER: <Badge variant="warning">Coder</Badge>,
      BILLING: <Badge variant="secondary">Billing</Badge>,
      ADMIN: <Badge variant="danger">Admin</Badge>
    }
    return badges[role] || <Badge>{role}</Badge>
  }

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>
  }

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      fullName.includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    )
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">User Management</h1>
          <p className="text-secondary-600 mt-1">Create and manage all system users</p>
        </div>
        <Button
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Create New User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'PATIENT').length}</p>
            <p className="text-sm text-secondary-600">Patients</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'DOCTOR').length}</p>
            <p className="text-sm text-secondary-600">Doctors</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{users.filter(u => u.role === 'CODER').length}</p>
            <p className="text-sm text-secondary-600">Coders</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'BILLING').length}</p>
            <p className="text-sm text-secondary-600">Billing Staff</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'ADMIN').length}</p>
            <p className="text-sm text-secondary-600">Admins</p>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader
          title="All Users"
          subtitle={`${filteredUsers.length} users found`}
        />

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">User</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Email</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Role</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Joined</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Last Active</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-secondary-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                    className="transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900">{user.first_name} {user.last_name}</div>
                          {user.phone && (
                            <div className="text-xs text-secondary-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-secondary-700">{user.email}</td>
                    <td className="p-4 text-center">{getRoleBadge(user.role)}</td>
                    <td className="p-4 text-center">{getStatusBadge(user.is_active ? 'active' : 'inactive')}</td>
                    <td className="p-4 text-sm text-secondary-700">{formatDate(user.created_at)}</td>
                    <td className="p-4 text-sm text-secondary-600">{getTimeAgo(user.updated_at || user.created_at)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">Create New User</h2>
                <p className="text-secondary-600 text-sm mt-1">Add a new user to the system</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="user@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1 (555) 123-4567"
                leftIcon={<Phone className="w-5 h-5" />}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Street Address (Optional)"
                placeholder="123 Main Street"
                leftIcon={<MapPin className="w-5 h-5" />}
                error={errors.address?.message}
                {...register('address')}
              />

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input
                    label="City (Optional)"
                    placeholder="New York"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                </div>
                <Input
                  label="State (Optional)"
                  placeholder="NY"
                  error={errors.state?.message}
                  {...register('state')}
                />
              </div>

              <Input
                label="ZIP Code (Optional)"
                placeholder="10001"
                error={errors.zipCode?.message}
                {...register('zipCode')}
              />

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  User Role
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400 transition-all bg-white text-secondary-900"
                >
                  <option value={UserRole.PATIENT}>Patient</option>
                  <option value={UserRole.DOCTOR}>Doctor / Clinician</option>
                  <option value={UserRole.CODER}>Medical Coder</option>
                  <option value={UserRole.BILLING}>Billing Staff</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
                <p className="mt-1 text-xs text-secondary-500">
                  Select the appropriate role for this user
                </p>
              </div>

              {selectedRole === UserRole.DOCTOR && (
                <Input
                  label="Specialization (Doctors only)"
                  placeholder="e.g. Cardiology, General Practice"
                  error={errors.specialization?.message}
                  {...register('specialization')}
                />
              )}

              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                leftIcon={<Lock className="w-5 h-5" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex gap-3 mt-6">
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isSubmitting}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Create User
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">Edit User</h2>
                <p className="text-secondary-600 text-sm mt-1">Update user information and credentials</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  reset()
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="John"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="New Password (Leave empty to keep current)"
                type="password"
                placeholder="Leave empty to keep current password"
                leftIcon={<Lock className="w-5 h-5" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Phone"
                placeholder="(555) 123-4567"
                leftIcon={<Phone className="w-5 h-5" />}
                error={errors.phone?.message}
                {...register('phone')}
              />

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  User Role
                </label>
                <select
                  {...register('role')}
                  className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={UserRole.PATIENT}>Patient</option>
                  <option value={UserRole.DOCTOR}>Doctor / Clinician</option>
                  <option value={UserRole.CODER}>Medical Coder</option>
                  <option value={UserRole.BILLING}>Billing Staff</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>

              {selectedRole === UserRole.DOCTOR && (
                <Input
                  label="Specialization (Doctors only)"
                  placeholder="e.g. Cardiology, General Practice"
                  error={errors.specialization?.message}
                  {...register('specialization')}
                />
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                    reset()
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers

