import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, Filter, ChevronRight, Calendar, User, CheckCircle, Clock } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { getPendingEncounters, getCompletedEncounters } from '@/services/clinicalService'

const ITEMS_PER_PAGE = 10

type StatusFilter = 'all' | 'pending' | 'coded'

const ClaimsQueue = () => {
  const navigate = useNavigate()
  const [allEncounters, setAllEncounters] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      try {
        const [pending, completed] = await Promise.all([
          getPendingEncounters(),
          getCompletedEncounters(),
        ])
        const tagged = [
          ...(pending || []).map((e: any) => ({ ...e, _queueStatus: 'pending' })),
          ...(completed || []).map((e: any) => ({ ...e, _queueStatus: 'coded' })),
        ].sort((a, b) => new Date(b.encounter_date).getTime() - new Date(a.encounter_date).getTime())
        setAllEncounters(tagged)
      } catch (err) {
        console.error('Failed to load encounters', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = allEncounters
    if (statusFilter !== 'all') list = list.filter(e => e._queueStatus === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.patient_name?.toLowerCase().includes(q) ||
        e.doctor_name?.toLowerCase().includes(q) ||
        e.chief_complaint?.toLowerCase().includes(q)
      )
    }
    return list
  }, [allEncounters, statusFilter, search])

  // Reset to page 1 when filter/search changes
  useEffect(() => { setCurrentPage(1) }, [statusFilter, search])

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const counts = useMemo(() => ({
    all: allEncounters.length,
    pending: allEncounters.filter(e => e._queueStatus === 'pending').length,
    coded: allEncounters.filter(e => e._queueStatus === 'coded').length,
  }), [allEncounters])

  if (isLoading) return <DashboardSkeleton statCount={3} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Claims Queue</h1>
          <p className="text-secondary-600 mt-1">All clinical encounters requiring medical coding</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="text-sm px-3 py-1">{counts.pending} Pending</Badge>
          <Badge variant="success" className="text-sm px-3 py-1">{counts.coded} Coded</Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient, doctor, or complaint…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'pending', 'coded'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  statusFilter === s ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader title={`Encounters (${filtered.length})`} subtitle="Click a row to open the coding workspace" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Doctor</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Chief Complaint</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-secondary-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No encounters found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                  </td>
                </tr>
              ) : (
                paginated.map((enc, i) => (
                  <motion.tr
                    key={enc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/coder/claims/${enc.id}`)}
                  >
                    <td className="p-4 text-sm text-secondary-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(enc.encounter_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-secondary-900">{enc.patient_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-secondary-600">{enc.doctor_name}</td>
                    <td className="p-4 text-sm text-secondary-600">{enc.encounter_type || enc.type || '—'}</td>
                    <td className="p-4 text-sm text-secondary-600 max-w-[200px] truncate">
                      {enc.chief_complaint || '—'}
                    </td>
                    <td className="p-4 text-center">
                      {enc._queueStatus === 'pending' ? (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1 inline" /> Pending
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1 inline" /> Coded
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Button size="sm" variant={enc._queueStatus === 'pending' ? 'primary' : 'outline'}>
                        {enc._queueStatus === 'pending' ? 'Code It' : 'Review'}
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

export default ClaimsQueue
