# Nevado Trek Backend

Backend para el sistema de gestión de tours Nevado Trek, construido con Firebase Cloud Functions y Firestore.

## Funcionalidades Implementadas

### Endpoints Públicos

1. **GET /tours** - Lista todos los tours activos
   - Devuelve todos los tours con `isActive: true`
   - Estructura bilingüe: `{name: {es: "...", en: "..."}}`
   - Respuesta: `200 OK` con array de tours o `200 OK` con array vacío

2. **GET /tours/:tourId** - Obtiene un tour específico
   - Devuelve un tour específico si está activo
   - Parámetro: `tourId` en la URL
   - Respuesta: `200 OK` con el tour o `404 Not Found`

### Endpoints de Administración

3. **POST /admin/tours** - Crea un nuevo tour
   - Requiere header: `X-Admin-Secret-Key: miClaveSecreta123`
   - Estructura bilingüe requerida para campos de texto
   - Respuesta: `201 Created` con el ID del tour creado

4. **PUT /admin/tours/:tourId** - Actualiza un tour existente
   - Requiere header: `X-Admin-Secret-Key: miClaveSecreta123`
   - Parámetro: `tourId` en la URL
   - Actualiza solo los campos proporcionados
   - Respuesta: `200 OK` en éxito o `400/401/404` en errores

## Requisitos del Sistema

- Node.js v22 o superior
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Java JDK 8 o superior (solo para pruebas locales con Firestore emulator)

## Instalación y Configuración

### 1. Instalar dependencias

```bash
cd functions
npm install
```

### 2. Iniciar sesión en Firebase

```bash
firebase login
```

### 3. Seleccionar proyecto (si tienes múltiples proyectos)

```bash
firebase use [project-id]
```

## Pruebas Locales

Para probar las funciones localmente con emuladores:

### 1. Asegúrate de tener Java instalado

Java es requerido para el emulador de Firestore. Puedes verificar si está instalado con:

```bash
java -version
```

### 2. Iniciar los emuladores

```bash
firebase emulators:start --only functions,firestore
```

Los emuladores mostrarán las URLs locales para cada función, por ejemplo:
- `http://localhost:5001/[project-id]/us-central1/getTours`

### 3. Probar las funciones

Puedes usar herramientas como cURL, Postman, o un navegador para probar las funciones:

```bash
# Obtener tours
curl http://localhost:5001/[project-id]/us-central1/getTours

# Crear tour (requiere header de autenticación)
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret-Key: miClaveSecreta123" \
  -d '{"name": {"es": "Mi Tour", "en": "My Tour"}, "description": {"es": "Descripción", "en": "Description"}}' \
  http://localhost:5001/[project-id]/us-central1/adminCreateTour
```

## Despliegue a Producción

Para desplegar las funciones a Firebase:

```bash
firebase deploy --only functions
```

### URLs de las Funciones Desplegadas (Estado Actual)

Las funciones han sido desplegadas exitosamente y están disponibles en las siguientes URLs:

- **GET /tours**: https://gettoursv2-wgfhwjbpva-uc.a.run.app
- **GET /tours/:tourId**: https://gettourbyidv2-wgfhwjbpva-uc.a.run.app
- **POST /admin/tours**: https://admincreatetourv2-wgfhwjbpva-uc.a.run.app
- **PUT /admin/tours/:tourId**: https://adminupdatetourv2-wgfhwjbpva-uc.a.run.app
- **DELETE /admin/tours/:tourId**: https://admindeletetourv2-wgfhwjbpva-uc.a.run.app

Para usar las funciones de administración, recuerda incluir el header `X-Admin-Secret-Key: miClaveSecreta123`.

## Estructura de Datos

### Tour (estructura bilingüe)
```json
{
  "name": {
    "es": "Nombre en español",
    "en": "Name in English"
  },
  "description": {
    "es": "Descripción en español",
    "en": "Description in English"
  },
  "price": {
    "amount": 150,
    "currency": "COP"
  },
  "maxParticipants": 15,
  "duration": "4 horas",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "images": ["url1", "url2"]
}
```

## Seguridad

- Las funciones de administración requieren el header `X-Admin-Secret-Key`
- La clave actual es `miClaveSecreta123`, pero para producción debería moverse a Firebase Secrets
- Solo se devuelven tours con `isActive: true` en endpoints públicos

## Pruebas Unitarias

Para ejecutar las pruebas de funcionalidad:

```bash
node test_functions.js
```

Esto ejecuta pruebas unitarias básicas de todas las funciones sin requerir Firebase.

## Siguiente Fase

Próximos pasos según el plan:

1. **Fase 2: Lógica de Reservas**
   - Validación Anti-Spam
   - Flujo de Reserva Inicial
   - Lógica de Calendario Público
   - Flujo de Unirse a Evento
   - Flujo de Publicar Evento

2. **Fase 3: Gestión de Reservas**
   - Gestión de Reservas (Admin)
   - Gestión de Eventos (Admin)
   - Actualizar Reglas de Seguridad
   - Refinar Denormalización