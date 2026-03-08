import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
    Users,
    Calendar,
    Clock,
    CheckCircle,
    Stethoscope,
    ClipboardList,
    ArrowRight
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { getPendingEncounters } from '@/services/clinicalService'
import { StatCardSkeleton } from '@/components/ui/DashboardSkeleton'

const getTimeGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

const DoctorDashboard = () => {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [appointments, setAppointments] = useState<any[]>([])
    const [pendingEncounters, setPendingEncounters] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [apptData, encounterData] = await Promise.allSettled([
                    apiGet('/v1/appointments'),
                    getPendingEncounters()
                ])
                if (apptData.status === 'fulfilled') setAppointments((apptData.value as any[]) || [])
                if (encounterData.status === 'fulfilled') setPendingEncounters((encounterData.value as any[]) || [])
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    // Calculate real statistics from appointments
    const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        const today = new Date()
        return aptDate.toDateString() === today.toDateString()
    })
    const completedToday = todayAppointments.filter(a => a.status === 'completed').length
    const weekAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        const today = new Date(); const weekOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        return aptDate >= today && aptDate <= weekOut
    })

    const stats = [
        {
            title: "Today's Patients",
            value: todayAppointments.length.toString(),
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            change: `${completedToday} completed today`,
            trend: 'neutral' as const
        },
        {
            title: 'Upcoming (7 Days)',
            value: weekAppointments.length.toString(),
            icon: Calendar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            change: `${appointments.filter(a => a.status === 'scheduled').length} total scheduled`,
            trend: 'neutral' as const
        },
        {
            title: 'Pending Coding',
            value: pendingEncounters.length.toString(),
            icon: ClipboardList,
            color: pendingEncounters.length > 0 ? 'text-orange-600' : 'text-green-600',
            bgColor: pendingEncounters.length > 0 ? 'bg-orange-50' : 'bg-green-50',
            change: pendingEncounters.length > 0 ? 'Awaiting coder review' : 'All clear',
            trend: 'neutral' as const
        },
        {
            title: 'Total Appointments',
            value: appointments.length.toString(),
            icon: Stethoscope,
            color: 'text-teal-600',
            bgColor: 'bg-teal-50',
            change: `${appointments.filter(a => a.status === 'completed').length} completed all-time`,
            trend: 'up' as const
        }
    ]

    const getStatusBadge = (status: string) => {
        const badges = {
            completed: <Badge variant="success">Completed</Badge>,
            scheduled: <Badge variant="warning">Scheduled</Badge>,
            cancelled: <Badge variant="danger">Cancelled</Badge>
        }
        return badges[status as keyof typeof badges] || <Badge variant="info">{status}</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                        {getTimeGreeting()}, Dr. {user?.lastName || user?.firstName || 'Doctor'}!
                    </h1>
                    <p className="text-secondary-600 dark:text-gray-400 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        {todayAppointments.length > 0 && ` — ${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} today`}
                    </p>
                </div>
                {pendingEncounters.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <ClipboardList className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                            {pendingEncounters.length} encounter{pendingEncounters.length > 1 ? 's' : ''} pending coding
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
                {/* Today's Schedule - 2 columns */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader
                            title="Today's Schedule"
                            subtitle={`${todayAppointments.length} appointments - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                        />
                        {isLoading ? (
                            <div className="text-center py-8 text-secondary-500">Loading appointments...</div>
                        ) : todayAppointments.length === 0 ? (
                            <div className="text-center py-8 text-secondary-500">No appointments scheduled for today</div>
                        ) : (
                            <div className="space-y-3">
                                {todayAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="flex flex-col items-center">
                                                    <Clock className="w-5 h-5 text-primary-600 mb-1" />
                                                    <span className="text-sm font-semibold text-secondary-900">
                                                        {appointment.appointment_time}
                                                    </span>
                                                    <span className="text-xs text-secondary-500">{appointment.appointment_date}</span>
                                                </div>
                                                <div className="h-14 w-px bg-gray-300"></div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-semibold text-secondary-900">{appointment.patientName || 'Patient'}</h4>
                                                    </div>
                                                    <p className="text-sm text-secondary-600">{appointment.appointment_type}</p>
                                                    {appointment.reason && (
                                                        <p className="text-xs text-secondary-500 mt-1">{appointment.reason}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(appointment.status)}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => navigate(`/doctor/patients/${appointment.user_id}`)}
                                                >
                                                    View Patient
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Recent Appointments - 1 column */}
                <div>
                    <Card>
                        <CardHeader
                            title="Recent Appointments"
                            subtitle="Latest scheduled patients"
                        />
                        {isLoading ? (
                            <div className="text-center py-8 text-secondary-500">Loading...</div>
                        ) : appointments.length === 0 ? (
                            <div className="text-center py-8 text-secondary-500">No appointments yet</div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.slice(0, 5).map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        onClick={() => navigate(`/doctor/patients/${appointment.user_id}`)}
                                        className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {appointment.patientName?.split(' ').map((n: string) => n[0]).join('') || 'P'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-secondary-900 mb-1">{appointment.patientName || 'Patient'}</h4>
                                                <p className="text-sm text-secondary-600 mb-2">{appointment.appointment_type}</p>
                                                <div className="text-xs text-secondary-500 space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {appointment.appointment_date} at {appointment.appointment_time}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Status: {appointment.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'My Patients', sub: 'View all patient records', icon: Users, color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600', route: '/doctor/patients' },
                  { label: 'My Schedule', sub: `${appointments.filter(a=>a.status==='scheduled').length} pending appointments`, icon: Calendar, color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600', route: '/doctor/appointments' },
                  { label: 'Coding Queue', sub: `${pendingEncounters.length} notes awaiting codes`, icon: ClipboardList, color: pendingEncounters.length > 0 ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-700', iconColor: pendingEncounters.length > 0 ? 'text-orange-600' : 'text-gray-500', route: '/doctor/patients' },
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

export default DoctorDashboard
