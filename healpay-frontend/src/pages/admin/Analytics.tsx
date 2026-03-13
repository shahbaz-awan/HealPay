import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, FileText, Activity, TrendingUp,
  CheckCircle, XCircle, Clock, BarChart2, UserCheck, Stethoscope
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { toast } from 'react-toastify'

const fmt = (n: number) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const USERS_PER_PAGE = 10

const roleColor: Record<string, string> = {
  patient: 'bg-blue-100 text-blue-700',
  doctor:  'bg-green-100 text-green-700',
  coder:   'bg-purple-100 text-purple-700',
  billing: 'bg-amber-100 text-amber-700',
  admin:   'bg-red-100 text-red-700',
}

const Analytics = () => {
  const [summary, setSummary] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userPage, setUserPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [summaryData, usersData] = await Promise.all([
          apiGet<any>('/v1/admin/reports/summary'),
          apiGet<any[]>('/v1/admin/reports/users', { params: { limit: 200 } }),
        ])
        setSummary(summaryData)
        setUsers(usersData || [])
      } catch {
        toast.error('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading || !summary) return <DashboardSkeleton statCount={4} />

  const { billing, claims, encounters, appointments, monthly_revenue = [], users: userStats } = summary

  const maxRevenue = Math.max(...monthly_revenue.map((m: any) => m.revenue || 0), 1)

  const kpis = [
    { label: 'Total Collected',   value: fmt(billing.total_collected),  icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Outstanding',       value: fmt(billing.outstanding),       icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Encounters',  value: encounters.total,               icon: Activity,   color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Registered',  value: userStats?.total ?? 0,          icon: Users,      color: 'bg-purple-50 text-purple-600' },
  ]

  const claimTotal = (claims.submitted || 0) + (claims.approved || 0) + (claims.denied || 0)
  const approvalRate = claimTotal ? ((claims.approved / claimTotal) * 100).toFixed(1) : '0.0'
  const denialRate   = claimTotal ? ((claims.denied / claimTotal) * 100).toFixed(1) : '0.0'
  const collectionRate = billing.collection_rate_pct?.toFixed(1) ?? '0.0'

  const roleBreakdown = Object.entries(userStats?.by_role ?? {}).map(([role, count]) => ({
    role,
    count: count as number,
    pct: userStats.total ? (((count as number) / userStats.total) * 100).toFixed(1) : '0',
  }))

  const pagedUsers = users.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Analytics</h1>
        <p className="text-secondary-600 mt-1">System-wide operational and financial insights</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${k.color}`}>
                  <k.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-secondary-500">{k.label}</p>
                  <p className="text-xl font-bold text-secondary-900">{k.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader
            title="Monthly Revenue"
            subtitle="Collections over the last 6 months"
            icon={<BarChart2 className="w-5 h-5 text-primary-600" />}
          />
          {monthly_revenue.length === 0 ? (
            <p className="text-center text-secondary-400 py-8">No data</p>
          ) : (
            <div className="mt-4 space-y-3">
              {monthly_revenue.map((row: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-secondary-500 w-16 shrink-0 text-right">{row.month}</span>
                  <div className="flex-1 bg-secondary-100 rounded-full h-7 overflow-hidden">
                    <motion.div
                      className="h-7 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max((row.revenue / maxRevenue) * 100, row.revenue > 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                    >
                      {row.revenue > 0 && (
                        <span className="text-white text-xs font-semibold whitespace-nowrap">
                          ${Number(row.revenue).toLocaleString()}
                        </span>
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Claims Analysis */}
        <Card>
          <CardHeader title="Claims Analysis" subtitle="Processing and adjudication rates" />
          <div className="mt-4 space-y-4">
            {[
              { label: 'Submitted',   count: claims.submitted,  icon: Clock,         cls: 'text-blue-600 bg-blue-50',   variant: 'info' as const },
              { label: 'Approved',    count: claims.approved,   icon: CheckCircle,   cls: 'text-green-600 bg-green-50', variant: 'success' as const },
              { label: 'Denied',      count: claims.denied,     icon: XCircle,       cls: 'text-red-600 bg-red-50',     variant: 'danger' as const },
            ].map(({ label, count, icon: Icon, cls, variant }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700">{label}</span>
                </div>
                <Badge variant={variant}>{count ?? 0}</Badge>
              </div>
            ))}
            <div className="pt-2 border-t border-secondary-100 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-700">{approvalRate}%</p>
                <p className="text-xs text-green-600">Approval Rate</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-700">{denialRate}%</p>
                <p className="text-xs text-red-600">Denial Rate</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Billing Performance */}
        <Card>
          <CardHeader title="Billing Performance" subtitle="Revenue and collection metrics" />
          <div className="mt-4 space-y-4">
            {[
              { label: 'Total Invoiced',   value: fmt(billing.total_invoiced),  bar: 100, color: 'bg-blue-400' },
              { label: 'Total Collected',  value: fmt(billing.total_collected), bar: billing.total_invoiced ? (billing.total_collected / billing.total_invoiced) * 100 : 0, color: 'bg-green-400' },
              { label: 'Outstanding',      value: fmt(billing.outstanding),     bar: billing.total_invoiced ? (billing.outstanding / billing.total_invoiced) * 100 : 0, color: 'bg-amber-400' },
            ].map(({ label, value, bar, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-secondary-600">{label}</span>
                  <span className="font-semibold text-secondary-900">{value}</span>
                </div>
                <div className="w-full bg-secondary-100 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(bar, 100)}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </div>
            ))}
            <div className="mt-3 p-3 rounded-lg bg-secondary-50 text-center">
              <p className="text-2xl font-bold text-primary-700">{collectionRate}%</p>
              <p className="text-xs text-secondary-500">Overall Collection Rate</p>
            </div>
          </div>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader title="User Distribution" subtitle="Registered users by role" />
          <div className="mt-4 space-y-3">
            {roleBreakdown.map(({ role, count, pct }) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-20 shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${roleColor[role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {role}
                  </span>
                </div>
                <div className="flex-1 bg-secondary-100 rounded-full h-4 overflow-hidden">
                  <motion.div
                    className="h-4 rounded-full bg-gradient-to-r from-secondary-400 to-secondary-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-sm font-semibold text-secondary-700 w-14 text-right">{count} ({pct}%)</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-xl font-bold text-blue-700">{encounters.this_month}</p>
              <p className="text-xs text-blue-500">Encounters This Month</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50">
              <p className="text-xl font-bold text-purple-700">{appointments.this_month}</p>
              <p className="text-xs text-purple-500">Appointments This Month</p>
            </div>
          </div>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader
          title="User Activity"
          subtitle="All registered users with encounter and appointment activity"
          icon={<UserCheck className="w-5 h-5 text-primary-600" />}
        />
        <div className="overflow-x-auto mt-2">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">User</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Role</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Encounters</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Appointments</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {pagedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-secondary-400">No users found</td>
                </tr>
              ) : (
                pagedUsers.map((u: any, i: number) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{u.name}</p>
                          <p className="text-xs text-secondary-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${roleColor[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-semibold text-secondary-700">{u.encounters ?? 0}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-semibold text-secondary-700">{u.appointments ?? 0}</span>
                    </td>
                    <td className="p-4 text-sm text-secondary-500">
                      {u.joined ? new Date(u.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={userPage}
          totalItems={users.length}
          itemsPerPage={USERS_PER_PAGE}
          onPageChange={setUserPage}
        />
      </Card>
    </div>
  )
}

export default Analytics
