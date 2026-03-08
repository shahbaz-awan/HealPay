import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Shield,
  ArrowRight,
  Stethoscope
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet } from '@/services/api'
import { getMyInvoices } from '@/services/billingService'
import { useAuthStore } from '@/store/authStore'
import { StatCardSkeleton } from '@/components/ui/DashboardSkeleton'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const PatientDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appointmentsData, invoicesData] = await Promise.allSettled([
          apiGet('/v1/appointments/my'),
          getMyInvoices()
        ])
        if (appointmentsData.status === 'fulfilled') setAppointments(appointmentsData.value as any[])
        if (invoicesData.status === 'fulfilled') setInvoices(invoicesData.value as any[])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Derived stats
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date)
    return aptDate > new Date() && apt.status !== 'cancelled'
  })
  const completedAppointments = appointments.filter(apt => apt.status === 'completed')
  const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled')
  const nextAppointment = [...upcomingAppointments].sort(
    (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  )[0] ?? null

  // Invoice derived stats
  const pendingInvoices = invoices.filter(inv => inv.status === 'issued')
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue')
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + (inv.balance_due ?? 0), 0)

  const stats = [
    {
      title: 'Total Appointments',
      value: appointments.length.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${scheduledAppointments.length} scheduled`,
      trend: 'up'
    },
    {
      title: 'Upcoming Visits',
      value: upcomingAppointments.length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: nextAppointment ? `Next: ${new Date(nextAppointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'None scheduled',
      trend: 'neutral'
    },
    {
      title: 'Completed Visits',
      value: completedAppointments.length.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: 'Total all time',
      trend: 'up'
    },
    {
      title: 'Balance Due',
      value: `$${totalOutstanding.toFixed(2)}`,
      icon: DollarSign,
      color: totalOutstanding > 0 ? 'text-red-600' : 'text-green-600',
      bgColor: totalOutstanding > 0 ? 'bg-red-50' : 'bg-green-50',
      change: `${pendingInvoices.length} pending · ${overdueInvoices.length} overdue`,
      trend: totalOutstanding > 0 ? 'neutral' : 'up'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: <Badge variant="success">Paid</Badge>,
      pending: <Badge variant="warning">Pending</Badge>,
      overdue: <Badge variant="danger">Overdue</Badge>,
      scheduled: <Badge variant="info">Scheduled</Badge>,
      completed: <Badge variant="success">Completed</Badge>,
      cancelled: <Badge variant="danger">Cancelled</Badge>
    }
    return badges[status as keyof typeof badges]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
            {getGreeting()}, {user?.firstName || 'Patient'}!
          </h1>
          <p className="text-secondary-600 dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {overdueInvoices.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 dark:text-red-400 font-medium">
              {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat, index) => (
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

      {/* Overdue Invoices Alert Section */}
      {!isLoading && overdueInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">
              {overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''} — Action Required
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueInvoices.map(inv => (
              <div
                key={inv.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate('/patient/bills')}
              >
                <div>
                  <p className="text-sm font-semibold text-secondary-900 dark:text-white">{inv.invoice_number}</p>
                  <p className="text-xs text-red-600 mt-0.5">Due: {formatDate(inv.due_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">${(inv.balance_due ?? 0).toFixed(2)}</p>
                  <p className="text-xs text-secondary-500">Balance due</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/patient/bills')}
              className="border-red-300 text-red-700 hover:bg-red-100">
              View All Bills
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="My Invoices"
              subtitle="Your medical billing history"
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/patient/bills')}>
                  View All
                </Button>
              }
            />
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center text-secondary-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-14 h-14 text-secondary-300 mx-auto mb-3" />
                  <p className="text-secondary-700 font-medium mb-1">No invoices yet</p>
                  <p className="text-sm text-secondary-500">Invoices will appear here after your visits are billed</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-secondary-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Invoice #</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Issue Date</th>
                      <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Due Date</th>
                      <th className="text-right p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Amount</th>
                      <th className="text-right p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Balance</th>
                      <th className="text-center p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 dark:divide-gray-700">
                    {invoices.slice(0, 5).map((inv) => (
                      <motion.tr
                        key={inv.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4">
                          <div className="text-sm font-medium text-secondary-900 dark:text-white">{inv.invoice_number}</div>
                        </td>
                        <td className="p-4 text-sm text-secondary-600 dark:text-gray-400">{inv.issue_date}</td>
                        <td className="p-4 text-sm text-secondary-600 dark:text-gray-400">{inv.due_date}</td>
                        <td className="p-4 text-right">
                          <span className="text-sm font-semibold text-secondary-900 dark:text-white">${inv.total_amount?.toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-sm font-semibold ${inv.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${inv.balance_due?.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-4 text-center">{getStatusBadge(inv.status)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Appointments - Takes 1 column */}
        <div>
          <Card>
            <CardHeader
              title="Upcoming Appointments"
              subtitle="Your scheduled visits"
            />
            <div className="space-y-4">
              {isLoading ? (
                <div className="p-8 text-center text-secondary-500">
                  Loading appointments...
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                  <p className="text-secondary-600 mb-3">No upcoming appointments</p>
                  <Button variant="outline" onClick={() => navigate('/patient/appointments')}>
                    Book Appointment
                  </Button>
                </div>
              ) : (
                upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Calendar className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-secondary-900">
                            {appointment.doctorName || 'Doctor'}
                          </h4>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-sm text-secondary-600 mb-2">{appointment.appointment_type}</p>
                        <div className="flex items-center gap-4 text-xs text-secondary-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(appointment.appointment_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.appointment_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {upcomingAppointments.length > 0 && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/patient/appointments')}>
                  View All Appointments
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Book Appointment', sub: 'Schedule a visit', icon: Calendar, color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600', route: '/patient/appointments' },
            { label: 'View Invoices', sub: `${invoices.length} total invoices`, icon: FileText, color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600', route: '/patient/bills' },
            { label: 'Medical Records', sub: 'Access health history', icon: Stethoscope, color: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600', route: '/patient/records' },
            { label: 'My Profile', sub: 'Update your information', icon: Shield, color: 'bg-orange-50 dark:bg-orange-900/20', iconColor: 'text-orange-600', route: '/patient/profile' },
          ].map((action, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -2 }}
              className="cursor-pointer"
              onClick={() => navigate(action.route)}
            >
              <Card className="hover:shadow-md transition-shadow border hover:border-primary-300 dark:hover:border-primary-600">
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

export default PatientDashboard
