import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, isSameMonth, addMonths, subMonths } from 'date-fns'
import './Calendar.css'

function Calendar({ medicines, appointments }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
  
  const daysInMonth = []
  let day = startDate
  while (day <= endDate) {
    daysInMonth.push(day)
    day = addDays(day, 1)
  }
  
  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const getMonthName = (date) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return months[date.getMonth()]
  }

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

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="month-year-display">
          <h2 className="month-title">{getMonthName(currentDate)}</h2>
          <h2 className="year-title">{format(currentDate, 'yyyy')}</h2>
        </div>
        <div className="calendar-controls">
          <button onClick={goToPreviousMonth}>← Mes Anterior</button>
          <button onClick={goToToday}>Hoy</button>
          <button onClick={goToNextMonth}>Mes Siguiente →</button>
        </div>
      </div>

      <div className="calendar-month">
        <div className="calendar-weekdays">
          {weekDays.map((dayName, index) => (
            <div key={index} className="weekday-header">{dayName}</div>
          ))}
        </div>
        <div className="calendar-days">
          {daysInMonth.map((day, index) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())
            const isCurrentMonth = isSameMonth(day, currentDate)
            const dayMedicines = getMedicinesForDate(day)
            const dayAppointments = getAppointmentsForDate(day)
            const hasEvents = dayMedicines.length > 0 || dayAppointments.length > 0

            return (
              <div 
                key={index} 
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {hasEvents && (
                  <div className="day-events">
                    {dayAppointments.length > 0 && (
                      <div className="event-indicator appointment-indicator" title={`${dayAppointments.length} cita(s)`}>
                        🏥 {dayAppointments.length}
                      </div>
                    )}
                    {dayMedicines.length > 0 && (
                      <div className="event-indicator medicine-indicator" title={`${dayMedicines.length} medicina(s)`}>
                        💊 {dayMedicines.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="selected-day-details">
          <h3>Detalles del {format(selectedDate, 'EEEE, d')} de {getMonthName(selectedDate)} de {format(selectedDate, 'yyyy')}</h3>
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

