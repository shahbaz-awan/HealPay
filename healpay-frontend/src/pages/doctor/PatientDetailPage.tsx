import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    AlertCircle,
    Pill,
    Activity,
    FileText,
    Clock,
    ArrowLeft,
    Edit,
    UserPlus,
    Heart,
    Droplet,
    Thermometer,
    Weight,
    Send,
    CheckCircle,
    ClipboardList
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet } from '@/services/api'
import { getPatientEncounters, submitEncounterForCoding } from '@/services/clinicalService'
import AddNoteModal from '@/components/modals/AddNoteModal'
import ScheduleFollowupModal from '@/components/modals/ScheduleFollowupModal'
import { toast } from 'react-toastify'

const PatientDetailPage = () => {
    const navigate = useNavigate()
    const { id: userId } = useParams()
    const [showAddNoteModal, setShowAddNoteModal] = useState(false)
    const [showFollowupModal, setShowFollowupModal] = useState(false)
    const [patientData, setPatientData] = useState<any>(null)
    const [intakeData, setIntakeData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [encounters, setEncounters] = useState<any[]>([])
    const [submittingId, setSubmittingId] = useState<number | null>(null)

    // Fetch patient basic info and intake form
    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                // Fetch user basic info via doctor-accessible endpoint
                const patient = await apiGet(`/v1/appointments/patients/${userId}`)

                if (!patient) {
                    console.error('Patient not found')
                    setIsLoading(false)
                    return
                }

                setPatientData(patient)

                // Fetch patient intake data
                try {
                    const intake = await apiGet(`/v1/patient-intake/${userId}`)
                    setIntakeData(intake)
                } catch (intakeError: any) {
                    // Intake might not exist yet - that's okay
                    console.log('No intake data found for patient')
                }

                // Fetch clinical encounters
                try {
                    const encs = await getPatientEncounters(parseInt(userId!))
                    setEncounters(encs || [])
                } catch {
                    console.log('No encounters found for patient')
                }
            } catch (error) {
                console.error('Error fetching patient details:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (userId) {
            fetchPatientDetails()
        }
    }, [userId])

    const getSeverityBadge = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'severe':
                return <Badge variant="danger">{severity}</Badge>
            case 'moderate':
                return <Badge variant="warning">{severity}</Badge>
            default:
                return <Badge variant="info">{severity}</Badge>
        }
    }

    const handleNoteSuccess = async () => {
        // Refresh encounters list
        try {
            const encs = await getPatientEncounters(parseInt(userId || '0'))
            setEncounters(encs || [])
        } catch {
            console.log('Could not refresh encounters')
        }
    }

    const handleSubmitForCoding = async (encounterId: number) => {
        setSubmittingId(encounterId)
        try {
            await submitEncounterForCoding(encounterId)
            toast.success('Encounter submitted to coding queue!')
            // Refresh list
            const encs = await getPatientEncounters(parseInt(userId || '0'))
            setEncounters(encs || [])
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to submit for coding')
        } finally {
            setSubmittingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-secondary-600">Loading patient details...</p>
                </div>
            </div>
        )
    }

    if (!patientData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2">Patient Not Found</h2>
                    <p className="text-secondary-600 mb-4">Unable to find patient details</p>
                    <Button onClick={() => navigate('/doctor/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    // Calculate age from DOB
    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A'
        const birthDate = new Date(dob)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    const fullName = `${patientData.first_name || ''} ${patientData.last_name || ''}`.trim() || 'Patient'
    const age = intakeData?.date_of_birth ? calculateAge(intakeData.date_of_birth) : 'N/A'

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/doctor/dashboard')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowAddNoteModal(true)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Add Clinical Note
                    </Button>
                    <Button
                        onClick={() => setShowFollowupModal(true)}
                        className="flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Schedule Follow-up
                    </Button>
                </div>
            </div>

            {/* Patient Header Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-secondary-900">{fullName}</h1>
                            <Badge variant="info">Patient ID: #{patientData.id}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-secondary-600">
                                <Calendar className="w-4 h-4" />
                                <span>{age} years old{intakeData?.date_of_birth && ` • DOB: ${intakeData.date_of_birth}`}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                                <Phone className="w-4 h-4" />
                                <span>{intakeData?.phone_primary || patientData.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                                <Mail className="w-4 h-4" />
                                <span>{patientData.email}</span>
                            </div>
                            {intakeData?.address_line1 && (
                                <div className="flex items-center gap-2 text-secondary-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{intakeData.address_line1}, {intakeData.city}, {intakeData.state} {intakeData.zip_code}</span>
                                </div>
                            )}
                            {intakeData?.gender && (
                                <div className="flex items-center gap-2 text-secondary-600">
                                    <User className="w-4 h-4" />
                                    <span>{intakeData.gender}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {!intakeData ? (
                <Card>
                    <div className="text-center py-12">
                        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Intake Form Completed</h3>
                        <p className="text-secondary-600">Patient has not filled out their medical intake form yet.</p>
                    </div>
                </Card>
            ) : (
                /* Main Content Grid */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Medical Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Allergies */}
                        <Card>
                            <CardHeader
                                title="Allergies"
                                subtitle="Critical medical alert"
                                icon={<AlertCircle className="w-5 h-5 text-red-600" />}
                            />
                            {intakeData.allergies ? (
                                <div className="space-y-3">
                                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                        <p className="text-sm text-red-900 whitespace-pre-wrap">{intakeData.allergies}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-secondary-500">No known allergies</p>
                            )}
                        </Card>

                        {/* Current Medications */}
                        <Card>
                            <CardHeader
                                title="Current Medications"
                                subtitle="Active prescriptions"
                                icon={<Pill className="w-5 h-5 text-blue-600" />}
                            />
                            {intakeData.current_medications ? (
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-secondary-900 whitespace-pre-wrap">{intakeData.current_medications}</p>
                                </div>
                            ) : (
                                <p className="text-secondary-500">No current medications</p>
                            )}
                        </Card>

                        {/* Medical History */}
                        <Card>
                            <CardHeader
                                title="Medical History"
                                subtitle="Conditions and past surgeries"
                            />
                            <div className="space-y-4">
                                {intakeData.chronic_conditions && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-secondary-700 mb-2">Chronic Conditions</h4>
                                        <div className="p-3 bg-yellow-50 border-l-2 border-yellow-500 rounded">
                                            <p className="text-sm text-yellow-900 whitespace-pre-wrap">{intakeData.chronic_conditions}</p>
                                        </div>
                                    </div>
                                )}
                                {intakeData.past_surgeries && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-secondary-700 mb-2">Past Surgeries</h4>
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-secondary-900 whitespace-pre-wrap">{intakeData.past_surgeries}</p>
                                        </div>
                                    </div>
                                )}
                                {intakeData.family_medical_history && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-secondary-700 mb-2">Family History</h4>
                                        <div className="p-3 bg-purple-50 border-l-2 border-purple-500 rounded">
                                            <p className="text-sm text-purple-900 whitespace-pre-wrap">{intakeData.family_medical_history}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column - Summary Cards */}
                    <div className="space-y-6">
                        {/* Insurance Information */}
                        {intakeData.insurance_provider_primary && (
                            <Card>
                                <CardHeader title="Insurance" subtitle="Primary coverage" />
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Provider</span>
                                        <p className="text-sm font-semibold text-secondary-900">{intakeData.insurance_provider_primary}</p>
                                    </div>
                                    {intakeData.insurance_policy_number_primary && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-600 uppercase">Policy Number</span>
                                            <p className="text-sm text-secondary-900">{intakeData.insurance_policy_number_primary}</p>
                                        </div>
                                    )}
                                    {intakeData.insurance_group_number_primary && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-600 uppercase">Group Number</span>
                                            <p className="text-sm text-secondary-900">{intakeData.insurance_group_number_primary}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Emergency Contact */}
                        {intakeData.emergency_contact_name && (
                            <Card>
                                <CardHeader title="Emergency Contact" subtitle="In case of emergency" />
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Name</span>
                                        <p className="text-sm font-semibold text-secondary-900">{intakeData.emergency_contact_name}</p>
                                    </div>
                                    {intakeData.emergency_contact_relationship && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-600 uppercase">Relationship</span>
                                            <p className="text-sm text-secondary-900">{intakeData.emergency_contact_relationship}</p>
                                        </div>
                                    )}
                                    {intakeData.emergency_contact_phone && (
                                        <div>
                                            <span className="text-xs font-medium text-gray-600 uppercase">Phone</span>
                                            <p className="text-sm text-secondary-900">{intakeData.emergency_contact_phone}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        {/* Social History */}
                        <Card>
                            <CardHeader title="Social History" subtitle="Lifestyle factors" />
                            <div className="space-y-3">
                                {intakeData.tobacco_use && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Tobacco Use</span>
                                        <p className="text-sm text-secondary-900">{intakeData.tobacco_use}</p>
                                    </div>
                                )}
                                {intakeData.alcohol_use && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Alcohol Use</span>
                                        <p className="text-sm text-secondary-900">{intakeData.alcohol_use}</p>
                                    </div>
                                )}
                                {intakeData.exercise_frequency && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Exercise</span>
                                        <p className="text-sm text-secondary-900">{intakeData.exercise_frequency}</p>
                                    </div>
                                )}
                                {intakeData.occupation && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-600 uppercase">Occupation</span>
                                        <p className="text-sm text-secondary-900">{intakeData.occupation}</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Review of Systems */}
                        <Card>
                            <CardHeader title="Review of Systems" subtitle="Current conditions" />
                            <div className="space-y-2">
                                {intakeData.has_diabetes && (
                                    <div className="p-2 bg-yellow-50 rounded flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-yellow-600" />
                                        <span className="text-sm text-yellow-900">Diabetes</span>
                                    </div>
                                )}
                                {intakeData.has_hypertension && (
                                    <div className="p-2 bg-red-50 rounded flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-600" />
                                        <span className="text-sm text-red-900">Hypertension</span>
                                    </div>
                                )}
                                {intakeData.has_heart_disease && (
                                    <div className="p-2 bg-red-50 rounded flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-red-600" />
                                        <span className="text-sm text-red-900">Heart Disease</span>
                                    </div>
                                )}
                                {intakeData.has_asthma && (
                                    <div className="p-2 bg-blue-50 rounded flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm text-blue-900">Asthma</span>
                                    </div>
                                )}
                                {intakeData.has_cancer && (
                                    <div className="p-2 bg-purple-50 rounded flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm text-purple-900">Cancer History</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Clinical Encounters Section */}
            <Card>
                <CardHeader
                    title="Clinical Encounters"
                    subtitle="All visits and their coding status"
                    icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
                />
                {encounters.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-secondary-500">No clinical encounters yet. Add a clinical note to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {encounters.map((enc: any) => (
                            <div key={enc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-medium text-secondary-900">
                                            {enc.encounter_type || 'Office Visit'}
                                        </span>
                                        <Badge
                                            variant={
                                                enc.status === 'pending_coding' ? 'warning' :
                                                enc.status === 'coded' ? 'info' :
                                                enc.status === 'sent_to_biller' ? 'success' :
                                                enc.status === 'sent_to_doctor' ? 'success' : 'info'
                                            }
                                        >
                                            {enc.status === 'pending_coding' ? 'Pending Coding' :
                                             enc.status === 'coded' ? 'Coded' :
                                             enc.status === 'sent_to_biller' ? 'Sent to Biller' :
                                             enc.status === 'sent_to_doctor' ? 'Sent to Doctor' :
                                             enc.status}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-secondary-600">
                                        <span className="font-medium">Chief Complaint:</span> {enc.chief_complaint || '—'}
                                    </p>
                                    {enc.assessment && (
                                        <p className="text-sm text-secondary-500 mt-1">
                                            <span className="font-medium">Assessment:</span> {enc.assessment}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-400">
                                            {enc.encounter_date ? new Date(enc.encounter_date).toLocaleDateString() : 'Today'}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    {enc.status === 'pending_coding' ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSubmitForCoding(enc.id)}
                                            disabled={submittingId === enc.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <Send className="w-4 h-4" />
                                            {submittingId === enc.id ? 'Submitting...' : 'Submit for Coding'}
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>In Workflow</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Add Note Modal */}
            {showAddNoteModal && (
                <AddNoteModal
                    patientId={parseInt(userId || '0')}
                    patientName={fullName}
                    onClose={() => setShowAddNoteModal(false)}
                    onSuccess={handleNoteSuccess}
                />
            )}

            {/* Schedule Follow-up Modal */}
            {showFollowupModal && (
                <ScheduleFollowupModal
                    patientId={parseInt(userId || '0')}
                    patientName={fullName}
                    onClose={() => setShowFollowupModal(false)}
                    onSuccess={() => {
                        console.log('Follow-up appointment scheduled')
                    }}
                />
            )}
        </div>
    )
}

export default PatientDetailPage
