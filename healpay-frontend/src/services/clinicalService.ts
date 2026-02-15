import api from './api'

// Clinical Encounter APIs
export const createClinicalEncounter = async (encounterData: {
    patient_id: number
    encounter_type: string
    chief_complaint: string
    subjective_notes?: string
    objective_findings?: string
    assessment?: string
    plan?: string
}) => {
    try {
        const response = await api.post('/v1/clinical/encounters', encounterData)
        return response.data
    } catch (error) {
        console.error('Error creating encounter:', error)
        throw error
    }
}

export const getPatientEncounters = async (patientId: number) => {
    try {
        const response = await api.get(`/v1/clinical/encounters/patient/${patientId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching patient encounters:', error)
        throw error
    }
}

//Medical Coder APIs
export const getPendingEncounters = async () => {
    try {
        const response = await api.get('/v1/clinical/encounters/pending-coding')
        return response.data
    } catch (error) {
        console.error('Error fetching pending encounters:', error)
        throw error
    }
}

export const getEncounterDetails = async (encounterId: number) => {
    try {
        const response = await api.get(`/v1/clinical/encounters/${encounterId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching encounter details:', error)
        throw error
    }
}

export const assignMedicalCode = async (
    encounterId: number,
    codeData: {
        encounter_id: number
        code_type: string
        code: string
        description: string
        is_ai_suggested?: boolean
        confidence_score?: number
    }
) => {
    try {
        const response = await api.post(`/v1/clinical/encounters/${encounterId}/codes`, codeData)
        return response.data
    } catch (error) {
        console.error('Error assigning medical code:', error)
        throw error
    }
}

export const getEncounterCodes = async (encounterId: number) => {
    try {
        const response = await api.get(`/v1/clinical/encounters/${encounterId}/codes`)
        return response.data
    } catch (error) {
        console.error('Error fetching encounter codes:', error)
        throw error
    }
}

export const completeCoding = async (encounterId: number) => {
    try {
        const response = await api.put(`/v1/clinical/encounters/${encounterId}/complete-coding`)
        return response.data
    } catch (error) {
        console.error('Error completing coding:', error)
        throw error
    }
}

// Get AI-powered code recommendations for an encounter
export const getCodeRecommendations = async (encounterId: number) => {
    try {
        const response = await api.get(`/v1/clinical/encounters/${encounterId}/recommendations`)
        return response.data
    } catch (error) {
        console.error('Error fetching code recommendations:', error)
        throw error
    }
}

// Search code library for ICD-10 or CPT codes
export const searchCodes = async (
    query: string,
    codeType: 'ICD10_CM' | 'CPT',
    limit: number = 50
) => {
    try {
        const response = await api.get('/v1/clinical/codes/search', {
            params: { query, code_type: codeType, limit }
        })
        return response.data
    } catch (error) {
        console.error('Error searching codes:', error)
        throw error
    }
}

// Delete an assigned medical code
export const deleteMedicalCode = async (encounterId: number, codeId: number) => {
    try {
        const response = await api.delete(`/v1/clinical/encounters/${encounterId}/codes/${codeId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting medical code:', error)
        throw error
    }
}

// Update an assigned medical code
export const updateMedicalCode = async (
    encounterId: number,
    codeId: number,
    codeData: {
        encounter_id: number
        code_type: string
        code: string
        description: string
        is_ai_suggested?: boolean
        confidence_score?: number
    }
) => {
    try {
        const response = await api.put(`/v1/clinical/encounters/${encounterId}/codes/${codeId}`, codeData)
        return response.data
    } catch (error) {
        console.error('Error updating medical code:', error)
        throw error
    }
}

// Get completed encounters (coded, sent to biller/doctor)
export const getCompletedEncounters = async () => {
    try {
        const response = await api.get('/v1/clinical/encounters/completed')
        return response.data
    } catch (error) {
        console.error('Error fetching completed encounters:', error)
        throw error
    }
}

// Send encounter to biller or doctor
export const sendEncounterTo = async (encounterId: number, target: 'biller' | 'doctor') => {
    try {
        const response = await api.put(`/v1/clinical/encounters/${encounterId}/send-to`, null, {
            params: { target }
        })
        return response.data
    } catch (error) {
        console.error('Error sending encounter:', error)
        throw error
    }
}
