import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { toast } from 'react-toastify'
import { apiPost } from '@/services/api'

interface ScheduleFollowupModalProps {
    patientId: number
    patientName: string
    onClose: () => void
    onSuccess?: () => void
}

const ScheduleFollowupModal = ({ patientId, patientName, onClose, onSuccess }: ScheduleFollowupModalProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        appointment_date: '',
        appointment_time: '',
        appointment_type: 'Follow-up',
        reason: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.appointment_date || !formData.appointment_time) {
            toast.error('Please select date and time')
            return
        }

        setIsLoading(true)
        try {
            // Get current user (doctor) from localStorage
            const userStr = localStorage.getItem('user')
            const currentUser = userStr ? JSON.parse(userStr) : null

            if (!currentUser) {
                toast.error('User not authenticated')
                return
            }

            await apiPost('/v1/appointments', {
                user_id: patientId,
                doctor_id: currentUser.id,
                appointment_date: formData.appointment_date,
                appointment_time: formData.appointment_time,
                appointment_type: formData.appointment_type,
                reason: formData.reason,
                patient_dob: '',
                status: 'scheduled'
            })

            toast.success('Follow-up appointment scheduled successfully!')
            onSuccess?.()
            onClose()
        } catch (error: any) {
            console.error('Error scheduling follow-up:', error)
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to schedule follow-up'
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary-900">Schedule Follow-up</h2>
                        <p className="text-sm text-secondary-600 mt-1">Patient: {patientName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Appointment Type */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Appointment Type *
                        </label>
                        <select
                            value={formData.appointment_type}
                            onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="Follow-up">Follow-up</option>
                            <option value="General Consultation">General Consultation</option>
                            <option value="Annual Checkup">Annual Checkup</option>
                            <option value="Specialist Consultation">Specialist Consultation</option>
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Appointment Date *
                        </label>
                        <Input
                            type="date"
                            value={formData.appointment_date}
                            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Appointment Time *
                        </label>
                        <select
                            value={formData.appointment_time}
                            onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required
                        >
                            <option value="">Select time</option>
                            <option value="09:00 AM">09:00 AM</option>
                            <option value="09:30 AM">09:30 AM</option>
                            <option value="10:00 AM">10:00 AM</option>
                            <option value="10:30 AM">10:30 AM</option>
                            <option value="11:00 AM">11:00 AM</option>
                            <option value="11:30 AM">11:30 AM</option>
                            <option value="12:00 PM">12:00 PM</option>
                            <option value="02:00 PM">02:00 PM</option>
                            <option value="02:30 PM">02:30 PM</option>
                            <option value="03:00 PM">03:00 PM</option>
                            <option value="03:30 PM">03:30 PM</option>
                            <option value="04:00 PM">04:00 PM</option>
                            <option value="04:30 PM">04:30 PM</option>
                            <option value="05:00 PM">05:00 PM</option>
                        </select>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Reason for Follow-up
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Optional notes about this follow-up appointment..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default ScheduleFollowupModal
