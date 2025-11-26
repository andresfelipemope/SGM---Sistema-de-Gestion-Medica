import { useState } from 'react'
import './MedicineForm.css'

function MedicineForm({ onAdd, medicines, onDelete }) {
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    startDate: '',
    endDate: '',
    times: [],
    notes: ''
  })

  const [selectedTimes, setSelectedTimes] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)

  const availableTimes = ['08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']

  const handleTimeToggle = (time) => {
    setSelectedTimes(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.dose || !formData.startDate || selectedTimes.length === 0) {
      alert('Por favor, completa todos los campos obligatorios')
      return
    }

    const medicineData = {
      ...formData,
      times: selectedTimes.sort(),
      id: Date.now()
    }

    onAdd(medicineData)
    
    // Reset form
    setFormData({
      name: '',
      dose: '',
      startDate: '',
      endDate: '',
      times: [],
      notes: ''
    })
    setSelectedTimes([])
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta medicina?')) {
      onDelete(id)
    }
  }

  return (
    <div className="medicine-form-container">
      <div className="form-section">
        <h2>Registrar Nueva Medicina</h2>
        <form onSubmit={handleSubmit} className="medicine-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Nombre de la Medicina *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Paracetamol"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dose">Dosis *</label>
              <input
                type="text"
                id="dose"
                value={formData.dose}
                onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                placeholder="Ej: 500mg, 1 tableta"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Fecha de Inicio *</label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Fecha de Fin (opcional)</label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Horarios de Toma *</label>
            <div className="time-selector">
              {availableTimes.map(time => (
                <button
                  key={time}
                  type="button"
                  className={`time-button ${selectedTimes.includes(time) ? 'selected' : ''}`}
                  onClick={() => handleTimeToggle(time)}
                >
                  {time}
                </button>
              ))}
            </div>
            {selectedTimes.length > 0 && (
              <p className="selected-times">Horarios seleccionados: {selectedTimes.join(', ')}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas Adicionales</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instrucciones especiales, efectos secundarios, etc."
              rows="4"
            />
          </div>

          {showSuccess && (
            <div className="success-message">
              ✓ Medicina registrada exitosamente
            </div>
          )}

          <button type="submit" className="submit-button">
            Registrar Medicina
          </button>
        </form>
      </div>

      <div className="medicines-list-section">
        <h2>Medicinas Registradas</h2>
        {medicines.length === 0 ? (
          <p className="empty-message">No hay medicinas registradas aún</p>
        ) : (
          <div className="medicines-list">
            {medicines.map(med => (
              <div key={med.id} className="medicine-card">
                <div className="medicine-header">
                  <h3>{med.name}</h3>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(med.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className="medicine-details">
                  <p><strong>Dosis:</strong> {med.dose}</p>
                  <p><strong>Inicio:</strong> {new Date(med.startDate).toLocaleDateString('es-ES')}</p>
                  {med.endDate && (
                    <p><strong>Fin:</strong> {new Date(med.endDate).toLocaleDateString('es-ES')}</p>
                  )}
                  <p><strong>Horarios:</strong> {med.times.join(', ')}</p>
                  {med.notes && <p><strong>Notas:</strong> {med.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicineForm

