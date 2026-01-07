# Backend Documentation - Index

**Last Updated**: January 7, 2026  
**Project Status**: 🟢 PRODUCTION READY

Esta carpeta contiene toda la documentación técnica del backend de Nevado Trek V2.6.

---

## 📚 Documentos Disponibles

### 1. [backend_status.md](./backend_status.md)
**Estado real y verificado**
- Mantenimiento reciente (Jan 7, 2026 - Restauración API)
- Versión actual: **v2.6.0**
- Testing de producción (100% OK)
- Registro de cambios (maxPax=8, Join Admin, etc.)

### 2. [API_REFERENCE.md](./API_REFERENCE.md) 🆕
**Referencia técnica de endpoints**
- Definición de 27 endpoints (Admin y Públicos)
- Formatos de Request/Response
- Reglas de manejo de fechas (ISO Strings & Noon UTC)
- Autenticación administrativa

### 3. [PUBLIC_API_FRONTEND_GUIDE.md](./PUBLIC_API_FRONTEND_GUIDE.md) 🆕
**Guía específica para el Frontend**
- Endpoints optimizados para el sitio web
- Estrategia de **Cache Bypass** con `?t=Date.now()`
- Ejemplos de uso en JavaScript/TypeScript

### 4. [FIREBASE_PROJECT.md](./FIREBASE_PROJECT.md)
**Configuración de Firebase**
- Proyecto: `nevadotrektest01` (Producción)
- Guía de emuladores y deployment

---

## 🎯 Quick Start

### Verificar Salud de Producción
```bash
# Ejecuta un test rápido de conectividad
node functions/test_prod_simple.js
```

### Desplegar Cambios
```bash
# Desde la raíz del proyecto
firebase deploy --only functions:api
```

---

## 📊 Estado del Sistema

| Componente | Estado | Detalles |
|------------|--------|----------|
| **Backend v2.6** | ✅ Deployed | Jan 7 Restoration Complete |
| **API Pública** | ✅ Live | https://api-wgfhwjbpva-uc.a.run.app |
| **Facturación** | ✅ Active | Google Cloud Billing OK |
| **Docs** | ✅ Sync | Sincronizado con v2.6 |

---

## ⚠️ Nota sobre Fechas
Recordar siempre la regla **Noon UTC (12:00 PM)** para evitar que las fechas en Colombia (UTC-5) aparezcan como el día anterior en la base de datos.