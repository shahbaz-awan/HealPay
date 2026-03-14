import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  ClipboardList,
  ArrowRight
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { getBillingStats, getRecentInvoices, getReadyToBillEncounters, createInvoiceFromEncounter, getInvoiceDetail, BillingStats, getClaims, updateClaimStatus, Claim } from '@/services/billingService'
import RecordPaymentModal from '@/components/modals/RecordPaymentModal'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { toast } from 'react-toastify'
import { ARAgingWidget } from '@/components/ui/ARAgingWidget'

const BillingDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [readyEncounters, setReadyEncounters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<number | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [claims, setClaims] = useState<Claim[]>([])
  const [updatingClaimId, setUpdatingClaimId] = useState<number | null>(null)
  const [showDenialModal, setShowDenialModal] = useState(false)
  const [denialTarget, setDenialTarget] = useState<{ id: number; number: string } | null>(null)
  const [denialCode, setDenialCode] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await getBillingStats().catch(err => {
          console.error('Failed to load stats', err)
          return null
        })
        setStats(statsData)

        const invoicesData = await getRecentInvoices().catch(err => {
          console.error('Failed to load invoices', err)
          return []
        })
        setRecentInvoices(invoicesData || [])

        const readyEncountersData = await getReadyToBillEncounters().catch(err => {
          console.error('Failed to load ready encounters', err)
          return []
        })
        setReadyEncounters(readyEncountersData || [])

        const claimsData = await getClaims().catch(err => {
          console.error('Failed to load claims', err)
          return []
        })
        setClaims(claimsData || [])

      } catch (error) {
        console.error('Unexpected error fetching billing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Statistics Display
  const statCards = [
    {
      title: 'Total Revenue',
      value: stats ? `$${stats.total_revenue.toLocaleString()}` : '$0',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: 'Lifetime revenue',
      trend: 'up'
    },
    {
      title: 'Outstanding',
      value: stats ? `$${stats.outstanding.toLocaleString()}` : '$0',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: `${stats ? stats.pending_invoices_count : 0} pending invoices`,
      trend: 'neutral'
    },
    {
      title: 'Collected This Month',
      value: stats ? `$${stats.collected_month.toLocaleString()}` : '$0',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: 'Current month',
      trend: 'up'
    },
    {
      title: 'Overdue',
      value: stats ? `$${stats.overdue.toLocaleString()}` : '$0',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: `${stats ? stats.overdue_invoices_count : 0} overdue invoices`,
      trend: 'neutral'
    }
  ]

  // Payment activity (Placeholder for now, could be fetched via API later)
  const paymentActivity: any[] = []

  // Collection efficiency
  const collectionRate = stats && (stats.total_revenue + stats.outstanding) > 0
    ? (stats.total_revenue / (stats.total_revenue + stats.outstanding)) * 100
    : 0

  const getStatusBadge = (status: string) => {
    const badges: any = {
      paid: <Badge variant="success">Paid</Badge>,
      issued: <Badge variant="warning">Issued</Badge>,
      overdue: <Badge variant="danger">Overdue</Badge>,
      cancelled: <Badge variant="secondary">Cancelled</Badge>
    }
    return badges[status] || <Badge variant="info">{status}</Badge>
  }

  const getPaymentMethodIcon = (_method: string) => {
    return <CreditCard className="w-4 h-4 text-gray-400" />
  }

  const handleGenerateInvoice = async (encounterId: number) => {
    setGeneratingInvoiceId(encounterId)
    try {
      const result = await createInvoiceFromEncounter(encounterId)
      if (result.already_existed) {
        toast.info(`Invoice ${result.invoice_number} already exists for this encounter`)
      } else {
        toast.success(`Invoice ${result.invoice_number} created for $${result.total_amount?.toFixed(2)}`)
      }
      // Refresh data
      const [invoicesData, readyData] = await Promise.all([
        getRecentInvoices().catch(() => []),
        getReadyToBillEncounters().catch(() => [])
      ])
      setRecentInvoices(invoicesData || [])
      setReadyEncounters(readyData || [])
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to generate invoice')
    } finally {
      setGeneratingInvoiceId(null)
    }
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

  const handleClaimStatusUpdate = async (claimId: number, newStatus: string) => {
    if (newStatus === 'denied') {
      const claim = claims.find(c => c.id === claimId)
      setDenialTarget({ id: claimId, number: claim?.claim_number || '' })
      setDenialCode('')
      setShowDenialModal(true)
      return
    }
    setUpdatingClaimId(claimId)
    try {
      const updated = await updateClaimStatus(claimId, newStatus)
      setClaims(prev => prev.map(c => c.id === claimId ? { ...c, ...updated } : c))
      toast.success(`Claim marked as ${newStatus}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update claim status')
    } finally {
      setUpdatingClaimId(null)
    }
  }

  const handleDenialConfirm = async () => {
    if (!denialTarget) return
    setUpdatingClaimId(denialTarget.id)
    setShowDenialModal(false)
    try {
      const updated = await updateClaimStatus(denialTarget.id, 'denied', denialCode || undefined)
      setClaims(prev => prev.map(c => c.id === denialTarget.id ? { ...c, ...updated } : c))
      toast.success('Claim denied')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to deny claim')
    } finally {
      setUpdatingClaimId(null)
      setDenialTarget(null)
    }
  }

  const getClaimStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      submitted: <Badge variant="info">Submitted</Badge>,
      approved: <Badge variant="success">Approved</Badge>,
      denied: <Badge variant="danger">Denied</Badge>,
      paid: <Badge variant="success">Paid</Badge>,
      pending: <Badge variant="warning">Pending</Badge>,
    }
    return badges[status] || <Badge variant="info">{status}</Badge>
  }

  if (isLoading) {
    return <DashboardSkeleton statCount={4} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Billing Dashboard</h1>
          <p className="text-secondary-600 mt-1">Manage invoices, payments, and revenue</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover-card relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-secondary-600 mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-secondary-900 mb-2">{stat.value}</h3>
                  <div className="flex items-center gap-2">
                    {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    <p className="text-xs text-secondary-500">{stat.change}</p>
                  </div>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor}`}></div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AR Aging Report */}
      <ARAgingWidget />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ready to Bill - Full Width on Mobile, Col span 2 otherwise */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encounters Ready for Billing */}
          <Card>
            <CardHeader
              title="Ready to Bill"
              subtitle="Encounters coded and waiting for claim generation"
              action={
                <Button variant="outline" size="sm">
                  View All
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Doctor</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Type</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {readyEncounters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-secondary-500">
                        No encounters ready for billing.
                      </td>
                    </tr>
                  ) : (
                    readyEncounters.map((encounter) => (
                      <motion.tr
                        key={encounter.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4 text-sm text-secondary-900">
                          {new Date(encounter.encounter_date).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-secondary-900">{encounter.patient_name}</div>
                        </td>
                        <td className="p-4 text-sm text-secondary-600">{encounter.doctor_name}</td>
                        <td className="p-4 text-sm text-secondary-600">{encounter.type}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="primary" onClick={() => navigate(`/billing/cms1500/${encounter.id}`)}>Generate Claim</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateInvoice(encounter.id)}
                              disabled={generatingInvoiceId === encounter.id}
                            >
                              {generatingInvoiceId === encounter.id ? 'Creating...' : 'Generate Invoice'}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Claims Management */}
          <Card>
            <CardHeader
              title="Claims Management"
              subtitle="Review and update insurance claim statuses"
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Claim #</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Insurer</th>
                    <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-secondary-500">
                        No claims found.
                      </td>
                    </tr>
                  ) : (
                    claims.slice(0, 8).map((claim) => (
                      <motion.tr
                        key={claim.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4 text-sm font-mono text-secondary-900">{claim.claim_number}</td>
                        <td className="p-4 text-sm text-secondary-600">{claim.insurance_provider}</td>
                        <td className="p-4 text-right text-sm font-semibold text-secondary-900">
                          ${claim.total_amount?.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          {getClaimStatusBadge(claim.status)}
                          {claim.denial_reason_code && (
                            <p className="text-xs text-red-600 mt-1">Code: {claim.denial_reason_code}</p>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {['submitted', 'pending'].includes(claim.status) ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={updatingClaimId === claim.id}
                                onClick={() => handleClaimStatusUpdate(claim.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingClaimId === claim.id}
                                onClick={() => handleClaimStatusUpdate(claim.id, 'denied')}
                              >
                                Deny
                              </Button>
                            </div>
                          ) : claim.status === 'approved' ? (
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={updatingClaimId === claim.id}
                              onClick={() => handleClaimStatusUpdate(claim.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <span className="text-xs text-secondary-400 italic">No actions</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader
              title="Recent Invoices"
              subtitle="Latest billing activity"
              action={
                <Button variant="outline" size="sm">
                  View All Invoices
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Invoice #</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient ID</th>
                    <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Due Date</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {recentInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-secondary-500">
                        No recent invoices found.
                      </td>
                    </tr>
                  ) : (
                    recentInvoices.map((invoice) => (
                      <motion.tr
                        key={invoice.id}
                        whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                        className="transition-colors"
                      >
                        <td className="p-4">
                          <div className="text-sm font-medium text-secondary-900">{invoice.invoice_number}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-secondary-900">#{invoice.patient_id}</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-sm font-semibold text-secondary-900">
                            ${invoice.total_amount?.toFixed(2)}
                          </div>
                          {invoice.amount_paid > 0 && (
                            <div className="text-xs text-green-600">
                              Paid: ${invoice.amount_paid.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-secondary-600">{invoice.due_date}</td>
                        <td className="p-4 text-center">{getStatusBadge(invoice.status)}</td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewInvoice(invoice.id)}
                          >
                            {invoice.status !== 'paid' ? 'Record Payment' : 'View'}
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Payment Activity + Collection Rate - 1 column */}
        <div className="space-y-6">
          {/* Collection Efficiency Card */}
          <Card>
            <CardHeader title="Collection Rate" subtitle="Revenue vs outstanding" />
            <div className="p-2">
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold text-secondary-900 dark:text-white">
                  {collectionRate.toFixed(1)}%
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${collectionRate >= 80 ? 'bg-green-100 text-green-700' : collectionRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {collectionRate >= 80 ? 'Excellent' : collectionRate >= 60 ? 'Fair' : 'Needs Attention'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <p className="text-xs text-secondary-500 dark:text-gray-400">Collected</p>
                  <p className="font-bold text-green-700 dark:text-green-400">${(stats?.total_revenue ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <p className="text-xs text-secondary-500 dark:text-gray-400">Outstanding</p>
                  <p className="font-bold text-yellow-700 dark:text-yellow-400">${(stats?.outstanding ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Activity */}
          <Card>
            <CardHeader
              title="Payment Activity"
              subtitle="Recent payments"
            />
            <div className="space-y-4">
              {paymentActivity.length === 0 ? (
                <div className="p-8 text-center text-secondary-500">
                  No recent payment activity.
                </div>
              ) : (
                paymentActivity.map((payment) => (
                  <div
                    key={payment.id}
                    className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary-900 mb-1">{payment.patient}</h4>
                        <div className="flex items-center gap-2 text-xs text-secondary-600 mb-2">
                          {getPaymentMethodIcon(payment.method)}
                          <span>{payment.method}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-green-700">
                            +${payment.amount.toFixed(2)}
                          </span>
                          <span className="text-xs text-secondary-500">{payment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'CMS-1500 Form', sub: 'Generate insurance claim forms', icon: ClipboardList, color: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-600', route: '/billing/cms1500' },
            { label: 'All Invoices', sub: `${recentInvoices.length} recent invoices`, icon: FileText, color: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600', route: '/billing/invoices' },
            { label: 'Ready to Bill', sub: `${readyEncounters.length} encounter${readyEncounters.length !== 1 ? 's' : ''} pending`, icon: CreditCard, color: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600', route: '/billing' },
            { label: 'Financial Reports', sub: 'Revenue analytics & exports', icon: BarChart3, color: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600', route: '/billing/reports' },
          ].map((action, i) => (
            <motion.div key={i} whileHover={{ y: -2 }} className="cursor-pointer" onClick={() => navigate(action.route)}>
              <Card className="hover:shadow-md transition-shadow border hover:border-primary-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 ${action.color} rounded-xl`}>
                    <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-secondary-900 dark:text-white text-sm">{action.label}</h3>
                    <p className="text-xs text-secondary-500 dark:text-gray-400 mt-0.5">{action.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-secondary-400" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <RecordPaymentModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedInvoice(null)
          }}
          onSuccess={async () => {
            const invoicesData = await getRecentInvoices().catch(() => [])
            setRecentInvoices(invoicesData || [])
            const statsData = await getBillingStats().catch(() => null)
            setStats(statsData)
          }}
        />
      )}

      {/* Denial Reason Modal */}
      {showDenialModal && denialTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-1">Deny Claim</h3>
            <p className="text-sm text-secondary-600 mb-4">
              Claim <span className="font-mono font-semibold">{denialTarget.number}</span> will be marked as denied.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Denial Reason Code <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CO-4, PR-1, CO-97"
              maxLength={10}
              value={denialCode}
              onChange={e => setDenialCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowDenialModal(false); setDenialTarget(null) }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleDenialConfirm}>
                Confirm Denial
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingDashboard
