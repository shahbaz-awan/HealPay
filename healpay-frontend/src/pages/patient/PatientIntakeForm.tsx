import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Phone, MapPin, Heart, FileText, Shield,
    AlertCircle, CheckCircle, ChevronRight, ChevronLeft,
    Plus, X, CreditCard, Users
} from 'lucide-react'
import { toast } from 'react-toastify'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { apiGet, apiPost, apiPut } from '@/services/api'

// Define form schema with validation
const patientIntakeSchema = z.object({
    // Personal Information
    dateOfBirth: z.string()
        .min(1, 'Date of birth is required')
        .refine(val => {
            const date = new Date(val)
            const age = (new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
            return age >= 0 && age <= 120
        }, 'Please enter a valid date of birth'),
    gender: z.string().min(1, 'Gender is required'),
    ssn: z.string()
        .regex(/^\d{0,4}$/, 'SSN must be 4 digits')
        .optional()
        .or(z.literal('')),
    maritalStatus: z.string().optional(),
    preferredLanguage: z.string().optional(),
    raceEthnicity: z.string().optional(),

    // Contact Information
    phonePrimary: z.string()
        .regex(/^[\d\s\-\(\)\+]+$/, 'Phone can only contain digits and formatting characters')
        .refine(val => {
            const digits = val.replace(/\D/g, '')
            return digits.length >= 10 && digits.length <= 15
        }, 'Phone must contain 10-15 digits'),
    phoneSecondary: z.string()
        .regex(/^[\d\s\-\(\)\+]*$/, 'Phone can only contain digits and formatting characters')
        .refine(val => {
            if (!val || val.trim() === '') return true
            const digits = val.replace(/\D/g, '')
            return digits.length >= 10 && digits.length <= 15
        }, 'Phone must contain 10-15 digits')
        .optional()
        .or(z.literal('')),
    addressLine1: z.string().min(5, 'Address is required (minimum 5 characters)'),
    addressLine2: z.string().optional(),
    city: z.string()
        .min(2, 'City is required')
        .regex(/^[A-Za-z\s\-']+$/, 'City can only contain letters, spaces, hyphens, and apostrophes'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string()
        .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits (or 5+4 format)'),

    // Emergency Contact
    emergencyContactName: z.string()
        .min(2, 'Emergency contact name is required')
        .regex(/^[A-Za-z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
    emergencyContactPhone: z.string()
        .regex(/^[\d\s\-\(\)\+]+$/, 'Phone can only contain digits and formatting characters')
        .refine(val => {
            const digits = val.replace(/\D/g, '')
            return digits.length >= 10 && digits.length <= 15
        }, 'Phone must contain 10-15 digits'),

    // Insurance
    insuranceProviderPrimary: z.string().optional(),
    insurancePolicyNumberPrimary: z.string().optional(),
    insuranceGroupNumberPrimary: z.string().optional(),
    insuranceHolderNamePrimary: z.string()
        .regex(/^[A-Za-z\s\-']*$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
        .optional()
        .or(z.literal('')),
    insuranceHolderDobPrimary: z.string().optional(),
    insuranceRelationshipPrimary: z.string().optional(),
    insuranceProviderSecondary: z.string().optional(),
    insurancePolicyNumberSecondary: z.string().optional(),
    insuranceGroupNumberSecondary: z.string().optional(),

    // Medical History
    primaryCarePhysician: z.string()
        .regex(/^[A-Za-z\s\-'.]*$/, 'Name can only contain letters, spaces, hyphens, periods, and apostrophes')
        .optional()
        .or(z.literal('')),
    allergies: z.string().optional(),
    currentMedications: z.string().optional(),
    pastSurgeries: z.string().optional(),
    chronicConditions: z.string().optional(),
    familyMedicalHistory: z.string().optional(),

    // Social History
    tobaccoUse: z.string().optional(),
    alcoholUse: z.string().optional(),
    exerciseFrequency: z.string().optional(),
    occupation: z.string().optional(),

    // Review of Systems
    hasDiabetes: z.boolean(),
    hasHypertension: z.boolean(),
    hasHeartDisease: z.boolean(),
    hasAsthma: z.boolean(),
    hasCancer: z.boolean(),

    // Consent
    consentToTreat: z.boolean().refine(val => val === true, {
        message: 'You must consent to treatment'
    }),
    consentPrivacyPolicy: z.boolean().refine(val => val === true, {
        message: 'You must accept the privacy policy'
    }),
    consentFinancialResponsibility: z.boolean().refine(val => val === true, {
        message: 'You must acknowledge financial responsibility'
    }),
    signature: z.string().min(2, 'Signature is required (minimum 2 characters)'),
})

type PatientIntakeFormData = z.infer<typeof patientIntakeSchema>

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

const PatientIntakeForm = () => {
    const navigate = useNavigate()
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        trigger, // Add trigger for manual validation
        reset,
    } = useForm<PatientIntakeFormData>({
        resolver: zodResolver(patientIntakeSchema),
        defaultValues: {
            preferredLanguage: 'English',
            tobaccoUse: 'never',
            alcoholUse: 'never',
            hasDiabetes: false,
            hasHypertension: false,
            hasHeartDisease: false,
            hasAsthma: false,
            hasCancer: false,
            consentToTreat: false,
            consentPrivacyPolicy: false,
            consentFinancialResponsibility: false,
        }
    })

    // Check if patient already has intake form on component mount
    useEffect(() => {
        const fetchExistingIntake = async () => {
            try {
                const intakeData = await apiGet('/v1/patient-intake/my-intake')

                // If intake exists, switch to edit mode and populate form
                setIsEditMode(true)

                // Transform snake_case backend data to camelCase for form
                reset({
                    dateOfBirth: intakeData.date_of_birth || '',
                    gender: intakeData.gender || '',
                    ssn: intakeData.ssn || '',
                    maritalStatus: intakeData.marital_status || '',
                    preferredLanguage: intakeData.preferred_language || 'English',
                    raceEthnicity: intakeData.race_ethnicity || '',
                    phonePrimary: intakeData.phone_primary || '',
                    phoneSecondary: intakeData.phone_secondary || '',
                    addressLine1: intakeData.address_line1 || '',
                    addressLine2: intakeData.address_line2 || '',
                    city: intakeData.city || '',
                    state: intakeData.state || '',
                    zipCode: intakeData.zip_code || '',
                    emergencyContactName: intakeData.emergency_contact_name || '',
                    emergencyContactRelationship: intakeData.emergency_contact_relationship || '',
                    emergencyContactPhone: intakeData.emergency_contact_phone || '',
                    insuranceProviderPrimary: intakeData.insurance_provider_primary || '',
                    insurancePolicyNumberPrimary: intakeData.insurance_policy_number_primary || '',
                    insuranceGroupNumberPrimary: intakeData.insurance_group_number_primary || '',
                    insuranceHolderNamePrimary: intakeData.insurance_holder_name_primary || '',
                    insuranceHolderDobPrimary: intakeData.insurance_holder_dob_primary || '',
                    insuranceRelationshipPrimary: intakeData.insurance_relationship_primary || '',
                    insuranceProviderSecondary: intakeData.insurance_provider_secondary || '',
                    insurancePolicyNumberSecondary: intakeData.insurance_policy_number_secondary || '',
                    insuranceGroupNumberSecondary: intakeData.insurance_group_number_secondary || '',
                    primaryCarePhysician: intakeData.primary_care_physician || '',
                    allergies: intakeData.allergies || '',
                    currentMedications: intakeData.current_medications || '',
                    pastSurgeries: intakeData.past_surgeries || '',
                    chronicConditions: intakeData.chronic_conditions || '',
                    familyMedicalHistory: intakeData.family_medical_history || '',
                    tobaccoUse: intakeData.tobacco_use || 'never',
                    alcoholUse: intakeData.alcohol_use || 'never',
                    exerciseFrequency: intakeData.exercise_frequency || '',
                    occupation: intakeData.occupation || '',
                    hasDiabetes: intakeData.has_diabetes || false,
                    hasHypertension: intakeData.has_hypertension || false,
                    hasHeartDisease: intakeData.has_heart_disease || false,
                    hasAsthma: intakeData.has_asthma || false,
                    hasCancer: intakeData.has_cancer || false,
                    consentToTreat: intakeData.consent_to_treat || false,
                    consentPrivacyPolicy: intakeData.consent_privacy_policy || false,
                    consentFinancialResponsibility: intakeData.consent_financial_responsibility || false,
                    signature: intakeData.signature || '',
                })

                toast.info('Editing existing intake form', {
                    position: 'top-center',
                    autoClose: 2000,
                })
            } catch (error: any) {
                // 404 means no intake exists yet - that's fine, user is creating new
                if (error.response?.status === 404) {
                    setIsEditMode(false)
                } else {
                    console.error('Error fetching intake:', error)
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchExistingIntake()
    }, [])

    const onSubmit = async (data: PatientIntakeFormData) => {
        try {
            setIsSubmitting(true)

            // Transform data to snake_case for backend
            const backendData = {
                date_of_birth: data.dateOfBirth,
                gender: data.gender,
                ssn: data.ssn,
                marital_status: data.maritalStatus,
                preferred_language: data.preferredLanguage,
                race_ethnicity: data.raceEthnicity,
                phone_primary: data.phonePrimary,
                phone_secondary: data.phoneSecondary,
                address_line1: data.addressLine1,
                address_line2: data.addressLine2,
                city: data.city,
                state: data.state,
                zip_code: data.zipCode,
                emergency_contact_name: data.emergencyContactName,
                emergency_contact_relationship: data.emergencyContactRelationship,
                emergency_contact_phone: data.emergencyContactPhone,
                insurance_provider_primary: data.insuranceProviderPrimary,
                insurance_policy_number_primary: data.insurancePolicyNumberPrimary,
                insurance_group_number_primary: data.insuranceGroupNumberPrimary,
                insurance_holder_name_primary: data.insuranceHolderNamePrimary,
                insurance_holder_dob_primary: data.insuranceHolderDobPrimary,
                insurance_relationship_primary: data.insuranceRelationshipPrimary,
                insurance_provider_secondary: data.insuranceProviderSecondary,
                insurance_policy_number_secondary: data.insurancePolicyNumberSecondary,
                insurance_group_number_secondary: data.insuranceGroupNumberSecondary,
                primary_care_physician: data.primaryCarePhysician,
                allergies: data.allergies,
                current_medications: data.currentMedications,
                past_surgeries: data.pastSurgeries,
                chronic_conditions: data.chronicConditions,
                family_medical_history: data.familyMedicalHistory,
                tobacco_use: data.tobaccoUse,
                alcohol_use: data.alcoholUse,
                exercise_frequency: data.exerciseFrequency,
                occupation: data.occupation,
                has_diabetes: data.hasDiabetes,
                has_hypertension: data.hasHypertension,
                has_heart_disease: data.hasHeartDisease,
                has_asthma: data.hasAsthma,
                has_cancer: data.hasCancer,
                consent_to_treat: data.consentToTreat,
                consent_privacy_policy: data.consentPrivacyPolicy,
                consent_financial_responsibility: data.consentFinancialResponsibility,
                signature: data.signature,
                is_complete: true
            }

            // Call appropriate endpoint based on edit mode
            if (isEditMode) {
                // Update existing intake
                await apiPut('/v1/patient-intake/my-intake', backendData)
                toast.success('Intake form updated successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                })
            } else {
                // Create new intake
                await apiPost('/v1/patient-intake/', backendData)
                toast.success('Intake form submitted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                })
            }

            navigate('/patient/dashboard')
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to submit intake form'
            toast.error(errorMessage, {
                position: 'top-center',
                autoClose: 4000,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalSteps = 6

    // Define required fields for each step
    const getRequiredFieldsForStep = (step: number): (keyof PatientIntakeFormData)[] => {
        switch (step) {
            case 1: // Personal Information
                return ['dateOfBirth', 'gender']
            case 2: // Contact Information + Emergency Contact
                return ['phonePrimary', 'addressLine1', 'city', 'state', 'zipCode',
                    'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone']
            case 3: // Insurance (all optional, so no required)
                return []
            case 4: // Medical History (all optional)
                return []
            case 5: // Social History (all optional)
                return []
            case 6: // Consent & Signature
                return ['consentToTreat', 'consentPrivacyPolicy', 'consentFinancialResponsibility', 'signature']
            default:
                return []
        }
    }

    const nextStep = async () => {
        if (currentStep < totalSteps) {
            // Get required fields for current step
            const requiredFields = getRequiredFieldsForStep(currentStep)

            // Trigger validation for current step fields
            const isValid = await trigger(requiredFields as any)

            if (isValid) {
                setCurrentStep(currentStep + 1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                // Show error toast
                toast.error('Please fill in all required fields before continuing', {
                    position: 'top-center',
                    autoClose: 3000,
                })

                // Scroll to first error
                const firstError = Object.keys(errors).find(key =>
                    requiredFields.includes(key as keyof PatientIntakeFormData)
                )
                if (firstError) {
                    const element = document.querySelector(`[name="${firstError}"]`)
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                }
            }
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold text-secondary-900 mb-2">
                        Patient Intake Form
                    </h1>
                    <p className="text-secondary-600">
                        Please complete all sections to help us provide you with the best care
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3, 4, 5, 6].map((step) => (
                            <div key={step} className="flex-1 flex items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${step <= currentStep
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                        }`}
                                >
                                    {step < currentStep ? (
                                        <CheckCircle className="w-6 h-6" />
                                    ) : (
                                        step
                                    )}
                                </div>
                                {step < 6 && (
                                    <div
                                        className={`flex-1 h-1 mx-2 transition-all ${step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center text-sm text-secondary-600">
                        Step {currentStep} of {totalSteps}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <AnimatePresence mode="wait">
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <User className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Personal Information
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                Tell us about yourself
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Date of Birth"
                                                type="date"
                                                error={errors.dateOfBirth?.message}
                                                {...register('dateOfBirth')}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Gender <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    {...register('gender')}
                                                >
                                                    <option value="">Select gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                    <option value="Prefer not to say">Prefer not to say</option>
                                                </select>
                                                {errors.gender && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="SSN (Last 4 digits)"
                                                placeholder="1234"
                                                maxLength={4}
                                                error={errors.ssn?.message}
                                                {...register('ssn')}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    Marital Status
                                                </label>
                                                <select
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    {...register('maritalStatus')}
                                                >
                                                    <option value="">Select status</option>
                                                    <option value="Single">Single</option>
                                                    <option value="Married">Married</option>
                                                    <option value="Divorced">Divorced</option>
                                                    <option value="Widowed">Widowed</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Preferred Language"
                                                placeholder="English"
                                                error={errors.preferredLanguage?.message}
                                                {...register('preferredLanguage')}
                                            />
                                            <Input
                                                label="Race/Ethnicity"
                                                placeholder="Optional"
                                                error={errors.raceEthnicity?.message}
                                                {...register('raceEthnicity')}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 2: Contact Information */}
                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <MapPin className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Contact Information
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                How can we reach you?
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Primary Phone"
                                                type="tel"
                                                placeholder="(555) 123-4567"
                                                leftIcon={<Phone className="w-5 h-5" />}
                                                error={errors.phonePrimary?.message}
                                                {...register('phonePrimary')}
                                            />
                                            <Input
                                                label="Secondary Phone"
                                                type="tel"
                                                placeholder="(555) 987-6543"
                                                leftIcon={<Phone className="w-5 h-5" />}
                                                error={errors.phoneSecondary?.message}
                                                {...register('phoneSecondary')}
                                            />
                                        </div>

                                        <Input
                                            label="Address Line 1"
                                            placeholder="123 Main Street"
                                            error={errors.addressLine1?.message}
                                            {...register('addressLine1')}
                                        />

                                        <Input
                                            label="Address Line 2"
                                            placeholder="Apt, Suite, Unit, etc. (Optional)"
                                            error={errors.addressLine2?.message}
                                            {...register('addressLine2')}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <Input
                                                label="City"
                                                placeholder="New York"
                                                error={errors.city?.message}
                                                {...register('city')}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                    State <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                    {...register('state')}
                                                >
                                                    <option value="">Select</option>
                                                    {US_STATES.map(state => (
                                                        <option key={state} value={state}>{state}</option>
                                                    ))}
                                                </select>
                                                {errors.state && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                                                )}
                                            </div>
                                            <Input
                                                label="ZIP Code"
                                                placeholder="10001"
                                                maxLength={5}
                                                error={errors.zipCode?.message}
                                                {...register('zipCode')}
                                            />
                                        </div>

                                        <div className="border-t pt-6 mt-6">
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                                Emergency Contact
                                            </h3>
                                            <div className="space-y-4">
                                                <Input
                                                    label="Emergency Contact Name"
                                                    placeholder="Jane Doe"
                                                    leftIcon={<Users className="w-5 h-5" />}
                                                    error={errors.emergencyContactName?.message}
                                                    {...register('emergencyContactName')}
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Relationship"
                                                        placeholder="Spouse, Parent, Sibling, etc."
                                                        error={errors.emergencyContactRelationship?.message}
                                                        {...register('emergencyContactRelationship')}
                                                    />
                                                    <Input
                                                        label="Emergency Contact Phone"
                                                        type="tel"
                                                        placeholder="(555) 555-5555"
                                                        leftIcon={<Phone className="w-5 h-5" />}
                                                        error={errors.emergencyContactPhone?.message}
                                                        {...register('emergencyContactPhone')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 3: Insurance Information */}
                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <CreditCard className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Insurance Information
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                Your insurance details (if applicable)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Primary Insurance */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                                Primary Insurance
                                            </h3>
                                            <div className="space-y-4">
                                                <Input
                                                    label="Insurance Provider"
                                                    placeholder="e.g., Blue Cross Blue Shield"
                                                    error={errors.insuranceProviderPrimary?.message}
                                                    {...register('insuranceProviderPrimary')}
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Policy Number"
                                                        placeholder="ABC123456789"
                                                        error={errors.insurancePolicyNumberPrimary?.message}
                                                        {...register('insurancePolicyNumberPrimary')}
                                                    />
                                                    <Input
                                                        label="Group Number"
                                                        placeholder="GRP001"
                                                        error={errors.insuranceGroupNumberPrimary?.message}
                                                        {...register('insuranceGroupNumberPrimary')}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Policy Holder Name"
                                                        placeholder="If different from patient"
                                                        error={errors.insuranceHolderNamePrimary?.message}
                                                        {...register('insuranceHolderNamePrimary')}
                                                    />
                                                    <Input
                                                        label="Policy Holder DOB"
                                                        type="date"
                                                        error={errors.insuranceHolderDobPrimary?.message}
                                                        {...register('insuranceHolderDobPrimary')}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                        Relationship to Policy Holder
                                                    </label>
                                                    <select
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                        {...register('insuranceRelationshipPrimary')}
                                                    >
                                                        <option value="">Select relationship</option>
                                                        <option value="Self">Self</option>
                                                        <option value="Spouse">Spouse</option>
                                                        <option value="Child">Child</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Secondary Insurance */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                                Secondary Insurance (Optional)
                                            </h3>
                                            <div className="space-y-4">
                                                <Input
                                                    label="Insurance Provider"
                                                    placeholder="e.g., Aetna"
                                                    error={errors.insuranceProviderSecondary?.message}
                                                    {...register('insuranceProviderSecondary')}
                                                />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Policy Number"
                                                        placeholder="ABC123456789"
                                                        error={errors.insurancePolicyNumberSecondary?.message}
                                                        {...register('insurancePolicyNumberSecondary')}
                                                    />
                                                    <Input
                                                        label="Group Number"
                                                        placeholder="GRP002"
                                                        error={errors.insuranceGroupNumberSecondary?.message}
                                                        {...register('insuranceGroupNumberSecondary')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 4: Medical History */}
                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <Heart className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Medical History
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                Help us understand your health background
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            label="Primary Care Physician"
                                            placeholder="Dr. John Smith"
                                            error={errors.primaryCarePhysician?.message}
                                            {...register('primaryCarePhysician')}
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Allergies
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                rows={3}
                                                placeholder="List any allergies to medications, foods, or other substances"
                                                {...register('allergies')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Current Medications
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                rows={3}
                                                placeholder="List all medications you are currently taking (include dosage if known)"
                                                {...register('currentMedications')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Past Surgeries
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                rows={3}
                                                placeholder="List any previous surgeries and approximate dates"
                                                {...register('pastSurgeries')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Chronic Conditions
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                rows={3}
                                                placeholder="List any ongoing health conditions"
                                                {...register('chronicConditions')}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                Family Medical History
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                rows={3}
                                                placeholder="List any significant health conditions in your immediate family"
                                                {...register('familyMedicalHistory')}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 5: Social History & Review of Systems */}
                        {currentStep === 5 && (
                            <motion.div
                                key="step5"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <FileText className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Social History & Health Screening
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                Lifestyle and health screening questions
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Social History */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                                Social History
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                            Tobacco Use
                                                        </label>
                                                        <select
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                            {...register('tobaccoUse')}
                                                        >
                                                            <option value="never">Never</option>
                                                            <option value="former">Former smoker</option>
                                                            <option value="current">Current smoker</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                                                            Alcohol Use
                                                        </label>
                                                        <select
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                                            {...register('alcoholUse')}
                                                        >
                                                            <option value="never">Never</option>
                                                            <option value="occasional">Occasional</option>
                                                            <option value="regular">Regular</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <Input
                                                        label="Exercise Frequency"
                                                        placeholder="e.g., 3 times per week"
                                                        error={errors.exerciseFrequency?.message}
                                                        {...register('exerciseFrequency')}
                                                    />
                                                    <Input
                                                        label="Occupation"
                                                        placeholder="Your current occupation"
                                                        error={errors.occupation?.message}
                                                        {...register('occupation')}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Review of Systems */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                                                Review of Systems
                                            </h3>
                                            <p className="text-sm text-secondary-600 mb-4">
                                                Do you currently have or have you been diagnosed with any of the following?
                                            </p>
                                            <div className="space-y-3">
                                                {[
                                                    { name: 'hasDiabetes', label: 'Diabetes' },
                                                    { name: 'hasHypertension', label: 'Hypertension (High Blood Pressure)' },
                                                    { name: 'hasHeartDisease', label: 'Heart Disease' },
                                                    { name: 'hasAsthma', label: 'Asthma' },
                                                    { name: 'hasCancer', label: 'Cancer' },
                                                ].map((condition) => (
                                                    <label key={condition.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                            {...register(condition.name as any)}
                                                        />
                                                        <span className="text-secondary-900">{condition.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {/* Step 6: Consent & Signature */}
                        {currentStep === 6 && (
                            <motion.div
                                key="step6"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                            >
                                <Card>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-100 rounded-lg">
                                            <Shield className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-secondary-900">
                                                Consent & Signature
                                            </h2>
                                            <p className="text-sm text-secondary-600">
                                                Review and agree to our policies
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Consent Checkboxes */}
                                        <div className="space-y-4">
                                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                                                    {...register('consentToTreat')}
                                                />
                                                <div>
                                                    <span className="font-semibold text-secondary-900">
                                                        Consent to Treatment
                                                    </span>
                                                    <p className="text-sm text-secondary-600 mt-1">
                                                        I consent to receive medical treatment and procedures as deemed necessary by the healthcare providers.
                                                    </p>
                                                </div>
                                            </label>
                                            {errors.consentToTreat && (
                                                <p className="text-red-500 text-sm">{errors.consentToTreat.message}</p>
                                            )}

                                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                                                    {...register('consentPrivacyPolicy')}
                                                />
                                                <div>
                                                    <span className="font-semibold text-secondary-900">
                                                        Privacy Policy (HIPAA)
                                                    </span>
                                                    <p className="text-sm text-secondary-600 mt-1">
                                                        I have received and understand the Notice of Privacy Practices and consent to the use and disclosure of my health information as described.
                                                    </p>
                                                </div>
                                            </label>
                                            {errors.consentPrivacyPolicy && (
                                                <p className="text-red-500 text-sm">{errors.consentPrivacyPolicy.message}</p>
                                            )}

                                            <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                                                    {...register('consentFinancialResponsibility')}
                                                />
                                                <div>
                                                    <span className="font-semibold text-secondary-900">
                                                        Financial Responsibility
                                                    </span>
                                                    <p className="text-sm text-secondary-600 mt-1">
                                                        I understand that I am financially responsible for all charges not covered by insurance and agree to pay any outstanding balances.
                                                    </p>
                                                </div>
                                            </label>
                                            {errors.consentFinancialResponsibility && (
                                                <p className="text-red-500 text-sm">{errors.consentFinancialResponsibility.message}</p>
                                            )}
                                        </div>

                                        {/* Signature */}
                                        <div className="border-t pt-6">
                                            <Input
                                                label="Digital Signature"
                                                placeholder="Type your full name to sign"
                                                error={errors.signature?.message}
                                                {...register('signature')}
                                            />
                                            <p className="text-xs text-secondary-500 mt-2">
                                                By typing your name above, you agree that this constitutes a legal signature confirming that you acknowledge and agree to the above terms.
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex gap-3">
                                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-blue-900">
                                                    <p className="font-semibold mb-1">Important Notice</p>
                                                    <p>
                                                        Please review all information for accuracy before submitting. You can update your information later if needed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Previous
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Submit Intake Form
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PatientIntakeForm
