import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { User, Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Camera } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-toastify'
import { apiPut } from '@/services/api'

const UserProfile = () => {
    const { user, updateUser } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state - initialize from user data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    })

    // Load user data when component mounts or user changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                city: user.city || '',
                state: user.state || '',
                zipCode: user.zip_code || ''
            })
        }
    }, [user])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // Update profile via API (email cannot be changed)
            const updateData = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone: formData.phone || null
            }

            await apiPut(`/auth/me/update`, updateData)

            // Update local user state
            if (updateUser) {
                updateUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone
                })
            }

            toast.success('Profile updated successfully!', {
                position: 'top-center',
                autoClose: 3000,
            })
            setIsEditing(false)
        } catch (error: any) {
            console.error('Profile update error:', error)
            const errorMessage = error.response?.data?.detail || 'Failed to update profile'
            toast.error(errorMessage, {
                position: 'top-center',
                autoClose: 3000,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        setFormData({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            phone: '+1 (555) 123-4567',
            address: '123 Medical Plaza, Suite 100',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
        })
        setIsEditing(false)
    }

    // Get user initials
    const getUserInitials = () => {
        return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
    }

    // Get role badge color
    const getRoleBadgeColor = () => {
        switch (user?.role) {
            case 'PATIENT':
                return 'bg-blue-100 text-blue-800'
            case 'DOCTOR':
                return 'bg-purple-100 text-purple-800'
            case 'CODER':
                return 'bg-green-100 text-green-800'
            case 'BILLING':
                return 'bg-yellow-100 text-yellow-800'
            case 'ADMIN':
                return 'bg-red-100 text-red-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-secondary-900">My Profile</h1>
                <p className="text-secondary-600 mt-1">Manage your personal information and account settings</p>
            </div>

            {/* Profile Card */}
            <Card>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                    {/* Avatar and Basic Info */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {getUserInitials()}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                                <Camera className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-secondary-900">
                                {user?.firstName} {user?.lastName}
                            </h2>
                            <p className="text-secondary-600">{user?.email}</p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor()}`}>
                                {user?.role}
                            </span>
                        </div>
                    </div>

                    {/* Edit/Save Buttons */}
                    <div>
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleSave}
                                    isLoading={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Personal Information */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-600" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.firstName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.lastName}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">{formData.email}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 py-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <p className="text-gray-900">{formData.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Address Information */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary-600" />
                        Address Information
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Street Address
                            </label>
                            {isEditing ? (
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            ) : (
                                <p className="text-gray-900 py-2">{formData.address}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    City
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">{formData.city}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">{formData.state}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ZIP Code
                                </label>
                                {isEditing ? (
                                    <Input
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-gray-900 py-2">{formData.zipCode}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Information */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary-600" />
                        Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Member Since
                            </label>
                            <div className="flex items-center gap-2 py-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <p className="text-gray-900">January 15, 2024</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Account Status
                            </label>
                            <div className="py-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Security Settings Card */}
            <Card>
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Security Settings</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Password</h4>
                            <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change Password
                        </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Enable
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default UserProfile
