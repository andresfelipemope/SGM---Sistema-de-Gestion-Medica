import { useState, useEffect } from 'react'
import Calendar from './Calendar'
import MedicineForm from './MedicineForm'
import AppointmentForm from './AppointmentForm'
import QRManager from './QRManager'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('calendar')
  const [medicines, setMedicines] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    // Cargar datos guardados
    const savedMedicines = localStorage.getItem('medicines')
    const savedAppointments = localStorage.getItem('appointments')
    
    if (savedMedicines) {
      setMedicines(JSON.parse(savedMedicines))
    }
    if (savedAppointments) {
      setAppointments(JSON.parse(savedAppointments))
    }
  }, [])

  const handleAddMedicine = (medicine) => {
    const newMedicines = [...medicines, { ...medicine, id: Date.now() }]
    setMedicines(newMedicines)
    localStorage.setItem('medicines', JSON.stringify(newMedicines))
  }

  const handleAddAppointment = (appointment) => {
    const newAppointments = [...appointments, { ...appointment, id: Date.now() }]
    setAppointments(newAppointments)
    localStorage.setItem('appointments', JSON.stringify(newAppointments))
  }

  const handleDeleteMedicine = (id) => {
    const updatedMedicines = medicines.filter(med => med.id !== id)
    setMedicines(updatedMedicines)
    localStorage.setItem('medicines', JSON.stringify(updatedMedicines))
  }

  const handleDeleteAppointment = (id) => {
    const updatedAppointments = appointments.filter(apt => apt.id !== id)
    setAppointments(updatedAppointments)
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments))
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Sistema de Gestión Médica</h1>
          <div className="header-actions">
            <span className="user-info">
              {user.name} ({user.userType === 'usuario' ? 'Usuario' : 'Cuidador'})
            </span>
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
          />
        )}
      </main>
    </div>
  )
}

export default Dashboard

