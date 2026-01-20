# Backend Status - Nevado Trek V2.7.5

**Last Updated**: January 19, 2026  
**Version**: v2.7.5  
**Status**: 🟢 **Fully Deployed & Verified on Staging**

---

## 📊 Executive Summary

El backend está **100% funcional y verificado en Staging** con la integración de **Bold Smart Links (API)**. Esta modalidad reemplaza al widget/botón para garantizar la disponibilidad de todos los métodos de pago.

**Staging Version**: v2.7.5  
**Key Feature**: Bold Smart Link API Integration & Universal Payment Support  
**maxPax**: 8 para todos los departures (public y private)

---

## 🆕 Latest Maintenance (Jan 19, 2026)

### 💳 Bold Smart Link Integration (v2.7.5)
**Status**: ✅ Deployed to Staging (Jan 19, 2026)
**Description**: Migrated from Checkout Widget to Server-to-Server API.
**Details**:
- **Mechanism**: The backend calls Bold API to generate a hosted payment URL.
- **Compatibility**: Guaranteed availability of Credit Cards, PSE, and Nequi (hosted on Bold's domain).
- **Cleanup**: Removed client-side integrity signature generation.
- **Webhooks**: Integrated with Sandbox webhook for real-time status updates.

### 💳 Bold Payment Deposit Logic (v2.7.2)
**Status**: ✅ Integrated into v2.7.5
**Description**: Partial payment logic.
**Details**:
- **Formula**: `(booking.finalPrice * 0.30) * 1.05`.
- **Logic**: Calculates a **30% deposit** based on booking price + **5% processing fee**.

---

## 🆕 Latest Maintenance (Jan 18, 2026)

### 🚨 Hotfix: Secrets Overlap Resolution (v2.7.1)
**Status**: ✅ Deployed to Staging (Jan 18, 2026)
**Description**: Resolved deployment conflict "Secret environment variable overlaps non secret environment variable".
**Details**:
- **Root Cause**: Legacy Cloud Run configuration conflicted with new `defineSecret` bindings.
- **Workaround**: Temporarily switched Telegram config to standard `process.env` variables (removing `defineSecret` binding) to allow successful deployment.
- **Impact**: Backend is fully operational. Notifications rely on existing environment variables.

### 📢 Telegram Notifications System (v2.7.0)
**Status**: ✅ Deployed to Staging  
**Description**: Real-time alerts for Admin.  
**Details**:
- **Integration**: Direct Telegram Bot API via `axios`.
- **Triggers**: New Bookings (All types), Payments (Approved/Rejected/Expired).
- **Enrichment**: Alerts include Tour Name and Customer Name.

---

## 🚀 Deployment History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v2.7.5 | Jan 19, 2026 | Bold Smart Links & Payment URL | ✅ Deployed (Staging) |
| v2.7.2 | Jan 19, 2026 | Bold Deposit Logic (30% + Fee) | ✅ Deployed (Staging) |
| v2.7.1 | Jan 18, 2026 | Hotfix: Cloud Run secrets overlap workaround | ✅ Deployed (Staging) |
| Maint | Jan 7, 2026 | Billing Reactivation & 503 Fix | ✅ Active |
| v2.6 | Nov 25, 2025 | Fix validation for join booking | ✅ Deployed |

---

## 📝 Notes

- **Function URL**: https://api-wgfhwjbpva-uc.a.run.app
- **Staging URL**: https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api
- **Firestore Project**: nevadotrektest01 (Prod) / nevado-trek-backend-03 (Staging)
- **Region**: us-central1
- **Runtime**: Node.js 22 (2nd Gen)
