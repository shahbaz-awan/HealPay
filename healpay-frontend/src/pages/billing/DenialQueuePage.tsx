import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, RefreshCw, ChevronRight, Clock, DollarSign, FileText, CheckSquare } from 'lucide-react'
import { apiGet, apiPost } from '@/services/api'
import { toast } from 'react-toastify'

interface DeniedClaim {
  id: number
  claim_number: string
  insurance_provider: string
  total_amount: number
  denial_reason_code: string
  appeal_status: string
  submitted_at: string
  adjudication_date?: string
}

const CARC_DESCRIPTIONS: Record<string, string> = {
  'CO-4':  'Modifier missing or inconsistent',
  'CO-11': 'Diagnosis inconsistent with procedure',
  'CO-15': 'Authorization number missing or invalid',
  'CO-16': 'Claim lacks required information',
  'CO-18': 'Exact duplicate claim/service',
  'CO-22': 'Covered by another payer (COB)',
  'CO-29': 'Time limit for filing has expired',
  'CO-50': 'Not deemed medically necessary by payer',
  'CO-97': 'Service included in allowance for another procedure',
}

const appealBadge = (s: string) => {
  switch(s) {
    case 'appealing':   return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'resubmitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'appeal_denied': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    default:            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
}

const DenialQueuePage: React.FC = () => {
  const [claims, setClaims] = useState<DeniedClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet<DeniedClaim[]>('/v1/billing/claims?status=denied')
      setClaims(data || [])
    } catch {
      toast.error('Failed to load denied claims')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const appeal = async (claimId: number) => {
    setActionLoading(claimId)
    try {
      await apiPost(`/v1/mock/claims/${claimId}/appeal`, {})
      toast.success('Claim marked as under appeal')
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to appeal claim')
    } finally {
      setActionLoading(null)
    }
  }

  const resubmit = async (claimId: number) => {
    setActionLoading(claimId)
    try {
      const res = await apiPost<any>(`/v1/mock/claims/${claimId}/resubmit`, {})
      toast.success(`Corrected claim ${res.corrected_claim_number} submitted!`)
      load()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to resubmit claim')
    } finally {
      setActionLoading(null)
    }
  }

  const daysSince = (dateStr?: string) => {
    if (!dateStr) return '—'
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    return `${diff}d ago`
  }

  return (
    <div className="p-6 max-w-6xl mx-auto fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            Denial Management Queue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {claims.length} denied claim{claims.length !== 1 ? 's' : ''} requiring action
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-semibold transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Denied', value: claims.length, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Under Appeal', value: claims.filter(c => c.appeal_status === 'appealing').length, icon: CheckSquare, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Total Denied $', value: `$${claims.reduce((s, c) => s + c.total_amount, 0).toFixed(0)}`, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-4 ${stat.bg} border-gray-100 dark:border-gray-700`}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="text-green-600 dark:text-green-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No Denied Claims</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">All claims are in good standing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-sm font-mono">{claim.claim_number}</span>
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">DENIED</span>
                      {claim.appeal_status !== 'none' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${appealBadge(claim.appeal_status)}`}>
                          {claim.appeal_status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{claim.insurance_provider}</p>
                    {claim.denial_reason_code && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <AlertTriangle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          <span className="font-mono font-bold">{claim.denial_reason_code}</span>
                          {' — '}
                          {CARC_DESCRIPTIONS[claim.denial_reason_code] || 'See remittance advice for details'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${claim.total_amount.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 justify-end mt-0.5">
                      <Clock size={10} />
                      {claim.adjudication_date ? daysSince(claim.adjudication_date) : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {claim.appeal_status !== 'resubmitted' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <button
                      onClick={() => appeal(claim.id)}
                      disabled={actionLoading === claim.id || claim.appeal_status === 'appealing'}
                      className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <FileText size={13} />
                      {claim.appeal_status === 'appealing' ? 'Under Appeal' : 'Mark as Appeal'}
                    </button>
                    <button
                      onClick={() => resubmit(claim.id)}
                      disabled={actionLoading === claim.id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={actionLoading === claim.id ? 'animate-spin' : ''} />
                      Resubmit Corrected Claim
                    </button>
                    <button className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      View ERA <ChevronRight size={13} />
                    </button>
                  </div>
                )}
                {claim.appeal_status === 'resubmitted' && (
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700 text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                    <RefreshCw size={12} /> Corrected claim submitted — awaiting adjudication
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DenialQueuePage
