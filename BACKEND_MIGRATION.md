# Guía de Migración a Django REST Framework

Este documento describe cómo migrar la aplicación del frontend actual (que usa localStorage) a un backend con Django REST Framework.

## Estructura Preparada

La aplicación está estructurada con una capa de servicios (`src/services/api.js`) que facilita la migración. Actualmente todas las funciones usan localStorage como mock, pero están listas para ser reemplazadas con llamadas a API.

## Servicios Disponibles

### 1. Authentication Service (`authService`)
- `login(email, password, userType)` - Autenticación
- `logout()` - Cerrar sesión
- `getCurrentUser()` - Obtener usuario actual

**Endpoints sugeridos:**
- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### 2. Patient Service (`patientService`)
- `getPatientsByCaregiver(caregiverId)` - Obtener pacientes de un cuidador
- `getPatient(patientId)` - Obtener paciente por ID
- `searchPatients(searchTerm)` - Buscar pacientes

**Endpoints sugeridos:**
- `GET /api/caregivers/{id}/patients/`
- `GET /api/patients/{id}/`
- `GET /api/patients/search/?q={term}`

### 3. Medicine Service (`medicineService`)
- `getMedicines(patientId)` - Obtener medicinas de un paciente
- `createMedicine(patientId, medicineData)` - Crear medicina
- `deleteMedicine(patientId, medicineId)` - Eliminar medicina

**Endpoints sugeridos:**
- `GET /api/patients/{patientId}/medicines/`
- `POST /api/patients/{patientId}/medicines/`
- `DELETE /api/medicines/{id}/`

### 4. Appointment Service (`appointmentService`)
- `getAppointments(patientId)` - Obtener citas de un paciente
- `createAppointment(patientId, appointmentData)` - Crear cita
- `deleteAppointment(patientId, appointmentId)` - Eliminar cita

**Endpoints sugeridos:**
- `GET /api/patients/{patientId}/appointments/`
- `POST /api/patients/{patientId}/appointments/`
- `DELETE /api/appointments/{id}/`

### 5. QR Service (`qrService`)
- `exportToQR(patientId, selectedMedicines, selectedAppointments)` - Exportar a QR
- `importFromQR(patientId, qrData)` - Importar desde QR

**Nota:** Estos pueden ser procesados en el frontend o validados en el backend.

## Pasos para Migración

### 1. Configurar Variables de Entorno

Crear archivo `.env`:
```
REACT_APP_API_URL=http://localhost:8000/api
```

### 2. Actualizar Servicios

En `src/services/api.js`, reemplazar las funciones mock con llamadas fetch:

```javascript
async login(email, password, userType) {
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, userType })
  })
  
  if (!response.ok) {
    throw new Error('Login failed')
  }
  
  const data = await response.json()
  // Guardar token
  localStorage.setItem('token', data.token)
  return data
}
```

### 3. Manejar Autenticación

- Implementar JWT tokens
- Guardar token en localStorage
- Incluir token en headers de todas las peticiones
- Manejar refresh tokens si es necesario

### 4. Manejar Errores

Implementar manejo de errores consistente:
- Errores de red
- Errores de autenticación (401)
- Errores de validación (400)
- Errores del servidor (500)

### 5. Actualizar Componentes

Los componentes ya están preparados para usar los servicios. Solo necesitas:
- Asegurar que los servicios retornen datos en el formato esperado
- Manejar estados de carga
- Manejar errores en la UI

## Modelos de Django Sugeridos

```python
# models.py
class User(AbstractUser):
    user_type = models.CharField(max_length=20, choices=[
        ('usuario', 'Usuario'),
        ('cuidador', 'Cuidador')
    ])

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    caregivers = models.ManyToManyField(User, related_name='patients', blank=True)

class Medicine(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medicines')
    name = models.CharField(max_length=200)
    dose = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    times = models.JSONField()  # Array de horas
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.CharField(max_length=200)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

## Notas Importantes

1. **Separación de Lógica**: Toda la lógica de datos está en `src/services/api.js`, facilitando la migración.

2. **Fallback a localStorage**: Los servicios tienen fallback a localStorage si hay errores, permitiendo desarrollo sin backend.

3. **Estructura de Datos**: Los datos están estructurados para ser compatibles con APIs REST estándar.

4. **Autenticación**: El sistema está preparado para usar tokens JWT. Solo necesitas implementar el backend.

5. **Pacientes por Cuidador**: El sistema maneja la relación cuidador-paciente. El backend debe implementar esta relación.

## Próximos Pasos

1. Crear proyecto Django con Django REST Framework
2. Implementar modelos según sugerencias
3. Crear serializers y viewsets
4. Configurar autenticación (JWT)
5. Actualizar servicios en `src/services/api.js`
6. Probar integración end-to-end





