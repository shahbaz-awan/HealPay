import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, FileText, CheckCircle, Clock, AlertCircle,
  XCircle, ChevronRight, Receipt, Search
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { toast } from 'react-toastify'

const ITEMS_PER_PAGE = 10

const encStatusLabel: Record<string, { label: string; variant: any }> = {
  pending_coding:  { label: 'Pending Code', variant: 'warning' },
  coded:           { label: 'Coded', variant: 'info' },
  sent_to_biller:  { label: 'Sent to Billing', variant: 'info' },
  completed:       { label: 'Completed', variant: 'success' },
}

const invStatusConfig: Record<string, { label: string; variant: any; icon: any }> = {
  issued:    { label: 'Issued',    variant: 'warning',   icon: Clock },
  paid:      { label: 'Paid',      variant: 'success',   icon: CheckCircle },
  overdue:   { label: 'Overdue',   variant: 'danger',    icon: AlertCircle },
  cancelled: { label: 'Cancelled', variant: 'secondary', icon: XCircle },
}

const claimStatusConfig: Record<string, { label: string; variant: any }> = {
  submitted: { label: 'Submitted', variant: 'info' },
  approved:  { label: 'Approved',  variant: 'success' },
  denied:    { label: 'Denied',    variant: 'danger' },
  pending:   { label: 'Pending',   variant: 'warning' },
}

const BillingPage = () => {
  const navigate = useNavigate()
  const [encounters, setEncounters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await apiGet<any[]>('/v1/billing/doctor-encounters')
        setEncounters(data || [])
      } catch {
        toast.error('Failed to load billing data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = encounters.filter(e =>
    !search ||
    e.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.encounter_type?.toLowerCase().includes(search.toLowerCase()) ||
    e.invoice_number?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalEncounters = encounters.length
  const unbilled  = encounters.filter(e => !e.invoice_id).length
  const invoiced  = encounters.filter(e => e.invoice_id && e.invoice_status !== 'paid').length
  const paid      = encounters.filter(e => e.invoice_status === 'paid').length
  const totalRevenue = encounters.reduce((sum, e) => sum + (e.amount_paid || 0), 0)

  if (isLoading) return <DashboardSkeleton statCount={4} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Billing Overview</h1>
        <p className="text-secondary-600 mt-1">Track invoice and claim status for your clinical encounters</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Encounters', value: totalEncounters, icon: FileText, color: 'bg-blue-50 text-blue-600' },
          { label: 'Not Yet Billed', value: unbilled, icon: Clock, color: 'bg-amber-50 text-amber-600' },
          { label: 'Awaiting Payment', value: invoiced, icon: DollarSign, color: 'bg-purple-50 text-purple-600' },
          { label: 'Paid', value: paid, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-secondary-500">{s.label}</p>
                  <p className="text-xl font-bold text-secondary-900">{s.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue collected */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-secondary-500">Total Collected (your encounters)</p>
              <p className="text-2xl font-bold text-green-700">
                ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Encounters Table */}
      <Card>
        <CardHeader
          title={`Encounter Billing Status (${filtered.length} total)`}
          subtitle="Each row shows the billing and insurance claim status for your encounters"
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by patient, type, or invoice number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Type</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Encounter Status</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Invoice</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Claim</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-secondary-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No encounters found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((enc, i) => {
                  const encBadge = encStatusLabel[enc.status] ?? { label: enc.status, variant: 'secondary' }
                  const invCfg = enc.invoice_status ? invStatusConfig[enc.invoice_status] : null
                  const clmCfg = enc.claim_status ? claimStatusConfig[enc.claim_status] : null

                  return (
                    <motion.tr
                      key={enc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-sm text-secondary-600 whitespace-nowrap">
                        {new Date(enc.encounter_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-sm font-medium text-secondary-900">{enc.patient_name}</td>
                      <td className="p-4 text-sm text-secondary-600">{enc.encounter_type}</td>
                      <td className="p-4 text-center">
                        <Badge variant={encBadge.variant}>{encBadge.label}</Badge>
                      </td>
                      <td className="p-4">
                        {enc.invoice_number ? (
                          <div className="flex items-center gap-1.5">
                            {invCfg && <invCfg.icon className="w-4 h-4 text-secondary-500" />}
                            <span className="text-sm font-mono text-secondary-700">{enc.invoice_number}</span>
                            {invCfg && <Badge variant={invCfg.variant}>{invCfg.label}</Badge>}
                          </div>
                        ) : (
                          <span className="text-sm text-secondary-400 italic">Not invoiced</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm">
                        {enc.invoice_amount != null ? (
                          <div>
                            <p className="font-semibold text-secondary-900">${enc.invoice_amount.toFixed(2)}</p>
                            {enc.amount_paid != null && enc.amount_paid > 0 && (
                              <p className="text-xs text-green-600">+${enc.amount_paid.toFixed(2)} paid</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary-300">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {clmCfg ? (
                          <Badge variant={clmCfg.variant}>{clmCfg.label}</Badge>
                        ) : (
                          <span className="text-secondary-300 text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {enc.status === 'coded' || enc.status === 'sent_to_biller' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/doctor/patients/${enc.patient_id}`)}
                          >
                            View
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-secondary-300 text-sm">—</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  )
}

export default BillingPage
