# Backend Documentation - Index

**Last Updated**: November 25, 2025

Esta carpeta contiene toda la documentación del backend de Nevado Trek V2.0.

---

## 📚 Documentos Disponibles

### 1. [backend_status.md](./backend_status.md)
**Estado actual del backend**
- Cambios recientes (v2.4 - Nov 25, 2025)
- Bugs corregidos
- Testing completo (41/41 tests passing)
- Deployment y migración
- Schemas de datos (Booking, Departure)

### 2. [FIREBASE_PROJECT.md](./FIREBASE_PROJECT.md) 🆕
**Configuración de Firebase y Emuladores**
- **Información del proyecto Firebase** (nevadotrektest01 = Producción)
- Cómo usar los emuladores correctamente
- Proceso de deployment
- URLs y configuraciones
- Errores comunes a evitar

> [!IMPORTANT]
> **Leer este documento primero** si vas a trabajar con Firebase o emuladores para evitar confusiones sobre qué proyecto usar.

### 3. [API_REFERENCE.md](./API_REFERENCE.md)
**Referencia completa de endpoints**
- 23 endpoints documentados
- Admin endpoints (19)
- Public endpoints (4)
- Request/Response examples
- Authentication

---

## 🎯 Quick Start

### Para Testing Local
```bash
cd "D:\Nevado Trek Development\nevado-trek-backend\functions"
firebase emulators:start --project nevadotrektest01
```

### Para Deployment
```bash
cd "D:\Nevado Trek Development\nevado-trek-backend"
firebase deploy --only functions
```

### Para Verificar Producción
```bash
cd "D:\Nevado Trek Development\nevado-trek-backend\functions"
node test_prod_simple.js
```

---

## 📊 Estado General

| Componente | Estado | Detalles |
|------------|--------|----------|
| **Backend v2.4** | ✅ Deployed | Production verified |
| **Tests** | ✅ 41/41 | All passing |
| **API** | ✅ Live | https://api-wgfhwjbpva-uc.a.run.app |
| **Firebase** | ✅ Active | nevadotrektest01 |

---

## 🔍 Cambios Más Recientes (v2.4)

1. ✅ Private Departure maxPax = 8
2. ✅ Irreversible Cancellation Logic  
3. ✅ Private Departure Auto-Cancellation
4. ✅ Public Slot Release on Cancel

Ver [backend_status.md](./backend_status.md) para detalles completos.

---

## ⚠️ Importante: Proyecto Firebase

**Producción = `nevadotrektest01`**

A pesar del nombre "test", este ES el proyecto de producción que sirve la API en `https://api-wgfhwjbpva-uc.a.run.app`.

Ver [FIREBASE_PROJECT.md](./FIREBASE_PROJECT.md) para más detalles.
