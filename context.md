# Contexto del Proyecto - Nevado Trek Backend

## Descripción General

Este archivo proporciona contexto sobre el estado actual del backend de Nevado Trek, incluyendo la arquitectura implementada, las funcionalidades desarrolladas y la estructura del sistema.

## Arquitectura Actual

### Estructura del Proyecto

```
nevado-trek-backend/
├── .firebaserc
├── .gitignore
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── instructions.md
├── context.md (nuevo archivo)
└── functions/
    ├── .eslintrc.js
    ├── .gitignore
    ├── index.js (archivo principal con las Cloud Functions)
    ├── package.json
    ├── package-lock.json
    └── node_modules/...
```

### Tecnologías Utilizadas

- **Firebase Cloud Functions**: Para la lógica de backend serverless
- **Firebase Firestore**: Base de datos NoSQL para almacenar tours, eventos y reservas
- **Firebase Admin SDK**: Para interactuar con servicios de Firebase
- **Node.js**: Runtime para las funciones
- **ESLint**: Para mantener la calidad del código

## Funcionalidades Implementadas

### 1. GET /getToursV2 - Endpoint Público de Tours

**Descripción**: Endpoint que permite obtener la lista de tours activos disponibles.

**Características**:
- Filtra solo tours con `isActive: true`
- Devuelve datos bilingües (español e inglés)
- Manejo apropiado de errores HTTP
- Devuelve `200 OK` con array vacío si no hay tours
- Devuelve `500 Internal Server Error` en caso de errores
- URL: `https://us-central1-nevadotrektest01.cloudfunctions.net/getToursV2`

### 2. GET /getTourByIdV2 - Endpoint Público de Tour Individual

**Descripción**: Endpoint que permite obtener un tour específico por su ID.

**Características**:
- Filtra para devolver solo tours con `isActive: true`
- Devuelve datos bilingües (español e inglés)
- Validación de parámetros de URL
- Manejo apropiado de errores HTTP
- Devuelve `404 Not Found` si el tour no existe o no está activo
- URL: `https://us-central1-nevadotrektest01.cloudfunctions.net/getTourByIdV2`

### 3. POST /adminCreateTourV2 - Endpoint de Administración para Crear Tours

**Descripción**: Endpoint protegido que permite a administradores crear nuevos tours.

**Características**:
- Requiere autenticación con header `X-Admin-Secret-Key`
- Valida estructura bilingüe de campos de texto
- Asegura campo `isActive` con valor por defecto
- Añade marcas de tiempo de creación
- Devuelve `201 Created` en caso de éxito
- Devuelve `400 Bad Request` para datos inválidos
- Devuelve `401 Unauthorized` si la autenticación falla
- URL: `https://us-central1-nevadotrektest01.cloudfunctions.net/adminCreateTourV2`

### 4. PUT /adminUpdateTourV2 - Endpoint de Administración para Actualizar Tours

**Descripción**: Endpoint protegido que permite a administradores actualizar tours existentes.

**Características**:
- Requiere autenticación con header `X-Admin-Secret-Key`
- Valida estructura bilingüe de campos de texto actualizados
- Actualiza marca de tiempo de modificación
- Validación para impedir cambios de ID
- Devuelve `200 OK` en caso de éxito
- Devuelve `400 Bad Request` para datos inválidos
- Devuelve `401 Unauthorized` si la autenticación falla
- Devuelve `404 Not Found` si el tour no existe
- URL: `https://us-central1-nevadotrektest01.cloudfunctions.net/adminUpdateTourV2`

### 5. DELETE /adminDeleteTourV2 - Endpoint de Administración para Eliminar Tours

**Descripción**: Endpoint protegido que permite a administradores eliminar tours existentes (eliminación lógica).

**Características**:
- Requiere autenticación con header `X-Admin-Secret-Key`
- Realiza eliminación lógica marcando `isActive` como `false`
- Actualiza marca de tiempo de modificación
- Devuelve `200 OK` en caso de éxito
- Devuelve `401 Unauthorized` si la autenticación falla
- Devuelve `404 Not Found` si el tour no existe
- URL: `https://us-central1-nevadotrektest01.cloudfunctions.net/adminDeleteTourV2`

### 2. Sistema de Constantes

**Descripción**: Sistema centralizado para manejar configuraciones importantes.

**Constantes Disponibles**:
- `ADMIN_SECRET_KEY`: Clave para autenticación de admin (clave temporal)
- `COLLECTIONS`: Nombres de colecciones de Firestore
  - `TOURS`: Colección para tours
  - `TOUR_EVENTS`: Colección para eventos de tours
  - `BOOKINGS`: Colección para reservas
  - `RATE_LIMITER`: Colección para control de spam
- `STATUS`: Estados para eventos y reservas
  - `EVENT_TYPE_PRIVATE`: Evento privado
  - `EVENT_TYPE_PUBLIC`: Evento público
  - `BOOKING_PENDING`: Reserva pendiente
- `RATE_LIMIT_SECONDS`: Control anti-spam (10 segundos)

### 3. Middleware de Autenticación

**Descripción**: Función para validar la clave secreta de administrador en encabezados de solicitud.

**Características**:
- Verifica el encabezado `X-Admin-Secret-Key`
- Preparado para futuras funciones de administración

## Código Implementado

### Estructura Principal de `functions/index.js`

```javascript
// Inicialización de servicios de Firebase
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
const db = admin.firestore();

// Sección de constantes y utilidades
const CONSTANTS = { ... };
const isAdminRequest = (req) => { ... };

// Endpoints públicos
const getToursList = async (req, res) => { ... };

// Exportación de funciones
module.exports = {
  getTours: functions.https.onRequest(getToursList)
};
```

## Estado Actual del Desarrollo

### Completado
- ✅ Implementación base de Cloud Functions
- ✅ Endpoint GET /tours para listar tours activos
- ✅ Sistema de constantes centralizado
- ✅ Middleware de autenticación para admin
- ✅ Validación y manejo de errores
- ✅ Cumplimiento de estándares de calidad de código (linting)
- ✅ Documentación actualizada

### Próximos Pasos
- 🔜 Implementación de endpoints de administración (crear, editar, eliminar tours)
- 🔜 Implementación de sistema de reservas
- 🔜 Implementación de sistema de autenticación
- 🔜 Despliegue a producción
- 🔜 Integración con frontend

## Consideraciones de Seguridad

- La clave secreta de administrador actual (`miClaveSecreta123`) es temporal
- Para producción, la clave debería almacenarse en Firebase Secrets
- El middleware de autenticación está implementado para proteger endpoints de administración

## Requisitos para Ejecución

### Desarrollo Local
- Node.js v22 o superior
- Firebase CLI instalado
- Java instalado (para emuladores de Firestore)

### Comandos Útiles
- `firebase emulators:start --only functions,firestore` - Ejecutar emuladores localmente
- `firebase deploy --only functions` - Desplegar funciones a producción
- `npm run lint` - Verificar calidad del código
- `npm install` - Instalar dependencias

## Colecciones de Firestore Utilizadas

- `tours` - Contiene la información de los tours disponibles
- `tourEvents` - Contiene información específica de salidas
- `bookings` - Contiene información de reservas
- `rateLimiter` - Contiene información para control de spam

## Características del Sistema

- **Arquitectura Bilingüe**: Diseñado para soportar contenido en español e inglés
- **Sistema Anti-Spam**: Implementado con control de tasa de solicitudes
- **Sistema de Eventos**: Estructura preparada para eventos privados y públicos
- **API RESTful**: Seguimiento de convenciones REST para endpoints

## Estado del Código

El código actual:
- Cumple con estándares de linting de ESLint
- Sigue buenas prácticas de JavaScript
- Incluye documentación JSDoc apropiada
- Tiene manejo de errores robusto
- Usa convenciones consistentes de formateo