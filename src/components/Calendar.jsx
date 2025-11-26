import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import './Calendar.css'

function Calendar({ medicines, appointments }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getMedicinesForDate = (date) => {
    return medicines.filter(med => {
      const medDate = parseISO(med.startDate)
      return isSameDay(medDate, date) || 
             (medDate <= date && (!med.endDate || parseISO(med.endDate) >= date))
    })
  }

  const getAppointmentsForDate = (date) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.date)
      return isSameDay(aptDate, date)
    })
  }

  const getMedicinesForTime = (date, time) => {
    const dayMedicines = getMedicinesForDate(date)
    return dayMedicines.filter(med => 
      med.times.some(t => t === time)
    )
  }

  const timesOfDay = ['08:00', '12:00', '16:00', '20:00']

  const goToPreviousWeek = () => {
    setCurrentDate(addDays(currentDate, -7))
  }

  const goToNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Calendario de Medicamentos y Citas</h2>
        <div className="calendar-controls">
          <button onClick={goToPreviousWeek}>← Semana Anterior</button>
          <button onClick={goToToday}>Hoy</button>
          <button onClick={goToNextWeek}>Semana Siguiente →</button>
        </div>
      </div>

      <div className="calendar-week">
        {weekDays.map((day, index) => {
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, new Date())
          const dayMedicines = getMedicinesForDate(day)
          const dayAppointments = getAppointmentsForDate(day)

          return (
            <div 
              key={index} 
              className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="day-header">
                <div className="day-name">{format(day, 'EEE')}</div>
                <div className="day-number">{format(day, 'd')}</div>
              </div>

              <div className="day-content">
                {dayAppointments.length > 0 && (
                  <div className="appointments-section">
                    <strong>🏥 Citas:</strong>
                    {dayAppointments.map(apt => (
                      <div key={apt.id} className="appointment-item">
                        {apt.time} - {apt.doctor}
                      </div>
                    ))}
                  </div>
                )}

                <div className="medicines-section">
                  {timesOfDay.map(time => {
                    const timeMedicines = getMedicinesForTime(day, time)
                    if (timeMedicines.length === 0) return null

                    return (
                      <div key={time} className="medicine-time-slot">
                        <div className="time-label">{time}</div>
                        {timeMedicines.map(med => (
                          <div key={med.id} className="medicine-item">
                            💊 {med.name} ({med.dose})
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>

                {dayMedicines.length === 0 && dayAppointments.length === 0 && (
                  <div className="empty-day">Sin eventos</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selectedDate && (
        <div className="selected-day-details">
          <h3>Detalles del {format(selectedDate, 'EEEE, d MMMM yyyy')}</h3>
          <div className="details-content">
            <div className="details-section">
              <h4>💊 Medicamentos</h4>
              {getMedicinesForDate(selectedDate).length > 0 ? (
                <ul>
                  {getMedicinesForDate(selectedDate).map(med => (
                    <li key={med.id}>
                      <strong>{med.name}</strong> - {med.dose}
                      <br />
                      Horarios: {med.times.join(', ')}
                      {med.notes && <><br />Notas: {med.notes}</>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay medicamentos programados para este día</p>
              )}
            </div>

            <div className="details-section">
              <h4>🏥 Citas Médicas</h4>
              {getAppointmentsForDate(selectedDate).length > 0 ? (
                <ul>
                  {getAppointmentsForDate(selectedDate).map(apt => (
                    <li key={apt.id}>
                      <strong>{apt.time}</strong> - {apt.doctor}
                      <br />
                      {apt.location && <>Lugar: {apt.location}<br /></>}
                      {apt.notes && <>Notas: {apt.notes}</>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay citas programadas para este día</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar

