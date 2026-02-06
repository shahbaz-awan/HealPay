import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText,
  User,
  Calendar,
  ChevronRight,
  Stethoscope,
  CheckCircle,
  TrendingUp,
  Send,
  Eye
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getPendingEncounters, getCompletedEncounters, sendEncounterTo } from '@/services/clinicalService'

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
  const [completedEncounters, setCompletedEncounters] = useState<PendingEncounter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEncounter, setSelectedEncounter] = useState<PendingEncounter | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [sendingTo, setSendingTo] = useState<number | null>(null)

  useEffect(() => {
    fetchAllEncounters()
  }, [])

  const fetchAllEncounters = async () => {
    try {
      setIsLoading(true)
      const [pendingData, completedData] = await Promise.all([
        getPendingEncounters(),
        getCompletedEncounters()
      ])
      setEncounters(pendingData)
      setCompletedEncounters(completedData)
    } catch (error) {
      console.error('Error fetching encounters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTo = async (encounterId: number, target: 'biller' | 'doctor') => {
    try {
      setSendingTo(encounterId)
      await sendEncounterTo(encounterId, target)
      const completedData = await getCompletedEncounters()
      setCompletedEncounters(completedData)
    } catch (error) {
      console.error('Error sending encounter:', error)
    } finally {
      setSendingTo(null)
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
          <p className="text-secondary-600">Loading encounters...</p>
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
              <p className="text-sm text-secondary-600">Completed</p>
              <p className="text-2xl font-bold text-secondary-900">{completedEncounters.length}</p>
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Pending ({encounters.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === 'completed'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-2" />
          Completed ({completedEncounters.length})
        </button>
      </div>

      {/* Pending Encounters List */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader
            title="Pending Encounters"
            subtitle="Clinical encounters waiting for code assignment"
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
                        <Badge variant="warning">Pending</Badge>
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
      )}

      {/* Completed Encounters List */}
      {activeTab === 'completed' && (
        <Card>
          <CardHeader
            title="Completed Encounters"
            subtitle="Coded encounters ready for billing"
          />

          {completedEncounters.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Completed Encounters</h3>
              <p className="text-secondary-600">Complete coding on pending encounters to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedEncounters.map((encounter) => (
                <motion.div
                  key={encounter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border border-secondary-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {encounter.patient_name}
                        </h3>
                        <Badge variant={
                          encounter.status === 'sent_to_biller' ? 'success' :
                            encounter.status === 'sent_to_doctor' ? 'info' : 'warning'
                        }>
                          {encounter.status === 'sent_to_biller' ? 'Sent to Biller' :
                            encounter.status === 'sent_to_doctor' ? 'Sent to Doctor' : 'Coded'}
                        </Badge>
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
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/coder/claims/${encounter.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {encounter.status === 'coded' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={sendingTo === encounter.id}
                            onClick={() => handleSendTo(encounter.id, 'biller')}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            To Biller
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={sendingTo === encounter.id}
                            onClick={() => handleSendTo(encounter.id, 'doctor')}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            To Doctor
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}

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
                className="text-secondary-400 hover:text-secondary-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedEncounter.chief_complaint && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-1">Chief Complaint</h4>
                  <p className="text-red-700">{selectedEncounter.chief_complaint}</p>
                </div>
              )}
              {selectedEncounter.subjective_notes && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-1">Subjective</h4>
                  <p className="text-blue-700">{selectedEncounter.subjective_notes}</p>
                </div>
              )}
              {selectedEncounter.objective_findings && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-1">Objective Findings</h4>
                  <p className="text-green-700">{selectedEncounter.objective_findings}</p>
                </div>
              )}
              {selectedEncounter.assessment && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-1">Assessment</h4>
                  <p className="text-yellow-700">{selectedEncounter.assessment}</p>
                </div>
              )}
              {selectedEncounter.plan && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-1">Plan</h4>
                  <p className="text-purple-700">{selectedEncounter.plan}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSelectedEncounter(null)}>
                Close
              </Button>
              <Button onClick={() => navigate(`/coder/claims/${selectedEncounter.id}`)}>
                Start Coding
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CoderDashboard
