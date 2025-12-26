import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  User,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getPendingEncounters } from '@/services/clinicalService'

interface PendingEncounter {
  id: number
  encounter_date: string
  patient_name: string
  patient_age: number
  encounter_type: string
  chief_complaint: string
  subjective_notes?: string
  objective_findings?: string
  assessment?: string
  plan?: string
  doctor_name: string
  status: string
}

const CoderDashboard = () => {
  const navigate = useNavigate()
  const [encounters, setEncounters] = useState<PendingEncounter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEncounter, setSelectedEncounter] = useState<PendingEncounter | null>(null)

  useEffect(() => {
    fetchPendingEncounters()
  }, [])

  const fetchPendingEncounters = async () => {
    try {
      setIsLoading(true)
      const data = await getPendingEncounters()
      setEncounters(data)
    } catch (error) {
      console.error('Error fetching pending encounters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading pending encounters...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Medical Coding Dashboard</h1>
          <p className="text-secondary-600 mt-1">Review clinical encounters and assign medical codes</p>
        </div>
        <Badge variant="info" className="text-lg px-4 py-2">
          {encounters.length} Pending
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Pending Coding</p>
              <p className="text-2xl font-bold text-secondary-900">{encounters.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Coded Today</p>
              <p className="text-2xl font-bold text-secondary-900">0</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-secondary-600">Accuracy Rate</p>
              <p className="text-2xl font-bold text-secondary-900">98.5%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Encounters List */}
      <Card>
        <CardHeader
          title="Pending Encounters"
          subtitle="Clinical encounters waiting for code assignment"
          icon={<FileText className="w-5 h-5 text-blue-600" />}
        />

        {encounters.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Pending Encounters</h3>
            <p className="text-secondary-600">All clinical encounters have been coded</p>
          </div>
        ) : (
          <div className="space-y-4">
            {encounters.map((encounter) => (
              <motion.div
                key={encounter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border border-secondary-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedEncounter(encounter)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {encounter.patient_name}
                      </h3>
                      <Badge variant="warning">Pending Coding</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-secondary-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Age: {encounter.patient_age} years</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(encounter.encounter_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        <span>{encounter.doctor_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{encounter.encounter_type}</span>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <p className="text-sm font-medium text-yellow-900">
                        <strong>Chief Complaint:</strong> {encounter.chief_complaint}
                      </p>
                      {encounter.assessment && (
                        <p className="text-sm text-yellow-900 mt-1">
                          <strong>Assessment:</strong> {encounter.assessment}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/coder/claims/${encounter.id}`)
                    }}
                  >
                    Assign Codes
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Clinical Notes Modal */}
      {selectedEncounter && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEncounter(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary-900">
                  Clinical Notes - {selectedEncounter.patient_name}
                </h2>
                <p className="text-sm text-secondary-600 mt-1">
                  {selectedEncounter.doctor_name} • {formatDate(selectedEncounter.encounter_date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedEncounter(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">Chief Complaint</h3>
                <p className="text-blue-900">{selectedEncounter.chief_complaint}</p>
              </div>

              {selectedEncounter.subjective_notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-secondary-900 mb-2">Subjective (S)</h3>
                  <p className="text-secondary-700 whitespace-pre-wrap">
                    {selectedEncounter.subjective_notes}
                  </p>
                </div>
              )}

              {selectedEncounter.objective_findings && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-secondary-900 mb-2">Objective (O)</h3>
                  <p className="text-secondary-700 whitespace-pre-wrap">
                    {selectedEncounter.objective_findings}
                  </p>
                </div>
              )}

              {selectedEncounter.assessment && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                  <h3 className="font-semibold text-yellow-900 mb-2">Assessment (A)</h3>
                  <p className="text-yellow-900 whitespace-pre-wrap">
                    {selectedEncounter.assessment}
                  </p>
                </div>
              )}

              {selectedEncounter.plan && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Plan (P)</h3>
                  <p className="text-green-900 whitespace-pre-wrap">
                    {selectedEncounter.plan}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedEncounter(null)}
              >
                Close
              </Button>
              <Button
                onClick={() => navigate(`/coder/claims/${selectedEncounter.id}`)}
              >
                Assign Medical Codes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CoderDashboard
