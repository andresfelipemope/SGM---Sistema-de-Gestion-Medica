import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientService } from '../services/api'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('usuario') // 'usuario' o 'cuidador'
  const [selectedPatientId, setSelectedPatientId] = useState(null)
  const [patients, setPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Cargar pacientes cuando es cuidador
  useEffect(() => {
    if (userType === 'cuidador') {
      loadPatients()
    } else {
      setPatients([])
      setFilteredPatients([])
      setSelectedPatientId(null)
    }
  }, [userType])

  // Filtrar pacientes al buscar
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    } else {
      setFilteredPatients(patients)
    }
  }, [searchTerm, patients])

  const loadPatients = async () => {
    setLoading(true)
    try {
      // TODO: En producción, obtener pacientes asociados al cuidador desde API
      // Por ahora, cargar desde localStorage o crear lista mock
      const savedPatients = localStorage.getItem('patients')
      if (savedPatients) {
        const patientsList = JSON.parse(savedPatients)
        setPatients(patientsList)
        setFilteredPatients(patientsList)
      } else {
        // Crear lista mock de pacientes para demostración
        const mockPatients = [
          { id: 1, name: 'Juan Pérez', email: 'juan@example.com' },
          { id: 2, name: 'María García', email: 'maria@example.com' },
          { id: 3, name: 'Carlos López', email: 'carlos@example.com' }
        ]
        localStorage.setItem('patients', JSON.stringify(mockPatients))
        setPatients(mockPatients)
        setFilteredPatients(mockPatients)
      }
    } catch (error) {
      console.error('Error loading patients:', error)
      setError('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validación
    if (!email || !password) {
      setError('Por favor, completa todos los campos')
      return
    }

    if (userType === 'cuidador' && !selectedPatientId) {
      setError('Por favor, selecciona un paciente')
      return
    }

    setLoading(true)

    try {
      // TODO: Reemplazar con llamada a API real
      // const response = await authService.login(email, password, userType)
      
      // Simulación de login
      let patientData = null
      if (userType === 'usuario') {
        // El usuario es el paciente
        patientData = {
          id: Date.now(),
          name: email.split('@')[0],
          email
        }
      } else {
        // Buscar paciente seleccionado
        patientData = patients.find(p => p.id === selectedPatientId)
      }

      const userData = {
        id: Date.now(),
        email,
        userType,
        name: userType === 'cuidador' ? `Cuidador: ${email.split('@')[0]}` : email.split('@')[0],
        patientId: userType === 'usuario' ? patientData?.id : selectedPatientId,
        patient: patientData
      }

      onLogin(userData)
      navigate('/dashboard')
    } catch (error) {
      setError('Error al iniciar sesión. Por favor, intenta nuevamente.')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">SGM - Sistema de Gestión Médica</h1>
        <p className="login-subtitle">Inicia sesión para continuar</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userType">Tipo de usuario</label>
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="form-select"
            >
              <option value="usuario">Usuario</option>
              <option value="cuidador">Cuidador</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {userType === 'cuidador' && (
            <div className="form-group">
              <label htmlFor="patientSearch">Seleccionar Paciente *</label>
              <input
                type="text"
                id="patientSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar paciente por nombre o email..."
                className="patient-search-input"
              />
              {filteredPatients.length > 0 && (
                <div className="patient-list">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      className={`patient-item ${selectedPatientId === patient.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="patient-name">{patient.name}</div>
                      {patient.email && (
                        <div className="patient-email">{patient.email}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {searchTerm && filteredPatients.length === 0 && !loading && (
                <p className="no-patients">No se encontraron pacientes</p>
              )}
              {selectedPatientId && (
                <div className="selected-patient-info">
                  Paciente seleccionado: {patients.find(p => p.id === selectedPatientId)?.name}
                </div>
              )}
            </div>
          )}

          {userType === 'usuario' && (
            <div className="info-message">
              <p>Iniciarás sesión como paciente. Verás tus propias medicinas y citas médicas.</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="login-note">
          Nota: Esta es una versión de demostración. Cualquier correo y contraseña funcionarán.
        </p>
      </div>
    </div>
  )
}

export default Login

