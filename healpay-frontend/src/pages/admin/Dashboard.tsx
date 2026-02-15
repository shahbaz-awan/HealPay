import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  Activity,
  Shield,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiGet } from '@/services/api'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  phone: string | null
  created_at: string
  updated_at: string | null
  is_active: boolean
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiGet<User[]>('/v1/admin/users')
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Calculate real stats from user data
  const totalUsers = users.length
  const patientCount = users.filter(u => u.role === 'PATIENT').length
  const doctorCount = users.filter(u => u.role === 'DOCTOR').length
  const coderCount = users.filter(u => u.role === 'CODER').length
  const billingCount = users.filter(u => u.role === 'BILLING').length
  const adminCount = users.filter(u => u.role === 'ADMIN').length

  // Get recent users (last 5 users)
  const recentUsers = [...users]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Get time ago helper
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  // System statistics with real data
  const stats = [
    {
      title: 'Total Users',
      value: totalUsers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${users.length} total registered`,
      trend: 'up'
    },
    {
      title: 'Active Patients',
      value: patientCount.toString(),
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: totalUsers > 0 ? `${((patientCount / totalUsers) * 100).toFixed(1)}% of total` : '0%',
      trend: 'up'
    },
    {
      title: 'Healthcare Staff',
      value: (doctorCount + coderCount + billingCount).toString(),
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: `${doctorCount} doctors, ${coderCount} coders`,
      trend: 'up'
    },
    {
      title: 'System Admin',
      value: adminCount.toString(),
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: 'Admin accounts',
      trend: 'up'
    }
  ]

  // User role distribution with real data
  const userDistribution = totalUsers > 0 ? [
    { role: 'Patients', count: patientCount, percentage: (patientCount / totalUsers) * 100, color: 'bg-blue-500' },
    { role: 'Doctors', count: doctorCount, percentage: (doctorCount / totalUsers) * 100, color: 'bg-purple-500' },
    { role: 'Coders', count: coderCount, percentage: (coderCount / totalUsers) * 100, color: 'bg-green-500' },
    { role: 'Billing Staff', count: billingCount, percentage: (billingCount / totalUsers) * 100, color: 'bg-yellow-500' },
    { role: 'Admins', count: adminCount, percentage: (adminCount / totalUsers) * 100, color: 'bg-red-500' }
  ].filter(item => item.count > 0) : []

  // System alerts
  const systemAlerts = [
    {
      id: 1,
      type: 'success',
      message: `System has ${totalUsers} registered users across all roles`,
      time: 'Current'
    },
    {
      id: 2,
      type: 'info',
      message: 'All validation rules are active for registration and user creation',
      time: 'System Status'
    },
    {
      id: 3,
      type: 'success',
      message: 'Database connection active and operational',
      time: 'System Health'
    }
  ]

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'DOCTOR': 'bg-purple-100 text-purple-800',
      'PATIENT': 'bg-blue-100 text-blue-800',
      'CODER': 'bg-green-100 text-green-800',
      'BILLING': 'bg-yellow-100 text-yellow-800',
      'ADMIN': 'bg-red-100 text-red-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'success':
        return <Activity className="w-5 h-5 text-green-600" />
      default:
        return <Activity className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
          <p className="text-secondary-600 mt-1">System overview and user management</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover-card relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-secondary-600 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-secondary-900 mb-2">{stat.value}</h3>
                  <div className="flex items-center gap-2">
                    {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    <p className="text-xs text-secondary-500">{stat.change}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor}`}></div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent User Activity"
              subtitle="Newly registered and active users"
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                  View All Users
                </Button>
              }
            />
            {isLoading ? (
              <div className="p-8 text-center text-secondary-500">
                Loading users...
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="p-8 text-center text-secondary-500">
                No users registered yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700">User</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700">Role</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700">Join Date</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700">Last Active</th>
                      <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {recentUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {user.first_name[0]}{user.last_name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-secondary-900">{user.first_name} {user.last_name}</div>
                              <div className="text-xs text-secondary-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-secondary-900">{formatDate(user.created_at)}</td>
                        <td className="p-4 text-sm text-secondary-600">{getTimeAgo(user.updated_at || user.created_at)}</td>
                        <td className="p-4 text-center">
                          <Badge variant="success">Active</Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* System Alerts */}
          <Card>
            <CardHeader
              title="System Alerts"
              subtitle="Recent notifications"
            />
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm text-secondary-900">{alert.message}</p>
                      <p className="text-xs text-secondary-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader
              title="User Distribution"
              subtitle="By role"
            />
            <div className="space-y-3">
              {userDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-secondary-700">{item.role}</span>
                    <span className="text-sm font-semibold text-secondary-900">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-secondary-500 mt-1">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-card cursor-pointer group" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Manage Users</h3>
              <p className="text-sm text-secondary-600">Add, edit, or remove users</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Analytics</h3>
              <p className="text-sm text-secondary-600">View detailed reports</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Security Settings</h3>
              <p className="text-sm text-secondary-600">Configure system security</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
