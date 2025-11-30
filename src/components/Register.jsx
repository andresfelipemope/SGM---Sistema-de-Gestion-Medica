import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import './Register.css'

function Register({ onRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    userType: 'usuario'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!formData.email || !formData.password || !formData.name) {
      setError('Por favor, completa todos los campos')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, ingresa un correo electrónico válido')
      return
    }

    setLoading(true)

    try {
      const result = await authService.register(
        formData.email,
        formData.password,
        formData.name,
        formData.userType
      )

      // Si el registro es exitoso, hacer login automático
      const loginResult = await authService.login(
        formData.email,
        formData.password,
        formData.userType
      )

      onRegister(loginResult.user)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message || 'Error al registrar. Por favor, intenta nuevamente.')
      console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">SGM - Sistema de Gestión Médica</h1>
        <p className="register-subtitle">Crea una cuenta nueva</p>
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="userType">Tipo de usuario</label>
            <select
              id="userType"
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
              className="form-select"
            >
              <option value="usuario">Usuario (Paciente)</option>
              <option value="cuidador">Cuidador</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nombre completo *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico *</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repite tu contraseña"
              required
              minLength={6}
            />
          </div>

          {formData.userType === 'usuario' && (
            <div className="info-message">
              <p>Al registrarte como usuario, podrás gestionar tus propias medicinas y citas médicas.</p>
            </div>
          )}

          {formData.userType === 'cuidador' && (
            <div className="info-message">
              <p>Como cuidador, podrás gestionar las medicinas y citas de los pacientes asociados a tu cuenta.</p>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="register-link">
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  )
}

export default Register

