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

### 1. GET /tours - Endpoint Público de Tours

**Descripción**: Endpoint que permite obtener la lista de tours activos disponibles.

**Características**:
- Filtra solo tours con `isActive: true`
- Devuelve datos bilingües (español e inglés)
- Manejo apropiado de errores HTTP
- Devuelve `200 OK` con array vacío si no hay tours
- Devuelve `500 Internal Server Error` en caso de errores

**URL**: 
- Local: `http://localhost:5001/[project-id]/us-central1/getTours`
- Producción: `https://[project-id].cloudfunctions.net/getTours`

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