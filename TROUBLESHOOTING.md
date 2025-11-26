# Complete Troubleshooting Guide

**Version**: 1.0  
**Last Updated**: November 25, 2025  
**Target Audience**: Developers, Support Team

---

## 📚 CONTENIDOS

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Integration Issues](#integration-issues)
4. [E2E Test Issues](#e2e-test-issues)
5. [Deployment Issues](#deployment-issues)
6. [Performance Issues](#performance-issues)

---

## 🔧 BACKEND ISSUES

### Problem: 401 Unauthorized on all admin endpoints

**Symptoms**:
```json
Response: { "error": "Unauthorized" }
Status: 401
```

**Possible Causes**:
1. ❌ Missing `X-Admin-Secret-Key` header
2. ❌ Incorrect admin key value
3. ❌ Headers not sent properly

**Solutions**:

**Check 1**: Verify header is sent
```javascript
// In axios instance
api.interceptors.request.use((config) => {
  console.log('Headers:', config.headers);
  // Should see: X-Admin-Secret-Key: nevadotrek2025
  return config;
});
```

**Check 2**: Verify admin key
```bash
# Check Firebase config
firebase functions:config:get

# Should return:
# {
#   "admin": {
#     "key": "nevadotrek2025"
#   }
# }
```

**Check 3**: Test with cURL
```bash
curl -X GET \
  https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/tours \
  -H "X-Admin-Secret-Key: nevadotrek2025"
  
# Should return tours, not 401
```

**Fix**:
```typescript
// Ensure interceptor is set BEFORE any requests
const api = axios.create({
  baseURL: 'https://...'
});

api.interceptors.request.use((config) => {
  const key = localStorage.getItem('adminKey');
  if (key) {
    config.headers['X-Admin-Secret-Key'] = key;
  }
  return config;
});

export default api;
```

---

### Problem: "Invalid or missing 'tourId'" when joining departure

**Symptoms**:
```json
POST /admin/bookings/join
Response: { "error": "Invalid or missing 'tourId'" }
Status: 400
```

**Root Cause**: Validation middleware requires tourId even when departureId is provided

**Solution**: Update to v2.6 backend

```bash
# Check backend version
curl https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/stats \
  -H "X-Admin-Secret-Key: nevadotrek2025"
  
# Verify validation.js includes:
# if (!departureId) {
#   // Only require tourId if NOT joining
# }
```

**Workaround** (if stuck on old version):
```javascript
// Send tourId even when joining
const payload = {
  departureId: 'dep_123',
  tourId: 'tour_456',  // Include this
  pax: 2,
  customer: { ... }
};
```

---

### Problem: "Not enough capacity" but UI shows space available

**Symptoms**:
```json
Response: { "error": "Not enough capacity. Only 2 space(s) available" }
But UI shows: 6/8 pax (should have 2 spaces)
```

**Root Cause**: Race condition - currentPax not updated yet

**Debug Steps**:

1. Check actual currentPax in database:
```javascript
// In Firebase Console
db.collection('departures').doc('dep_xyz').get()
  .then(doc => console.log('currentPax:', doc.data().currentPax));
```

2. Verify calculation:
```
maxPax = 8
currentPax = 6
New booking pax = 3
Result: 6 + 3 = 9 > 8 ❌
```

**Solution**: Frontend should validate BEFORE submitting

```typescript
const handleSubmit = (data) => {
  // Validate capacity
  const availableSpace = departure.maxPax - departure.currentPax;
  if (data.pax > availableSpace) {
    alert(`Only ${availableSpace} space(s) available`);
    return;
  }
  
  // Proceed with submission
  createBooking.mutate(data);
};
```

---

### Problem: Ghost departures (empty departures not deleted)

**Symptoms**:
- Departures with `currentPax: 0` remain in database
- Calendar shows empty departures

**Expected Behavior** (v2.3+): Auto-delete when currentPax drops to 0

**Check Version**:
```javascript
// In bookings.controller.js, check for:
if (departure.currentPax === 0) {
  await t.delete(departureRef);
}
```

**Manual Cleanup**:
```javascript
// Run in Firebase Console or script
const db = admin.firestore();
const snapshot = await db.collection('departures')
  .where('currentPax', '==', 0)
  .get();

snapshot.docs.forEach(doc => {
  console.log('Deleting ghost departure:', doc.id);
  doc.ref.delete();
});
```

---

## 💻 FRONTEND ISSUES

### Problem: "Cannot read property 'name' of undefined"

**Symptoms**:
```
TypeError: Cannot read property 'name' of undefined
at BookingModal.tsx:123
```

**Root Cause**: Data not loaded yet, but component tries to access it

**Debug**:
```typescript
console.log('booking:', booking);
console.log('departure:', departure);
console.log('tour:', tour);

// One of these is undefined
```

**Solution**: Add loading state

```typescript
if (isLoadingBooking || isLoadingDeparture || isLoadingTour) {
  return <div>Loading...</div>;
}

if (!booking || !departure || !tour) {
  return <div>Data not found</div>;
}

// Now safe to access booking.customer.name
```

**Better Solution**: Optional chaining

```typescript
<div>{booking?.customer?.name ?? 'N/A'}</div>
```

---

### Problem: Form validation not working

**Symptoms**:
- Form submits with empty fields
- No error messages shown

**Check 1**: Zod schema correct?

```typescript
const schema = z.object({
  email: z.string().email('Invalid email'), // ✅ Good
  pax: z.number().min(1, 'Min 1'),          // ✅ Good
});
```

**Check 2**: Resolver configured?

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema), // ✅ Must have this
});
```

**Check 3**: Errors displayed?

```typescript
<input {...register('email')} />
{errors.email && <span className="error">{errors.email.message}</span>}
```

**Check 4**: Submit handler attached?

```typescript
<form onSubmit={handleSubmit(onSubmit)}> {/* ✅ Must wrap */}
  {/* Form fields */}
  <button type="submit">Submit</button>
</form>
```

---

### Problem: Modal not opening

**Symptoms**:
- Click button, nothing happens
- No errors in console

**Debug Steps**:

1. Check modal state:
```typescript
const [isOpen, setIsOpen] = useState(false);

console.log('isOpen:', isOpen); // Should change to true on click
```

2. Check button handler:
```typescript
<button onClick={() => {
  console.log('Button clicked'); // Does this log?
  setIsOpen(true);
}}>
  Open Modal
</button>
```

3. Check modal component:
```typescript
<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  {/* Content */}
</Dialog.Root>
```

**Common Mistakes**:

❌ **Wrong**:
```typescript
<button onClick={setIsOpen(true)}>Open</button>
// This calls setIsOpen immediately, not on click
```

✅ **Correct**:
```typescript
<button onClick={() => setIsOpen(true)}>Open</button>
```

---

### Problem: React Query data not updating

**Symptoms**:
- Make change (update booking)
- UI doesn't reflect change
- Refresh page → change appears

**Root Cause**: Queries not invalidated after mutation

**Solution**: Add invalidation

```typescript
const updateBooking = useMutation({
  mutationFn: bookingsService.update,
  onSuccess: (data, variables) => {
    // MUST invalidate related queries
    queryClient.invalidateQueries(['bookings']);
    queryClient.invalidateQueries(['booking', variables.id]);
    queryClient.invalidateQueries(['departures']);
  },
});
```

**Check invalidation is working**:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Log all queries
console.log('All queries:', queryClient.getQueryCache().getAll());

// Check specific query
const bookingsQuery = queryClient.getQueryState(['bookings']);
console.log('Bookings query:', bookingsQuery);
```

---

## 🔗 INTEGRATION ISSUES

### Problem: CORS error

**Symptoms**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Backend Check**:
```javascript
// In functions/index.js
const cors = require('cors');
app.use(cors({ origin: true })); // ✅ Must have this
```

**Frontend Check**:
```typescript
// Verify baseURL is correct
const api = axios.create({
  baseURL: 'https://us-central1-nevadotrektest01.cloudfunctions.net/api'
  // ❌ NOT: http://localhost:5001/...
});
```

**Development Fix**:
```javascript
// For local development, use Firebase emulators
// functions/index.js
if (process.env.FUNCTIONS_EMULATOR) {
  app.use(cors({ origin: '*' }));
} else {
  app.use(cors({ origin: true }));
}
```

---

### Problem: Data mismatch between frontend and backend

**Symptoms**:
- Frontend shows 6 pax
- Backend shows 4 pax
- Values out of sync

**Debug**:

1. Check frontend data:
```typescript
const { data: booking } = useBooking(id);
console.log('Frontend booking:', booking);
```

2. Check backend data:
```bash
curl https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/bookings/{id} \
  -H "X-Admin-Secret-Key: nevadotrek2025"
```

3. Check database directly:
```javascript
// Firebase Console
db.collection('bookings').doc(id).get()
  .then(doc => console.log('DB booking:', doc.data()));
```

**Solution**: Clear React Query cache

```typescript
queryClient.clear(); // Nuclear option - clears ALL
// or
queryClient.invalidateQueries(['booking', id]); // Specific
```

---

## 🧪 E2E TEST ISSUES

### Problem: Tests timing out

**Symptoms**:
```
Error: Test timeout of 30000ms exceeded
at calendar.spec.ts:25
```

**Solutions**:

**1. Increase timeout** (playwright.config.ts):
```typescript
export default defineConfig({
  timeout: 60000, // 60 seconds
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
});
```

**2. Use better waits**:
```typescript
// ❌ Bad: Fixed timeout
await page.waitForTimeout(5000);

// ✅ Good: Wait for specific condition
await page.waitForSelector('[data-testid="departure-card"]', { timeout: 10000 });
await expect(page.locator('[data-testid="modal"]')).toBeVisible({ timeout: 5000 });
```

**3. Wait for network idle**:
```typescript
await page.goto('http://localhost:5173');
await page.waitForLoadState('networkidle');
```

---

### Problem: Element not found

**Symptoms**:
```
Error: Element not found: [data-testid="submit-button"]
```

**Debug Steps**:

1. Take screenshot:
```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

2. Log page content:
```typescript
const content = await page.content();
console.log('HTML:', content);
```

3. Check if element exists:
```typescript
const button = page.locator('[data-testid="submit-button"]');
console.log('Button count:', await button.count()); // Should be > 0
```

**Solutions**:

**1. Element not loaded yet**:
```typescript
await button.waitFor({ state: 'visible', timeout: 5000 });
await button.click();
```

**2. Wrong selector**:
```typescript
// Check actual testid in component
<button data-testid="btn-submit"> {/* Note: btn-submit, not submit-button */}

// Update test
const button = page.locator('[data-testid="btn-submit"]');
```

**3. Element hidden**:
```typescript
// Check visibility
const isVisible = await button.isVisible();
console.log('Is visible:', isVisible);

// Force click if needed
await button.click({ force: true }); // Last resort
```

---

### Problem: Test passing locally, failing in CI

**Common Causes**:

1. **Timing differences**:
```typescript
// CI is slower, need more generous timeouts
const timeout = process.env.CI ? 10000 : 5000;
await page.waitForSelector('...', { timeout });
```

2. **Environment differences**:
```typescript
// Different base URL in CI
const baseURL = process.env.CI 
  ? 'https://staging.example.com'
  : 'http://localhost:5173';
```

3. **Data dependencies**:
```typescript
// Test assumes specific data exists
// ❌ Bad: Assumes tour_123 exists
await page.selectOption('tourId', 'tour_123');

// ✅ Good: Create test data first
const tour = await createTestTour();
await page.selectOption('tourId', tour.id);
```

---

## 🚀 DEPLOYMENT ISSUES

### Problem: "Function deployment failed"

**Symptoms**:
```bash
$ firebase deploy --only functions
Error: Failed to deploy functions
```

**Check 1**: Dependencies installed?

```bash
cd functions
npm install
```

**Check 2**: Linting passing?

```bash
npm run lint
# Fix any errors before deploying
```

**Check 3**: Node version correct?

```json
// functions/package.json
{
  "engines": {
    "node": "18" // Must match
  }
}
```

**Check 4**: Firebase project set?

```bash
firebase use nevadotrektest01
firebase deploy --only functions
```

---

### Problem: Functions deployed but returning 500

**Debug**:

1. Check logs:
```bash
firebase functions:log --only api
```

2. Look for errors:
```
Error: Cannot find module 'express'
```

3. Install missing dependencies:
```bash
cd functions
npm install express cors firebase-admin
```

4. Redeploy:
```bash
firebase deploy --only functions
```

---

## ⚡ PERFORMANCE ISSUES

### Problem: Slow page load

**Debug**:

1. Check network tab:
- Which requests are slow?
- Any failed requests?
- Total load time?

2. Check React Query cache:
```typescript
// Are we re-fetching unnecessarily?
const { data, isFetching } = useQuery({
  queryKey: ['tours'],
  queryFn: fetchTours,
  staleTime: 5 * 60 * 1000, // ✅ Cache for 5 minutes
});
```

3. Check component re-renders:
```typescript
// Add to component
useEffect(() => {
  console.log('Component rendered');
});
```

**Solutions**:

**1. Optimize queries**:
```typescript
// ❌ Bad: Fetch all, filter client-side
const { data: allTours } = useTours();
const activeTours = allTours?.filter(t => t.isActive);

// ✅ Good: Filter server-side
const { data: activeTours } = useTours({ isActive: true });
```

**2. Memoize expensive calculations**:
```typescript
import { useMemo } from 'react';

const sortedBookings = useMemo(() => {
  return bookings?.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [bookings]);
```

**3. Lazy load images**:
```typescript
<img 
  src={tour.image} 
  loading="lazy" 
  alt={tour.name.es} 
/>
```

---

## 🆘 EMERGENCY PROCEDURES

### Rollback Deployment

```bash
# List previous deployments
firebase functions:log

# Rollback to previous version
firebase deploy --only functions --force
```

### Clear All Caches

```typescript
// Frontend
queryClient.clear();
localStorage.clear();
location.reload();
```

### Database Backup

```bash
# Export Firestore
gcloud firestore export gs://nevadotrektest01.appspot.com/backups/$(date +%Y%m%d)
```

### Check System Health

```bash
# 1. Backend health
curl https://us-central1-nevadotrektest01.cloudfunctions.net/api/admin/stats \
  -H "X-Admin-Secret-Key: nevadotrek2025"

# 2. Database connectivity
# Firebase Console → Firestore → Check reads/writes

# 3. Frontend build
cd admin-dashboard
npm run build
# Should complete without errors
```

---

## 📞 Getting Help

### Search Order

1. **This guide** - Most common issues covered
2. **Code comments** - Check inline documentation
3. **Git history** - `git log` for recent changes
4. **Stack Overflow** - Search error message
5. **Discord/Slack** - Ask team

### Providing Debug Info

When asking for help, include:

1. **Error message** (full text)
2. **Steps to reproduce**
3. **Screenshots** (if UI issue)
4. **Console logs** (frontend)
5. **Function logs** (backend)
6. **Environment** (dev/staging/prod)
7. **What you've tried**

---

**Document**: Complete Troubleshooting Guide  
**Version**: 1.0  
**Last Updated**: November 25, 2025
