# PROMPT PARA CREAR BACKEND CON DJANGO REST FRAMEWORK

Copia este prompt completo y dáselo a Cursor para crear el backend:

---

## PROMPT PARA CURSOR

Crea un backend completo con Django REST Framework para un Sistema de Gestión Médica (SGM) que se conectará con un frontend React. El backend debe proporcionar una API REST completa con autenticación JWT.

### REQUERIMIENTOS TÉCNICOS

1. **Django 4.2+** con **Django REST Framework**
2. **djangorestframework-simplejwt** para autenticación JWT
3. **django-cors-headers** para CORS
4. **PostgreSQL** como base de datos (o SQLite para desarrollo)
5. **python-decouple** para variables de entorno

### ESTRUCTURA DEL PROYECTO

```
sgm_backend/
├── manage.py
├── requirements.txt
├── .env
├── sgm_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── permissions.py
├── patients/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── medicines/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
└── appointments/
    ├── models.py
    ├── serializers.py
    ├── views.py
    └── urls.py
```

### MODELOS REQUERIDOS

#### 1. User (accounts/models.py)
Extender AbstractUser de Django con:
- `user_type`: CharField con choices: 'usuario' (paciente) o 'cuidador'
- `phone`: CharField opcional
- `created_at`: DateTimeField auto_now_add
- `updated_at`: DateTimeField auto_now

#### 2. PatientProfile (patients/models.py)
- `user`: OneToOneField a User (relación única)
- `name`: CharField(max_length=200) - nombre completo
- `email`: EmailField (debe coincidir con user.email)
- `date_of_birth`: DateField opcional
- `created_at`: DateTimeField auto_now_add
- `updated_at`: DateTimeField auto_now

#### 3. CaregiverPatientRelation (patients/models.py)
Relación Many-to-Many entre cuidadores y pacientes:
- `caregiver`: ForeignKey a User
- `patient`: ForeignKey a PatientProfile
- `created_at`: DateTimeField auto_now_add
- `is_active`: BooleanField default=True
- Meta: unique_together = ['caregiver', 'patient']

#### 4. Medicine (medicines/models.py)
- `patient`: ForeignKey a PatientProfile, related_name='medicines', on_delete=CASCADE
- `name`: CharField(max_length=200) - nombre de la medicina
- `dose`: CharField(max_length=100) - dosis (ej: "500mg", "1 tableta")
- `start_date`: DateField - fecha de inicio
- `end_date`: DateField null=True, blank=True - fecha de fin (opcional)
- `times`: JSONField - array de strings con horarios (ej: ["08:00", "20:00"])
- `notes`: TextField blank=True - notas adicionales
- `created_at`: DateTimeField auto_now_add
- `updated_at`: DateTimeField auto_now

**Validaciones:**
- `end_date` no puede ser anterior a `start_date`
- `start_date` no puede ser anterior a la fecha actual
- `times` debe ser un array no vacío

#### 5. Appointment (appointments/models.py)
- `patient`: ForeignKey a PatientProfile, related_name='appointments', on_delete=CASCADE
- `doctor`: CharField(max_length=200) - nombre del doctor/especialista
- `date`: DateField - fecha de la cita
- `time`: TimeField - hora de la cita
- `location`: CharField(max_length=200, blank=True) - lugar/consultorio
- `notes`: TextField blank=True - notas adicionales
- `created_at`: DateTimeField auto_now_add
- `updated_at`: DateTimeField auto_now

**Validaciones:**
- `date` no puede ser anterior a la fecha actual
- Si `date` es hoy, `time` no puede ser anterior a la hora actual

### ENDPOINTS REQUERIDOS

#### AUTENTICACIÓN (accounts/urls.py)

1. **POST /api/auth/register/**
   - Body: `{ "email": "string", "password": "string", "user_type": "usuario"|"cuidador", "name": "string", "phone": "string" (opcional) }`
   - Response 201: `{ "user": {...}, "token": "string", "refresh": "string" }`
   - Crea usuario y perfil de paciente si es 'usuario'

2. **POST /api/auth/login/**
   - Body: `{ "email": "string", "password": "string", "user_type": "usuario"|"cuidador" }`
   - Response 200: `{ "user": {...}, "token": "string", "refresh": "string" }`
   - Response 401: `{ "error": "Credenciales inválidas" }`

3. **POST /api/auth/logout/**
   - Headers: `Authorization: Bearer <token>`
   - Response 200: `{ "message": "Logout exitoso" }`
   - Invalida el refresh token

4. **GET /api/auth/me/**
   - Headers: `Authorization: Bearer <token>`
   - Response 200: `{ "id": int, "email": "string", "user_type": "string", "name": "string", "patient": {...} (si es usuario) }`

5. **POST /api/auth/token/refresh/**
   - Body: `{ "refresh": "string" }`
   - Response 200: `{ "access": "string" }`

#### PACIENTES (patients/urls.py)

6. **GET /api/patients/search/?q={search_term}**
   - Headers: `Authorization: Bearer <token>`
   - Query params: `q` (string) - término de búsqueda
   - Response 200: `[{ "id": int, "name": "string", "email": "string" }, ...]`
   - Solo cuidadores pueden buscar. Retorna pacientes asociados al cuidador.

7. **GET /api/caregivers/{caregiver_id}/patients/**
   - Headers: `Authorization: Bearer <token>`
   - Response 200: `[{ "id": int, "name": "string", "email": "string" }, ...]`
   - Solo el cuidador autenticado puede ver sus pacientes

8. **GET /api/patients/{patient_id}/**
   - Headers: `Authorization: Bearer <token>`
   - Response 200: `{ "id": int, "name": "string", "email": "string", "date_of_birth": "YYYY-MM-DD" (opcional) }`
   - Solo el paciente o su cuidador pueden ver

9. **POST /api/caregivers/{caregiver_id}/patients/{patient_id}/associate/**
   - Headers: `Authorization: Bearer <token>`
   - Response 201: `{ "message": "Paciente asociado exitosamente" }`
   - Asocia un paciente a un cuidador

#### MEDICINAS (medicines/urls.py)

10. **GET /api/patients/{patient_id}/medicines/**
    - Headers: `Authorization: Bearer <token>`
    - Response 200: `[{ "id": int, "name": "string", "dose": "string", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"|null, "times": ["string"], "notes": "string", "created_at": "ISO datetime" }, ...]`
    - Solo el paciente o su cuidador pueden ver

11. **POST /api/patients/{patient_id}/medicines/**
    - Headers: `Authorization: Bearer <token>`
    - Body: `{ "name": "string", "dose": "string", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"|null, "times": ["string"], "notes": "string" }`
    - Response 201: `{ "id": int, ... (mismo formato que GET) }`
    - Validar: start_date >= hoy, end_date >= start_date, times no vacío
    - Solo el paciente o su cuidador pueden crear

12. **DELETE /api/medicines/{medicine_id}/**
    - Headers: `Authorization: Bearer <token>`
    - Response 204: No content
    - Solo el paciente o su cuidador pueden eliminar

#### CITAS MÉDICAS (appointments/urls.py)

13. **GET /api/patients/{patient_id}/appointments/**
    - Headers: `Authorization: Bearer <token>`
    - Response 200: `[{ "id": int, "doctor": "string", "date": "YYYY-MM-DD", "time": "HH:MM:SS", "location": "string", "notes": "string", "created_at": "ISO datetime" }, ...]`
    - Ordenar por fecha y hora ascendente
    - Solo el paciente o su cuidador pueden ver

14. **POST /api/patients/{patient_id}/appointments/**
    - Headers: `Authorization: Bearer <token>`
    - Body: `{ "doctor": "string", "date": "YYYY-MM-DD", "time": "HH:MM:SS", "location": "string" (opcional), "notes": "string" (opcional) }`
    - Response 201: `{ "id": int, ... (mismo formato que GET) }`
    - Validar: date >= hoy, si date es hoy entonces time >= ahora
    - Solo el paciente o su cuidador pueden crear

15. **DELETE /api/appointments/{appointment_id}/**
    - Headers: `Authorization: Bearer <token>`
    - Response 204: No content
    - Solo el paciente o su cuidador pueden eliminar

### PERMISOS REQUERIDOS

Crear permisos personalizados en `accounts/permissions.py`:

1. **IsPatientOrCaregiver**: 
   - Permite acceso si el usuario es el paciente o es cuidador del paciente
   - Usar en endpoints de medicinas y citas

2. **IsCaregiver**: 
   - Solo cuidadores pueden acceder
   - Usar en endpoints de búsqueda de pacientes

3. **IsOwnerOrCaregiver**:
   - El usuario es dueño del recurso o es cuidador del paciente dueño
   - Usar en DELETE de medicinas y citas

### SERIALIZERS REQUERIDOS

#### accounts/serializers.py
- `UserRegistrationSerializer`: Para registro
- `UserLoginSerializer`: Para login
- `UserSerializer`: Para retornar datos del usuario

#### patients/serializers.py
- `PatientProfileSerializer`: Para datos del paciente
- `PatientSearchSerializer`: Para búsqueda (solo id, name, email)

#### medicines/serializers.py
- `MedicineSerializer`: Para CRUD de medicinas
- Validar: start_date, end_date, times

#### appointments/serializers.py
- `AppointmentSerializer`: Para CRUD de citas
- Validar: date, time

### CONFIGURACIÓN REQUERIDA

#### settings.py debe incluir:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'accounts',
    'patients',
    'medicines',
    'appointments',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

### FORMATO DE RESPUESTAS

**Éxito:**
- 200 OK: `{ "data": {...} }` o `[{...}, ...]`
- 201 Created: `{ "data": {...} }`
- 204 No Content: (sin body)

**Errores:**
- 400 Bad Request: `{ "error": "string", "details": {...} }`
- 401 Unauthorized: `{ "error": "No autenticado" }`
- 403 Forbidden: `{ "error": "No tienes permiso" }`
- 404 Not Found: `{ "error": "Recurso no encontrado" }`
- 500 Server Error: `{ "error": "Error del servidor" }`

### VALIDACIONES ESPECÍFICAS

1. **Fechas**: Usar timezone-aware datetime
2. **Horarios**: Formato "HH:MM" (24 horas)
3. **Email**: Validar formato y unicidad
4. **Passwords**: Mínimo 8 caracteres (puedes usar validadores de Django)
5. **JSON Fields**: Validar que times sea array de strings

### DATOS DE PRUEBA

Crear un comando de management o fixture con:
- 2 usuarios tipo 'usuario' (pacientes)
- 1 usuario tipo 'cuidador'
- Asociar el cuidador con los pacientes
- Algunas medicinas y citas de ejemplo

### DOCUMENTACIÓN

- Incluir Swagger/OpenAPI con drf-yasg o drf-spectacular
- Endpoint: `/api/docs/`

### IMPORTANTE

- Todos los endpoints requieren autenticación excepto register y login
- Usar paginación para listados (opcional pero recomendado)
- Incluir logging de errores
- Manejar excepciones apropiadamente
- Retornar mensajes de error en español cuando sea posible
- Los IDs deben ser enteros, no UUIDs (para simplificar frontend)

---

## INSTRUCCIONES ADICIONALES PARA CURSOR

1. Crea el proyecto desde cero con `django-admin startproject`
2. Crea cada app con `python manage.py startapp`
3. Configura la base de datos (PostgreSQL recomendado, SQLite para desarrollo)
4. Crea las migraciones y ejecútalas
5. Crea un superusuario para administración
6. Incluye un README.md con instrucciones de instalación
7. Incluye un archivo requirements.txt con todas las dependencias
8. Configura .env.example con las variables necesarias
9. Asegúrate de que todos los endpoints retornen exactamente el formato especificado
10. Prueba todos los endpoints con Postman o similar antes de considerar completado

---




