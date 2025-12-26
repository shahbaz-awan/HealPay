import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  CreditCard,
  Activity,
  Clock,
  CheckCircle,
  Calendar,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

const PatientDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real appointments data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const appointmentsData = await apiGet('/appointments/my')
        setAppointments(appointmentsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Calculate real stats from appointments
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date)
    return aptDate > new Date() && apt.status !== 'cancelled'
  })

  const completedAppointments = appointments.filter(apt => apt.status === 'completed')
  const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled')

  // Get next appointment
  const nextAppointment = upcomingAppointments.length > 0
    ? upcomingAppointments.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0]
    : null

  const stats = [
    {
      title: 'Total Appointments',
      value: appointments.length.toString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${scheduledAppointments.length} scheduled`,
      trend: 'up'
    },
    {
      title: 'Upcoming',
      value: upcomingAppointments.length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: 'Next 30 days',
      trend: 'neutral'
    },
    {
      title: 'Completed',
      value: completedAppointments.length.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: 'All time',
      trend: 'up'
    },
    {
      title: 'Next Appointment',
      value: nextAppointment ? new Date(nextAppointment.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: nextAppointment ? nextAppointment.doctorName || 'Doctor' : 'No upcoming',
      trend: 'neutral'
    }
  ]

  // Dummy bills data (since we don't have a bills endpoint yet)
  const recentBills = [
    {
      id: 1,
      date: '2024-11-28',
      billNumber: 'INV-2024-1128',
      doctor: 'Dr. Emily Chen',
      specialty: 'Cardiology',
      service: 'ECG & Consultation',
      amount: 450.00,
      status: 'paid',
      insuranceCovered: 360.00,
      patientResponsibility: 90.00
    },
    {
      id: 2,
      date: '2024-11-20',
      billNumber: 'INV-2024-1120',
      doctor: 'Dr. Michael Rodriguez',
      specialty: 'General Practice',
      service: 'Annual Physical Exam',
      amount: 320.00,
      status: 'pending',
      insuranceCovered: 256.00,
      patientResponsibility: 64.00
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
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">
          Welcome Back, {user?.firstName || 'Patient'}!
        </h1>
        <p className="text-secondary-600 mt-1">Here's your health and billing summary for today</p>
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
        {/* Recent Bills - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Recent Bills"
              subtitle="Your latest medical bills and payments"
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/patient/bills')}>
                  View All
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Doctor</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Service</th>
                    <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {recentBills.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-secondary-500">
                        No bills yet
                      </td>
                    </tr>
                  ) : (
                    recentBills.map((bill) => (
                      <motion.tr
                        key={bill.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4">
                          <div className="text-sm text-secondary-900 font-medium">{bill.date}</div>
                          <div className="text-xs text-secondary-500">{bill.billNumber}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-secondary-900 font-medium">{bill.doctor}</div>
                          <div className="text-xs text-secondary-500">{bill.specialty}</div>
                        </td>
                        <td className="p-4 text-sm text-secondary-900">{bill.service}</td>
                        <td className="p-4 text-right">
                          <div className="text-sm text-secondary-900 font-semibold">
                            ${bill.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-secondary-500">
                            You pay: ${bill.patientResponsibility.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-4 text-center">{getStatusBadge(bill.status)}</td>
                        <td className="p-4 text-center">
                          {bill.status === 'pending' || bill.status === 'overdue' ? (
                            <Button size="sm" variant="primary">Pay Now</Button>
                          ) : (
                            <Button size="sm" variant="ghost">View</Button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-card cursor-pointer group" onClick={() => navigate('/patient/bills')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">View All Bills</h3>
              <p className="text-sm text-secondary-600">See complete billing history</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group" onClick={() => navigate('/patient/payments')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Payment History</h3>
              <p className="text-sm text-secondary-600">Track your payments</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group" onClick={() => navigate('/patient/records')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Medical Records</h3>
              <p className="text-sm text-secondary-600">Access your health records</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PatientDashboard
