import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Calendar,
    Clock,
    User,
    Mail,
    Cake,
    Stethoscope,
    Plus,
    X,
    Check
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { useAuthStore } from '@/store/authStore'
import { apiGet, apiPost } from '@/services/api'

// Appointment booking schema
const appointmentSchema = z.object({
    patientName: z.string().min(1, 'Patient name is required'),
    patientEmail: z.string().email('Invalid email'),
    patientDOB: z.string().optional(),
    doctorId: z.string().min(1, 'Please select a doctor'),
    appointmentDate: z.string().min(1, 'Please select a date'),
    appointmentTime: z.string().min(1, 'Please select a time'),
    appointmentType: z.string().min(1, 'Please select appointment type'),
    reason: z.string().optional(),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Doctor {
    id: number
    first_name: string
    last_name: string
    email: string
    specialization?: string
}

const PatientAppointments = () => {
    const { user } = useAuthStore()
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [patientDOB, setPatientDOB] = useState('')
    const [appointments, setAppointments] = useState<any[]>([])

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patientName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
            patientEmail: user?.email || '',
        },
    })

    // Fetch doctors from system
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const allUsers = await apiGet<any[]>('/admin/users')
                const doctorUsers = allUsers.filter(u => u.role === 'DOCTOR')
                setDoctors(doctorUsers)
            } catch (error) {
                console.error('Error fetching doctors:', error)
                toast.error('Failed to load doctors')
            }
        }
        fetchDoctors()
    }, [])

    // Fetch patient DOB from intake form if available
    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                // Try to fetch patient intake data
                const intakeData = await apiGet('/patient-intake/my-intake')
                if (intakeData && intakeData.date_of_birth) {
                    setPatientDOB(intakeData.date_of_birth)
                }
            } catch (error) {
                // Intake form not filled yet, that's okay
                console.log('No intake data found')
            }
        }
        fetchPatientData()
    }, [])

    const onSubmit = async (data: AppointmentFormData) => {
        setIsSubmitting(true)
        try {
            const appointmentData = {
                doctor_id: parseInt(data.doctorId),
                appointment_date: data.appointmentDate,
                appointment_time: data.appointmentTime,
                appointment_type: data.appointmentType,
                reason: data.reason || '',
                patient_dob: data.patientDOB || patientDOB,
            }

            await apiPost('/appointments', appointmentData)

            toast.success('Appointment booked successfully!')
            setShowBookingModal(false)
            reset()
            // Refresh appointments list
            fetchAppointments()
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to book appointment'
            toast.error(errorMessage)
        } finally {
            setIsSubmitting(false)
        }
    }

    const fetchAppointments = async () => {
        try {
            const data = await apiGet('/appointments/my')
            setAppointments(data)
        } catch (error) {
            console.error('Error fetching appointments:', error)
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, [])

    // Time slots
    const timeSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
    ]

    // Appointment types
    const appointmentTypes = [
        'General Consultation',
        'Follow-up Visit',
        'Annual Physical',
        'Specialist Consultation',
        'Lab Results Review',
        'Prescription Renewal',
        'Other'
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Appointments</h1>
                    <p className="text-secondary-600 mt-1">View and book your medical appointments</p>
                </div>
                <Button
                    onClick={() => setShowBookingModal(true)}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Book Appointment
                </Button>
            </div>

            {/* Appointments List */}
            <Card>
                <CardHeader
                    title="Your Appointments"
                    subtitle="Upcoming and past appointments"
                />
                {appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                        <p className="text-secondary-600">No appointments yet</p>
                        <Button
                            onClick={() => setShowBookingModal(true)}
                            variant="outline"
                            className="mt-4"
                        >
                            Book Your First Appointment
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {appointments.map((apt) => (
                            <div
                                key={apt.id}
                                className="p-4 border border-secondary-200 rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-primary-50 rounded-lg">
                                            <Calendar className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-secondary-900">
                                                Dr. {apt.doctorName}
                                            </h3>
                                            <p className="text-sm text-secondary-600 mt-1">{apt.appointment_type}</p>
                                            <div className="flex gap-4 mt-2 text-sm text-secondary-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {apt.appointment_date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {apt.appointment_time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="info">Upcoming</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Booking Modal */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-secondary-900">Book an Appointment</h2>
                                <p className="text-secondary-600 text-sm mt-1">Fill in the details to schedule your visit</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowBookingModal(false)
                                    reset()
                                }}
                                className="text-secondary-400 hover:text-secondary-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Patient Information - Autofilled */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Patient Information (Auto-filled)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        leftIcon={<User className="w-5 h-5" />}
                                        error={errors.patientName?.message}
                                        {...register('patientName')}
                                        disabled
                                        className="bg-white"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        leftIcon={<Mail className="w-5 h-5" />}
                                        error={errors.patientEmail?.message}
                                        {...register('patientEmail')}
                                        disabled
                                        className="bg-white"
                                    />
                                </div>
                                {patientDOB && (
                                    <Input
                                        label="Date of Birth"
                                        leftIcon={<Cake className="w-5 h-5" />}
                                        value={patientDOB}
                                        disabled
                                        className="bg-white mt-4"
                                    />
                                )}
                                {!patientDOB && (
                                    <div className="mt-3 text-sm text-amber-700">
                                        <p>💡 Complete your <a href="/patient/intake-form" className="underline font-medium">intake form</a> to auto-fill DOB</p>
                                    </div>
                                )}
                            </div>

                            {/* Doctor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    <Stethoscope className="w-4 h-4 inline mr-2" />
                                    Select Doctor
                                </label>
                                <select
                                    {...register('doctorId')}
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Choose a doctor...</option>
                                    {doctors.map((doctor) => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.first_name} {doctor.last_name}
                                            {doctor.specialization && ` - ${doctor.specialization}`}
                                        </option>
                                    ))}
                                </select>
                                {errors.doctorId && (
                                    <p className="text-red-600 text-sm mt-1">{errors.doctorId.message}</p>
                                )}
                            </div>

                            {/* Appointment Type */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Appointment Type
                                </label>
                                <select
                                    {...register('appointmentType')}
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Select type...</option>
                                    {appointmentTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {errors.appointmentType && (
                                    <p className="text-red-600 text-sm mt-1">{errors.appointmentType.message}</p>
                                )}
                            </div>

                            {/* Date and Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        Appointment Date
                                    </label>
                                    <input
                                        type="date"
                                        {...register('appointmentDate')}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                    {errors.appointmentDate && (
                                        <p className="text-red-600 text-sm mt-1">{errors.appointmentDate.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        Appointment Time
                                    </label>
                                    <select
                                        {...register('appointmentTime')}
                                        className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">Select time...</option>
                                        {timeSlots.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.appointmentTime && (
                                        <p className="text-red-600 text-sm mt-1">{errors.appointmentTime.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Reason (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                    Reason for Visit (Optional)
                                </label>
                                <textarea
                                    {...register('reason')}
                                    rows={3}
                                    placeholder="Describe your symptoms or reason for visit..."
                                    className="w-full px-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    {isSubmitting ? 'Booking...' : 'Book Appointment'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowBookingModal(false)
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

export default PatientAppointments
