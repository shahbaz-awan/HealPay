import { apiGet, apiPost } from './api'
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
