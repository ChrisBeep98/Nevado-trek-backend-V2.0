# Frontend Cleanup & Documentation Plan

## 📋 FILES TO CLEAN (Safe to Delete)

### Log Files (Root Directory)
- `booking_test_output.txt` *(3.5 KB)* - Old test output
- `debug_log.txt` *(370 B)* - Debug logs
- `e2e_results.txt` *(218 KB)* - Old E2E results
- `error_log.txt` *(228 B)* - Error logs
- `key_debug.txt` *(244 B)* - Debug file
- `modal_debug.txt` *(385 B)* - Modal debug
- `modal_screenshot.png` *(220 KB)* - Debug screenshot
- `test_errors_detail.txt` *(16 KB)* - Test error logs
- `test_output.txt` *(663 KB)* - Old test output
- `test_output_2.txt` *(3.2 KB)* - Old test output
- `test_output_3.txt` *(3.3 KB)* - Old test output
- `test_output_4.txt` *(859 KB)* - Old test output
- `test_output_5.txt` *(471 KB)* - Old test output
- `test_output_single.txt` *(459 KB)* - Old test output

**Total to Clean**: ~2.9 MB of log files

### Integration Test Logs
- `src/__tests__/integration/test_error.log` *(349 B)* - Error log

### Documentation to Consolidate
Multiple overlapping docs in `frontend-docs/`:
- `estado_actual.md` - Merge into comprehensive
- `frontend_status.md` - Merge into comprehensive
- `frontend_development_status.md` - Merge into comprehensive
- `frontend_architecture_status.md` - Merge into comprehensive
- `session_summary_nov21.md` - Archive or delete (outdated)

Keep & Update:
- ✅ `comprehensive_documentation.md` - Main doc
- ✅ `e2e_test_inventory.md` - Update with current tests
- ✅ `e2e_testing_guide.md` - Keep as reference
- ✅ `testing_documentation.md` - Consolidated testing doc

---

## 🧪 TEST FILES INVENTORY

### E2E Tests (25 files)

#### ✅ Active & Maintained
1. `auth.spec.ts` - Login flow
2. `calendar.spec.ts` - Calendar UI
3. `bookings.spec.ts` - Main booking tests
4. `departures.spec.ts` - Departure management
5. `tours.spec.ts` - Tour management (main)
6. `modal-enhancements.spec.ts` - Modal features
7. `transfer-tab.spec.ts` - Transfer functionality **(NEW)**

#### 📦 Debug/Diagnostic (Can Archive)
8. `add-booking-debug.spec.ts` - Debug version
9. `add-booking-simple.spec.ts` - Simple version
10. `add-booking-minimal.spec.ts` - Minimal version
11. `add-booking-final.spec.ts` - Final version
12. `add-booking-complete.spec.ts` - Complete version
13. `add-booking.spec.ts` - Original version
14. `backend-response-diag.spec.ts` - Backend diagnostic
15. `debug-modal.spec.ts` - Modal debugging

#### 🔄 Alternative Versions (Choose One)
16. `booking-creation.spec.ts`
17. `booking-management.spec.ts`
18. `bookingmodal.complete.spec.ts`
19. `bookings.full_flow.spec.ts`
20. `bookings.logic.spec.ts`

#### 📝 Update-Specific (Can Archive After Merge)
21. `booking_date_tour_update.spec.ts`
22. `tours-complete.spec.ts`
23. `tours-refactor.spec.ts`
24. `tours-update.spec.ts`

#### ⚙️ CRUD Generic
25. `crud-operations.spec.ts`

### Unit Tests (3 files)
1. `src/__tests__/unit/hooks/useBookings.test.tsx`
2. `src/__tests__/unit/hooks/useDepartures.test.tsx`
3. `src/__tests__/unit/hooks/useTours.test.tsx`

### Integration Tests (1 file)
1. `src/__tests__/integration/live-backend.test.ts`

---

## 📊 TEST CONSOLIDATION RECOMMENDATIONS

### Keep These Core Tests:
1. **auth.spec.ts** - Authentication
2. **calendar.spec.ts** - Calendar UI (7/7 passing)
3. **bookings.spec.ts** - Main booking flows
4. **departures.spec.ts** - Departure management  
5. **tours.spec.ts** - Tour management
6. **modal-enhancements.spec.ts** - Modal features (3/4 passing)
7. **transfer-tab.spec.ts** - Transfer tab (NEW - 1/4 passing but functional)

### Archive/Delete Debug Files:
- All `add-booking-*.spec.ts` variants (consolidate into `bookings.spec.ts`)
- All `debug-*.spec.ts` files
- `backend-response-diag.spec.ts`

### Consolidate Duplicates:
- Merge `booking-*.spec.ts` files into main `bookings.spec.ts`
- Merge `tours-*.spec.ts` files into main `tours.spec.ts`
- Keep only comprehensive versions

**Result**: ~7 core E2E test files instead of 25

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
src/__tests__/
├── e2e/
│   ├── core/
│   │   ├── auth.spec.ts
│   │   ├── calendar.spec.ts
│   │   ├── bookings.spec.ts
│   │   ├── departures.spec.ts
│   │   └── tours.spec.ts
│   ├── features/
│   │   ├── modal-enhancements.spec.ts
│   │   └── transfer-tab.spec.ts
│   ├── helpers/
│   │   └── booking-helpers.ts
│   └── archived/ (optional)
│       └── [old debug files]
├── unit/
│   └── hooks/
│       ├── useBookings.test.tsx
│       ├── useDepartures.test.tsx
│       └── useTours.test.tsx
└── integration/
    └── live-backend.test.ts
```

---

## 🎯 ACTION PLAN

### Phase 1: Cleanup
1. ✅ Delete all .txt log files from root
2. ✅ Delete modal_screenshot.png
3. ✅ Delete integration test_error.log
4. ✅ Archive deprecated E2E tests

### Phase 2: Test Consolidation
1. ✅ Review and merge duplicate test files
2. ✅ Move to new folder structure (optional)
3. ✅ Update test inventory

### Phase 3: Documentation
1. ✅ Create complete test inventory (this file)
2. ✅ Update comprehensive_documentation.md
3. ✅ Archive/merge redundant docs
4. ✅ Create architecture diagrams
5. ✅ Document current MVP state

---

## ⚠️ DO NOT DELETE
- `node_modules/`
- `dist/`
- `playwright-report/` (current run)
- `test-results/` (current results)
- `BOOKINGMODAL_FIXES.md` (useful reference)
- `README.md`
- `verify_backend.js` (utility script)

---

**Next Steps**: 
1. Get user approval for cleanup
2. Execute cleanup safely
3. Create consolidated documentation
4. Update test inventory with current status
