import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Search, User, FileText, Calendar, ChevronRight } from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import DashboardSkeleton from '@/components/ui/DashboardSkeleton'
import { getPendingEncounters, getCompletedEncounters } from '@/services/clinicalService'

const ITEMS_PER_PAGE = 10

interface PatientSummary {
  id: number
  name: string
  pendingCount: number
  codedCount: number
  totalCount: number
  lastEncounterDate: string
  lastEncounterId: number
}

const CoderPatients = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      try {
        const [pending, completed] = await Promise.all([
          getPendingEncounters(),
          getCompletedEncounters(),
        ])
        // Aggregate encounters by patient
        const map = new Map<number, PatientSummary>()
        const process = (list: any[], status: 'pending' | 'coded') => {
          for (const enc of list || []) {
            const pid = enc.patient_id ?? enc.id // fallback
            const existing = map.get(pid)
            const encDate = enc.encounter_date
            if (existing) {
              if (status === 'pending') existing.pendingCount++
              else existing.codedCount++
              existing.totalCount++
              if (encDate > existing.lastEncounterDate) {
                existing.lastEncounterDate = encDate
                existing.lastEncounterId = enc.id
              }
            } else {
              map.set(pid, {
                id: pid,
                name: enc.patient_name || `Patient #${pid}`,
                pendingCount: status === 'pending' ? 1 : 0,
                codedCount: status === 'coded' ? 1 : 0,
                totalCount: 1,
                lastEncounterDate: encDate,
                lastEncounterId: enc.id,
              })
            }
          }
        }
        process(pending, 'pending')
        process(completed, 'coded')
        setPatients(
          Array.from(map.values()).sort((a, b) =>
            new Date(b.lastEncounterDate).getTime() - new Date(a.lastEncounterDate).getTime()
          )
        )
      } catch (err) {
        console.error('Failed to load patients', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return patients
    const q = search.toLowerCase()
    return patients.filter(p => p.name.toLowerCase().includes(q))
  }, [patients, search])

  useEffect(() => { setCurrentPage(1) }, [search])

  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (isLoading) return <DashboardSkeleton statCount={2} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Patients</h1>
          <p className="text-secondary-600 mt-1">Patients with clinical encounters in the coding queue</p>
        </div>
        <Badge variant="info" className="text-sm px-3 py-1">{patients.length} Patients</Badge>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </Card>

      {/* Patients table */}
      <Card>
        <CardHeader title={`Patients (${filtered.length})`} subtitle="Click to view their encounter history" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Encounters</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Pending</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Coded</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Last Encounter</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-secondary-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No patients found</p>
                  </td>
                </tr>
              ) : (
                paginated.map((patient, i) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {patient.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900 text-sm">{patient.name}</p>
                          <p className="text-xs text-secondary-500">ID #{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-secondary-900">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        {patient.totalCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {patient.pendingCount > 0 ? (
                        <Badge variant="warning">{patient.pendingCount}</Badge>
                      ) : (
                        <span className="text-secondary-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {patient.codedCount > 0 ? (
                        <Badge variant="success">{patient.codedCount}</Badge>
                      ) : (
                        <span className="text-secondary-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-secondary-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(patient.lastEncounterDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant={patient.pendingCount > 0 ? 'primary' : 'outline'}
                        onClick={() => navigate(`/coder/claims/${patient.lastEncounterId}`)}
                      >
                        {patient.pendingCount > 0 ? 'Code' : 'View'}
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

export default CoderPatients
