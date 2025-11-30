import { useState, useEffect } from 'react'
import { patientService } from '../services/api'
import './PatientManager.css'

function PatientManager({ caregiverId, onPatientUpdate }) {
  const [associatedPatients, setAssociatedPatients] = useState([])
  const [allPatients, setAllPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadData()
  }, [caregiverId])

  useEffect(() => {
    if (searchTerm) {
      const filtered = allPatients.filter(p => 
        !associatedPatients.some(ap => ap.id === p.id) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.email?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(allPatients.filter(p => 
        !associatedPatients.some(ap => ap.id === p.id)
      ))
    }
  }, [searchTerm, allPatients, associatedPatients])

  const loadData = async () => {
    setLoading(true)
    try {
      const [associated, all] = await Promise.all([
        patientService.getPatientsByCaregiver(caregiverId),
        Promise.resolve(JSON.parse(localStorage.getItem('patients') || '[]'))
      ])
      setAssociatedPatients(associated)
      setAllPatients(all)
    } catch (error) {
      console.error('Error loading patients:', error)
      setMessage({ type: 'error', text: 'Error al cargar pacientes' })
    } finally {
      setLoading(false)
    }
  }

  const handleAssociate = async (patientId) => {
    try {
      await patientService.associatePatientToCaregiver(caregiverId, patientId)
      setMessage({ type: 'success', text: 'Paciente asociado exitosamente' })
      await loadData()
      setSearchTerm('')
      // Notificar al Dashboard para que actualice la lista de pacientes
      if (onPatientUpdate) {
        onPatientUpdate()
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error associating patient:', error)
      setMessage({ type: 'error', text: 'Error al asociar paciente' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleDisassociate = async (patientId) => {
    if (!window.confirm('¿Estás seguro de que quieres desasociar este paciente?')) {
      return
    }

    try {
      await patientService.disassociatePatientFromCaregiver(caregiverId, patientId)
      setMessage({ type: 'success', text: 'Paciente desasociado exitosamente' })
      await loadData()
      // Notificar al Dashboard para que actualice la lista de pacientes
      if (onPatientUpdate) {
        onPatientUpdate()
      }
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error disassociating patient:', error)
      setMessage({ type: 'error', text: 'Error al desasociar paciente' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  if (loading) {
    return <div className="patient-manager-loading">Cargando...</div>
  }

  return (
    <div className="patient-manager">
      <div className="patient-manager-header">
        <h2>Gestión de Pacientes</h2>
        <p>Asocia o desasocia pacientes a tu cuenta de cuidador</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="patient-sections">
        <div className="associated-patients-section">
          <h3>Pacientes Asociados ({associatedPatients.length})</h3>
          {associatedPatients.length === 0 ? (
            <p className="empty-message">No tienes pacientes asociados</p>
          ) : (
            <div className="patient-list">
              {associatedPatients.map(patient => (
                <div key={patient.id} className="patient-card associated">
                  <div className="patient-card-content">
                    <div className="patient-name">{patient.name}</div>
                    {patient.email && (
                      <div className="patient-email">{patient.email}</div>
                    )}
                  </div>
                  <button
                    className="disassociate-button"
                    onClick={() => handleDisassociate(patient.id)}
                    title="Desasociar paciente"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="available-patients-section">
          <h3>Buscar y Asociar Pacientes</h3>
          <input
            type="text"
            className="patient-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o email..."
          />
          {filteredPatients.length === 0 ? (
            <p className="empty-message">
              {searchTerm ? 'No se encontraron pacientes disponibles' : 'No hay pacientes disponibles para asociar'}
            </p>
          ) : (
            <div className="patient-list">
              {filteredPatients.map(patient => (
                <div key={patient.id} className="patient-card available">
                  <div className="patient-card-content">
                    <div className="patient-name">{patient.name}</div>
                    {patient.email && (
                      <div className="patient-email">{patient.email}</div>
                    )}
                  </div>
                  <button
                    className="associate-button"
                    onClick={() => handleAssociate(patient.id)}
                    title="Asociar paciente"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientManager

