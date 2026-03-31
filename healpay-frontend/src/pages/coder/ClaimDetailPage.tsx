import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    User,
    Calendar,
    FileText,
    CheckCircle,
    Search,
    Sparkles,
    Plus,
    Trash2,
    Pencil,
    Send,
    X
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getEncounterDetails, assignMedicalCode, getEncounterCodes, completeCoding, getCodeRecommendations, searchCodes, deleteMedicalCode, updateMedicalCode, sendEncounterTo } from '@/services/clinicalService'
import { toast } from 'react-toastify'

const ClaimDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const [isLoading, setIsLoading] = useState(true)
    const [encounter, setEncounter] = useState<any>(null)
    const [assignedCodes, setAssignedCodes] = useState<any[]>([])
    const [aiRecommendations, setAiRecommendations] = useState<any>(null)
    const [loadingRecommendations, setLoadingRecommendations] = useState(false)
    const [showRecommendations, setShowRecommendations] = useState(false)
    const [recommendationError, setRecommendationError] = useState<string | null>(null)
    const [recommendationErrorType, setRecommendationErrorType] = useState<'validation' | 'service'>('service')
    const [codeSearchQuery, setCodeSearchQuery] = useState('')
    const [selectedCodeType, setSelectedCodeType] = useState<'ICD-10' | 'CPT'>('ICD-10')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [quickCodeEntry, setQuickCodeEntry] = useState('')
    const [quickCodeLoading, setQuickCodeLoading] = useState(false)

    // Edit/Delete state
    const [editingCode, setEditingCode] = useState<any>(null)
    const [editCodeValue, setEditCodeValue] = useState('')
    const [editDescriptionValue, setEditDescriptionValue] = useState('')
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
    const [sendingTo, setSendingTo] = useState<string | null>(null)

    useEffect(() => {
        loadEncounterData()
    }, [id])

    const loadEncounterData = async () => {
        try {
            setIsLoading(true)
            // Fetch from API
            const data = await getEncounterDetails(Number(id))
            setEncounter(data)

            // Load assigned codes
            const codes = await getEncounterCodes(Number(id))
            setAssignedCodes(codes || [])

            // Don't load AI recommendations automatically - let user request them
        } catch (error) {
            console.error('Error loading encounter:', error)
            toast.error('Failed to load encounter details. Make sure you are logged in.')
        } finally {
            setIsLoading(false)
        }
    }

    const loadRecommendations = async () => {
        try {
            setLoadingRecommendations(true)
            setRecommendationError(null)
            const recommendations = await getCodeRecommendations(Number(id))
            setAiRecommendations(recommendations)
            setShowRecommendations(true)
            toast.success('AI recommendations loaded successfully!')
        } catch (error: any) {
            console.error('Error loading recommendations:', error)
            const status = error?.response?.status
            const detail = error?.response?.data?.detail
            if (status === 422) {
                // Invalid / non-medical complaint
                setRecommendationErrorType('validation')
                setRecommendationError(detail || 'The chief complaint does not appear to be a valid medical condition.')
                toast.warn(detail || 'Please enter a valid medical chief complaint.')
            } else {
                setRecommendationErrorType('service')
                setRecommendationError(detail || 'Failed to load AI recommendations. The AI service may need initialization.')
                toast.error(detail || 'AI service error. Please try again.')
            }
        } finally {
            setLoadingRecommendations(false)
        }
    }

    const handleCodeSearch = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([])
            return
        }

        try {
            setSearchLoading(true)
            const codeTypeParam = selectedCodeType === 'ICD-10' ? 'ICD10_CM' : 'CPT'
            const response = await searchCodes(query, codeTypeParam, 50)
            setSearchResults(response.results || [])
        } catch (error) {
            console.error('Error searching codes:', error)
            setSearchResults([])
        } finally {
            setSearchLoading(false)
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleCodeSearch(codeSearchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [codeSearchQuery, selectedCodeType])

    const handleAssignCode = async (code: string, description: string, isAiSuggested: boolean = false, overrideCodeType?: string) => {
        try {
            // Normalize code_type → backend schema expects 'ICD-10' or 'CPT'
            const rawType = overrideCodeType || (selectedCodeType === 'ICD-10' ? 'ICD-10' : 'CPT')
            const finalCodeType = rawType === 'ICD10_CM' ? 'ICD-10' : rawType

            const newCodeData = {
                encounter_id: Number(id),
                code_type: finalCodeType,
                code,
                description,
                is_ai_suggested: isAiSuggested,
                confidence_score: isAiSuggested ? 0.92 : undefined
            }

            await assignMedicalCode(Number(id), newCodeData)

            // Refresh codes from server
            const codes = await getEncounterCodes(Number(id))
            setAssignedCodes(codes || [])

            toast.success(`Code ${code} assigned successfully`)
            setCodeSearchQuery('')
        } catch (error) {
            console.error('Error assigning code:', error)
            toast.error('Failed to assign code')
        }
    }

    const handleQuickCodeEntry = async () => {
        if (!quickCodeEntry.trim()) {
            toast.error('Please enter a code')
            return
        }

        try {
            setQuickCodeLoading(true)
            const codeTypeParam = selectedCodeType === 'ICD-10' ? 'ICD10_CM' : 'CPT'
            const response = await searchCodes(quickCodeEntry.trim(), codeTypeParam, 1)

            if (response.results && response.results.length > 0) {
                const code = response.results[0]
                await handleAssignCode(code.code, code.description, false, code.code_type)
                setQuickCodeEntry('')
            } else {
                toast.error(`Code "${quickCodeEntry}" not found in ${selectedCodeType} library`)
            }
        } catch (error) {
            console.error('Error adding quick code:', error)
            toast.error('Failed to add code')
        } finally {
            setQuickCodeLoading(false)
        }
    }

    const handleCompleteCoding = async () => {
        if (assignedCodes.length === 0) {
            toast.error('Please assign at least one code before completing')
            return
        }

        try {
            await completeCoding(Number(id))
            toast.success('Coding completed! Claim ready for billing.')
            setTimeout(() => {
                navigate('/coder/dashboard')
            }, 1500)
        } catch (error) {
            console.error('Error completing coding:', error)
            toast.error('Failed to complete coding')
        }
    }

    // Handle delete code
    const handleDeleteCode = async (codeId: number) => {
        try {
            await deleteMedicalCode(Number(id), codeId)
            const codes = await getEncounterCodes(Number(id))
            setAssignedCodes(codes || [])
            toast.success('Code deleted successfully')
            setDeleteConfirmId(null)
        } catch (error) {
            console.error('Error deleting code:', error)
            toast.error('Failed to delete code')
        }
    }

    // Handle edit code
    const handleEditCode = async () => {
        if (!editingCode) return

        try {
            await updateMedicalCode(Number(id), editingCode.id, {
                encounter_id: Number(id),
                code_type: editingCode.code_type,
                code: editCodeValue,
                description: editDescriptionValue,
                is_ai_suggested: false,
                confidence_score: undefined
            })
            const codes = await getEncounterCodes(Number(id))
            setAssignedCodes(codes || [])
            toast.success('Code updated successfully')
            setEditingCode(null)
        } catch (error) {
            console.error('Error updating code:', error)
            toast.error('Failed to update code')
        }
    }

    // Handle send to biller/doctor
    const handleSendTo = async (target: 'biller' | 'doctor') => {
        try {
            setSendingTo(target)
            await sendEncounterTo(Number(id), target)
            toast.success(`Encounter sent to ${target} successfully!`)
            // Reload encounter to update status
            const data = await getEncounterDetails(Number(id))
            setEncounter(data)
        } catch (error) {
            console.error('Error sending encounter:', error)
            toast.error(`Failed to send to ${target}`)
        } finally {
            setSendingTo(null)
        }
    }

    // Open edit modal
    const openEditModal = (code: any) => {
        setEditingCode(code)
        setEditCodeValue(code.code)
        setEditDescriptionValue(code.description)
    }



    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!encounter) {
        return <div className="flex items-center justify-center min-h-screen">Encounter not found</div>
    }

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Clinical Notes - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Optional AI Recommendations Button */}
                    {!showRecommendations && !loadingRecommendations && !recommendationError && (
                        <Card className="border-2 border-dashed border-blue-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                                        AI-Powered Code Recommendations (Optional)
                                    </h3>
                                    <p className="text-sm text-secondary-600">
                                        Get intelligent code suggestions based on clinical documentation
                                    </p>
                                </div>
                                <Button
                                    onClick={loadRecommendations}
                                    className="flex items-center gap-2"
                                    variant="outline"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Get AI Recommendations
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Recommendation Error State */}
                    {recommendationError && (
                        <Card className={`border-2 ${recommendationErrorType === 'validation'
                            ? 'border-amber-300 bg-amber-50'
                            : 'border-red-200 bg-red-50'}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className={`text-lg font-semibold mb-1 ${recommendationErrorType === 'validation'
                                        ? 'text-amber-900'
                                        : 'text-red-900'}`}
                                    >
                                        {recommendationErrorType === 'validation' ? '⚠️ Invalid Chief Complaint' : '❌ Recommendation Error'}
                                    </h3>
                                    <p className={`text-sm mb-3 ${recommendationErrorType === 'validation'
                                        ? 'text-amber-800'
                                        : 'text-red-700'}`}
                                    >
                                        {recommendationError}
                                    </p>
                                    {recommendationErrorType === 'validation' && (
                                        <p className="text-xs text-amber-700">
                                            Examples of valid complaints: <em>chest pain, shortness of breath, fever, headache, abdominal pain</em>
                                        </p>
                                    )}
                                </div>
                                {recommendationErrorType === 'service' && (
                                    <Button
                                        onClick={loadRecommendations}
                                        className="flex items-center gap-2 ml-4"
                                        variant="outline"
                                        size="sm"
                                    >
                                        Retry
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Loading state for recommendations */}
                    {loadingRecommendations && (
                        <Card className="border-2 border-blue-200">
                            <div className="flex items-center gap-3 text-blue-600">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                                <div>
                                    <span className="font-medium">AI engine is loading…</span>
                                    <p className="text-xs text-blue-500 mt-0.5">First load can take up to 2 minutes. Please wait.</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* AI Recommendations - ICD-10 */}
                    {showRecommendations && aiRecommendations && aiRecommendations.icd10_recommendations?.length > 0 && (
                        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <CardHeader
                                title="AI Diagnosis Code Recommendations (ICD-10)"
                                subtitle={`${aiRecommendations.icd10_recommendations.length} codes recommended by Medical AI`}
                            />
                            <div className="space-y-2">
                                {aiRecommendations.icd10_recommendations.map((rec: any, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Sparkles className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-mono font-bold text-lg text-secondary-900">
                                                            {rec.code}
                                                        </span>
                                                        <Badge variant="info">
                                                            {Math.round(rec.confidence_score * 100)}% confidence
                                                        </Badge>
                                                        <Badge variant="secondary">ICD-10</Badge>
                                                    </div>
                                                    <p className="text-sm text-secondary-700 font-medium mb-2">{rec.description}</p>
                                                    <div className="text-xs text-secondary-600 space-y-1">
                                                        <p>📊 {rec.explanation}</p>
                                                        {rec.matched_keywords?.length > 0 && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span>🔍 Keywords:</span>
                                                                {rec.matched_keywords.map((kw: string, i: number) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAssignCode(rec.code, rec.description, true, 'ICD-10')}
                                                className="ml-3 flex-shrink-0"
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* AI Recommendations - CPT */}
                    {showRecommendations && aiRecommendations && aiRecommendations.cpt_recommendations?.length > 0 && (
                        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
                            <CardHeader
                                title="AI Procedure Code Recommendations (CPT)"
                                subtitle={`${aiRecommendations.cpt_recommendations.length} codes recommended by Medical AI`}
                            />
                            <div className="space-y-2">
                                {aiRecommendations.cpt_recommendations.map((rec: any, index: number) => (
                                    <div
                                        key={index}
                                        className="p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <Sparkles className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                        <span className="font-mono font-bold text-lg text-secondary-900">
                                                            {rec.code}
                                                        </span>
                                                        <Badge variant="success">
                                                            {Math.round(rec.confidence_score * 100)}% confidence
                                                        </Badge>
                                                        <Badge variant="secondary">CPT</Badge>
                                                    </div>
                                                    <p className="text-sm text-secondary-700 font-medium mb-2">{rec.description}</p>
                                                    <div className="text-xs text-secondary-600 space-y-1">
                                                        <p>📊 {rec.explanation}</p>
                                                        {rec.matched_keywords?.length > 0 && (
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span>🔍 Keywords:</span>
                                                                {rec.matched_keywords.map((kw: string, i: number) => (
                                                                    <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAssignCode(rec.code, rec.description, true, 'CPT')}
                                                className="ml-3 flex-shrink-0"
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Loading state for recommendations */}
                    {loadingRecommendations && (
                        <Card className="border-2 border-blue-200">
                            <div className="flex items-center gap-3 text-blue-600">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                                <div>
                                    <span className="font-medium">AI engine is loading…</span>
                                    <p className="text-xs text-blue-500 mt-0.5">First load can take up to 2 minutes. Please wait.</p>
                                </div>
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
                    {/* Send To Actions (after coding complete) */}
                    {(encounter.status === 'coded' || encounter.status === 'sent_to_biller' || encounter.status === 'sent_to_doctor') && (
                        <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200">
                            <CardHeader
                                title="Send Completed Encounter"
                                subtitle="Route to biller or doctor for review"
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleSendTo('biller')}
                                    disabled={sendingTo !== null || encounter.status === 'sent_to_biller'}
                                    className="flex-1 flex items-center justify-center gap-2"
                                    variant={encounter.status === 'sent_to_biller' ? 'secondary' : 'primary'}
                                >
                                    <Send className="w-4 h-4" />
                                    {encounter.status === 'sent_to_biller' ? 'Sent to Biller ✓' : 'Send to Biller'}
                                </Button>
                                <Button
                                    onClick={() => handleSendTo('doctor')}
                                    disabled={sendingTo !== null || encounter.status === 'sent_to_doctor'}
                                    variant={encounter.status === 'sent_to_doctor' ? 'secondary' : 'outline'}
                                    className="flex-1 flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {encounter.status === 'sent_to_doctor' ? 'Sent to Doctor ✓' : 'Send to Doctor'}
                                </Button>
                            </div>
                        </Card>
                    )}

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
                                        className="p-3 bg-green-50 rounded-lg border border-green-200 relative"
                                    >
                                        {/* Delete Confirmation Overlay */}
                                        {deleteConfirmId === code.id && (
                                            <div className="absolute inset-0 bg-red-50 bg-opacity-95 rounded-lg flex items-center justify-center gap-3 z-10">
                                                <span className="text-sm font-medium text-red-700">Delete this code?</span>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteCode(code.id)}
                                                >
                                                    Yes, Delete
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setDeleteConfirmId(null)}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex items-start justify-between mb-1">
                                            <span className="font-mono font-semibold text-green-900">
                                                {code.code}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={code.code_type === 'ICD-10' || code.code_type === 'ICD10_CM' ? 'info' : 'success'}>
                                                    {code.code_type === 'ICD10_CM' ? 'ICD-10' : code.code_type}
                                                </Badge>
                                                {/* Action Buttons */}
                                                <button
                                                    onClick={() => openEditModal(code)}
                                                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                                                    title="Edit code"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(code.id)}
                                                    className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                                    title="Delete code"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
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

                    {/* Quick Code Entry */}
                    <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
                        <CardHeader title="Quick Add Code" subtitle="Enter code directly" />
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

                            <div className="flex gap-2">
                                <Input
                                    value={quickCodeEntry}
                                    onChange={(e) => setQuickCodeEntry(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleQuickCodeEntry()}
                                    placeholder={selectedCodeType === 'ICD-10' ? 'e.g., E11.9' : 'e.g., 99213'}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleQuickCodeEntry}
                                    disabled={quickCodeLoading || !quickCodeEntry.trim()}
                                    className="flex items-center gap-2"
                                >
                                    {quickCodeLoading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    Add
                                </Button>
                            </div>
                            <p className="text-xs text-secondary-600">
                                💡 Tip: Type the exact code and press Enter or click Add
                            </p>
                        </div>
                    </Card>

                    {/* Code Search */}
                    <Card>
                        <CardHeader title="Search Code Library" subtitle="Find codes by description" />
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={codeSearchQuery}
                                    onChange={(e) => setCodeSearchQuery(e.target.value)}
                                    placeholder={`Search ${selectedCodeType} codes by description...`}
                                    className="pl-10"
                                />
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {searchLoading ? (
                                    <div className="text-center py-8 text-secondary-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                                        <p className="text-sm">Searching code library...</p>
                                    </div>
                                ) : searchResults.length === 0 && codeSearchQuery.length >= 2 ? (
                                    <div className="text-center py-8 text-secondary-500">
                                        <p className="text-sm">No codes found for "{codeSearchQuery}"</p>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <div className="text-center py-8 text-secondary-500">
                                        <p className="text-sm font-medium mb-1">Search full code library</p>
                                        <p className="text-xs">Type to search from thousands of medical codes</p>
                                    </div>
                                ) : (
                                    searchResults.map((code, index) => (
                                        <div
                                            key={index}
                                            className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                                            onClick={() => handleAssignCode(code.code, code.description, false, code.code_type)}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono font-semibold text-secondary-900">
                                                    {code.code}
                                                </span>
                                                <Plus className="w-4 h-4 text-primary-600" />
                                            </div>
                                            <p className="text-xs text-secondary-600">{code.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Edit Code Modal */}
            {editingCode && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-secondary-900">Edit Medical Code</h3>
                            <button
                                onClick={() => setEditingCode(null)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    Code Type
                                </label>
                                <Badge variant={editingCode.code_type === 'ICD10_CM' || editingCode.code_type === 'ICD-10' ? 'info' : 'success'}>
                                    {editingCode.code_type === 'ICD10_CM' ? 'ICD-10' : editingCode.code_type}
                                </Badge>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    Code
                                </label>
                                <Input
                                    value={editCodeValue}
                                    onChange={(e) => setEditCodeValue(e.target.value)}
                                    placeholder="e.g., E11.9"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editDescriptionValue}
                                    onChange={(e) => setEditDescriptionValue(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setEditingCode(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditCode}
                                className="flex-1"
                                disabled={!editCodeValue.trim() || !editDescriptionValue.trim()}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ClaimDetailPage
