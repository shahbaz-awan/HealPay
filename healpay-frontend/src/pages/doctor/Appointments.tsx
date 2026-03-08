import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    Clock,
    User,
    Mail,
    Phone,
    FileText,
    Filter,
    X,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet, apiPatch } from '@/services/api'
import { toast } from 'react-toastify'

interface Appointment {
    id: number
    user_id: number
    doctor_id: number
    appointment_date: string
    appointment_time: string
    appointment_type: string
    reason?: string
    status: string
    patientName?: string
    patient_email?: string
    patient_dob?: string
    created_at: string
}

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [isLoading, setIsLoading] = useState(true)

    // Fetch appointments for this doctor
    const fetchAppointments = async () => {
        setIsLoading(true)
        try {
            const data = await apiGet<Appointment[]>('/v1/appointments')
            setAppointments(data)
            setFilteredAppointments(data)
        } catch (error) {
            console.error('Error fetching appointments:', error)
            toast.error('Failed to load appointments')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    // Filter appointments by status
    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredAppointments(appointments)
        } else {
            setFilteredAppointments(appointments.filter(apt => apt.status === statusFilter))
        }
    }, [statusFilter, appointments])

    const getStatusBadge = (status: string) => {
        const badges: Record<string, JSX.Element> = {
            scheduled: <Badge variant="info">Scheduled</Badge>,
            completed: <Badge variant="success">Completed</Badge>,
            cancelled: <Badge variant="danger">Cancelled</Badge>,
            'in-progress': <Badge variant="warning">In Progress</Badge>
        }
        return badges[status] || <Badge>{status}</Badge>
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatTime = (timeString: string) => {
        return timeString
    }

    const isUpcoming = (date: string) => {
        return new Date(date) > new Date()
    }

    const updateAppointmentStatus = async (appointmentId: number, newStatus: string) => {
        try {
            await apiPatch(`/v1/appointments/${appointmentId}/status?new_status=${newStatus}`, {})
            toast.success(`Appointment marked as ${newStatus}`)
            fetchAppointments()
            setSelectedAppointment(null)
        } catch (error) {
            toast.error('Failed to update appointment status')
        }
    }

    // Stats
    const stats = {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        upcoming: appointments.filter(a => isUpcoming(a.appointment_date) && a.status === 'scheduled').length
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">My Appointments</h1>
                    <p className="text-secondary-600 mt-1">View and manage your appointments</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        <p className="text-sm text-secondary-600 mt-1">Total</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{stats.upcoming}</p>
                        <p className="text-sm text-secondary-600 mt-1">Upcoming</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">{stats.scheduled}</p>
                        <p className="text-sm text-secondary-600 mt-1">Scheduled</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                        <p className="text-sm text-secondary-600 mt-1">Completed</p>
                    </div>
                </Card>
            </div>

            {/* Appointments List */}
            <Card>
                <CardHeader
                    title="All Appointments"
                    subtitle={`${filteredAppointments.length} appointments found`}
                />

                {/* Filter */}
                <div className="mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-secondary-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="all">All Appointments</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="in-progress">In Progress</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date & Time</th>
                                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Type</th>
                                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-secondary-500">
                                        Loading appointments...
                                    </td>
                                </tr>
                            ) : filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-secondary-500">
                                        No appointments found
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments
                                    .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
                                    .map((apt) => (
                                        <motion.tr
                                            key={apt.id}
                                            whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                                            className="transition-colors cursor-pointer"
                                            onClick={() => setSelectedAppointment(apt)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {apt.patientName ? apt.patientName.split(' ').map(n => n[0]).join('') : 'P'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-secondary-900">
                                                            {apt.patientName || 'Unknown Patient'}
                                                        </div>
                                                        {apt.patient_email && (
                                                            <div className="text-xs text-secondary-500 flex items-center gap-1">
                                                                <Mail className="w-3 h-3" />
                                                                {apt.patient_email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1 text-sm text-secondary-700">
                                                        <Calendar className="w-4 h-4" />
                                                        {formatDate(apt.appointment_date)}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-secondary-600">
                                                        <Clock className="w-4 h-4" />
                                                        {formatTime(apt.appointment_time)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-secondary-700">{apt.appointment_type}</td>
                                            <td className="p-4 text-center">{getStatusBadge(apt.status)}</td>
                                            <td className="p-4 text-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedAppointment(apt)
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Appointment Detail Modal */}
            <AnimatePresence>
                {selectedAppointment && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-secondary-900">Appointment Details</h2>
                                    <p className="text-secondary-600 text-sm mt-1">ID: #{selectedAppointment.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedAppointment(null)}
                                    className="text-secondary-400 hover:text-secondary-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Patient Information */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Patient Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-secondary-600">Full Name</label>
                                            <p className="font-medium text-secondary-900">{selectedAppointment.patientName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-secondary-600">Email</label>
                                            <p className="font-medium text-secondary-900">{selectedAppointment.patient_email || 'N/A'}</p>
                                        </div>
                                        {selectedAppointment.patient_dob && (
                                            <div>
                                                <label className="text-xs text-secondary-600">Date of Birth</label>
                                                <p className="font-medium text-secondary-900">{selectedAppointment.patient_dob}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Appointment Details */}
                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Appointment Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-secondary-600">Date</label>
                                            <p className="font-medium text-secondary-900">{formatDate(selectedAppointment.appointment_date)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-secondary-600">Time</label>
                                            <p className="font-medium text-secondary-900">{formatTime(selectedAppointment.appointment_time)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-secondary-600">Type</label>
                                            <p className="font-medium text-secondary-900">{selectedAppointment.appointment_type}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-secondary-600">Status</label>
                                            <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                                        </div>
                                    </div>
                                    {selectedAppointment.reason && (
                                        <div className="mt-4">
                                            <label className="text-xs text-secondary-600">Reason for Visit</label>
                                            <p className="font-medium text-secondary-900 mt-1">{selectedAppointment.reason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {selectedAppointment.status === 'scheduled' && (
                                    <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-secondary-900 mb-3">Update Status</h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateAppointmentStatus(selectedAppointment.id, 'in-progress')}
                                                className="flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                Mark In Progress
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateAppointmentStatus(selectedAppointment.id, 'completed')}
                                                className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark Completed
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateAppointmentStatus(selectedAppointment.id, 'cancelled')}
                                                className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Close Button */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedAppointment(null)}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DoctorAppointments
