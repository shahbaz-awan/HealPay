import { apiGet, apiPost, apiPatch } from './api'
// Note: Frontend connects to backend. If backend port changes, api.ts needs update.

export interface BillingStats {
    total_revenue: number
    outstanding: number
    collected_month: number
    overdue: number
    pending_invoices_count: number
    overdue_invoices_count: number
}

export interface Invoice {
    id: number
    invoice_number: string
    patient_id: number
    amount: number // mapped from total_amount
    balance_due: number
    status: string
    issue_date: string
    due_date: string
    patient?: any // enriched data
}

export interface Payment {
    id: number
    invoice_id: number
    amount: number
    payment_date: string
    payment_method: string
    transaction_id?: string
    notes?: string
}

export const getBillingStats = async () => {
    try {
        const response = await apiGet<BillingStats>('/v1/billing/stats')
        return response
    } catch (error) {
        console.error('Error fetching billing stats:', error)
        throw error
    }
}

export const getRecentInvoices = async (limit: number = 10) => {
    try {
        const response = await apiGet<any[]>('/v1/billing/invoices/recent', { params: { limit } })

        // Transform backend snake_case to frontend friendly format if needed, 
        // or just ensure consistent mapping. For now returning raw.
        return response
    } catch (error) {
        console.error('Error fetching recent invoices:', error)
        throw error
    }
}

export const createInvoice = async (data: {
    patient_id: number
    amount: number
    encounter_id?: number
    claim_id?: number
}) => {
    try {
        const response = await apiPost('/v1/billing/invoices', data)
        return response
    } catch (error) {
        console.error('Error creating invoice:', error)
        throw error
    }
}

export const getReadyToBillEncounters = async () => {
    try {
        // Using direct main.py endpoint
        const response = await apiGet<any[]>('/v1/billing/encounters/ready')
        return response
    } catch (error) {
        console.error('Error fetching ready encounters:', error)
        throw error
    }
}

export const recordPayment = async (data: {
    invoice_id: number
    amount: number
    payment_method: string
    transaction_id?: string
    notes?: string
}) => {
    try {
        const response = await apiPost('/v1/billing/payments', data)
        return response
    } catch (error) {
        console.error('Error recording payment:', error)
        throw error
    }
}

export const createInvoiceFromEncounter = async (encounterId: number) => {
    try {
        const response = await apiPost<any>(`/v1/billing/invoices/from-encounter/${encounterId}`, {})
        return response
    } catch (error) {
        console.error('Error creating invoice from encounter:', error)
        throw error
    }
}

export const getInvoiceDetail = async (invoiceId: number) => {
    try {
        const response = await apiGet<any>(`/v1/billing/invoices/${invoiceId}`)
        return response
    } catch (error) {
        console.error('Error fetching invoice detail:', error)
        throw error
    }
}

export const getMyInvoices = async () => {
    try {
        const response = await apiGet<any[]>('/v1/billing/invoices/my')
        return response
    } catch (error) {
        console.error('Error fetching my invoices:', error)
        throw error
    }
}
export interface RiskIssue {
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    field: string
    box: string
    message: string
    suggestion: string
}

export interface ClaimRiskResult {
    risk_level: 'HIGH' | 'MEDIUM' | 'LOW'
    risk_score: number
    total_issues: number
    high_count: number
    medium_count: number
    low_count: number
    issues: RiskIssue[]
    passed_checks: string[]
    summary: string
}

export const createClaim = async (data: {
    encounter_id: number
    insurance_provider: string
    total_amount: number
    patient_responsibility?: number
    notes?: string
}): Promise<any> => {
    try {
        const response = await apiPost<any>('/v1/billing/claims', data)
        return response
    } catch (error) {
        console.error('Error creating claim:', error)
        throw error
    }
}

export const analyzeClaimRisk = async (formData: Record<string, any>): Promise<ClaimRiskResult> => {
    try {
        const response = await apiPost<ClaimRiskResult>('/v1/billing/analyze-claim-risk', formData)
        return response
    } catch (error) {
        console.error('Error analyzing claim risk:', error)
        throw error
    }
}

export interface Claim {
    id: number
    encounter_id: number
    claim_number: string
    insurance_provider: string
    total_amount: number
    patient_responsibility?: number
    status: string
    claim_type?: string
    billing_provider_npi?: string
    denial_reason_code?: string
    adjudication_date?: string
    cms1500_data?: Record<string, any>
}

export const getClaims = async (): Promise<Claim[]> => {
    try {
        const response = await apiGet<Claim[]>('/v1/billing/claims')
        return response
    } catch (error) {
        console.error('Error fetching claims:', error)
        throw error
    }
}

export const updateClaimStatus = async (
    claimId: number,
    status: string,
    denial_reason_code?: string
): Promise<Claim> => {
    try {
        const payload: Record<string, any> = { status }
        if (denial_reason_code) payload.denial_reason_code = denial_reason_code
        const response = await apiPatch<Claim>(`/v1/billing/claims/${claimId}/status`, payload)
        return response
    } catch (error) {
        console.error('Error updating claim status:', error)
        throw error
    }
}