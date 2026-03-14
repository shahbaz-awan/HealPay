import React, { useEffect, useState } from 'react'
import { apiGet } from '@/services/api'

interface AgingBucket {
  total: number
  count: number
  invoices: Array<{
    invoice_id: number
    invoice_number: string
    patient_name: string
    due_date: string
    balance_due: number
    days_past_due: number
  }>
}

interface ARAgingData {
  grand_total_outstanding: number
  generated_at: string
  buckets: {
    '0_30_days': AgingBucket
    '31_60_days': AgingBucket
    '61_90_days': AgingBucket
    'over_90_days': AgingBucket
  }
}

const BUCKET_CONFIG = [
  { key: '0_30_days',   label: '0-30 Days',  color: 'bg-green-500',  light: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800' },
  { key: '31_60_days',  label: '31-60 Days', color: 'bg-yellow-500', light: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  { key: '61_90_days',  label: '61-90 Days', color: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  { key: 'over_90_days',label: '90+ Days',   color: 'bg-red-500',    light: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-300',       border: 'border-red-200 dark:border-red-800' },
] as const

export const ARAgingWidget: React.FC = () => {
  const [data, setData] = useState<ARAgingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    apiGet<ARAgingData>('/v1/mock/reports/ar-aging')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl" />)}
      </div>
    </div>
  )

  if (!data) return null

  const grand = data.grand_total_outstanding

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">AR Aging Report</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">As of {data.generated_at}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ${grand.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Outstanding</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="mb-5 h-2 rounded-full overflow-hidden flex">
        {BUCKET_CONFIG.map(({ key, color }) => {
          const bucket = data.buckets[key as keyof typeof data.buckets]
          const pct = grand > 0 ? (bucket.total / grand) * 100 : 0
          return (
            <div
              key={key}
              className={`${color} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${pct}%` }}
              title={`${key}: $${bucket.total.toFixed(2)}`}
            />
          )
        })}
      </div>

      {/* Bucket cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {BUCKET_CONFIG.map(({ key, label, light, text, border, color }) => {
          const bucket = data.buckets[key as keyof typeof data.buckets]
          const pct = grand > 0 ? ((bucket.total / grand) * 100).toFixed(0) : '0'
          const isExpanded = expanded === key

          return (
            <div key={key} className={`rounded-xl border ${light} ${border} overflow-hidden`}>
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full text-left p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
                  <span className={`text-xs font-bold ${text}`}>{label}</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ${bucket.total.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {bucket.count} invoice{bucket.count !== 1 ? 's' : ''} · {pct}%
                </p>
              </button>

              {/* Expandable invoice list */}
              {isExpanded && bucket.invoices.length > 0 && (
                <div className="border-t border-current border-opacity-20 max-h-40 overflow-y-auto">
                  {bucket.invoices.slice(0, 8).map(inv => (
                    <div key={inv.invoice_id} className="px-3 py-1.5 border-b border-current border-opacity-10 last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{inv.patient_name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{inv.invoice_number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold text-red-600 dark:text-red-400">${inv.balance_due.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">{inv.days_past_due}d past</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ARAgingWidget
