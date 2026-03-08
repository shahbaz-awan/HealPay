import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FileText, DollarSign, AlertCircle, CheckCircle, Clock,
    ChevronDown, ChevronUp, X, Loader2, Receipt
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getMyInvoices, getInvoiceDetail } from '@/services/billingService'

interface Invoice {
    id: number
    invoice_number: string
    total_amount: number
    balance_due: number
    status: string
    issue_date: string
    due_date: string
    line_items?: LineItem[]
    encounter_id?: number
}

interface LineItem {
    code: string
    description: string
    amount: number
    code_type: string
}

const statusConfig: Record<string, { label: string; badge: 'success' | 'warning' | 'danger' | 'info'; icon: React.FC<any> }> = {
    paid: { label: 'Paid', badge: 'success', icon: CheckCircle },
    issued: { label: 'Pending', badge: 'warning', icon: Clock },
    overdue: { label: 'Overdue', badge: 'danger', icon: AlertCircle },
    cancelled: { label: 'Cancelled', badge: 'info', icon: X },
}

const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const formatCurrency = (n: number) =>
    typeof n === 'number' ? `$${n.toFixed(2)}` : '—'

const PatientBills = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [detail, setDetail] = useState<Invoice | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')

    useEffect(() => {
        getMyInvoices()
            .then(data => setInvoices(data || []))
            .catch(() => setInvoices([]))
            .finally(() => setIsLoading(false))
    }, [])

    const openDetail = async (id: number) => {
        setSelectedId(id)
        setDetail(null)
        setDetailLoading(true)
        try {
            const data = await getInvoiceDetail(id)
            setDetail(data)
        } catch {
            setDetail(invoices.find(inv => inv.id === id) || null)
        } finally {
            setDetailLoading(false)
        }
    }

    const filtered = invoices.filter(inv => {
        if (filter === 'all') return true
        if (filter === 'pending') return inv.status === 'issued'
        if (filter === 'overdue') return inv.status === 'overdue'
        if (filter === 'paid') return inv.status === 'paid'
        return true
    })

    const totalOutstanding = invoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + (inv.balance_due ?? 0), 0)
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length
    const paidCount = invoices.filter(inv => inv.status === 'paid').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">My Bills</h1>
                <p className="text-secondary-500 dark:text-gray-400 mt-1">View and track your medical invoices</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                            <DollarSign className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-secondary-500">Total Outstanding</p>
                            <p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatCurrency(totalOutstanding)}</p>
                        </div>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            <AlertCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-secondary-500">Overdue Invoices</p>
                            <p className="text-2xl font-bold text-secondary-900 dark:text-white">{overdueCount}</p>
                        </div>
                    </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-secondary-500">Paid Invoices</p>
                            <p className="text-2xl font-bold text-secondary-900 dark:text-white">{paidCount}</p>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'pending', 'overdue', 'paid'] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                            filter === f
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {f === 'all' ? `All (${invoices.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${invoices.filter(inv => {
                            if (f === 'pending') return inv.status === 'issued'
                            return inv.status === f
                        }).length})`}
                    </button>
                ))}
            </div>

            {/* Invoice table */}
            <Card>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
                            <p className="text-secondary-500">Loading invoices…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-14 h-14 text-secondary-300 mx-auto mb-3" />
                            <p className="font-medium text-secondary-700 mb-1">No invoices found</p>
                            <p className="text-sm text-secondary-500">Invoices appear here once your visits are billed</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-secondary-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Invoice #</th>
                                    <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Issue Date</th>
                                    <th className="text-left p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Due Date</th>
                                    <th className="text-right p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Amount</th>
                                    <th className="text-right p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Balance</th>
                                    <th className="text-center p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Status</th>
                                    <th className="text-center p-4 text-sm font-semibold text-secondary-700 dark:text-gray-300">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 dark:divide-gray-700">
                                {filtered.map((inv, i) => (
                                    <>
                                        <motion.tr
                                            key={inv.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`transition-colors ${inv.status === 'overdue' ? 'bg-red-50/40 dark:bg-red-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/40`}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Receipt className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-secondary-900 dark:text-white">{inv.invoice_number}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-secondary-600 dark:text-gray-400">{formatDate(inv.issue_date)}</td>
                                            <td className="p-4 text-sm">
                                                <span className={inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-secondary-600 dark:text-gray-400'}>
                                                    {formatDate(inv.due_date)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-sm font-semibold text-secondary-900 dark:text-white">
                                                {formatCurrency(inv.total_amount)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-sm font-semibold ${inv.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(inv.balance_due)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge variant={statusConfig[inv.status]?.badge ?? 'info'}>
                                                    {statusConfig[inv.status]?.label ?? inv.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setSelectedId(selectedId === inv.id ? null : inv.id)}
                                                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                    aria-label="Toggle details"
                                                >
                                                    {selectedId === inv.id
                                                        ? <ChevronUp className="w-4 h-4 text-secondary-500" />
                                                        : <ChevronDown className="w-4 h-4 text-secondary-500" />
                                                    }
                                                </button>
                                            </td>
                                        </motion.tr>
                                        {/* Expanded detail row */}
                                        <AnimatePresence>
                                            {selectedId === inv.id && (
                                                <tr key={`detail-${inv.id}`}>
                                                    <td colSpan={7} className="p-0">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="overflow-hidden bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-800"
                                                        >
                                                            <InvoiceDetailPanel
                                                                invoiceId={inv.id}
                                                                onLoad={openDetail}
                                                                detail={detail?.id === inv.id ? detail : null}
                                                                loading={detailLoading}
                                                            />
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    )
}

/* ---------- Inline detail panel ---------- */
interface DetailPanelProps {
    invoiceId: number
    onLoad: (id: number) => void
    detail: Invoice | null
    loading: boolean
}

const InvoiceDetailPanel = ({ invoiceId, onLoad, detail, loading }: DetailPanelProps) => {
    useEffect(() => {
        onLoad(invoiceId)
    }, [invoiceId])   // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary-500 mx-auto" />
            </div>
        )
    }
    if (!detail) return null

    return (
        <div className="p-6">
            <p className="text-sm font-semibold text-secondary-700 dark:text-gray-300 mb-3">Line Items</p>
            {detail.line_items && detail.line_items.length > 0 ? (
                <div className="space-y-2">
                    {detail.line_items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                    {item.code}
                                </span>
                                <span className="text-sm text-secondary-700 dark:text-gray-300">
                                    {item.description || item.code_type}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-secondary-900 dark:text-white">
                                ${(item.amount ?? 0).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-secondary-500 italic">No line item breakdown available.</p>
            )}
        </div>
    )
}

export default PatientBills
