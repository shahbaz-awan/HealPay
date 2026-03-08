import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, DollarSign, Building2, User } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { toast } from 'react-toastify'

const ITEMS_PER_PAGE = 20

const methodIcon = (method: string) => {
  if (method?.toLowerCase().includes('check')) return <CreditCard className="w-4 h-4 text-green-600" />
  if (method?.toLowerCase().includes('insurance')) return <Building2 className="w-4 h-4 text-blue-600" />
  return <CreditCard className="w-4 h-4 text-gray-500" />
}

const PaymentsPage = () => {
  const [payments, setPayments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPayments = async (page: number) => {
    setIsLoading(true)
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE
      const data = await apiGet<{ total: number; items: any[] }>('/v1/billing/payments', {
        params: { skip, limit: ITEMS_PER_PAGE },
      })
      setPayments(data.items)
      setTotal(data.total)
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchPayments(currentPage) }, [currentPage])

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const insuranceTotal = payments.filter(p => p.payer_type === 'insurance').reduce((sum, p) => sum + (p.amount || 0), 0)
  const patientTotal = payments.filter(p => p.payer_type !== 'insurance').reduce((sum, p) => sum + (p.amount || 0), 0)

  if (isLoading && payments.length === 0) return <DashboardSkeleton statCount={3} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Payments</h1>
        <p className="text-secondary-600 mt-1">Complete payment history across all invoices</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Page Total', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'bg-green-50 text-green-600' },
          { label: 'Insurance (page)', value: `$${insuranceTotal.toFixed(2)}`, icon: Building2, color: 'bg-blue-50 text-blue-600' },
          { label: 'Patient (page)', value: `$${patientTotal.toFixed(2)}`, icon: User, color: 'bg-purple-50 text-purple-600' },
        ].map((s, i) => (
          <Card key={i}>
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-secondary-500">{s.label}</p>
                <p className="text-xl font-bold text-secondary-900">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader
          title={`Payment History (${total} total)`}
          subtitle="All recorded payments — patient and insurance"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Invoice ID</th>
                <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Method</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Payer</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Check / Txn #</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-secondary-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No payments recorded yet</p>
                  </td>
                </tr>
              ) : (
                payments.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 text-sm text-secondary-700">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-sm text-secondary-600">#{p.invoice_id}</td>
                    <td className="p-4 text-right font-semibold text-green-700 text-sm">
                      +${p.amount?.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {methodIcon(p.payment_method)}
                        <span className="text-sm text-secondary-700 capitalize">{p.payment_method || '—'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={p.payer_type === 'insurance' ? 'info' : 'secondary'}>
                        {p.payer_type === 'insurance' ? 'Insurance' : 'Patient'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm font-mono text-secondary-600">
                      {p.check_number || p.transaction_id || '—'}
                    </td>
                    <td className="p-4 text-sm text-secondary-500 max-w-[160px] truncate">
                      {p.notes || '—'}
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
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  )
}

export default PaymentsPage
