# Firebase Project Configuration & Emulator Usage

**Last Updated**: November 25, 2025

---

## 🔥 Firebase Project Information

### Production Project 🟢
- **Project ID**: `nevadotrektest01`
- **Project Name**: Nevado Trek Test 01
- **Status**: Production/Live
- **API URL**: `https://api-wgfhwjbpva-uc.a.run.app`
- **Function URL**: `https://us-central1-nevadotrektest01.cloudfunctions.net/api`

> [!IMPORTANT]
> **`nevadotrektest01` IS THE PRODUCTION PROJECT** - Despite the "test" in the name, this is the live production environment that serves the actual API.

### Staging Project 🧪
- **Project ID**: `nevado-trek-backend-03`
- **Project Name**: nevado-trek-staging
- **Status**: Pre-Production / Testing
- **API URL**: `https://us-central1-nevado-trek-backend-03.cloudfunctions.net/api`
- **Admin Key**: `ntk_admin_staging_key_2026_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7`

### Project Configuration File
**Location**: `D:\Nevado Trek Development\nevado-trek-backend\.firebaserc`

```json
{
  "projects": {
    "default": "nevadotrektest01",
    "prod": "nevadotrektest01",
    "staging": "nevado-trek-backend-03"
  }
}
```

### Checking Current Project
```bash
# See which project is active
firebase use

# Switch environments
firebase use staging
firebase use prod
```

---

## 🧪 Firebase Emulators

### Purpose
Emulators allow local testing of Firebase Functions and Firestore without affecting production data.

### Starting Emulators
```bash
cd "D:\Nevado Trek Development\nevado-trek-backend\functions"
firebase emulators:start --project nevadotrektest01
```

**Emulator URLs:**
- Functions: `http://127.0.0.1:5001/nevadotrektest01/us-central1/api`
- Firestore: `http://127.0.0.1:8080`
- Emulator UI: `http://127.0.0.1:4000`

### Running Tests Against Emulators
```bash
# Execute test script while emulators are running
firebase emulators:exec "node test_complex_scenarios.js" --project nevadotrektest01
```

> [!TIP]
> Tests should use the emulator URL: `http://127.0.0.1:5001/nevadotrektest01/us-central1/api`

### Emulator vs Production
| Aspect | Emulators | Production |
|--------|-----------|------------|
| API URL | `http://127.0.0.1:5001/...` | `https://api-wgfhwjbpva-uc.a.run.app` |
| Data | Local/Temporary | Live/Persistent |
| Use Case | Testing | Live Users |
| Firestore | In-memory | Cloud Firestore |

---

## 🚀 Deployment Process

### Deploy Functions to Production
```bash
cd "D:\Nevado Trek Development\nevado-trek-backend"

# Verify active project
firebase use

# Deploy functions
firebase deploy --only functions
```

**Deployment Flow:**
1. Code changes made in `functions/src/`
2. Run local tests with emulators
3. Deploy to production with `firebase deploy`
4. Verify with production endpoint tests

### Typical Deployment Output
```
=== Deploying to 'nevadotrektest01'...

i  functions: preparing codebase default for deployment
✔  functions: functions source uploaded successfully
i  functions: updating Node.js 22 function api(us-central1)...
✔  functions[api(us-central1)] Successful update operation.

✔  Deploy complete!
```

---

## 📝 Environment Variables

### Local Development
**File**: `functions/.env.nevadotrektest01`

Contains configuration for local emulator testing.

### Production
Environment variables are configured in Firebase Console for the `nevadotrektest01` project.

---

## 🔑 Admin Authentication

**Admin Secret Key**: `ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7`

Used for all admin endpoint requests:
```javascript
headers: {
  'X-Admin-Secret-Key': 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7'
}
```

---

## 📂 Project Structure

```
nevado-trek-backend/
├── .firebaserc              # Project configuration (nevadotrektest01)
├── firebase.json            # Firebase hosting/functions config
├── functions/
│   ├── .env.nevadotrektest01   # Emulator environment variables
│   ├── index.js             # Main functions entry point
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Validation, auth
│   │   └── constants.js     # Shared constants
│   └── test_*.js            # Test scripts
└── Backend-docs/            # Documentation
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ Wrong: Trying to deploy to "nevadotrekprod"
```bash
firebase use nevadotrekprod  # ERROR: Project doesn't exist
```

### ✅ Correct: Deploy to nevadotrektest01
```bash
firebase use default  # Uses nevadotrektest01
firebase deploy --only functions
```

### ❌ Wrong: Testing against wrong URL
```javascript
const API_URL = 'https://some-other-url.com';  // Wrong!
```

### ✅ Correct: Use production URL
```javascript
const API_URL = 'https://api-wgfhwjbpva-uc.a.run.app';  // Correct!
```

---

## 📊 Quick Reference

| Task | Command |
|------|---------|
| Check active project | `firebase use` |
| Start emulators | `firebase emulators:start --project nevadotrektest01` |
| Run test with emulators | `firebase emulators:exec "node test_file.js" --project nevadotrektest01` |
| Deploy to production | `firebase deploy --only functions` |
| Test production API | `node test_prod_simple.js` |

---

## 🔗 Related Documentation

- [backend_status.md](./backend_status.md) - Current backend status and recent changes
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API endpoint documentation
