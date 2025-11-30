import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService, patientService } from '../services/api'
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
  const [caregiverId, setCaregiverId] = useState(null)
  const navigate = useNavigate()

  // Cargar pacientes cuando es cuidador y después de autenticar
  useEffect(() => {
    if (userType === 'cuidador' && caregiverId) {
      loadPatients()
    } else {
      setPatients([])
      setFilteredPatients([])
      setSelectedPatientId(null)
      setCaregiverId(null)
    }
  }, [userType, caregiverId])

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
    if (!caregiverId) return
    
    setLoading(true)
    try {
      const patientsList = await patientService.getPatientsByCaregiver(caregiverId)
      setPatients(patientsList)
      setFilteredPatients(patientsList)
      
      if (patientsList.length === 0) {
        setError('No tienes pacientes asociados. Por favor, contacta al administrador para asociar pacientes a tu cuenta.')
      }
    } catch (error) {
      console.error('Error loading patients:', error)
      setError('Error al cargar pacientes')
    } finally {
      setLoading(false)
    }
  }

  const handleUserTypeChange = (newUserType) => {
    setUserType(newUserType)
    setEmail('')
    setPassword('')
    setError('')
    setSelectedPatientId(null)
    setCaregiverId(null)
    setPatients([])
    setFilteredPatients([])
  }

  const handlePasswordChange = async (newPassword) => {
    // Si es cuidador y tenemos email y contraseña, intentar verificar y cargar pacientes
    if (userType === 'cuidador' && email && newPassword) {
      try {
        // Verificar si el usuario existe y la contraseña es correcta
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const user = users.find(u => u.email === email && u.userType === 'cuidador')
        
        if (user) {
          // Verificar contraseña (usando el mismo hash que en authService)
          const hashPassword = (pwd) => {
            let hash = 0
            for (let i = 0; i < pwd.length; i++) {
              const char = pwd.charCodeAt(i)
              hash = ((hash << 5) - hash) + char
              hash = hash & hash
            }
            return hash.toString()
          }
          
          if (hashPassword(newPassword) === user.passwordHash) {
            setCaregiverId(user.id)
          } else {
            setCaregiverId(null)
            setPatients([])
            setFilteredPatients([])
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      }
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

    setLoading(true)

    try {
      // Autenticar usuario
      const loginResult = await authService.login(email, password, userType)
      const user = loginResult.user

      // Si es cuidador, necesitamos seleccionar un paciente
      if (userType === 'cuidador') {
        // Cargar pacientes asociados al cuidador
        const associatedPatients = await patientService.getPatientsByCaregiver(user.id)
        
        if (associatedPatients.length === 0) {
          setError('No tienes pacientes asociados. Ve a la pestaña "Pacientes" en el dashboard para asociar pacientes a tu cuenta.')
          setLoading(false)
          return
        }

        // Si solo hay un paciente, seleccionarlo automáticamente
        if (associatedPatients.length === 1) {
          user.patientId = associatedPatients[0].id
          user.patient = associatedPatients[0]
        } else if (!selectedPatientId) {
          // Si hay múltiples pacientes y no se ha seleccionado uno, mostrar la lista
          setError('Por favor, selecciona un paciente de la lista')
          setPatients(associatedPatients)
          setFilteredPatients(associatedPatients)
          setLoading(false)
          return
        } else {
          // Usar el paciente seleccionado
          const selectedPatient = associatedPatients.find(p => p.id === selectedPatientId)
          if (selectedPatient) {
            user.patientId = selectedPatient.id
            user.patient = selectedPatient
          } else {
            setError('El paciente seleccionado no está asociado a tu cuenta')
            setLoading(false)
            return
          }
        }
      }

      onLogin(user)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.')
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
              onChange={(e) => handleUserTypeChange(e.target.value)}
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
              onChange={(e) => {
                setEmail(e.target.value)
                setCaregiverId(null)
                setPatients([])
                setFilteredPatients([])
                setSelectedPatientId(null)
              }}
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
              onChange={(e) => {
                setPassword(e.target.value)
                handlePasswordChange(e.target.value)
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {userType === 'cuidador' && patients.length > 0 && (
            <div className="form-group">
              <label htmlFor="patientSearch">Seleccionar Paciente *</label>
              {patients.length > 1 && (
                <input
                  type="text"
                  id="patientSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente por nombre o email..."
                  className="patient-search-input"
                />
              )}
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
              {patients.length === 1 && !selectedPatientId && (
                <div className="info-message">
                  <p>Seleccionarás automáticamente: {patients[0].name}</p>
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

        <p className="login-link">
          ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}

export default Login

