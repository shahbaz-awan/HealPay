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
  ClipboardList
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { getBillingStats, getRecentInvoices, getReadyToBillEncounters, BillingStats } from '@/services/billingService'

const BillingDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [readyEncounters, setReadyEncounters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const getStatusBadge = (status: string) => {
    const badges: any = {
      paid: <Badge variant="success">Paid</Badge>,
      issued: <Badge variant="warning">Issued</Badge>,
      overdue: <Badge variant="danger">Overdue</Badge>,
      cancelled: <Badge variant="secondary">Cancelled</Badge>
    }
    return badges[status] || <Badge variant="info">{status}</Badge>
  }

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="w-4 h-4 text-gray-400" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
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
                          <Button size="sm" variant="primary">Generate Claim</Button>
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
                          <Button size="sm" variant="ghost">View</Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Payment Activity - 1 column */}
        <div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-card cursor-pointer group" onClick={() => navigate('/billing/cms1500')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <ClipboardList className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">CMS-1500 Form</h3>
              <p className="text-sm text-secondary-600">Generate claim forms</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">All Invoices</h3>
              <p className="text-sm text-secondary-600">View invoice history</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Payment Methods</h3>
              <p className="text-sm text-secondary-600">Manage payment options</p>
            </div>
          </div>
        </Card>

        <Card className="hover-card cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">Financial Reports</h3>
              <p className="text-sm text-secondary-600">Detailed analytics</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default BillingDashboard
