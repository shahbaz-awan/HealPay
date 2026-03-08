import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Filter, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import RecordPaymentModal from '@/components/modals/RecordPaymentModal'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { getInvoiceDetail } from '@/services/billingService'
import { toast } from 'react-toastify'

const ITEMS_PER_PAGE = 15
type StatusFilter = 'all' | 'issued' | 'paid' | 'overdue' | 'cancelled'

const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
  paid:      { label: 'Paid',      variant: 'success',   icon: CheckCircle },
  issued:    { label: 'Issued',    variant: 'warning',   icon: Clock },
  overdue:   { label: 'Overdue',   variant: 'danger',    icon: AlertCircle },
  cancelled: { label: 'Cancelled', variant: 'secondary', icon: FileText },
}

const InvoicesPage = () => {
  const [allInvoices, setAllInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const fetchInvoices = async (page: number, status: StatusFilter) => {
    setIsLoading(true)
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE
      const params: Record<string, any> = { skip, limit: ITEMS_PER_PAGE }
      if (status !== 'all') params.status = status
      const data = await apiGet<{ total: number; items: any[] }>('/v1/billing/invoices', { params })
      setAllInvoices(data.items)
      setTotal(data.total)
    } catch (err) {
      toast.error('Failed to load invoices')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchInvoices(currentPage, statusFilter) }, [currentPage, statusFilter])

  const filtered = useMemo(() => {
    if (!search.trim()) return allInvoices
    const q = search.toLowerCase()
    return allInvoices.filter(inv =>
      inv.invoice_number?.toLowerCase().includes(q) ||
      String(inv.patient_id)?.includes(q)
    )
  }, [allInvoices, search])

  const handleStatusFilterChange = (s: StatusFilter) => {
    setStatusFilter(s)
    setCurrentPage(1)
  }

  const handleViewInvoice = async (invoiceId: number) => {
    try {
      const detail = await getInvoiceDetail(invoiceId)
      setSelectedInvoice(detail)
      setShowPaymentModal(true)
    } catch {
      toast.error('Could not load invoice details')
    }
  }

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig['issued']
    const Icon = cfg.icon
    return (
      <Badge variant={cfg.variant}>
        <Icon className="w-3 h-3 mr-1 inline" />
        {cfg.label}
      </Badge>
    )
  }

  if (isLoading && allInvoices.length === 0) return <DashboardSkeleton statCount={4} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Invoices</h1>
          <p className="text-secondary-600 mt-1">Full invoice register with payment tracking</p>
        </div>
        <Badge variant="info" className="text-sm px-3 py-1">{total} Total</Badge>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice # or patient ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'issued', 'paid', 'overdue', 'cancelled'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => handleStatusFilterChange(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  statusFilter === s ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title="Invoice List"
          subtitle={isLoading ? 'Loading…' : `Showing ${filtered.length} invoices`}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Invoice #</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient ID</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary-700">Total</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary-700">Paid</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary-700">Balance</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Due Date</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-secondary-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No invoices found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-sm text-secondary-900 font-mono">{inv.invoice_number}</td>
                    <td className="p-4 text-sm text-secondary-600">#{inv.patient_id}</td>
                    <td className="p-4 text-right text-sm font-semibold text-secondary-900">
                      ${inv.total_amount?.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-sm text-green-600">
                      ${(inv.amount_paid || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-sm font-semibold text-orange-600">
                      ${(inv.balance_due || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-sm text-secondary-600">{inv.due_date || '—'}</td>
                    <td className="p-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant={inv.status !== 'paid' && inv.status !== 'cancelled' ? 'primary' : 'ghost'}
                        onClick={() => handleViewInvoice(inv.id)}
                      >
                        {inv.status !== 'paid' && inv.status !== 'cancelled' ? 'Pay' : 'View'}
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={p => { setCurrentPage(p); fetchInvoices(p, statusFilter) }}
        />
      </Card>

      {showPaymentModal && selectedInvoice && (
        <RecordPaymentModal
          invoice={selectedInvoice}
          onClose={() => { setShowPaymentModal(false); setSelectedInvoice(null) }}
          onSuccess={() => fetchInvoices(currentPage, statusFilter)}
        />
      )}
    </div>
  )
}

export default InvoicesPage
