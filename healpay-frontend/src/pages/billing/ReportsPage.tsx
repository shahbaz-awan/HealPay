import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, BarChart2
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { toast } from 'react-toastify'

const fmt = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) : '0.0')

const ReportsPage = () => {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await apiGet<any>('/v1/billing/stats')
        setStats(data)
      } catch {
        toast.error('Failed to load reports data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) return <DashboardSkeleton statCount={4} />
  if (!stats) return null

  const {
    total_revenue = 0,
    outstanding = 0,
    collected_month = 0,
    overdue = 0,
    pending_invoices_count = 0,
    overdue_invoices_count = 0,
    monthly_revenue = [],
    invoice_status_breakdown = {},
    claim_status_breakdown = {},
  } = stats

  const totalInvoiced = total_revenue + outstanding
  const collectionRate = pct(total_revenue, totalInvoiced)

  const statCards = [
    { label: 'Total Collected', value: fmt(total_revenue), icon: DollarSign, color: 'bg-green-50 text-green-600', sub: '' },
    { label: 'Outstanding', value: fmt(outstanding), icon: AlertCircle, color: 'bg-amber-50 text-amber-600', sub: `${pending_invoices_count} pending invoices` },
    { label: 'Collected This Month', value: fmt(collected_month), icon: TrendingUp, color: 'bg-blue-50 text-blue-600', sub: '' },
    { label: 'Overdue', value: fmt(overdue), icon: XCircle, color: 'bg-red-50 text-red-600', sub: `${overdue_invoices_count} overdue invoices` },
  ]

  const maxRevenue = monthly_revenue.length > 0
    ? Math.max(...monthly_revenue.map((m: any) => m.revenue || 0), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Reports</h1>
        <p className="text-secondary-600 mt-1">Revenue overview and billing performance metrics</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-secondary-500">{s.label}</p>
                  <p className="text-xl font-bold text-secondary-900">{s.value}</p>
                  {s.sub && <p className="text-xs text-secondary-400">{s.sub}</p>}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Collection Rate */}
      <Card>
        <CardHeader title="Collection Rate" subtitle="Total collected vs total invoiced" />
        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm text-secondary-700">
            <span>Collected {fmt(total_revenue)}</span>
            <span className="font-bold text-green-600">{collectionRate}%</span>
          </div>
          <div className="w-full bg-secondary-100 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${collectionRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-secondary-400">Total invoiced: {fmt(totalInvoiced)}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader
            title="Monthly Revenue"
            subtitle="Last 6 months — amount collected"
            icon={<BarChart2 className="w-5 h-5 text-primary-600" />}
          />
          {monthly_revenue.length === 0 ? (
            <p className="text-center text-secondary-400 py-8">No revenue data available</p>
          ) : (
            <div className="mt-4 space-y-3">
              {monthly_revenue.map((row: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-secondary-500 w-14 shrink-0 text-right">{row.month}</span>
                  <div className="flex-1 bg-secondary-100 rounded-full h-6 overflow-hidden">
                    <motion.div
                      className="h-6 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${(row.revenue / maxRevenue) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    >
                      {row.revenue > 0 && (
                        <span className="text-white text-xs font-semibold">${Number(row.revenue).toLocaleString()}</span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Claims Breakdown */}
        <Card>
          <CardHeader title="Claims Breakdown" subtitle="By current status" />
          <div className="mt-4 space-y-3">
            {[
              { key: 'submitted', label: 'Submitted', icon: Clock, cls: 'text-blue-600 bg-blue-50', variant: 'info' as const },
              { key: 'approved', label: 'Approved', icon: CheckCircle2, cls: 'text-green-600 bg-green-50', variant: 'success' as const },
              { key: 'denied', label: 'Denied', icon: XCircle, cls: 'text-red-600 bg-red-50', variant: 'danger' as const },
              { key: 'pending', label: 'Pending', icon: Clock, cls: 'text-amber-600 bg-amber-50', variant: 'warning' as const },
            ].map(({ key, label, icon: Icon, cls, variant }) => {
              const count = claim_status_breakdown?.[key] ?? 0
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-secondary-700">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={variant}>{count}</Badge>
                  </div>
                </div>
              )
            })}
            {Object.keys(claim_status_breakdown).length === 0 && (
              <p className="text-center text-secondary-400 py-6">No claims data available</p>
            )}
          </div>
        </Card>

        {/* Invoice Status Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader title="Invoice Status Breakdown" subtitle="Distribution of invoice statuses" />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { key: 'draft', label: 'Draft', color: 'border-secondary-300 text-secondary-600' },
              { key: 'issued', label: 'Issued', color: 'border-blue-400 text-blue-600' },
              { key: 'paid', label: 'Paid', color: 'border-green-400 text-green-600' },
              { key: 'overdue', label: 'Overdue', color: 'border-red-400 text-red-600' },
              { key: 'cancelled', label: 'Cancelled', color: 'border-gray-400 text-gray-500' },
            ].map(({ key, label, color }) => (
              <div key={key} className={`border-2 rounded-xl p-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{invoice_status_breakdown?.[key] ?? 0}</p>
                <p className="text-xs mt-1 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ReportsPage
