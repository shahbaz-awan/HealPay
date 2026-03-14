import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, User, FileText, DollarSign, Activity, X, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface SearchResult {
  type: 'patient' | 'encounter' | 'claim' | 'invoice'
  id: number
  title: string
  subtitle: string
  link: string
  status?: string
}

const typeIcon = { patient: User, encounter: Activity, claim: FileText, invoice: DollarSign }
const typeLabel = { patient: 'Patient', encounter: 'Encounter', claim: 'Claim', invoice: 'Invoice' }
const typeColor = {
  patient:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  encounter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  claim:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  invoice:   'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults([]) }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      // Build search results from multiple endpoints
      const role = user?.role?.toUpperCase()
      const all: SearchResult[] = []

      if (role === 'ADMIN' || role === 'DOCTOR' || role === 'BILLING') {
        // Search patients
        try {
          const patients = await apiGet<any[]>(`/v1/admin/users?q=${encodeURIComponent(q)}`)
          patients?.slice(0, 3).forEach((p: any) => all.push({
            type: 'patient', id: p.id,
            title: `${p.first_name} ${p.last_name}`,
            subtitle: p.email,
            link: `/admin/patients/${p.id}`,
          }))
        } catch {}
      }

      if (role === 'BILLING' || role === 'ADMIN') {
        // Search claims
        try {
          const claims = await apiGet<any[]>(`/v1/billing/claims?q=${encodeURIComponent(q)}`)
          claims?.slice(0, 3).forEach((c: any) => all.push({
            type: 'claim', id: c.id,
            title: `Claim ${c.claim_number}`,
            subtitle: `${c.insurance_provider} · $${c.total_amount}`,
            link: `/billing/claims`,
            status: c.status,
          }))
        } catch {}
        // Search invoices
        try {
          const invoices = await apiGet<any[]>(`/v1/billing/invoices?q=${encodeURIComponent(q)}`)
          invoices?.slice(0, 3).forEach((i: any) => all.push({
            type: 'invoice', id: i.id,
            title: `Invoice ${i.invoice_number}`,
            subtitle: `$${i.balance_due} due`,
            link: `/billing/invoices`,
            status: i.status,
          }))
        } catch {}
      }

      if (role === 'CODER' || role === 'DOCTOR' || role === 'ADMIN') {
        try {
          const encounters = await apiGet<any[]>(`/v1/clinical/encounters?q=${encodeURIComponent(q)}`)
          encounters?.slice(0, 3).forEach((e: any) => all.push({
            type: 'encounter', id: e.id,
            title: `Encounter #${e.id}`,
            subtitle: e.chief_complaint || e.encounter_type,
            link: `/coder/dashboard`,
            status: e.status,
          }))
        } catch {}
      }

      setResults(all)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const t = setTimeout(() => search(query), 300)
    return () => clearTimeout(t)
  }, [query, search])

  const handleSelect = (r: SearchResult) => {
    navigate(r.link)
    setOpen(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setSelectedIdx(i => Math.min(i + 1, results.length - 1))
    if (e.key === 'ArrowUp') setSelectedIdx(i => Math.max(i - 1, 0))
    if (e.key === 'Enter' && results[selectedIdx]) handleSelect(results[selectedIdx])
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm hover:border-blue-400 dark:hover:border-blue-600 transition-all group"
      title="Search (Ctrl+K)"
    >
      <Search size={14} />
      <span className="hidden sm:inline text-xs">Search…</span>
      <kbd className="hidden sm:inline text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          {loading ? <Loader size={18} className="text-blue-500 animate-spin flex-shrink-0" /> : <Search size={18} className="text-gray-400 flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0) }}
            onKeyDown={handleKey}
            placeholder="Search patients, claims, invoices, encounters…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query.length >= 2 && !loading && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No results for "<span className="font-semibold text-gray-600 dark:text-gray-300">{query}</span>"
            </div>
          )}
          {query.length < 2 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Type at least 2 characters to search
            </div>
          )}
          {results.map((r, idx) => {
            const Icon = typeIcon[r.type]
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setSelectedIdx(idx)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 ${
                  selectedIdx === idx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor[r.type]}`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.subtitle}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor[r.type]}`}>
                  {typeLabel[r.type]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex gap-4 text-[10px] text-gray-400">
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono">↑↓</kbd> Navigate</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono">Enter</kbd> Select</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalSearch
