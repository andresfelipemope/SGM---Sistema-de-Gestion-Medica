/**
 * API Service Layer
 * 
 * Esta capa de servicio prepara la aplicación para conectarse con Django REST Framework.
 * Actualmente usa localStorage como mock, pero está estructurado para fácil migración a API calls.
 * 
 * Para migrar a backend:
 * 1. Reemplazar las funciones mock con llamadas fetch/axios a los endpoints de Django
 * 2. Manejar autenticación con tokens (JWT)
 * 3. Manejar errores de red y respuestas del servidor
 */

const API_BASE_URL = 'http://127.0.0.1:8000/'

// ==================== AUTHENTICATION ====================
export const authService = {
  /**
   * Login de usuario o cuidador
   * @param {string} email 
   * @param {string} password 
   * @param {string} userType - 'usuario' o 'cuidador'
   * @returns {Promise<{user: object, token: string}>}
   */
  async login(email, password, userType) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/auth/login/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password, userType })
    // }).then(res => res.json())
    
    // Mock implementation
    return Promise.resolve({
      user: {
        id: Date.now(),
        email,
        userType,
        name: email.split('@')[0]
      },
      token: 'mock-token-' + Date.now()
    })
  },

  /**
   * Logout
   * @returns {Promise<void>}
   */
  async logout() {
    // TODO: Llamar a API para invalidar token
    // return fetch(`${API_BASE_URL}/auth/logout/`, { method: 'POST' })
    return Promise.resolve()
  },

  /**
   * Obtener usuario actual
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/auth/me/`).then(res => res.json())
    
    const user = localStorage.getItem('user')
    return Promise.resolve(user ? JSON.parse(user) : null)
  }
}

// ==================== PATIENTS ====================
export const patientService = {
  /**
   * Obtener lista de pacientes asociados a un cuidador
   * @param {number} caregiverId 
   * @returns {Promise<Array>}
   */
  async getPatientsByCaregiver(caregiverId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/caregivers/${caregiverId}/patients/`).then(res => res.json())
    
    // Mock implementation
    const patients = localStorage.getItem(`caregiver_${caregiverId}_patients`)
    return Promise.resolve(patients ? JSON.parse(patients) : [])
  },

  /**
   * Obtener paciente por ID
   * @param {number} patientId 
   * @returns {Promise<object>}
   */
  async getPatient(patientId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/${patientId}/`).then(res => res.json())
    
    const patients = localStorage.getItem('patients')
    const allPatients = patients ? JSON.parse(patients) : []
    return Promise.resolve(allPatients.find(p => p.id === patientId) || null)
  },

  /**
   * Buscar pacientes (para selección en login)
   * @param {string} searchTerm 
   * @returns {Promise<Array>}
   */
  async searchPatients(searchTerm) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/search/?q=${searchTerm}`).then(res => res.json())
    
    // Mock implementation
    const patients = localStorage.getItem('patients')
    const allPatients = patients ? JSON.parse(patients) : []
    return Promise.resolve(
      allPatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }
}

// ==================== MEDICINES ====================
export const medicineService = {
  /**
   * Obtener medicinas de un paciente
   * @param {number} patientId 
   * @returns {Promise<Array>}
   */
  async getMedicines(patientId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/${patientId}/medicines/`).then(res => res.json())
    
    // Mock implementation
    const key = patientId ? `medicines_${patientId}` : 'medicines'
    const medicines = localStorage.getItem(key)
    return Promise.resolve(medicines ? JSON.parse(medicines) : [])
  },

  /**
   * Crear medicina
   * @param {number} patientId 
   * @param {object} medicineData 
   * @returns {Promise<object>}
   */
  async createMedicine(patientId, medicineData) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/${patientId}/medicines/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(medicineData)
    // }).then(res => res.json())
    
    // Mock implementation
    const medicines = await this.getMedicines(patientId)
    const newMedicine = { ...medicineData, id: Date.now(), patientId }
    const updatedMedicines = [...medicines, newMedicine]
    const key = patientId ? `medicines_${patientId}` : 'medicines'
    localStorage.setItem(key, JSON.stringify(updatedMedicines))
    return Promise.resolve(newMedicine)
  },

  /**
   * Eliminar medicina
   * @param {number} patientId 
   * @param {number} medicineId 
   * @returns {Promise<void>}
   */
  async deleteMedicine(patientId, medicineId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/medicines/${medicineId}/`, { method: 'DELETE' })
    
    // Mock implementation
    const medicines = await this.getMedicines(patientId)
    const updatedMedicines = medicines.filter(m => m.id !== medicineId)
    const key = patientId ? `medicines_${patientId}` : 'medicines'
    localStorage.setItem(key, JSON.stringify(updatedMedicines))
    return Promise.resolve()
  }
}

// ==================== APPOINTMENTS ====================
export const appointmentService = {
  /**
   * Obtener citas de un paciente
   * @param {number} patientId 
   * @returns {Promise<Array>}
   */
  async getAppointments(patientId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/${patientId}/appointments/`).then(res => res.json())
    
    // Mock implementation
    const key = patientId ? `appointments_${patientId}` : 'appointments'
    const appointments = localStorage.getItem(key)
    return Promise.resolve(appointments ? JSON.parse(appointments) : [])
  },

  /**
   * Crear cita
   * @param {number} patientId 
   * @param {object} appointmentData 
   * @returns {Promise<object>}
   */
  async createAppointment(patientId, appointmentData) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/patients/${patientId}/appointments/`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(appointmentData)
    // }).then(res => res.json())
    
    // Mock implementation
    const appointments = await this.getAppointments(patientId)
    const newAppointment = { ...appointmentData, id: Date.now(), patientId }
    const updatedAppointments = [...appointments, newAppointment]
    const key = patientId ? `appointments_${patientId}` : 'appointments'
    localStorage.setItem(key, JSON.stringify(updatedAppointments))
    return Promise.resolve(newAppointment)
  },

  /**
   * Eliminar cita
   * @param {number} patientId 
   * @param {number} appointmentId 
   * @returns {Promise<void>}
   */
  async deleteAppointment(patientId, appointmentId) {
    // TODO: Reemplazar con llamada a API
    // return fetch(`${API_BASE_URL}/appointments/${appointmentId}/`, { method: 'DELETE' })
    
    // Mock implementation
    const appointments = await this.getAppointments(patientId)
    const updatedAppointments = appointments.filter(a => a.id !== appointmentId)
    const key = patientId ? `appointments_${patientId}` : 'appointments'
    localStorage.setItem(key, JSON.stringify(updatedAppointments))
    return Promise.resolve()
  }
}

// ==================== QR EXPORT/IMPORT ====================
export const qrService = {
  /**
   * Exportar datos a formato QR
   * @param {number} patientId 
   * @param {Array} selectedMedicines 
   * @param {Array} selectedAppointments 
   * @returns {Promise<string>} JSON string para QR
   */
  async exportToQR(patientId, selectedMedicines = [], selectedAppointments = []) {
    // TODO: Si es necesario, validar en backend antes de exportar
    const medicines = await medicineService.getMedicines(patientId)
    const appointments = await appointmentService.getAppointments(patientId)
    
    const selectedMedData = medicines.filter(m => selectedMedicines.includes(m.id))
    const selectedAptData = appointments.filter(a => selectedAppointments.includes(a.id))
    
    return JSON.stringify({
      type: 'export',
      patientId,
      medicines: selectedMedData,
      appointments: selectedAptData,
      exportDate: new Date().toISOString()
    })
  },

  /**
   * Importar datos desde QR
   * @param {number} patientId 
   * @param {object} qrData 
   * @returns {Promise<void>}
   */
  async importFromQR(patientId, qrData) {
    // TODO: Validar y procesar en backend antes de importar
    if (qrData.medicines && Array.isArray(qrData.medicines)) {
      for (const med of qrData.medicines) {
        await medicineService.createMedicine(patientId, med)
      }
    }
    if (qrData.appointments && Array.isArray(qrData.appointments)) {
      for (const apt of qrData.appointments) {
        await appointmentService.createAppointment(patientId, apt)
      }
    }
    return Promise.resolve()
  }
}

// ==================== UTILITY FUNCTIONS ====================
export const apiUtils = {
  /**
   * Manejar errores de API de forma consistente
   * @param {Error} error 
   */
  handleError(error) {
    console.error('API Error:', error)
    // TODO: Implementar logging de errores
    // TODO: Mostrar notificaciones al usuario
    throw error
  },

  /**
   * Obtener headers con autenticación
   * @returns {object}
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }
}





