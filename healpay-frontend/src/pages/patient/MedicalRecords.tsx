import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Calendar, ChevronDown, ChevronRight,
  FileText, Activity, Tag, User, ClipboardList, Search
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { apiGet } from '@/services/api'
import { toast } from 'react-toastify'

const ITEMS_PER_PAGE = 8

const statusBadge: Record<string, any> = {
  pending_coding: { label: 'Pending Review', variant: 'warning' },
  coded:          { label: 'Reviewed', variant: 'info' },
  sent_to_biller: { label: 'Processing', variant: 'info' },
  sent_to_doctor: { label: 'Under Review', variant: 'warning' },
  completed:      { label: 'Completed', variant: 'success' },
}

const MedicalRecords = () => {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await apiGet<any[]>('/v1/clinical/encounters/my-records')
        setRecords(data || [])
      } catch {
        toast.error('Failed to load medical records')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = records.filter(r =>
    !search ||
    r.encounter_type?.toLowerCase().includes(search.toLowerCase()) ||
    r.chief_complaint?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_name?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalVisits = records.length
  const uniqueDiagnoses = new Set(records.flatMap(r => r.icd_codes?.map((c: any) => c.code) ?? [])).size
  const totalProcedures = records.reduce((sum: number, r: any) => sum + (r.cpt_codes?.length ?? 0), 0)

  if (isLoading) return <DashboardSkeleton statCount={3} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-secondary-900">Medical Records</h1>
        <p className="text-secondary-600 mt-1">Your complete clinical visit history and diagnoses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Visits', value: totalVisits, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
          { label: 'Unique Diagnoses', value: uniqueDiagnoses, icon: Stethoscope, color: 'bg-purple-50 text-purple-600' },
          { label: 'Procedures Recorded', value: totalProcedures, icon: ClipboardList, color: 'bg-green-50 text-green-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-secondary-500">{s.label}</p>
                  <p className="text-2xl font-bold text-secondary-900">{s.value}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Records List */}
      <Card>
        <CardHeader
          title="Visit History"
          subtitle="Click any visit to expand diagnoses and procedures"
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search by type, complaint, or doctor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full pl-9 pr-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-14 h-14 mx-auto mb-3 text-secondary-300" />
            <p className="font-semibold text-secondary-700">
              {records.length === 0 ? 'No medical records yet' : 'No records match your search'}
            </p>
            <p className="text-sm text-secondary-400 mt-1">
              {records.length === 0 ? 'Records will appear here after doctor visits' : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((record, i) => {
              const isOpen = expanded === record.id
              const badge = statusBadge[record.status] ?? { label: record.status, variant: 'secondary' }
              const hasCodes = (record.icd_codes?.length ?? 0) + (record.cpt_codes?.length ?? 0) > 0

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border border-secondary-200 rounded-xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    className="w-full text-left p-4 hover:bg-secondary-50 transition-colors flex items-center justify-between gap-4"
                    onClick={() => setExpanded(isOpen ? null : record.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-secondary-900 text-sm">{record.encounter_type}</span>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {hasCodes && <Badge variant="info">{(record.icd_codes?.length ?? 0) + (record.cpt_codes?.length ?? 0)} codes</Badge>}
                        </div>
                        <p className="text-xs text-secondary-500 truncate mt-0.5">
                          {record.chief_complaint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <p className="text-xs text-secondary-500">
                          {new Date(record.encounter_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-secondary-400 flex items-center gap-1 justify-end mt-0.5">
                          <User className="w-3 h-3" />{record.doctor_name}
                        </p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-secondary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-secondary-100 overflow-hidden"
                      >
                        <div className="p-4 space-y-4 bg-secondary-50">
                          {record.assessment && (
                            <div>
                              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1">Assessment</p>
                              <p className="text-sm text-secondary-700">{record.assessment}</p>
                            </div>
                          )}
                          {record.plan && (
                            <div>
                              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-1">Treatment Plan</p>
                              <p className="text-sm text-secondary-700">{record.plan}</p>
                            </div>
                          )}

                          {record.icd_codes?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> Diagnoses (ICD-10)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {record.icd_codes.map((c: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                                    <span className="font-mono font-bold">{c.code}</span>
                                    <span className="text-blue-600">{c.description}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.cpt_codes?.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <ClipboardList className="w-3 h-3" /> Procedures (CPT)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {record.cpt_codes.map((c: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                                    <span className="font-mono font-bold">{c.code}</span>
                                    <span className="text-green-600">{c.description}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {!hasCodes && (
                            <p className="text-sm text-secondary-400 italic">No medical codes assigned yet — record is pending review.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  )
}

export default MedicalRecords
