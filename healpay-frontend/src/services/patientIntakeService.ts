import { apiPost, apiGet, apiPut, apiDelete } from './api'

export interface PatientIntakeData {
    dateOfBirth: string
    gender: string
    ssn?: string
    maritalStatus?: string
    preferredLanguage?: string
    raceEthnicity?: string
    phonePrimary: string
    phoneSecondary?: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    zipCode: string
    emergencyContactName: string
    emergencyContactRelationship: string
    emergencyContactPhone: string
    insuranceProviderPrimary?: string
    insurancePolicyNumberPrimary?: string
    insuranceGroupNumberPrimary?: string
    insuranceHolderNamePrimary?: string
    insuranceHolderDobPrimary?: string
    insuranceRelationshipPrimary?: string
    insuranceProviderSecondary?: string
    insurancePolicyNumberSecondary?: string
    insuranceGroupNumberSecondary?: string
    primaryCarePhysician?: string
    allergies?: string
    currentMedications?: string
    pastSurgeries?: string
    chronicConditions?: string
    familyMedicalHistory?: string
    tobaccoUse?: string
    alcoholUse?: string
    exerciseFrequency?: string
    occupation?: string
    hasDiabetes: boolean
    hasHypertension: boolean
    hasHeartDisease: boolean
    hasAsthma: boolean
    hasCancer: boolean
    consentToTreat: boolean
    consentPrivacyPolicy: boolean
    consentFinancialResponsibility: boolean
    signature: string
}

export interface PatientIntakeResponse extends PatientIntakeData {
    id: number
    userId: number
    isComplete: boolean
    createdAt: string
    updatedAt?: string
}

export const patientIntakeService = {
    // Create new patient intake
    create: async (data: any): Promise<PatientIntakeResponse> => {
        return apiPost<PatientIntakeResponse>('/patient-intake/', data)
    },

    // Get current user's intake
    getMyIntake: async (): Promise<PatientIntakeResponse> => {
        return apiGet<PatientIntakeResponse>('/patient-intake/my-intake')
    },

    // Update current user's intake
    updateMyIntake: async (data: any): Promise<PatientIntakeResponse> => {
        return apiPut<PatientIntakeResponse>('/patient-intake/my-intake', data)
    },

    // Get intake by user ID (Admin, Doctor, Coder only)
    getIntakeByUserId: async (userId: number): Promise<PatientIntakeResponse> => {
        return apiGet<PatientIntakeResponse>(`/patient-intake/${userId}`)
    },

    // Get all patient intakes (Admin, Doctor, Coder only)
    getAllIntakes: async (skip: number = 0, limit: number = 100): Promise<PatientIntakeResponse[]> => {
        return apiGet<PatientIntakeResponse[]>(`/patient-intake/?skip=${skip}&limit=${limit}`)
    },

    // Delete current user's intake
    deleteMyIntake: async (): Promise<void> => {
        return apiDelete('/patient-intake/my-intake')
    },
}
