import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, DollarSign, CreditCard, Banknote, Building2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { recordPayment } from '@/services/billingService'
import { toast } from 'react-toastify'

interface RecordPaymentModalProps {
    invoice: {
        id: number
        invoice_number: string
        patient_name: string
        total_amount: number
        amount_paid: number
        balance_due: number
        status: string
    }
    onClose: () => void
    onSuccess: () => void
}

const PAYMENT_METHODS = [
    { value: 'Credit Card', label: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'Cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
    { value: 'Insurance', label: 'Insurance', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: <Building2 className="w-4 h-4" /> },
    { value: 'Check', label: 'Check', icon: <Banknote className="w-4 h-4" /> },
]

const RecordPaymentModal = ({ invoice, onClose, onSuccess }: RecordPaymentModalProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: invoice.balance_due.toFixed(2),
        payment_method: 'Credit Card',
        transaction_id: '',
        notes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid payment amount')
            return
        }
        if (amount > invoice.balance_due) {
            toast.error(`Amount cannot exceed balance due ($${invoice.balance_due.toFixed(2)})`)
            return
        }

        setIsLoading(true)
        try {
            await recordPayment({
                invoice_id: invoice.id,
                amount,
                payment_method: formData.payment_method,
                transaction_id: formData.transaction_id || undefined,
                notes: formData.notes || undefined,
            })

            toast.success(`Payment of $${amount.toFixed(2)} recorded successfully!`)
            onSuccess()
            onClose()
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Failed to record payment'
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-secondary-900">Record Payment</h2>
                        <p className="text-sm text-secondary-600 mt-1">{invoice.invoice_number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Invoice Summary */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-secondary-600">Patient</span>
                        <span className="font-semibold text-secondary-900">{invoice.patient_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-secondary-600">Invoice Total</span>
                        <span className="font-semibold">${invoice.total_amount.toFixed(2)}</span>
                    </div>
                    {invoice.amount_paid > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-secondary-600">Already Paid</span>
                            <span className="font-semibold text-green-600">-${invoice.amount_paid.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2 border-blue-200">
                        <span className="font-semibold text-secondary-900">Balance Due</span>
                        <span className="text-lg font-bold text-red-600">${invoice.balance_due.toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Payment Amount *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={invoice.balance_due}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="pl-9"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Payment Method *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map((method) => (
                                <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, payment_method: method.value })}
                                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                                        formData.payment_method === method.value
                                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                                            : 'border-gray-200 hover:border-gray-300 text-secondary-700'
                                    }`}
                                >
                                    {method.icon}
                                    {method.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Transaction ID */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Transaction ID <span className="text-xs text-gray-400">(optional)</span>
                        </label>
                        <Input
                            value={formData.transaction_id}
                            onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                            placeholder="e.g., CC-123456"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Notes <span className="text-xs text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Processing...' : `Record $${parseFloat(formData.amount || '0').toFixed(2)} Payment`}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

export default RecordPaymentModal
