import { useState, useEffect } from 'react'
import Calendar from './Calendar'
import MedicineForm from './MedicineForm'
import AppointmentForm from './AppointmentForm'
import QRManager from './QRManager'
import PatientManager from './PatientManager'
import { medicineService, appointmentService, patientService } from '../services/api'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('calendar')
  const [medicines, setMedicines] = useState([])
  const [appointments, setAppointments] = useState([])
  const [currentPatientId, setCurrentPatientId] = useState(user.patientId || user.id)
  const [availablePatients, setAvailablePatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user.userType === 'cuidador') {
      loadAvailablePatients()
    }
  }, [user])

  useEffect(() => {
    if (currentPatientId) {
      loadData()
    }
  }, [currentPatientId])

  useEffect(() => {
    // Recargar pacientes cuando se cambia a la pestaña de pacientes
    if (activeTab === 'patients' && user.userType === 'cuidador') {
      loadAvailablePatients()
    }
  }, [activeTab])

  const loadAvailablePatients = async () => {
    try {
      const patients = await patientService.getPatientsByCaregiver(user.id)
      setAvailablePatients(patients)
      
      // Si no hay paciente seleccionado y hay pacientes disponibles, seleccionar el primero
      if (patients.length > 0 && !currentPatientId) {
        setCurrentPatientId(patients[0].id)
      }
    } catch (error) {
      console.error('Error loading available patients:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Usar servicios preparados para backend
      const [medicinesData, appointmentsData] = await Promise.all([
        medicineService.getMedicines(currentPatientId),
        appointmentService.getAppointments(currentPatientId)
      ])
      setMedicines(medicinesData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error loading data:', error)
      // Fallback a localStorage si hay error
      const savedMedicines = localStorage.getItem(`medicines_${currentPatientId}`) || localStorage.getItem('medicines')
      const savedAppointments = localStorage.getItem(`appointments_${currentPatientId}`) || localStorage.getItem('appointments')
      
      if (savedMedicines) {
        setMedicines(JSON.parse(savedMedicines))
      }
      if (savedAppointments) {
        setAppointments(JSON.parse(savedAppointments))
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePatientChange = async (patientId) => {
    setCurrentPatientId(patientId)
    const selectedPatient = availablePatients.find(p => p.id === patientId)
    if (selectedPatient) {
      // Actualizar el usuario en localStorage con el nuevo paciente seleccionado
      const updatedUser = {
        ...user,
        patientId: selectedPatient.id,
        patient: selectedPatient
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    // Recargar datos del nuevo paciente
    await loadData()
  }

  const handleAddMedicine = async (medicine) => {
    try {
      // Usar servicio preparado para backend
      const newMedicine = await medicineService.createMedicine(currentPatientId, medicine)
      setMedicines([...medicines, newMedicine])
    } catch (error) {
      console.error('Error adding medicine:', error)
      // Fallback
      const newMedicines = [...medicines, { ...medicine, id: Date.now() }]
      setMedicines(newMedicines)
      const key = currentPatientId ? `medicines_${currentPatientId}` : 'medicines'
      localStorage.setItem(key, JSON.stringify(newMedicines))
    }
  }

  const handleAddAppointment = async (appointment) => {
    try {
      // Usar servicio preparado para backend
      const newAppointment = await appointmentService.createAppointment(currentPatientId, appointment)
      setAppointments([...appointments, newAppointment])
    } catch (error) {
      console.error('Error adding appointment:', error)
      // Fallback
      const newAppointments = [...appointments, { ...appointment, id: Date.now() }]
      setAppointments(newAppointments)
      const key = currentPatientId ? `appointments_${currentPatientId}` : 'appointments'
      localStorage.setItem(key, JSON.stringify(newAppointments))
    }
  }

  const handleDeleteMedicine = async (id) => {
    try {
      // Usar servicio preparado para backend
      await medicineService.deleteMedicine(currentPatientId, id)
      setMedicines(medicines.filter(med => med.id !== id))
    } catch (error) {
      console.error('Error deleting medicine:', error)
      // Fallback
      const updatedMedicines = medicines.filter(med => med.id !== id)
      setMedicines(updatedMedicines)
      const key = currentPatientId ? `medicines_${currentPatientId}` : 'medicines'
      localStorage.setItem(key, JSON.stringify(updatedMedicines))
    }
  }

  const handleDeleteAppointment = async (id) => {
    try {
      // Usar servicio preparado para backend
      await appointmentService.deleteAppointment(currentPatientId, id)
      setAppointments(appointments.filter(apt => apt.id !== id))
    } catch (error) {
      console.error('Error deleting appointment:', error)
      // Fallback
      const updatedAppointments = appointments.filter(apt => apt.id !== id)
      setAppointments(updatedAppointments)
      const key = currentPatientId ? `appointments_${currentPatientId}` : 'appointments'
      localStorage.setItem(key, JSON.stringify(updatedAppointments))
    }
  }

  const handleImportData = (importedData) => {
    if (importedData.medicines && Array.isArray(importedData.medicines)) {
      setMedicines(importedData.medicines)
      localStorage.setItem('medicines', JSON.stringify(importedData.medicines))
    }
    if (importedData.appointments && Array.isArray(importedData.appointments)) {
      setAppointments(importedData.appointments)
      localStorage.setItem('appointments', JSON.stringify(importedData.appointments))
    }
  }

  const handleFillMedicineForm = (medicineData) => {
    // Guardar datos en window para que el formulario los lea
    window.medicineFormData = medicineData
    setActiveTab('medicine')
  }

  const handleFillAppointmentForm = (appointmentData) => {
    // Guardar datos en window para que el formulario los lea
    window.appointmentFormData = appointmentData
    setActiveTab('appointment')
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Sistema de Gestión Médica</h1>
          <div className="header-actions">
            <div className="user-info-section">
              <span className="user-info">
                {user.name} ({user.userType === 'usuario' ? 'Paciente' : 'Cuidador'})
              </span>
              {user.userType === 'cuidador' && availablePatients.length > 0 && (
                <div className="patient-selector">
                  <label htmlFor="patient-select">Paciente: </label>
                  <select
                    id="patient-select"
                    value={currentPatientId || ''}
                    onChange={(e) => handlePatientChange(Number(e.target.value))}
                    className="patient-select-dropdown"
                  >
                    {availablePatients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {user.userType === 'cuidador' && availablePatients.length === 0 && (
                <span className="patient-info no-patients">
                  No hay pacientes asociados
                </span>
              )}
            </div>
            <button onClick={onLogout} className="logout-button">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendario
        </button>
        <button
          className={`nav-button ${activeTab === 'medicine' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicine')}
        >
          💊 Medicinas
        </button>
        <button
          className={`nav-button ${activeTab === 'appointment' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointment')}
        >
          🏥 Citas Médicas
        </button>
        <button
          className={`nav-button ${activeTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveTab('qr')}
        >
          📱 Códigos QR
        </button>
        {user.userType === 'cuidador' && (
          <button
            className={`nav-button ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            👥 Pacientes
          </button>
        )}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'calendar' && (
          <Calendar medicines={medicines} appointments={appointments} />
        )}
        {activeTab === 'medicine' && (
          <MedicineForm 
            onAdd={handleAddMedicine} 
            medicines={medicines}
            onDelete={handleDeleteMedicine}
          />
        )}
        {activeTab === 'appointment' && (
          <AppointmentForm 
            onAdd={handleAddAppointment} 
            appointments={appointments}
            onDelete={handleDeleteAppointment}
          />
        )}
        {activeTab === 'qr' && (
          <QRManager 
            medicines={medicines} 
            appointments={appointments}
            onImport={handleImportData}
            onFillMedicineForm={handleFillMedicineForm}
            onFillAppointmentForm={handleFillAppointmentForm}
          />
        )}
        {activeTab === 'patients' && user.userType === 'cuidador' && (
          <PatientManager 
            caregiverId={user.id} 
            onPatientUpdate={loadAvailablePatients}
          />
        )}
      </main>
    </div>
  )
}

export default Dashboard

