import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    User,
    Calendar,
    FileText,
    Code,
    CheckCircle,
    Search,
    Sparkles,
    Plus
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getEncounterDetails, assignMedicalCode, getEncounterCodes, completeCoding } from '@/services/clinicalService'
import { toast } from 'react-toastify'

const ClaimDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [encounter, setEncounter] = useState<any>(null)
    const [assignedCodes, setAssignedCodes] = useState<any[]>([])
    const [showCodeSearch, setShowCodeSearch] = useState(false)
    const [codeSearchQuery, setCodeSearchQuery] = useState('')
    const [selectedCodeType, setSelectedCodeType] = useState<'ICD-10' | 'CPT'>('ICD-10')

    // Mock ICD-10 and CPT codes for demo
    const icd10Codes = [
        { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
        { code: 'I10', description: 'Essential (primary) hypertension' },
        { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
        { code: 'M79.3', description: 'Panniculitis, unspecified' },
        { code: 'R07.9', description: 'Chest pain, unspecified' },
        { code: 'G43.909', description: 'Migraine, unspecified, not intractable, without status migrainosus' },
    ]

    const cptCodes = [
        { code: '99213', description: 'Office visit, established patient, 20-29 minutes' },
        { code: '99214', description: 'Office visit, established patient, 30-39 minutes' },
        { code: '93000', description: 'Electrocardiogram, routine ECG with interpretation' },
        { code: '70450', description: 'CT scan, head or brain' },
        { code: '99203', description: 'Office visit, new patient, 30-44 minutes' },
    ]

    useEffect(() => {
        loadEncounterData()
    }, [id])

    const loadEncounterData = async () => {
        try {
            setIsLoading(true)
            // In real app, fetch from API
            // const data = await getEncounterDetails(Number(id))

            // Mock data for demo
            const mockEncounter = {
                id: Number(id),
                encounter_date: '2024-12-08T09:00:00',
                patient_name: 'Sarah Mitchell',
                patient_age: 45,
                encounter_type: 'Office Visit',
                chief_complaint: 'Annual checkup, discussion of diabetes management',
                subjective_notes: 'Patient reports feeling well overall. Has been compliant with medications. Checking blood sugar regularly at home, averaging 110-130 mg/dL. No episodes of hypoglycemia. Diet compliance good.',
                objective_findings: 'BP: 128/82, HR: 72, Temp: 98.6°F, Weight: 145 lbs, BMI: 23.4. Physical exam unremarkable. No peripheral edema. Cardiovascular: Regular rate and rhythm.',
                assessment: 'Type 2 Diabetes Mellitus - well controlled. Hypertension - stable. Hyperlipidemia - on statin therapy.',
                plan: 'Continue current medications (Lisinopril 10mg daily, Metformin 500mg BID, Aspirin 81mg daily). HbA1c ordered. Follow-up in 3 months. Patient educated on foot care.',
                doctor_name: 'Dr. Emily Chen',
                status: 'pending_coding'
            }

            setEncounter(mockEncounter)

            // Load assigned codes
            // const codes = await getEncounterCodes(Number(id))
            setAssignedCodes([])
        } catch (error) {
            console.error('Error loading encounter:', error)
            toast.error('Failed to load encounter details')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAssignCode = async (code: string, description: string, isAiSuggested: boolean = false) => {
        try {
            const newCode = {
                encounter_id: Number(id),
                code_type: selectedCodeType,
                code,
                description,
                is_ai_suggested: isAiSuggested,
                confidence_score: isAiSuggested ? 0.92 : undefined
            }

            // In real app: await assignMedicalCode(Number(id), newCode)

            // Add to local state for demo
            setAssignedCodes([...assignedCodes, {
                ...newCode,
                id: assignedCodes.length + 1,
                coder_id: 1,
                created_at: new Date().toISOString()
            }])

            toast.success(`Code ${code} assigned successfully`)
            setShowCodeSearch(false)
            setCodeSearchQuery('')
        } catch (error) {
            console.error('Error assigning code:', error)
            toast.error('Failed to assign code')
        }
    }

    const handleCompleteCoding = async () => {
        if (assignedCodes.length === 0) {
            toast.error('Please assign at least one code before completing')
            return
        }

        try {
            // await completeCoding(Number(id))
            toast.success('Coding completed! Claim ready for billing.')
            setTimeout(() => {
                navigate('/coder/dashboard')
            }, 1500)
        } catch (error) {
            console.error('Error completing coding:', error)
            toast.error('Failed to complete coding')
        }
    }

    const getAISuggestions = () => {
        if (!encounter) return []

        // Simple AI suggestion logic based on keywords in assessment
        const suggestions = []
        const assessment = encounter.assessment?.toLowerCase() || ''

        if (assessment.includes('diabetes')) {
            suggestions.push({ ...icd10Codes[0], confidence: 0.95, isAi: true })
        }
        if (assessment.includes('hypertension')) {
            suggestions.push({ ...icd10Codes[1], confidence: 0.92, isAi: true })
        }

        // Suggest CPT based on encounter type
        if (encounter.encounter_type === 'Office Visit') {
            suggestions.push({ ...cptCodes[0], confidence: 0.88, isAi: true, code_type: 'CPT' })
        }

        return suggestions
    }

    const filteredCodes = selectedCodeType === 'ICD-10' ? icd10Codes : cptCodes
    const searchResults = codeSearchQuery
        ? filteredCodes.filter(c =>
            c.code.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(codeSearchQuery.toLowerCase())
        )
        : filteredCodes

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!encounter) {
        return <div className="flex items-center justify-center min-h-screen">Encounter not found</div>
    }

    const aiSuggestions = getAISuggestions()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/coder/dashboard')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Claims Queue
                    </Button>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={encounter.status === 'coded' ? 'success' : 'warning'}>
                        {encounter.status === 'coded' ? 'Coded' : 'Pending Coding'}
                    </Badge>
                    {assignedCodes.length > 0 && encounter.status !== 'coded' && (
                        <Button onClick={handleCompleteCoding} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Complete Coding
                        </Button>
                    )}
                </div>
            </div>

            {/* Patient & Encounter Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 mb-2">{encounter.patient_name}</h1>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-secondary-600">
                                <User className="w-4 h-4" />
                                <span>Age: {encounter.patient_age}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(encounter.encounter_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                                <FileText className="w-4 h-4" />
                                <span>{encounter.encounter_type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-secondary-600">
                                <User className="w-4 h-4" />
                                <span>{encounter.doctor_name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clinical Notes - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* AI Suggestions */}
                    {aiSuggestions.length > 0 && (
                        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <CardHeader
                                title="AI Code Suggestions"
                                subtitle="Based on clinical documentation"
                            />
                            <div className="space-y-2">
                                {aiSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-white rounded-lg border border-blue-200 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-semibold text-secondary-900">
                                                        {suggestion.code}
                                                    </span>
                                                    <Badge variant="info">
                                                        {Math.round((suggestion.confidence || 0) * 100)}% confidence
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-secondary-600">{suggestion.description}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAssignCode(suggestion.code, suggestion.description, true)}
                                        >
                                            Assign
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Chief Complaint */}
                    <Card>
                        <CardHeader title="Chief Complaint" />
                        <p className="text-secondary-900">{encounter.chief_complaint}</p>
                    </Card>

                    {/* SOAP Notes */}
                    <Card>
                        <CardHeader title="Clinical Documentation (SOAP)" />
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm text-blue-900 mb-2">SUBJECTIVE</h4>
                                <p className="text-secondary-700">{encounter.subjective_notes}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-green-900 mb-2">OBJECTIVE</h4>
                                <p className="text-secondary-700">{encounter.objective_findings}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-purple-900 mb-2">ASSESSMENT</h4>
                                <p className="text-secondary-700 font-medium">{encounter.assessment}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-orange-900 mb-2">PLAN</h4>
                                <p className="text-secondary-700">{encounter.plan}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Code Assignment - 1 column */}
                <div className="space-y-6">
                    {/* Assigned Codes */}
                    <Card>
                        <CardHeader
                            title="Assigned Codes"
                            subtitle={`${assignedCodes.length} codes assigned`}
                        />
                        <div className="space-y-2">
                            {assignedCodes.length === 0 ? (
                                <p className="text-sm text-secondary-500 text-center py-4">
                                    No codes assigned yet
                                </p>
                            ) : (
                                assignedCodes.map((code) => (
                                    <div
                                        key={code.id}
                                        className="p-3 bg-green-50 rounded-lg border border-green-200"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className="font-mono font-semibold text-green-900">
                                                {code.code}
                                            </span>
                                            <Badge variant={code.code_type === 'ICD-10' ? 'info' : 'success'}>
                                                {code.code_type}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-secondary-600">{code.description}</p>
                                        {code.is_ai_suggested && (
                                            <div className="flex items-center gap-1 mt-2">
                                                <Sparkles className="w-3 h-3 text-blue-600" />
                                                <span className="text-xs text-blue-600">AI Suggested</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Code Search */}
                    <Card>
                        <CardHeader title="Assign Codes" />
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedCodeType('ICD-10')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCodeType === 'ICD-10'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    ICD-10
                                </button>
                                <button
                                    onClick={() => setSelectedCodeType('CPT')}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCodeType === 'CPT'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    CPT
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={codeSearchQuery}
                                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                                    placeholder={`Search ${selectedCodeType} codes...`}
                                    className="pl-10"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {searchResults.map((code, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                                        onClick={() => handleAssignCode(code.code, code.description)}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-mono font-semibold text-secondary-900">
                                                {code.code}
                                            </span>
                                            <Plus className="w-4 h-4 text-primary-600" />
                                        </div>
                                        <p className="text-xs text-secondary-600">{code.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default ClaimDetailPage
