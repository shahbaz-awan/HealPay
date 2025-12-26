import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Search,
  Calendar,
  Phone,
  Mail,
  Eye
} from 'lucide-react'
import Card, { CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { apiGet } from '@/services/api'

interface Patient {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  appointmentCount: number
  lastAppointment?: string
}

const DoctorPatients = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch patients from doctor's appointments
  const fetchPatients = async () => {
    setIsLoading(true)
    try {
      // Get all appointments for this doctor
      const appointments = await apiGet<any[]>('/appointments')
      
      // Extract unique patients and aggregate data
      const patientMap = new Map<number, Patient>()
      
      appointments.forEach((apt: any) => {
        const patientId = apt.user_id
        
        if (patientMap.has(patientId)) {
          const existing = patientMap.get(patientId)!
          existing.appointmentCount++
          
          // Update last appointment if this one is more recent
          if (!existing.lastAppointment || apt.appointment_date > existing.lastAppointment) {
            existing.lastAppointment = apt.appointment_date
          }
        } else {
          patientMap.set(patientId, {
            id: patientId,
            first_name: apt.patientName?.split(' ')[0] || 'Unknown',
            last_name: apt.patientName?.split(' ').slice(1).join(' ') || '',
            email: apt.patient_email || '',
            phone: apt.patient_phone || '',
            appointmentCount: 1,
            lastAppointment: apt.appointment_date
          })
        }
      })
      
      setPatients(Array.from(patientMap.values()))
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(patient => {
    const fullName = `${patient.first_name} ${patient.last_name}`.toLowerCase()
    const search = searchTerm.toLowerCase()
    return (
      fullName.includes(search) ||
      patient.email.toLowerCase().includes(search) ||
      patient.phone?.toLowerCase().includes(search)
    )
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">My Patients</h1>
          <p className="text-secondary-600 mt-1">View and manage your patients</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{patients.length}</p>
            <p className="text-sm text-secondary-600 mt-1">Total Patients</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {patients.reduce((sum, p) => sum + p.appointmentCount, 0)}
            </p>
            <p className="text-sm text-secondary-600 mt-1">Total Appointments</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {patients.filter(p => {
                if (!p.lastAppointment) return false
                const lastDate = new Date(p.lastAppointment)
                const daysSince = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
                return daysSince <= 7
              }).length}
            </p>
            <p className="text-sm text-secondary-600 mt-1">Active This Week</p>
          </div>
        </Card>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader
          title="All Patients"
          subtitle={`${filteredPatients.length} patients found`}
        />

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Patient</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Contact</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Appointments</th>
                <th className="text-left p-4 text-sm font-semibold text-secondary-700">Last Visit</th>
                <th className="text-center p-4 text-sm font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary-500">
                    Loading patients...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary-500">
                    {searchTerm ? 'No patients found matching your search' : 'No patients yet'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <motion.tr
                    key={patient.id}
                    whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.5)' }}
                    className="transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-secondary-900">
                            {patient.first_name} {patient.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        {patient.email && (
                          <div className="flex items-center gap-1 text-secondary-700">
                            <Mail className="w-3 h-3" />
                            <span>{patient.email}</span>
                          </div>
                        )}
                        {patient.phone && (
                          <div className="flex items-center gap-1 text-secondary-600">
                            <Phone className="w-3 h-3" />
                            <span>{patient.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="info">{patient.appointmentCount}</Badge>
                    </td>
                    <td className="p-4 text-sm text-secondary-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(patient.lastAppointment)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default DoctorPatients
