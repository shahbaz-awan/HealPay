import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, Save, Loader2, ShieldAlert, ShieldCheck, Shield, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { getEncounterDetails, getEncounterCodes } from '@/services/clinicalService'
import { analyzeClaimRisk, createClaim, ClaimRiskResult } from '@/services/billingService'
import { toast } from 'react-toastify'

const CMS1500Form = () => {
    const navigate = useNavigate()
    const { encounterId } = useParams<{ encounterId?: string }>()
    const formRef = useRef<HTMLDivElement>(null)
    const [autoFillLoading, setAutoFillLoading] = useState(false)
    const [autoFillError, setAutoFillError] = useState<string | null>(null)

    // Risk analyzer state
    const [riskResult, setRiskResult] = useState<ClaimRiskResult | null>(null)
    const [riskLoading, setRiskLoading] = useState(false)
    const [riskError, setRiskError] = useState<string | null>(null)
    const [showPassedChecks, setShowPassedChecks] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)

    const [formData, setFormData] = useState({
        // Box 1 - Insurance Type
        insuranceType: '',
        // Box 1a - Insured ID
        insuredId: '',
        // Box 2 - Patient Name
        patientLastName: '',
        patientFirstName: '',
        patientMiddle: '',
        // Box 3 - Patient DOB & Sex
        patientDOB: '',
        patientSex: '',
        // Box 4 - Insured Name
        insuredLastName: '',
        insuredFirstName: '',
        insuredMiddle: '',
        // Box 5 - Patient Address
        patientStreet: '',
        patientCity: '',
        patientState: '',
        patientZip: '',
        patientPhone: '',
        // Box 6 - Patient Relationship
        patientRelationship: '',
        // Box 7 - Insured Address
        insuredStreet: '',
        insuredCity: '',
        insuredState: '',
        insuredZip: '',
        insuredPhone: '',
        // Box 8 - Reserved
        // Box 9 - Other Insured Name
        otherInsuredName: '',
        // Box 9a - Other Insured Policy
        otherInsuredPolicy: '',
        // Box 10 - Condition Related To
        conditionEmployment: false,
        conditionAutoAccident: false,
        conditionAutoState: '',
        conditionOtherAccident: false,
        // Box 11 - Insured Policy/Group
        insuredPolicy: '',
        // Box 11a - Insured DOB & Sex
        insuredDOB: '',
        insuredSex: '',
        // Box 11b - Other Claim ID
        otherClaimId: '',
        // Box 11c - Insurance Plan Name
        insurancePlanName: '',
        // Box 11d - Another Health Benefit
        anotherHealthBenefit: '',
        // Box 12 - Patient Signature
        patientSignature: 'SIGNATURE ON FILE',
        patientSignatureDate: '',
        // Box 13 - Insured Signature
        insuredSignature: 'SIGNATURE ON FILE',
        // Box 14 - Date of Current Illness
        dateOfIllness: '',
        illnessQualifier: '',
        // Box 15 - Other Date
        otherDate: '',
        otherDateQualifier: '',
        // Box 16 - Dates Unable to Work
        unableToWorkFrom: '',
        unableToWorkTo: '',
        // Box 17 - Referring Provider
        referringProviderName: '',
        referringProviderQualifier: '',
        // Box 17a - Other ID
        referringProviderId: '',
        // Box 17b - NPI
        referringProviderNPI: '',
        // Box 18 - Hospitalization Dates
        hospitalizedFrom: '',
        hospitalizedTo: '',
        // Box 19 - Additional Claim Info
        additionalClaimInfo: '',
        // Box 20 - Outside Lab
        outsideLab: '',
        outsideLabCharges: '',
        // Box 21 - Diagnosis Codes (A-L)
        diagnosisA: '', diagnosisB: '', diagnosisC: '', diagnosisD: '',
        diagnosisE: '', diagnosisF: '', diagnosisG: '', diagnosisH: '',
        diagnosisI: '', diagnosisJ: '', diagnosisK: '', diagnosisL: '',
        icdIndicator: '0', // 0 = ICD-10
        // Box 22 - Resubmission Code
        resubmissionCode: '',
        originalRefNo: '',
        // Box 23 - Prior Authorization
        priorAuth: '',
        // Box 24 - Service Lines (6 rows)
        serviceLines: [
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
            { dateFrom: '', dateTo: '', pos: '', emg: '', cpt: '', modifier1: '', modifier2: '', modifier3: '', modifier4: '', diagPointer: '', charges: '', units: '', epsdt: '', idQual: '', renderingNPI: '' },
        ],
        // Box 25 - Federal Tax ID
        federalTaxId: '',
        taxIdType: 'EIN',
        // Box 26 - Patient Account No
        patientAccountNo: '',
        // Box 27 - Accept Assignment
        acceptAssignment: '',
        // Box 28 - Total Charge
        totalCharge: '',
        // Box 29 - Amount Paid
        amountPaid: '',
        // Box 30 - Rsvd for NUCC
        // Box 31 - Signature of Provider
        providerSignature: '',
        providerSignatureDate: '',
        // Box 32 - Service Facility
        serviceFacilityName: '',
        serviceFacilityStreet: '',
        serviceFacilityCity: '',
        serviceFacilityState: '',
        serviceFacilityZip: '',
        serviceFacilityNPI: '',
        serviceFacilityOtherId: '',
        // Box 33 - Billing Provider
        billingProviderName: '',
        billingProviderStreet: '',
        billingProviderCity: '',
        billingProviderState: '',
        billingProviderZip: '',
        billingProviderPhone: '',
        billingProviderNPI: '',
        billingProviderOtherId: '',
    })

    const handlePrint = () => {
        window.print()
    }

    const updateField = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const updateServiceLine = (index: number, field: string, value: string) => {
        setFormData(prev => {
            const newLines = [...prev.serviceLines]
            newLines[index] = { ...newLines[index], [field]: value }
            return { ...prev, serviceLines: newLines }
        })
    }

    const handleAnalyzeRisk = async () => {
        setRiskLoading(true)
        setRiskError(null)
        setRiskResult(null)
        try {
            const result = await analyzeClaimRisk(formData as Record<string, any>)
            setRiskResult(result)
            setShowPassedChecks(false)
        } catch (err: any) {
            setRiskError(err?.response?.data?.detail || 'Failed to analyze claim risk. Please try again.')
        } finally {
            setRiskLoading(false)
        }
    }

    const handleSaveClaim = async () => {
        if (!encounterId) {
            toast.error('No encounter linked. Open this form from an encounter.')
            return
        }
        const insurer = formData.insurancePlanName || formData.insuranceType
        if (!insurer) {
            toast.error('Please fill in the Insurance Plan Name (Box 11c) before saving.')
            return
        }
        // Sum all service line charges
        const totalCharge = formData.serviceLines.reduce((sum: number, line: any) => {
            return sum + (parseFloat(line.charges) || 0)
        }, 0)
        if (totalCharge <= 0) {
            toast.error('Total charges must be greater than zero.')
            return
        }
        try {
            setSaveLoading(true)
            await createClaim({
                encounter_id: Number(encounterId),
                insurance_provider: insurer,
                total_amount: totalCharge,
                notes: `CMS-1500 submitted via billing portal`,
            })
            toast.success('Claim saved and submitted successfully!')
            navigate('/billing/dashboard')
        } catch (err: any) {
            const msg = err?.response?.data?.detail || 'Failed to save claim. Please try again.'
            toast.error(msg)
        } finally {
            setSaveLoading(false)
        }
    }

    // Auto-populate form when an encounterId is provided in the URL
    useEffect(() => {
        if (!encounterId) return

        const autoFill = async () => {
            setAutoFillLoading(true)
            setAutoFillError(null)
            try {
                const [enc, codes] = await Promise.all([
                    getEncounterDetails(Number(encounterId)),
                    getEncounterCodes(Number(encounterId))
                ])

                // Split patient name (format: "First Last")
                const nameParts = (enc.patient_name || '').trim().split(' ')
                const firstName = nameParts.slice(0, -1).join(' ')
                const lastName = nameParts.slice(-1)[0] || ''

                // Encounter date formatting
                const encDate = enc.encounter_date
                    ? new Date(enc.encounter_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                    : ''

                // Doctor name
                const doctorName = enc.doctor_name || ''

                // Extract ICD-10 codes (Box 21: up to 12 diagnosis pointers A-L)
                const icdCodes: string[] = (codes || [])
                    .filter((c: any) => c.code_type === 'ICD10_CM' || c.code_type === 'ICD-10')
                    .map((c: any) => c.code)
                const diagLabels = ['diagnosisA','diagnosisB','diagnosisC','diagnosisD',
                                    'diagnosisE','diagnosisF','diagnosisG','diagnosisH',
                                    'diagnosisI','diagnosisJ','diagnosisK','diagnosisL']
                const diagUpdates: Record<string, string> = {}
                icdCodes.slice(0, 12).forEach((code, i) => {
                    diagUpdates[diagLabels[i]] = code
                })

                // Extract CPT codes (Box 24 service lines: up to 6)
                const cptCodes: any[] = (codes || [])
                    .filter((c: any) => c.code_type === 'CPT')
                const newServiceLines = formData.serviceLines.map((line, i) => {
                    if (i < cptCodes.length) {
                        return {
                            ...line,
                            cpt: cptCodes[i].code,
                            dateFrom: encDate,
                            dateTo: encDate,
                            units: '1',
                            // Pointer to first diagnosis by default
                            diagPointer: 'A',
                        }
                    }
                    return line
                })

                setFormData(prev => ({
                    ...prev,
                    patientFirstName: firstName,
                    patientLastName: lastName,
                    dateOfIllness: encDate,
                    referringProviderName: doctorName,
                    patientAccountNo: `ENC-${encounterId}`,
                    serviceLines: newServiceLines,
                    ...diagUpdates,
                }))
            } catch (err) {
                setAutoFillError('Could not auto-fill form — encounter data unavailable.')
                console.error('CMS auto-fill error:', err)
            } finally {
                setAutoFillLoading(false)
            }
        }

        autoFill()
    }, [encounterId])

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            {/* Header - Hidden on print */}
            <div className="print:hidden mb-4 flex items-center justify-between max-w-[900px] mx-auto">
                <Button variant="outline" onClick={() => navigate('/billing')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Billing
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print Form
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleAnalyzeRisk}
                        disabled={riskLoading}
                        className="border-amber-400 text-amber-700 hover:bg-amber-50"
                    >
                        {riskLoading
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <Shield className="w-4 h-4 mr-2" />
                        }
                        Analyze Risk
                    </Button>
                    <Button variant="primary" onClick={handleSaveClaim} disabled={saveLoading}>
                        {saveLoading
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <Save className="w-4 h-4 mr-2" />
                        }
                        Save Claim
                    </Button>
                </div>
            </div>

            {/* Auto-fill status banner */}
            {encounterId && (
                <div className="print:hidden max-w-[900px] mx-auto mb-3">
                    {autoFillLoading && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-700 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Auto-filling form from encounter #{encounterId}…
                        </div>
                    )}
                    {!autoFillLoading && !autoFillError && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-green-700 text-sm">
                            ✓ Form auto-populated from Encounter #{encounterId} — patient info, ICD-10 codes (Box 21) and CPT codes (Box 24) filled in.
                        </div>
                    )}
                    {autoFillError && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-yellow-700 text-sm">
                            ⚠ {autoFillError}
                        </div>
                    )}
                </div>
            )}

            {/* ── Claim Risk Analysis Panel ──────────────────────────────── */}
            {(riskResult || riskLoading || riskError) && (
                <div className="print:hidden max-w-[900px] mx-auto mb-3">
                    {riskLoading && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-700 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            Analyzing claim for potential rejection risks…
                        </div>
                    )}
                    {riskError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                            ⚠ {riskError}
                        </div>
                    )}
                    {riskResult && (
                        <div className={`rounded-lg border-2 overflow-hidden ${
                            riskResult.risk_level === 'HIGH'   ? 'border-red-400'    :
                            riskResult.risk_level === 'MEDIUM' ? 'border-amber-400'  :
                                                                  'border-green-400'
                        }`}>
                            {/* Header bar */}
                            <div className={`flex items-center gap-3 px-4 py-3 ${
                                riskResult.risk_level === 'HIGH'   ? 'bg-red-600 text-white'    :
                                riskResult.risk_level === 'MEDIUM' ? 'bg-amber-500 text-white'  :
                                                                      'bg-green-600 text-white'
                            }`}>
                                {riskResult.risk_level === 'HIGH'
                                    ? <ShieldAlert className="w-5 h-5 shrink-0" />
                                    : riskResult.risk_level === 'MEDIUM'
                                        ? <AlertTriangle className="w-5 h-5 shrink-0" />
                                        : <ShieldCheck className="w-5 h-5 shrink-0" />
                                }
                                <div className="flex-1">
                                    <span className="font-bold text-base">
                                        {riskResult.risk_level} RISK
                                    </span>
                                    <span className="ml-3 text-sm opacity-90">
                                        Score: {riskResult.risk_score}/100
                                    </span>
                                </div>
                                <div className="text-sm text-right opacity-90">
                                    {riskResult.high_count > 0 && <span className="mr-2">🔴 {riskResult.high_count} critical</span>}
                                    {riskResult.medium_count > 0 && <span className="mr-2">🟡 {riskResult.medium_count} medium</span>}
                                    {riskResult.low_count > 0 && <span>🔵 {riskResult.low_count} low</span>}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="px-4 py-3 bg-white border-b border-gray-200 text-sm text-gray-700">
                                {riskResult.summary}
                            </div>

                            {/* Issues list */}
                            {riskResult.issues.length > 0 && (
                                <div className="bg-white divide-y divide-gray-100">
                                    {riskResult.issues.map((issue, i) => (
                                        <div key={i} className="flex gap-3 px-4 py-2.5 items-start">
                                            <span className={`shrink-0 text-xs font-bold mt-0.5 px-1.5 py-0.5 rounded ${
                                                issue.severity === 'HIGH'   ? 'bg-red-100 text-red-700'    :
                                                issue.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                                               'bg-blue-100 text-blue-700'
                                            }`}>
                                                {issue.severity}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {issue.box}
                                                    </span>
                                                    <span className="text-sm text-gray-800">{issue.message}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">💡 {issue.suggestion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Passed checks toggle */}
                            {riskResult.passed_checks.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                    <button
                                        className="flex items-center gap-2 w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                        onClick={() => setShowPassedChecks(v => !v)}
                                    >
                                        {showPassedChecks
                                            ? <ChevronUp className="w-3 h-3" />
                                            : <ChevronDown className="w-3 h-3" />
                                        }
                                        {riskResult.passed_checks.length} passed check(s)
                                    </button>
                                    {showPassedChecks && (
                                        <ul className="px-4 pb-3 space-y-1">
                                            {riskResult.passed_checks.map((check, i) => (
                                                <li key={i} className="text-xs text-green-700 flex items-center gap-1.5">
                                                    <ShieldCheck className="w-3 h-3 shrink-0" /> {check}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* CMS-1500 Form */}
            <div ref={formRef} className="max-w-[900px] mx-auto bg-white shadow-lg print:shadow-none">
                {/* Form Header */}
                <div className="bg-red-600 text-white text-center py-2 font-bold text-lg">
                    HEALTH INSURANCE CLAIM FORM
                </div>
                <div className="text-center text-xs py-1 bg-red-100 text-red-800 font-semibold">
                    APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) 02/12
                </div>

                {/* Form Content */}
                <div className="border-2 border-red-600 text-xs">

                    {/* Row 1: Payer Info and Insurance Type */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold mb-1">PICA</div>
                        </div>
                        <div className="flex-[3] p-1">
                            <div className="text-red-600 font-bold text-[10px]">1. MEDICARE | MEDICAID | TRICARE | CHAMPVA | GROUP HEALTH PLAN | FECA BLK LUNG | OTHER</div>
                            <div className="flex gap-4 mt-1">
                                {['MEDICARE', 'MEDICAID', 'TRICARE', 'CHAMPVA', 'GROUP', 'FECA', 'OTHER'].map(type => (
                                    <label key={type} className="flex items-center gap-1">
                                        <input type="checkbox" checked={formData.insuranceType === type} onChange={() => updateField('insuranceType', type)} className="w-3 h-3" />
                                        <span className="text-[9px]">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex-[2] p-1 border-l-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">1a. INSURED'S I.D. NUMBER</div>
                            <input type="text" value={formData.insuredId} onChange={e => updateField('insuredId', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                        </div>
                    </div>

                    {/* Row 2: Patient & Insured Names */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">2. PATIENT'S NAME (Last, First, Middle)</div>
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="Last" value={formData.patientLastName} onChange={e => updateField('patientLastName', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="First" value={formData.patientFirstName} onChange={e => updateField('patientFirstName', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="MI" value={formData.patientMiddle} onChange={e => updateField('patientMiddle', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                            </div>
                        </div>
                        <div className="w-32 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">3. PATIENT'S BIRTH DATE</div>
                            <input type="text" placeholder="MM/DD/YYYY" value={formData.patientDOB} onChange={e => updateField('patientDOB', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                            <div className="flex gap-2 mt-1">
                                <label className="flex items-center gap-1"><input type="radio" name="sex" checked={formData.patientSex === 'M'} onChange={() => updateField('patientSex', 'M')} /> M</label>
                                <label className="flex items-center gap-1"><input type="radio" name="sex" checked={formData.patientSex === 'F'} onChange={() => updateField('patientSex', 'F')} /> F</label>
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">4. INSURED'S NAME (Last, First, Middle)</div>
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="Last" value={formData.insuredLastName} onChange={e => updateField('insuredLastName', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="First" value={formData.insuredFirstName} onChange={e => updateField('insuredFirstName', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="MI" value={formData.insuredMiddle} onChange={e => updateField('insuredMiddle', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Patient Address & Relationship & Insured Address */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">5. PATIENT'S ADDRESS (No., Street)</div>
                            <input type="text" value={formData.patientStreet} onChange={e => updateField('patientStreet', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="City" value={formData.patientCity} onChange={e => updateField('patientCity', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ST" value={formData.patientState} onChange={e => updateField('patientState', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ZIP" value={formData.patientZip} onChange={e => updateField('patientZip', e.target.value)} className="w-16 border-b border-gray-300 outline-none" />
                            </div>
                            <div className="mt-1">
                                <span className="text-red-600 text-[10px]">TELEPHONE:</span>
                                <input type="text" value={formData.patientPhone} onChange={e => updateField('patientPhone', e.target.value)} className="ml-1 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="w-40 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">6. PATIENT RELATIONSHIP TO INSURED</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {['Self', 'Spouse', 'Child', 'Other'].map(rel => (
                                    <label key={rel} className="flex items-center gap-1">
                                        <input type="radio" name="relationship" checked={formData.patientRelationship === rel} onChange={() => updateField('patientRelationship', rel)} />
                                        <span className="text-[9px]">{rel}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">7. INSURED'S ADDRESS (No., Street)</div>
                            <input type="text" value={formData.insuredStreet} onChange={e => updateField('insuredStreet', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="City" value={formData.insuredCity} onChange={e => updateField('insuredCity', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ST" value={formData.insuredState} onChange={e => updateField('insuredState', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ZIP" value={formData.insuredZip} onChange={e => updateField('insuredZip', e.target.value)} className="w-16 border-b border-gray-300 outline-none" />
                            </div>
                            <div className="mt-1">
                                <span className="text-red-600 text-[10px]">TELEPHONE:</span>
                                <input type="text" value={formData.insuredPhone} onChange={e => updateField('insuredPhone', e.target.value)} className="ml-1 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Reserved, Other Insured, Condition */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="w-24 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">8. RESERVED FOR NUCC USE</div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">9. OTHER INSURED'S NAME</div>
                            <input type="text" value={formData.otherInsuredName} onChange={e => updateField('otherInsuredName', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <div className="text-red-600 font-bold text-[10px] mt-2">a. OTHER INSURED'S POLICY OR GROUP NUMBER</div>
                            <input type="text" value={formData.otherInsuredPolicy} onChange={e => updateField('otherInsuredPolicy', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">10. IS PATIENT'S CONDITION RELATED TO:</div>
                            <div className="mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">a. EMPLOYMENT?</span>
                                    <label className="flex items-center gap-1"><input type="radio" name="employment" checked={formData.conditionEmployment === true} onChange={() => updateField('conditionEmployment', true)} /> YES</label>
                                    <label className="flex items-center gap-1"><input type="radio" name="employment" checked={formData.conditionEmployment === false} onChange={() => updateField('conditionEmployment', false)} /> NO</label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">b. AUTO ACCIDENT?</span>
                                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={formData.conditionAutoAccident === true} onChange={() => updateField('conditionAutoAccident', true)} /> YES</label>
                                    <label className="flex items-center gap-1"><input type="radio" name="auto" checked={formData.conditionAutoAccident === false} onChange={() => updateField('conditionAutoAccident', false)} /> NO</label>
                                    <input type="text" placeholder="STATE" value={formData.conditionAutoState} onChange={e => updateField('conditionAutoState', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">c. OTHER ACCIDENT?</span>
                                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={formData.conditionOtherAccident === true} onChange={() => updateField('conditionOtherAccident', true)} /> YES</label>
                                    <label className="flex items-center gap-1"><input type="radio" name="other" checked={formData.conditionOtherAccident === false} onChange={() => updateField('conditionOtherAccident', false)} /> NO</label>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">11. INSURED'S POLICY GROUP OR FECA NUMBER</div>
                            <input type="text" value={formData.insuredPolicy} onChange={e => updateField('insuredPolicy', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                            <div className="text-red-600 font-bold text-[10px] mt-2">a. INSURED'S DATE OF BIRTH / SEX</div>
                            <div className="flex gap-2 mt-1">
                                <input type="text" placeholder="MM/DD/YYYY" value={formData.insuredDOB} onChange={e => updateField('insuredDOB', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <label className="flex items-center gap-1"><input type="radio" name="insuredSex" checked={formData.insuredSex === 'M'} onChange={() => updateField('insuredSex', 'M')} /> M</label>
                                <label className="flex items-center gap-1"><input type="radio" name="insuredSex" checked={formData.insuredSex === 'F'} onChange={() => updateField('insuredSex', 'F')} /> F</label>
                            </div>
                        </div>
                    </div>

                    {/* Row 5: Signatures Box 12-13 */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">12. PATIENT'S OR AUTHORIZED PERSON'S SIGNATURE</div>
                            <div className="text-[9px] mt-1">I authorize the release of any medical or other information necessary to process this claim.</div>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="text" value={formData.patientSignature} onChange={e => updateField('patientSignature', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <span className="text-[10px]">DATE:</span>
                                <input type="text" value={formData.patientSignatureDate} onChange={e => updateField('patientSignatureDate', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">13. INSURED'S OR AUTHORIZED PERSON'S SIGNATURE</div>
                            <div className="text-[9px] mt-1">I authorize payment of medical benefits to the undersigned physician.</div>
                            <input type="text" value={formData.insuredSignature} onChange={e => updateField('insuredSignature', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-2" />
                        </div>
                    </div>

                    {/* Row 6: Dates and Referring Provider (14-19) */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">14. DATE OF CURRENT ILLNESS, INJURY, or PREGNANCY (LMP)</div>
                            <div className="flex gap-2 mt-1">
                                <input type="text" placeholder="MM/DD/YYYY" value={formData.dateOfIllness} onChange={e => updateField('dateOfIllness', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <span className="text-[10px]">QUAL:</span>
                                <input type="text" value={formData.illnessQualifier} onChange={e => updateField('illnessQualifier', e.target.value)} className="w-8 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">15. OTHER DATE</div>
                            <div className="flex gap-2 mt-1">
                                <input type="text" placeholder="MM/DD/YYYY" value={formData.otherDate} onChange={e => updateField('otherDate', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <span className="text-[10px]">QUAL:</span>
                                <input type="text" value={formData.otherDateQualifier} onChange={e => updateField('otherDateQualifier', e.target.value)} className="w-8 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">16. DATES PATIENT UNABLE TO WORK IN CURRENT OCCUPATION</div>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px]">FROM:</span>
                                <input type="text" value={formData.unableToWorkFrom} onChange={e => updateField('unableToWorkFrom', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <span className="text-[10px]">TO:</span>
                                <input type="text" value={formData.unableToWorkTo} onChange={e => updateField('unableToWorkTo', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Row 7: Referring Provider, Hospitalization, etc (17-20) */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">17. NAME OF REFERRING PROVIDER OR OTHER SOURCE</div>
                            <div className="flex gap-2 mt-1">
                                <input type="text" value={formData.referringProviderQualifier} onChange={e => updateField('referringProviderQualifier', e.target.value)} className="w-8 border-b border-gray-300 outline-none" />
                                <input type="text" value={formData.referringProviderName} onChange={e => updateField('referringProviderName', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                            </div>
                            <div className="flex gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">17a.</span>
                                    <input type="text" value={formData.referringProviderId} onChange={e => updateField('referringProviderId', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">17b. NPI</span>
                                    <input type="text" value={formData.referringProviderNPI} onChange={e => updateField('referringProviderNPI', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">18. HOSPITALIZATION DATES RELATED TO CURRENT SERVICES</div>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px]">FROM:</span>
                                <input type="text" value={formData.hospitalizedFrom} onChange={e => updateField('hospitalizedFrom', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <span className="text-[10px]">TO:</span>
                                <input type="text" value={formData.hospitalizedTo} onChange={e => updateField('hospitalizedTo', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">19. ADDITIONAL CLAIM INFORMATION</div>
                            <input type="text" value={formData.additionalClaimInfo} onChange={e => updateField('additionalClaimInfo', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                        </div>
                    </div>

                    {/* Row 8: Outside Lab, Box 21 Diagnosis, Prior Auth (20-23) */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="w-32 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">20. OUTSIDE LAB?</div>
                            <div className="flex gap-2 mt-1">
                                <label className="flex items-center gap-1"><input type="radio" name="outsideLab" checked={formData.outsideLab === 'YES'} onChange={() => updateField('outsideLab', 'YES')} /> YES</label>
                                <label className="flex items-center gap-1"><input type="radio" name="outsideLab" checked={formData.outsideLab === 'NO'} onChange={() => updateField('outsideLab', 'NO')} /> NO</label>
                            </div>
                            <div className="text-[10px] mt-1">$ CHARGES</div>
                            <input type="text" value={formData.outsideLabCharges} onChange={e => updateField('outsideLabCharges', e.target.value)} className="w-full border-b border-gray-300 outline-none" />
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">21. DIAGNOSIS OR NATURE OF ILLNESS OR INJURY (Relate A-L to service line below)</div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px]">ICD Ind.</span>
                                <input type="text" value={formData.icdIndicator} onChange={e => updateField('icdIndicator', e.target.value)} className="w-6 border border-gray-300 outline-none text-center" />
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(letter => (
                                    <div key={letter} className="flex items-center gap-1">
                                        <span className="text-red-600 font-bold text-[10px]">{letter}.</span>
                                        <input
                                            type="text"
                                            value={formData[`diagnosis${letter}` as keyof typeof formData] as string}
                                            onChange={e => updateField(`diagnosis${letter}`, e.target.value)}
                                            className="flex-1 border-b border-gray-300 outline-none text-[10px] uppercase"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="w-40 p-1">
                            <div className="text-red-600 font-bold text-[10px]">22. RESUBMISSION CODE</div>
                            <input type="text" value={formData.resubmissionCode} onChange={e => updateField('resubmissionCode', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                            <div className="text-[10px] mt-1">ORIGINAL REF. NO.</div>
                            <input type="text" value={formData.originalRefNo} onChange={e => updateField('originalRefNo', e.target.value)} className="w-full border-b border-gray-300 outline-none" />
                            <div className="text-red-600 font-bold text-[10px] mt-2">23. PRIOR AUTHORIZATION NUMBER</div>
                            <input type="text" value={formData.priorAuth} onChange={e => updateField('priorAuth', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                        </div>
                    </div>

                    {/* Service Lines Header - Box 24 */}
                    <div className="border-b border-red-600 bg-red-50">
                        <div className="text-red-600 font-bold text-[10px] p-1 text-center">24. A. DATE(S) OF SERVICE | B. PLACE OF SERVICE | C. EMG | D. PROCEDURES, SERVICES, OR SUPPLIES | E. DIAGNOSIS POINTER | F. $ CHARGES | G. DAYS OR UNITS | H. EPSDT | I. ID QUAL | J. RENDERING PROVIDER ID #</div>
                    </div>

                    {/* Service Lines Header Row */}
                    <div className="border-b-2 border-red-600 flex text-[8px] bg-gray-50">
                        <div className="w-20 p-1 border-r border-red-600 text-center font-bold">From</div>
                        <div className="w-20 p-1 border-r border-red-600 text-center font-bold">To</div>
                        <div className="w-10 p-1 border-r border-red-600 text-center font-bold">POS</div>
                        <div className="w-8 p-1 border-r border-red-600 text-center font-bold">EMG</div>
                        <div className="flex-1 p-1 border-r border-red-600 text-center font-bold">CPT/HCPCS | Modifier</div>
                        <div className="w-12 p-1 border-r border-red-600 text-center font-bold">Diag Ptr</div>
                        <div className="w-20 p-1 border-r border-red-600 text-center font-bold">$ Charges</div>
                        <div className="w-10 p-1 border-r border-red-600 text-center font-bold">Units</div>
                        <div className="w-12 p-1 border-r border-red-600 text-center font-bold">EPSDT</div>
                        <div className="w-24 p-1 text-center font-bold">Rendering NPI</div>
                    </div>

                    {/* Service Lines (6 rows) */}
                    {formData.serviceLines.map((line, idx) => (
                        <div key={idx} className="border-b border-red-600 flex text-[9px]">
                            <div className="w-20 p-1 border-r border-red-600">
                                <input type="text" placeholder="MM/DD/YY" value={line.dateFrom} onChange={e => updateServiceLine(idx, 'dateFrom', e.target.value)} className="w-full outline-none" />
                            </div>
                            <div className="w-20 p-1 border-r border-red-600">
                                <input type="text" placeholder="MM/DD/YY" value={line.dateTo} onChange={e => updateServiceLine(idx, 'dateTo', e.target.value)} className="w-full outline-none" />
                            </div>
                            <div className="w-10 p-1 border-r border-red-600">
                                <input type="text" value={line.pos} onChange={e => updateServiceLine(idx, 'pos', e.target.value)} className="w-full outline-none text-center" />
                            </div>
                            <div className="w-8 p-1 border-r border-red-600">
                                <input type="text" value={line.emg} onChange={e => updateServiceLine(idx, 'emg', e.target.value)} className="w-full outline-none text-center" />
                            </div>
                            <div className="flex-1 p-1 border-r border-red-600">
                                <div className="flex gap-1">
                                    <input type="text" placeholder="CPT" value={line.cpt} onChange={e => updateServiceLine(idx, 'cpt', e.target.value)} className="w-16 outline-none" />
                                    <input type="text" value={line.modifier1} onChange={e => updateServiceLine(idx, 'modifier1', e.target.value)} className="w-6 outline-none border-l pl-1" />
                                    <input type="text" value={line.modifier2} onChange={e => updateServiceLine(idx, 'modifier2', e.target.value)} className="w-6 outline-none border-l pl-1" />
                                    <input type="text" value={line.modifier3} onChange={e => updateServiceLine(idx, 'modifier3', e.target.value)} className="w-6 outline-none border-l pl-1" />
                                    <input type="text" value={line.modifier4} onChange={e => updateServiceLine(idx, 'modifier4', e.target.value)} className="w-6 outline-none border-l pl-1" />
                                </div>
                            </div>
                            <div className="w-12 p-1 border-r border-red-600">
                                <input type="text" value={line.diagPointer} onChange={e => updateServiceLine(idx, 'diagPointer', e.target.value)} className="w-full outline-none text-center" />
                            </div>
                            <div className="w-20 p-1 border-r border-red-600">
                                <input type="text" value={line.charges} onChange={e => updateServiceLine(idx, 'charges', e.target.value)} className="w-full outline-none text-right" />
                            </div>
                            <div className="w-10 p-1 border-r border-red-600">
                                <input type="text" value={line.units} onChange={e => updateServiceLine(idx, 'units', e.target.value)} className="w-full outline-none text-center" />
                            </div>
                            <div className="w-12 p-1 border-r border-red-600">
                                <input type="text" value={line.epsdt} onChange={e => updateServiceLine(idx, 'epsdt', e.target.value)} className="w-full outline-none text-center" />
                            </div>
                            <div className="w-24 p-1">
                                <input type="text" value={line.renderingNPI} onChange={e => updateServiceLine(idx, 'renderingNPI', e.target.value)} className="w-full outline-none" />
                            </div>
                        </div>
                    ))}

                    {/* Bottom Section: Box 25-33 */}
                    <div className="border-b-2 border-red-600 flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">25. FEDERAL TAX I.D. NUMBER</div>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="text" value={formData.federalTaxId} onChange={e => updateField('federalTaxId', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                                <label className="flex items-center gap-1"><input type="radio" name="taxType" checked={formData.taxIdType === 'SSN'} onChange={() => updateField('taxIdType', 'SSN')} /> SSN</label>
                                <label className="flex items-center gap-1"><input type="radio" name="taxType" checked={formData.taxIdType === 'EIN'} onChange={() => updateField('taxIdType', 'EIN')} /> EIN</label>
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">26. PATIENT'S ACCOUNT NO.</div>
                            <input type="text" value={formData.patientAccountNo} onChange={e => updateField('patientAccountNo', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                        </div>
                        <div className="w-32 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">27. ACCEPT ASSIGNMENT?</div>
                            <div className="flex gap-2 mt-1">
                                <label className="flex items-center gap-1"><input type="radio" name="accept" checked={formData.acceptAssignment === 'YES'} onChange={() => updateField('acceptAssignment', 'YES')} /> YES</label>
                                <label className="flex items-center gap-1"><input type="radio" name="accept" checked={formData.acceptAssignment === 'NO'} onChange={() => updateField('acceptAssignment', 'NO')} /> NO</label>
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">28. TOTAL CHARGE</div>
                            <div className="flex items-center mt-1">
                                <span>$</span>
                                <input type="text" value={formData.totalCharge} onChange={e => updateField('totalCharge', e.target.value)} className="flex-1 border-b border-gray-300 outline-none ml-1" />
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">29. AMOUNT PAID</div>
                            <div className="flex items-center mt-1">
                                <span>$</span>
                                <input type="text" value={formData.amountPaid} onChange={e => updateField('amountPaid', e.target.value)} className="flex-1 border-b border-gray-300 outline-none ml-1" />
                            </div>
                        </div>
                        <div className="w-24 p-1">
                            <div className="text-red-600 font-bold text-[10px]">30. Rsvd for NUCC Use</div>
                        </div>
                    </div>

                    {/* Final Row: Boxes 31-33 */}
                    <div className="flex">
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">31. SIGNATURE OF PHYSICIAN OR SUPPLIER</div>
                            <input type="text" value={formData.providerSignature} onChange={e => updateField('providerSignature', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1" />
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px]">DATE:</span>
                                <input type="text" value={formData.providerSignatureDate} onChange={e => updateField('providerSignatureDate', e.target.value)} className="flex-1 border-b border-gray-300 outline-none" />
                            </div>
                        </div>
                        <div className="flex-1 p-1 border-r-2 border-red-600">
                            <div className="text-red-600 font-bold text-[10px]">32. SERVICE FACILITY LOCATION INFORMATION</div>
                            <input type="text" placeholder="Name" value={formData.serviceFacilityName} onChange={e => updateField('serviceFacilityName', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <input type="text" placeholder="Address" value={formData.serviceFacilityStreet} onChange={e => updateField('serviceFacilityStreet', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="City" value={formData.serviceFacilityCity} onChange={e => updateField('serviceFacilityCity', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ST" value={formData.serviceFacilityState} onChange={e => updateField('serviceFacilityState', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ZIP" value={formData.serviceFacilityZip} onChange={e => updateField('serviceFacilityZip', e.target.value)} className="w-16 border-b border-gray-300 outline-none" />
                            </div>
                            <div className="flex gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">a. NPI</span>
                                    <input type="text" value={formData.serviceFacilityNPI} onChange={e => updateField('serviceFacilityNPI', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">b.</span>
                                    <input type="text" value={formData.serviceFacilityOtherId} onChange={e => updateField('serviceFacilityOtherId', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-1">
                            <div className="text-red-600 font-bold text-[10px]">33. BILLING PROVIDER INFO & PH #</div>
                            <input type="text" placeholder="Name" value={formData.billingProviderName} onChange={e => updateField('billingProviderName', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <input type="text" placeholder="Address" value={formData.billingProviderStreet} onChange={e => updateField('billingProviderStreet', e.target.value)} className="w-full border-b border-gray-300 outline-none mt-1 uppercase" />
                            <div className="flex gap-1 mt-1">
                                <input type="text" placeholder="City" value={formData.billingProviderCity} onChange={e => updateField('billingProviderCity', e.target.value)} className="flex-1 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ST" value={formData.billingProviderState} onChange={e => updateField('billingProviderState', e.target.value)} className="w-8 border-b border-gray-300 outline-none uppercase" />
                                <input type="text" placeholder="ZIP" value={formData.billingProviderZip} onChange={e => updateField('billingProviderZip', e.target.value)} className="w-16 border-b border-gray-300 outline-none" />
                            </div>
                            <div className="mt-1">
                                <span className="text-[10px] text-red-600">PHONE:</span>
                                <input type="text" value={formData.billingProviderPhone} onChange={e => updateField('billingProviderPhone', e.target.value)} className="ml-1 border-b border-gray-300 outline-none" />
                            </div>
                            <div className="flex gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">a. NPI</span>
                                    <input type="text" value={formData.billingProviderNPI} onChange={e => updateField('billingProviderNPI', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-600">b.</span>
                                    <input type="text" value={formData.billingProviderOtherId} onChange={e => updateField('billingProviderOtherId', e.target.value)} className="w-24 border-b border-gray-300 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Footer */}
                <div className="bg-red-100 text-center py-1 text-[10px] text-red-800">
                    NUCC Instruction Manual available at: www.nucc.org | PLEASE PRINT OR TYPE
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
        </div>
    )
}

export default CMS1500Form
