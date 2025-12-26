import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

const BillingDashboard = () => {
  // Statistics
  const stats = [
    {
      title: 'Total Revenue',
      value: '$184,500',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+18% from last month',
      trend: 'up'
    },
    {
      title: 'Outstanding',
      value: '$42,350',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '156 pending invoices',
      trend: 'neutral'
    },
    {
      title: 'Collected This Month',
      value: '$142,150',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '87% collection rate',
      trend: 'up'
    },
    {
      title: 'Overdue',
      value: '$12,840',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: '34 overdue invoices',
      trend: 'neutral'
    }
  ]

  // Recent invoices
  const recentInvoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-1208-001',
      patient: 'Sarah Mitchell',
      service: 'ECG & Consultation',
      issueDate: '2024-12-08',
      dueDate: '2024-12-22',
      amount: 450.00,
      paid: 0,
      status: 'pending',
      insurance: 'Blue Cross'
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-1208-002',
      patient: 'James Anderson',
      service: 'Annual Physical',
      issueDate: '2024-12-08',
      dueDate: '2024-12-22',
      amount: 320.00,
      paid: 0,
      status: 'pending',
      insurance: 'Aetna'
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-1207-042',
      patient: 'Emily Rodriguez',
      service: 'X-Ray Imaging',
      issueDate: '2024-12-07',
      dueDate: '2024-12-21',
      amount: 275.00,
      paid: 275.00,
      status: 'paid',
      insurance: 'United Healthcare'
    },
    {
      id: 4,
      invoiceNumber: 'INV-2024-1128-015',
      patient: 'Michael Chen',
      service: 'Skin Examination',
      issueDate: '2024-11-28',
      dueDate: '2024-12-12',
      amount: 200.00,
      paid: 0,
      status: 'overdue',
      insurance: 'Cigna'
    }
  ]

  // Payment activity
  const paymentActivity = [
    {
      id: 1,
      patient: 'Lisa Thompson',
      amount: 280.00,
      method: 'Credit Card',
      time: '2 hours ago',
      status: 'completed'
    },
    {
      id: 2,
      patient: 'Robert Williams',
      amount: 520.00,
      method: 'Insurance',
      time: '5 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      patient: 'Jennifer Adams',
      amount: 340.00,
      method: 'Credit Card',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: 4,
      patient: 'David Martinez',
      amount: 195.00,
      method: 'Cash',
      time: '1 day ago',
      status: 'completed'
    }
  ]

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: <Badge variant="success">Paid</Badge>,
      pending: <Badge variant="warning">Pending</Badge>,
      overdue: <Badge variant="danger">Overdue</Badge>
    }
    return badges[status as keyof typeof badges]
  }

  const getPaymentMethodIcon = (method: string) => {
    return <CreditCard className="w-4 h-4 text-gray-400" />
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
        {stats.map((stat, index) => (
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
        {/* Recent Invoices - 2 columns */}
        <div className="lg:col-span-2">
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
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Service</th>
                    <th className="text-right p-4 text-sm font-semibold text-secondary-700">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-secondary-700">Due Date</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                    <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {recentInvoices.map((invoice) => (
                    <motion.tr
                      key={invoice.id}
                      whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                      className="transition-colors"
                    >
                      <td className="p-4">
                        <div className="text-sm font-medium text-secondary-900">{invoice.invoiceNumber}</div>
                        <div className="text-xs text-secondary-500">{invoice.insurance}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-secondary-900">{invoice.patient}</div>
                      </td>
                      <td className="p-4 text-sm text-secondary-900">{invoice.service}</td>
                      <td className="p-4 text-right">
                        <div className="text-sm font-semibold text-secondary-900">
                          ${invoice.amount.toFixed(2)}
                        </div>
                        {invoice.paid > 0 && (
                          <div className="text-xs text-green-600">
                            Paid: ${invoice.paid.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-secondary-600">{invoice.dueDate}</td>
                      <td className="p-4 text-center">{getStatusBadge(invoice.status)}</td>
                      <td className="p-4 text-center">
                        <Button size="sm" variant="ghost">View</Button>
                      </td>
                    </motion.tr>
                  ))}
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
              {paymentActivity.map((payment) => (
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
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
