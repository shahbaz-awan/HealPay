import axios from 'axios'

const API_URL = 'http://localhost:8000/api/clinical'

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    }
}

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
        const response = await axios.post(
            `${API_URL}/encounters`,
            encounterData,
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error creating encounter:', error)
        throw error
    }
}

export const getPatientEncounters = async (patientId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/encounters/patient/${patientId}`,
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error fetching patient encounters:', error)
        throw error
    }
}

// Medical Coder APIs
export const getPendingEncounters = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/encounters/pending-coding`,
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error fetching pending encounters:', error)
        throw error
    }
}

export const getEncounterDetails = async (encounterId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/encounters/${encounterId}`,
            getAuthHeaders()
        )
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
        const response = await axios.post(
            `${API_URL}/encounters/${encounterId}/codes`,
            codeData,
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error assigning medical code:', error)
        throw error
    }
}

export const getEncounterCodes = async (encounterId: number) => {
    try {
        const response = await axios.get(
            `${API_URL}/encounters/${encounterId}/codes`,
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error fetching encounter codes:', error)
        throw error
    }
}

export const completeCoding = async (encounterId: number) => {
    try {
        const response = await axios.put(
            `${API_URL}/encounters/${encounterId}/complete-coding`,
            {},
            getAuthHeaders()
        )
        return response.data
    } catch (error) {
        console.error('Error completing coding:', error)
        throw error
    }
}
