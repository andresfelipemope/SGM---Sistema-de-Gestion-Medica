import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState('usuario') // 'usuario' o 'cuidador'
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validación simple (en producción usar autenticación real)
    if (!email || !password) {
      setError('Por favor, completa todos los campos')
      return
    }

    // Simulación de login (en producción conectar con backend)
    const userData = {
      email,
      userType,
      name: email.split('@')[0]
    }

    onLogin(userData)
    navigate('/dashboard')
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

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Iniciar Sesión
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

