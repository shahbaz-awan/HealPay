import React, { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react'
import { apiPost } from '@/services/api'

interface EligibilityResult {
  status: 'active' | 'inactive'
  eligible: boolean
  transaction_id: string
  payer_name: string
  payer_id: string
  patient_name: string
  policy_number: string
  group_number: string
  plan_name: string
  plan_type: string
  effective_date: string
  termination_date: string
  message: string
  coverage?: {
    coverage_percentage: number
    deductible_total: number
    deductible_met: number
    deductible_remaining: number
    out_of_pocket_max: number
    out_of_pocket_met: number
    out_of_pocket_remaining: number
    copay_office_visit: number
    coinsurance_pct: number
    requires_referral: boolean
    requires_prior_auth_for: string[]
  }
  network?: { in_network: boolean; network_name: string }
}

interface EligibilityPanelProps {
  patientName: string
  dateOfBirth?: string
  insuranceProvider?: string
  policyNumber?: string
  groupNumber?: string
}

export const EligibilityPanel: React.FC<EligibilityPanelProps> = ({
  patientName, dateOfBirth = '', insuranceProvider = '', policyNumber = '', groupNumber = ''
}) => {
  const [payer, setPayer] = useState(insuranceProvider)
  const [policy, setPolicy] = useState(policyNumber)
  const [group, setGroup] = useState(groupNumber)
  const [dob, setDob] = useState(dateOfBirth)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EligibilityResult | null>(null)
  const [expanded, setExpanded] = useState(false)

  const verify = async () => {
    if (!payer || !policy) return
    setLoading(true)
    try {
      const res = await apiPost<EligibilityResult>('/v1/mock/eligibility/verify', {
        patient_name: patientName,
        date_of_birth: dob,
        insurance_provider: payer,
        policy_number: policy,
        group_number: group,
        date_of_service: new Date().toISOString().split('T')[0],
      })
      setResult(res)
      setExpanded(true)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const cov = result?.coverage

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <Shield size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Insurance Eligibility Verification</h3>
        {result && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
            result.eligible
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {result.eligible ? '✅ Active' : '❌ Inactive'}
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Insurance Payer</label>
            <input
              value={payer}
              onChange={e => setPayer(e.target.value)}
              placeholder="e.g. Blue Cross Blue Shield"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Policy #</label>
            <input
              value={policy}
              onChange={e => setPolicy(e.target.value)}
              placeholder="Policy number"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Group #</label>
            <input
              value={group}
              onChange={e => setGroup(e.target.value)}
              placeholder="Group number (optional)"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={verify}
          disabled={loading || !payer || !policy}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          {loading ? <><Loader size={15} className="animate-spin" /> Verifying…</> : <><Shield size={15} /> Verify Eligibility</>}
        </button>

        {/* Results */}
        {result && (
          <div className={`rounded-xl border p-4 ${result.eligible ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center gap-2 mb-3">
              {result.eligible
                ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                : <XCircle size={16} className="text-red-600 dark:text-red-400" />
              }
              <span className={`text-sm font-bold ${result.eligible ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                {result.message}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
              <div><span className="text-gray-500 dark:text-gray-400">Payer:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{result.payer_name}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400">Plan:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{result.plan_type}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400">Effective:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{result.effective_date}</span></div>
              <div><span className="text-gray-500 dark:text-gray-400">Terminates:</span> <span className="font-semibold text-gray-800 dark:text-gray-200">{result.termination_date}</span></div>
            </div>

            {cov && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? 'Hide' : 'Show'} Coverage Details
                </button>

                {expanded && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Coverage', value: `${cov.coverage_percentage}%` },
                      { label: 'Co-Pay', value: `$${cov.copay_office_visit}` },
                      { label: 'Deductible', value: `$${cov.deductible_total.toLocaleString()}`, sub: `$${cov.deductible_remaining.toLocaleString()} remaining` },
                      { label: 'Out-of-Pocket Max', value: `$${cov.out_of_pocket_max.toLocaleString()}`, sub: `$${cov.out_of_pocket_remaining.toLocaleString()} remaining` },
                      { label: 'Coinsurance', value: `${cov.coinsurance_pct}% patient` },
                      { label: 'Network', value: result.network?.in_network ? '✅ In-Network' : '❌ Out-of-Network' },
                    ].map(item => (
                      <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl p-2.5 border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{item.label}</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                        {item.sub && <p className="text-[10px] text-gray-400">{item.sub}</p>}
                      </div>
                    ))}
                    {cov.requires_prior_auth_for.length > 0 && (
                      <div className="col-span-2 flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-2.5 border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Prior auth required for: <strong>{cov.requires_prior_auth_for.join(', ')}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <p className="text-[10px] text-gray-400 mt-2">Transaction ID: {result.transaction_id}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EligibilityPanel
