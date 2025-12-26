import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { createClinicalEncounter } from '@/services/clinicalService'
import { toast } from 'react-toastify'

interface AddNoteModalProps {
    patientId: number
    patientName: string
    onClose: () => void
    onSuccess?: () => void
}

const AddNoteModal = ({ patientId, patientName, onClose, onSuccess }: AddNoteModalProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        encounter_type: 'Office Visit',
        chief_complaint: '',
        subjective_notes: '',
        objective_findings: '',
        assessment: '',
        plan: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.chief_complaint || !formData.assessment) {
            toast.error('Please fill in Chief Complaint and Assessment')
            return
        }

        setIsLoading(true)
        try {
            await createClinicalEncounter({
                patient_id: patientId,
                ...formData
            })

            toast.success('Clinical note saved successfully!')
            onSuccess?.()
            onClose()
        } catch (error: any) {
            console.error('Error saving clinical note:', error)
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)

            const errorMessage = error.response?.data?.detail || error.message || 'Failed to save clinical note'
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
                className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary-900">Add Clinical Note</h2>
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
                    {/* Encounter Type */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Encounter Type *
                        </label>
                        <select
                            value={formData.encounter_type}
                            onChange={(e) => setFormData({ ...formData, encounter_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="Office Visit">Office Visit</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Annual Checkup">Annual Checkup</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>

                    {/* Chief Complaint */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Chief Complaint * <span className="text-xs text-gray-500">(Main reason for visit)</span>
                        </label>
                        <Input
                            value={formData.chief_complaint}
                            onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                            placeholder="e.g., Chest pain, Headache, Follow-up for diabetes"
                            required
                        />
                    </div>

                    {/* Subjective (SOAP) */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Subjective <span className="text-xs text-gray-500">(Patient's description)</span>
                        </label>
                        <textarea
                            value={formData.subjective_notes}
                            onChange={(e) => setFormData({ ...formData, subjective_notes: e.target.value })}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Patient reports..."
                        />
                    </div>

                    {/* Objective (SOAP) */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Objective <span className="text-xs text-gray-500">(Doctor's observations)</span>
                        </label>
                        <textarea
                            value={formData.objective_findings}
                            onChange={(e) => setFormData({ ...formData, objective_findings: e.target.value })}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Physical examination findings, vital signs..."
                        />
                    </div>

                    {/* Assessment (SOAP) */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Assessment * <span className="text-xs text-gray-500">(Diagnosis)</span>
                        </label>
                        <textarea
                            value={formData.assessment}
                            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Diagnosis and clinical impression..."
                            required
                        />
                    </div>

                    {/* Plan (SOAP) */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Plan <span className="text-xs text-gray-500">(Treatment plan)</span>
                        </label>
                        <textarea
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Treatment recommendations, medications, follow-up..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Clinical Note'}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default AddNoteModal
