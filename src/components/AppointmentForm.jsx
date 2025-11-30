import { useState, useEffect } from 'react'
import './AppointmentForm.css'

function AppointmentForm({ onAdd, appointments, onDelete }) {
  const [formData, setFormData] = useState({
    doctor: '',
    date: '',
    time: '',
    location: '',
    notes: ''
  })

  const [showSuccess, setShowSuccess] = useState(false)

  // Cargar datos prellenados desde QR si existen
  useEffect(() => {
    if (window.appointmentFormData) {
      const data = window.appointmentFormData
      setFormData({
        doctor: data.doctor || '',
        date: data.date || '',
        time: data.time || '',
        location: data.location || '',
        notes: data.notes || ''
      })
      // Limpiar después de usar
      window.appointmentFormData = null
    }
  }, [])

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.doctor || !formData.date || !formData.time) {
      alert('Por favor, completa todos los campos obligatorios')
      return
    }

    // Validar que la fecha no sea anterior a hoy
    if (formData.date < getTodayDate()) {
      alert('La fecha de la cita no puede ser anterior a la fecha actual')
      return
    }

    const appointmentData = {
      ...formData,
      id: Date.now()
    }

    onAdd(appointmentData)
    
    // Reset form
    setFormData({
      doctor: '',
      date: '',
      time: '',
      location: '',
      notes: ''
    })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
      onDelete(id)
    }
  }

  return (
    <div className="appointment-form-container">
      <div className="form-section">
        <h2>Registrar Nueva Cita Médica</h2>
        <form onSubmit={handleSubmit} className="appointment-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="doctor">Doctor/Especialista *</label>
              <input
                type="text"
                id="doctor"
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                placeholder="Ej: Dr. Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Lugar/Consultorio</label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ej: Hospital Central, Consultorio 205"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Fecha *</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={getTodayDate()}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Hora *</label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas Adicionales</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Motivo de la cita, preparación necesaria, etc."
              rows="4"
            />
          </div>

          {showSuccess && (
            <div className="success-message">
              ✓ Cita médica registrada exitosamente
            </div>
          )}

          <button type="submit" className="submit-button">
            Registrar Cita
          </button>
        </form>
      </div>

      <div className="appointments-list-section">
        <h2>Citas Médicas Registradas</h2>
        {appointments.length === 0 ? (
          <p className="empty-message">No hay citas registradas aún</p>
        ) : (
          <div className="appointments-list">
            {appointments
              .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`)
                const dateB = new Date(`${b.date}T${b.time}`)
                return dateA - dateB
              })
              .map(apt => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-header">
                    <h3>{apt.doctor}</h3>
                    <button 
                      className="delete-button"
                      onClick={() => handleDelete(apt.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="appointment-details">
                    <p><strong>📅 Fecha:</strong> {new Date(apt.date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>🕐 Hora:</strong> {apt.time}</p>
                    {apt.location && <p><strong>📍 Lugar:</strong> {apt.location}</p>}
                    {apt.notes && <p><strong>📝 Notas:</strong> {apt.notes}</p>}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentForm

