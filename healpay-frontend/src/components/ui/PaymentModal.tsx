import React, { useState } from 'react'
import { CreditCard, Lock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { apiPost } from '@/services/api'
import { toast } from 'react-toastify'

interface PaymentModalProps {
  invoiceId: number
  invoiceNumber: string
  balanceDue: number
  onSuccess: () => void
  onClose: () => void
}

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', brand: '💳 Visa',       result: '✅ Success' },
  { number: '5555 5555 5555 4444', brand: '💳 Mastercard', result: '✅ Success' },
  { number: '4000 0000 0000 0002', brand: '💳 Visa',       result: '❌ Declined' },
  { number: '4000 0000 0000 9995', brand: '💳 Visa',       result: '❌ Insufficient Funds' },
]

type Status = 'idle' | 'processing' | 'success' | 'failed'

const formatCard = (v: string) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoiceId, invoiceNumber, balanceDue, onSuccess, onClose
}) => {
  const [cardNumber, setCardNumber] = useState('')
  const [holderName, setHolderName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [txnId, setTxnId] = useState('')
  const [showTestCards, setShowTestCards] = useState(false)

  const handleExpiry = (v: string) => {
    const d = v.replace(/\D/g, '')
    setExpiry(d.length > 2 ? `${d.slice(0,2)}/${d.slice(2,4)}` : d)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber || !holderName || !expiry || !cvv) {
      toast.error('Please fill in all card details')
      return
    }

    const [monthStr, yearStr] = expiry.split('/')
    setStatus('processing')
    setErrorMsg('')

    try {
      const res = await apiPost<any>(`/v1/mock/invoices/${invoiceId}/pay`, {
        invoice_id: invoiceId,
        card_number: cardNumber.replace(/\s/g, ''),
        card_holder_name: holderName,
        expiry_month: parseInt(monthStr || '0'),
        expiry_year: parseInt('20' + (yearStr || '0')),
        cvv,
      })

      if (res.success) {
        setStatus('success')
        setTxnId(res.transaction_id)
        toast.success('Payment successful!')
        setTimeout(onSuccess, 2000)
      } else {
        setStatus('failed')
        setErrorMsg(res.error_message || 'Payment declined')
      }
    } catch (err: any) {
      setStatus('failed')
      setErrorMsg(err?.response?.data?.detail || 'Payment failed. Please try again.')
    }
  }

  const cardBrand = () => {
    const n = cardNumber.replace(/\s/g, '')
    if (n.startsWith('4')) return '💳 Visa'
    if (n.startsWith('5')) return '💳 Mastercard'
    if (n.startsWith('3')) return '💳 Amex'
    if (n.startsWith('6')) return '💳 Discover'
    return '💳'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock size={20} />
              <div>
                <h2 className="text-lg font-bold">Secure Payment</h2>
                <p className="text-blue-200 text-xs">Invoice {invoiceNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors text-xl font-light">×</button>
          </div>
          <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-blue-100">Amount Due</span>
            <span className="text-2xl font-bold">${balanceDue.toFixed(2)}</span>
          </div>
        </div>

        {/* Success State */}
        {status === 'success' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Payment Successful!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your payment has been processed</p>
            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300">
              TXN ID: {txnId}
            </p>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <XCircle className="text-red-500 flex-shrink-0" size={20} />
              <p className="text-sm text-red-700 dark:text-red-300">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Payment Form */}
        {(status === 'idle' || status === 'processing') && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Test card banner */}
            <button
              type="button"
              onClick={() => setShowTestCards(!showTestCards)}
              className="w-full text-left text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 flex items-center justify-between"
            >
              <span>🧪 Demo Mode — Click to see test cards</span>
              <span>{showTestCards ? '▲' : '▼'}</span>
            </button>

            {showTestCards && (
              <div className="grid grid-cols-2 gap-2">
                {TEST_CARDS.map(tc => (
                  <button
                    key={tc.number}
                    type="button"
                    onClick={() => { setCardNumber(tc.number); setShowTestCards(false) }}
                    className="text-left p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  >
                    <p className="text-[10px] font-mono text-gray-600 dark:text-gray-400">{tc.number}</p>
                    <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-200">{tc.result}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Card Number */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCard(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">{cardBrand().split(' ')[0]}</span>
              </div>
            </div>

            {/* Holder Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Cardholder Name</label>
              <input
                type="text"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Expiry (MM/YY)</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={e => handleExpiry(e.target.value)}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={e => setCvv(e.target.value.slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'processing'}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-200 dark:shadow-blue-900 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {status === 'processing' ? (
                <><Loader size={18} className="animate-spin" /> Processing…</>
              ) : (
                <><Lock size={16} /> Pay ${balanceDue.toFixed(2)}</>
              )}
            </button>

            <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
              <Lock size={10} /> 256-bit SSL encrypted · Demo mode
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default PaymentModal
