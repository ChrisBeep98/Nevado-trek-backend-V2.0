#### Create Private Request
*   **Method**: `POST`
*   **URL**: `/public/bookings/private`
*   **Body**: Same as Create Booking, but always creates Private Departure.

---

## 📊 Endpoint Status Summary

### Admin Endpoints (18/18) ✅
| Category | Endpoints | Status |
|----------|-----------|--------|
| Tours | 5 | ✅ All operational |
| Departures | 5 | ✅ All operational |
| Bookings | 7 | ✅ All operational |
| Stats | 1 | ✅ Operational |

### Public Endpoints (4/4) ✅
| Category | Endpoints | Status |
|----------|-----------|--------|
| Tours | 1 | ✅ Operational |
| Departures | 1 | ✅ Operational |
| Bookings | 2 | ✅ Operational |

### Recent Fixes
**November 21, 2025**:
- ✅ Fixed `GET /admin/bookings` (was returning 404)
- ✅ Fixed `GET /admin/stats` (was returning 404)
- ✅ Redeployed all functions to Cloud Run
- ✅ Verified all 22 endpoints functional

### Testing Status
- **Integration Tests**: 16/16 passing (100%)
- **Manual Verification**: All endpoints tested
- **Frontend Compatibility**: Verified

---

**Document Version**: 2.0.1  
**Last Updated**: November 21, 2025  
**Next Review**: December 2025
