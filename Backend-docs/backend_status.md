# Backend Status - Nevado Trek V2.7.5

**Last Updated**: January 19, 2026  
**Version**: v2.7.5  
**Status**: 🟢 **LIVE IN PRODUCTION**

---

## 📊 Executive Summary

El sistema de pagos ha sido migrado exitosamente a **Producción**. La integración utiliza **Bold Smart Links (API)**, garantizando la disponibilidad universal de métodos de pago (Tarjetas, PSE, Nequi) y eliminando la dependencia de widgets en el frontend.

**Production Version**: v2.7.5  
**Key Feature**: Smart Link Payments & Real-time Telegram Alerts  
**Environment**: `nevadotrektest01` (Live)

---

## 🆕 Latest Deployment (Jan 19, 2026)

### 🚀 Production Release: Smart Links Payment System
**Status**: ✅ Deployed to `nevadotrektest01`
**Description**: Full rollout of the new payment architecture.
**Key Components**:
- **Smart Links**: Server-to-server link generation via `https://integrations.api.bold.co`.
- **Deposit Logic**: Automatic 30% Deposit + 5% Fee calculation.
- **Universal Support**: Works for all tour types (Private & Public/Join).
- **Notifications**: Telegram alerts active for Booking Creation and Payment Status updates.
- **Credentials**: Updated with valid Production Keys.

### 🧪 Staging Verification (Jan 19, 2026)
**Status**: ✅ Passed All Checks
**Tests Performed**:
- Admin Audit (CRUD Tours/Bookings): 100% Pass.
- Payment Flow (Private/Public): 100% Pass.
- Validations (Phone/Data Integrity): Verified.

---

## 🚀 Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v2.7.5 | Jan 19, 2026 | **PRODUCTION**: Bold Smart Links & Payment URL | ✅ Live |
| v2.7.5 | Jan 19, 2026 | Staging: Bold Smart Links Verification | ✅ Verified |
| v2.7.2 | Jan 19, 2026 | Staging: Bold Deposit Logic (30% + Fee) | ✅ Verified |
| v2.7.1 | Jan 18, 2026 | Hotfix: Cloud Run secrets overlap workaround | ✅ Resolved |
| Maint | Jan 7, 2026 | Billing Reactivation & 503 Fix | ✅ Active |

---

## 📝 Notes

- **Production URL**: https://api-wgfhwjbpva-uc.a.run.app
- **Staging URL**: https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api
- **Webhook URL (Prod)**: `https://api-wgfhwjbpva-uc.a.run.app/public/payments/webhook`
- **Firestore Project**: nevadotrektest01
- **Region**: us-central1
- **Runtime**: Node.js 22 (2nd Gen)