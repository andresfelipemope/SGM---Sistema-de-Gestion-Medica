/**
 * API Service Layer
 * 
 * Sistema de autenticación y gestión de usuarios usando localStorage
 * Implementa hash de contraseñas simple para frontend
 */

const API_BASE_URL = 'http://127.0.0.1:8000/'

// ==================== UTILITY FUNCTIONS ====================
/**
 * Hash simple de contraseña (solo para frontend, no para producción real)
 */
function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString()
}

/**
 * Verificar contraseña
 */
function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword
}

// ==================== AUTHENTICATION ====================
export const authService = {
  /**
   * Registrar nuevo usuario o cuidador
   * @param {string} email 
   * @param {string} password 
   * @param {string} name 
   * @param {string} userType - 'usuario' o 'cuidador'
   * @returns {Promise<{user: object}>}
   */
  async register(email, password, name, userType) {
    // Verificar si el usuario ya existe
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const existingUser = users.find(u => u.email === email && u.userType === userType)
    
    if (existingUser) {
      throw new Error('Este correo ya está registrado')
    }

    const newUser = {
      id: Date.now(),
      email,
      passwordHash: hashPassword(password),
      name,
      userType,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))

    // Si es usuario (paciente), crear perfil de paciente
    if (userType === 'usuario') {
      const patients = JSON.parse(localStorage.getItem('patients') || '[]')
      const newPatient = {
        id: newUser.id,
        userId: newUser.id,
        name,
        email,
        createdAt: new Date().toISOString()
      }
      patients.push(newPatient)
      localStorage.setItem('patients', JSON.stringify(patients))
    }

    return Promise.resolve({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        userType: newUser.userType
      }
    })
  },

  /**
   * Login de usuario o cuidador
   * @param {string} email 
   * @param {string} password 
   * @param {string} userType - 'usuario' o 'cuidador'
   * @returns {Promise<{user: object}>}
   */
  async login(email, password, userType) {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.email === email && u.userType === userType)
    
    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error('Contraseña incorrecta')
    }

    // Obtener datos del paciente si es usuario
    let patientData = null
    if (userType === 'usuario') {
      const patients = JSON.parse(localStorage.getItem('patients') || '[]')
      patientData = patients.find(p => p.userId === user.id)
    }

    return Promise.resolve({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.userType,
        patientId: userType === 'usuario' ? user.id : null,
        patient: patientData
      }
    })
  },

  /**
   * Logout
   * @returns {Promise<void>}
   */
  async logout() {
    return Promise.resolve()
  },

  /**
   * Obtener usuario actual
   * @returns {Promise<object>}
   */
  async getCurrentUser() {
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
    const relations = JSON.parse(localStorage.getItem('caregiver_patient_relations') || '[]')
    const patientIds = relations
      .filter(r => r.caregiverId === caregiverId)
      .map(r => r.patientId)
    
    const allPatients = JSON.parse(localStorage.getItem('patients') || '[]')
    const associatedPatients = allPatients.filter(p => patientIds.includes(p.id))
    
    return Promise.resolve(associatedPatients)
  },

  /**
   * Obtener paciente por ID
   * @param {number} patientId 
   * @returns {Promise<object>}
   */
  async getPatient(patientId) {
    const patients = JSON.parse(localStorage.getItem('patients') || '[]')
    return Promise.resolve(patients.find(p => p.id === patientId) || null)
  },

  /**
   * Buscar pacientes asociados a un cuidador (para selección en login)
   * @param {number} caregiverId 
   * @param {string} searchTerm 
   * @returns {Promise<Array>}
   */
  async searchPatientsByCaregiver(caregiverId, searchTerm) {
    const patients = await this.getPatientsByCaregiver(caregiverId)
    
    if (!searchTerm) {
      return Promise.resolve(patients)
    }
    
    return Promise.resolve(
      patients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  },

  /**
   * Asociar un paciente a un cuidador
   * @param {number} caregiverId 
   * @param {number} patientId 
   * @returns {Promise<void>}
   */
  async associatePatientToCaregiver(caregiverId, patientId) {
    const relations = JSON.parse(localStorage.getItem('caregiver_patient_relations') || '[]')
    
    // Verificar si ya existe la relación
    const exists = relations.some(r => r.caregiverId === caregiverId && r.patientId === patientId)
    if (exists) {
      return Promise.resolve()
    }

    relations.push({
      caregiverId,
      patientId,
      createdAt: new Date().toISOString()
    })
    
    localStorage.setItem('caregiver_patient_relations', JSON.stringify(relations))
    return Promise.resolve()
  },

  /**
   * Desasociar un paciente de un cuidador
   * @param {number} caregiverId 
   * @param {number} patientId 
   * @returns {Promise<void>}
   */
  async disassociatePatientFromCaregiver(caregiverId, patientId) {
    const relations = JSON.parse(localStorage.getItem('caregiver_patient_relations') || '[]')
    const updatedRelations = relations.filter(
      r => !(r.caregiverId === caregiverId && r.patientId === patientId)
    )
    localStorage.setItem('caregiver_patient_relations', JSON.stringify(updatedRelations))
    return Promise.resolve()
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





