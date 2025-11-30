# CAMBIOS NECESARIOS EN EL FRONTEND PARA CONECTAR CON BACKEND

Este documento detalla todos los cambios que debes hacer en el frontend para conectarlo con el backend Django REST Framework.

## 1. CONFIGURAR VARIABLE DE ENTORNO

### Crear archivo `.env` en la raíz del proyecto:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Actualizar `.gitignore` para incluir `.env`:

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 2. ACTUALIZAR `src/services/api.js`

Reemplazar TODAS las funciones mock con llamadas reales a la API. Aquí están los cambios específicos:

### 2.1. Actualizar `authService.login()`

**REEMPLAZAR:**
```javascript
async login(email, password, userType) {
  // TODO: Reemplazar con llamada a API
  // Mock implementation
  return Promise.resolve({...})
}
```

**POR:**
```javascript
async login(email, password, userType) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, user_type: userType })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al iniciar sesión')
    }

    const data = await response.json()
    
    // Guardar token
    localStorage.setItem('token', data.token)
    localStorage.setItem('refresh_token', data.refresh)
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        userType: data.user.user_type,
        name: data.user.name,
        patientId: data.user.patient?.id || data.user.id,
        patient: data.user.patient
      },
      token: data.token
    }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}
```

### 2.2. Actualizar `authService.logout()`

**REEMPLAZAR:**
```javascript
async logout() {
  // TODO: Llamar a API para invalidar token
  return Promise.resolve()
}
```

**POR:**
```javascript
async logout() {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: 'POST',
        headers: apiUtils.getAuthHeaders()
      })
    }
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}
```

### 2.3. Actualizar `authService.getCurrentUser()`

**REEMPLAZAR:**
```javascript
async getCurrentUser() {
  // TODO: Reemplazar con llamada a API
  const user = localStorage.getItem('user')
  return Promise.resolve(user ? JSON.parse(user) : null)
}
```

**POR:**
```javascript
async getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido, intentar refresh
        await refreshToken()
        return this.getCurrentUser() // Reintentar
      }
      throw new Error('Error al obtener usuario')
    }

    const data = await response.json()
    return {
      id: data.id,
      email: data.email,
      userType: data.user_type,
      name: data.name,
      patientId: data.patient?.id || data.id,
      patient: data.patient
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
```

### 2.4. Agregar función `refreshToken()`

**AGREGAR después de `getCurrentUser()`:**
```javascript
async refreshToken() {
  try {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) throw new Error('No refresh token')

    const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    localStorage.setItem('token', data.access)
    return data.access
  } catch (error) {
    // Si refresh falla, limpiar todo y redirigir a login
    localStorage.clear()
    window.location.href = '/login'
    throw error
  }
}
```

### 2.5. Actualizar `patientService.getPatientsByCaregiver()`

**REEMPLAZAR:**
```javascript
async getPatientsByCaregiver(caregiverId) {
  // TODO: Reemplazar con llamada a API
  // Mock implementation
}
```

**POR:**
```javascript
async getPatientsByCaregiver(caregiverId) {
  try {
    const response = await fetch(`${API_BASE_URL}/caregivers/${caregiverId}/patients/`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Error al obtener pacientes')
    }

    const data = await response.json()
    return data // Array de pacientes
  } catch (error) {
    console.error('Get patients error:', error)
    throw error
  }
}
```

### 2.6. Actualizar `patientService.getPatient()`

**REEMPLAZAR:**
```javascript
async getPatient(patientId) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async getPatient(patientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Error al obtener paciente')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get patient error:', error)
    throw error
  }
}
```

### 2.7. Actualizar `patientService.searchPatients()`

**REEMPLAZAR:**
```javascript
async searchPatients(searchTerm) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async searchPatients(searchTerm) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/search/?q=${encodeURIComponent(searchTerm)}`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Error al buscar pacientes')
    }

    const data = await response.json()
    return data // Array de pacientes
  } catch (error) {
    console.error('Search patients error:', error)
    throw error
  }
}
```

### 2.8. Actualizar `medicineService.getMedicines()`

**REEMPLAZAR:**
```javascript
async getMedicines(patientId) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async getMedicines(patientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medicines/`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        await refreshToken()
        return this.getMedicines(patientId) // Reintentar
      }
      throw new Error('Error al obtener medicinas')
    }

    const data = await response.json()
    return data // Array de medicinas
  } catch (error) {
    console.error('Get medicines error:', error)
    throw error
  }
}
```

### 2.9. Actualizar `medicineService.createMedicine()`

**REEMPLAZAR:**
```javascript
async createMedicine(patientId, medicineData) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async createMedicine(patientId, medicineData) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medicines/`, {
      method: 'POST',
      headers: apiUtils.getAuthHeaders(),
      body: JSON.stringify({
        name: medicineData.name,
        dose: medicineData.dose,
        start_date: medicineData.startDate,
        end_date: medicineData.endDate || null,
        times: medicineData.times,
        notes: medicineData.notes || ''
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear medicina')
    }

    const data = await response.json()
    // Convertir formato del backend al formato del frontend
    return {
      id: data.id,
      name: data.name,
      dose: data.dose,
      startDate: data.start_date,
      endDate: data.end_date,
      times: data.times,
      notes: data.notes,
      patientId: patientId
    }
  } catch (error) {
    console.error('Create medicine error:', error)
    throw error
  }
}
```

### 2.10. Actualizar `medicineService.deleteMedicine()`

**REEMPLAZAR:**
```javascript
async deleteMedicine(patientId, medicineId) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async deleteMedicine(patientId, medicineId) {
  try {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicineId}/`, {
      method: 'DELETE',
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        await refreshToken()
        return this.deleteMedicine(patientId, medicineId) // Reintentar
      }
      throw new Error('Error al eliminar medicina')
    }

    return Promise.resolve()
  } catch (error) {
    console.error('Delete medicine error:', error)
    throw error
  }
}
```

### 2.11. Actualizar `appointmentService.getAppointments()`

**REEMPLAZAR:**
```javascript
async getAppointments(patientId) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async getAppointments(patientId) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/appointments/`, {
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        await refreshToken()
        return this.getAppointments(patientId) // Reintentar
      }
      throw new Error('Error al obtener citas')
    }

    const data = await response.json()
    return data.map(apt => ({
      id: apt.id,
      doctor: apt.doctor,
      date: apt.date,
      time: apt.time,
      location: apt.location || '',
      notes: apt.notes || ''
    }))
  } catch (error) {
    console.error('Get appointments error:', error)
    throw error
  }
}
```

### 2.12. Actualizar `appointmentService.createAppointment()`

**REEMPLAZAR:**
```javascript
async createAppointment(patientId, appointmentData) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async createAppointment(patientId, appointmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/patients/${patientId}/appointments/`, {
      method: 'POST',
      headers: apiUtils.getAuthHeaders(),
      body: JSON.stringify({
        doctor: appointmentData.doctor,
        date: appointmentData.date,
        time: appointmentData.time,
        location: appointmentData.location || '',
        notes: appointmentData.notes || ''
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al crear cita')
    }

    const data = await response.json()
    return {
      id: data.id,
      doctor: data.doctor,
      date: data.date,
      time: data.time,
      location: data.location || '',
      notes: data.notes || ''
    }
  } catch (error) {
    console.error('Create appointment error:', error)
    throw error
  }
}
```

### 2.13. Actualizar `appointmentService.deleteAppointment()`

**REEMPLAZAR:**
```javascript
async deleteAppointment(patientId, appointmentId) {
  // TODO: Reemplazar con llamada a API
}
```

**POR:**
```javascript
async deleteAppointment(patientId, appointmentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, {
      method: 'DELETE',
      headers: apiUtils.getAuthHeaders()
    })

    if (!response.ok) {
      if (response.status === 401) {
        await refreshToken()
        return this.deleteAppointment(patientId, appointmentId) // Reintentar
      }
      throw new Error('Error al eliminar cita')
    }

    return Promise.resolve()
  } catch (error) {
    console.error('Delete appointment error:', error)
    throw error
  }
}
```

## 3. ACTUALIZAR `src/components/Login.jsx`

### 3.1. Actualizar `loadPatients()` para usar API

**REEMPLAZAR:**
```javascript
const loadPatients = async () => {
  setLoading(true)
  try {
    // TODO: En producción, obtener pacientes asociados al cuidador desde API
    const savedPatients = localStorage.getItem('patients')
    // ...
  }
}
```

**POR:**
```javascript
const loadPatients = async () => {
  setLoading(true)
  try {
    // Obtener pacientes asociados al cuidador desde API
    // Nota: Necesitarás el ID del cuidador, puedes obtenerlo después del login
    // Por ahora, usar búsqueda general
    const patients = await patientService.searchPatients('')
    setPatients(patients)
    setFilteredPatients(patients)
  } catch (error) {
    console.error('Error loading patients:', error)
    setError('Error al cargar pacientes')
    // Fallback a lista vacía
    setPatients([])
    setFilteredPatients([])
  } finally {
    setLoading(false)
  }
}
```

### 3.2. Actualizar `handleSubmit()` para usar API real

**REEMPLAZAR la llamada mock:**
```javascript
// Simulación de login
const userData = {...}
```

**POR:**
```javascript
// Llamar a API real
const response = await authService.login(email, password, userType)
const userData = response.user

// Si es cuidador y hay paciente seleccionado, agregar info del paciente
if (userType === 'cuidador' && selectedPatientId) {
  const patient = await patientService.getPatient(selectedPatientId)
  userData.patient = patient
  userData.patientId = selectedPatientId
}
```

## 4. ACTUALIZAR `src/App.jsx`

### 4.1. Agregar verificación de token al cargar

**AGREGAR en el useEffect:**
```javascript
useEffect(() => {
  // Verificar si hay un usuario guardado en localStorage
  const savedUser = localStorage.getItem('user')
  const token = localStorage.getItem('token')
  
  if (savedUser && token) {
    // Verificar que el token sea válido
    authService.getCurrentUser()
      .then(user => {
        if (user) {
          setUser(user)
        } else {
          // Token inválido, limpiar
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      })
      .catch(() => {
        // Error al verificar, limpiar
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      })
  }
}, [])
```

## 5. ACTUALIZAR `src/components/Dashboard.jsx`

### 5.1. Ya está usando los servicios, pero verificar manejo de errores

El Dashboard ya está preparado, solo asegúrate de que maneje errores correctamente:

```javascript
const loadData = async () => {
  setLoading(true)
  try {
    const [medicinesData, appointmentsData] = await Promise.all([
      medicineService.getMedicines(currentPatientId),
      appointmentService.getAppointments(currentPatientId)
    ])
    setMedicines(medicinesData)
    setAppointments(appointmentsData)
  } catch (error) {
    console.error('Error loading data:', error)
    // Mostrar mensaje de error al usuario
    alert('Error al cargar datos. Por favor, recarga la página.')
  } finally {
    setLoading(false)
  }
}
```

## 6. INSTALAR DEPENDENCIAS ADICIONALES (OPCIONAL)

Si quieres usar axios en lugar de fetch:

```bash
npm install axios
```

Y crear un archivo `src/services/axios.js`:

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar refresh token
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/token/refresh/`, {
            refresh
          })
          localStorage.setItem('token', response.data.access)
          // Reintentar request original
          error.config.headers.Authorization = `Bearer ${response.data.access}`
          return axios.request(error.config)
        } catch (refreshError) {
          // Refresh falló, redirigir a login
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

## 7. VERIFICAR CORS

Asegúrate de que el backend tenga configurado CORS para permitir requests desde `http://localhost:3000`.

## 8. PROBAR CONEXIÓN

1. Inicia el backend Django en `http://localhost:8000`
2. Inicia el frontend React en `http://localhost:3000`
3. Verifica en la consola del navegador que no haya errores de CORS
4. Prueba el login
5. Verifica que los datos se carguen correctamente

## NOTAS IMPORTANTES

- **Formato de fechas**: El backend espera `YYYY-MM-DD` y retorna el mismo formato
- **Formato de horas**: El backend espera `HH:MM:SS` pero puedes enviar `HH:MM`
- **IDs**: Todos los IDs son enteros, no UUIDs
- **Tokens**: Se guardan en localStorage. Considera usar httpOnly cookies en producción
- **Manejo de errores**: Todos los servicios deben manejar errores 401 (no autenticado) y 403 (sin permisos)

## CHECKLIST FINAL

- [ ] Archivo `.env` creado con `REACT_APP_API_URL`
- [ ] Todas las funciones en `api.js` actualizadas
- [ ] Función `refreshToken()` agregada
- [ ] `Login.jsx` actualizado para usar API real
- [ ] `App.jsx` verifica token al cargar
- [ ] Manejo de errores implementado
- [ ] CORS configurado en backend
- [ ] Probado login y carga de datos
- [ ] Probado crear/eliminar medicinas y citas




