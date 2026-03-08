import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  Activity,
  Shield,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
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

interface AdminSummary {
  users: { total: number; by_role: Record<string, number> }
  encounters: { total: number; pending_coding: number; this_month: number }
  billing: {
    total_invoiced: number
    total_collected: number
    outstanding: number
    overdue_count: number
    collection_rate_pct: number
  }
  claims: { submitted: number; approved: number; denied: number }
  appointments: { today: number; this_month: number }
  monthly_revenue: Array<{ month: string; revenue: number }>
}

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch users + summary in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, summaryData] = await Promise.allSettled([
          apiGet<User[]>('/v1/admin/users'),
          apiGet<AdminSummary>('/v1/admin/reports/summary'),
        ])
        if (usersData.status === 'fulfilled') setUsers(usersData.value)
        if (summaryData.status === 'fulfilled') setSummary(summaryData.value)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
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

  // Financial stats from summary API
  const financialStats = [
    {
      title: 'Total Revenue Collected',
      value: summary ? `$${summary.billing.total_collected.toLocaleString()}` : '—',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: summary ? `${summary.billing.collection_rate_pct}% collection rate` : '',
      trend: 'up'
    },
    {
      title: 'Outstanding Balance',
      value: summary ? `$${summary.billing.outstanding.toLocaleString()}` : '—',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: summary ? `${summary.billing.overdue_count} overdue invoices` : '',
      trend: 'neutral'
    },
    {
      title: 'Claims Submitted',
      value: summary ? summary.claims.submitted.toString() : '—',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: summary ? `${summary.claims.approved} approved, ${summary.claims.denied} denied` : '',
      trend: 'neutral'
    },
    {
      title: 'Encounters This Month',
      value: summary ? summary.encounters.this_month.toString() : '—',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: summary ? `${summary.encounters.pending_coding} pending coding` : '',
      trend: 'neutral'
    },
  ]

  // User role distribution with real data
  const userDistribution = totalUsers > 0 ? [
    { role: 'Patients', count: patientCount, percentage: (patientCount / totalUsers) * 100, color: 'bg-blue-500' },
    { role: 'Doctors', count: doctorCount, percentage: (doctorCount / totalUsers) * 100, color: 'bg-purple-500' },
    { role: 'Coders', count: coderCount, percentage: (coderCount / totalUsers) * 100, color: 'bg-green-500' },
    { role: 'Billing Staff', count: billingCount, percentage: (billingCount / totalUsers) * 100, color: 'bg-yellow-500' },
    { role: 'Admins', count: adminCount, percentage: (adminCount / totalUsers) * 100, color: 'bg-red-500' }
  ].filter(item => item.count > 0) : []

  // Dynamic system alerts — computed from real data
  const systemAlerts = useMemo(() => {
    const alerts: { id: number; type: string; message: string; time: string }[] = []
    if (isLoading) return alerts

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsers = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length

    if (doctorCount === 0) alerts.push({ id: 1, type: 'warning', message: 'No doctors are registered — patient bookings may be unavailable', time: 'Role Gap' })
    if (coderCount === 0) alerts.push({ id: 2, type: 'warning', message: 'No medical coders registered — encounters cannot be coded', time: 'Role Gap' })
    if (billingCount === 0) alerts.push({ id: 3, type: 'warning', message: 'No billing staff registered — invoicing unavailable', time: 'Role Gap' })
    if (newUsers > 0) alerts.push({ id: 4, type: 'info', message: `${newUsers} new user${newUsers !== 1 ? 's' : ''} registered in the past 7 days`, time: 'Recent Activity' })
    if (summary?.billing.overdue_count && summary.billing.overdue_count > 0) {
      alerts.push({ id: 7, type: 'warning', message: `${summary.billing.overdue_count} invoice${summary.billing.overdue_count !== 1 ? 's are' : ' is'} overdue — follow up with patients`, time: 'Billing Alert' })
    }
    if (doctorCount > 0 && coderCount > 0 && billingCount > 0) {
      alerts.push({ id: 5, type: 'success', message: 'All critical roles filled — system is fully operational', time: 'System Health' })
    }
    if (totalUsers > 0) alerts.push({ id: 6, type: 'info', message: `${totalUsers} registered user${totalUsers !== 1 ? 's' : ''} across ${[patientCount, doctorCount, coderCount, billingCount, adminCount].filter(Boolean).length} role groups`, time: 'System Status' })

    return alerts.slice(0, 4)
  }, [users, summary, isLoading, totalUsers, doctorCount, coderCount, billingCount, patientCount, adminCount])

  const getUserStatus = (u: User) => {
    if (u.updated_at) return <Badge variant="success">Active</Badge>
    return <Badge variant="info">Registered</Badge>
  }

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
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />
      default: return <Activity className="w-5 h-5 text-blue-600" />
    }
  }

  const getAlertBg = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-secondary-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' — '}{totalUsers} registered user{totalUsers !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
          <Users className="w-4 h-4 mr-2" />
          Manage Users
        </Button>
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

      {/* Financial Stats Grid */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financialStats.map((stat, index) => (
            <motion.div
              key={`fin-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <Card className="hover-card relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-secondary-600 mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                      {isLoading ? <span className="text-secondary-400">—</span> : stat.value}
                    </h3>
                    <p className="text-xs text-secondary-500">{stat.change}</p>
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
                        <td className="p-4 text-sm text-secondary-900 dark:text-white">{formatDate(user.created_at)}</td>
                        <td className="p-4 text-sm text-secondary-600 dark:text-gray-400">{getTimeAgo(user.updated_at || user.created_at)}</td>
                        <td className="p-4 text-center">
                          {getUserStatus(user)}
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
              {systemAlerts.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-secondary-500">No alerts — system healthy</p>
                </div>
              ) : systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getAlertBg(alert.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="text-sm text-secondary-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">{alert.time}</p>
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
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Manage Users', sub: `${totalUsers} total users`, icon: Users, color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600', route: '/admin/users' },
            { label: 'Analytics', sub: 'View detailed reports', icon: BarChart3, color: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600', route: '/admin/analytics' },
            { label: 'Security Settings', sub: 'Configure system security', icon: Shield, color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600', route: '/admin/settings' },
          ].map((action, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className="cursor-pointer" onClick={() => navigate(action.route)}>
              <Card className="hover:shadow-md transition-shadow border hover:border-primary-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${action.color} rounded-xl`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{action.label}</h3>
                    <p className="text-xs text-secondary-500 dark:text-gray-400 mt-0.5">{action.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-secondary-400" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
