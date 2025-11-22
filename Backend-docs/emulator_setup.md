# Firebase Emulators Setup Guide

**Last Updated**: 2025-11-22  
**Purpose**: Configure and run Firebase Emulators for local backend testing

---

## 📋 Prerequisites

### Required Software
1. **Node.js**: v22 or higher (v24 recommended)
2. **Java JDK**: Version 17+ (Version 21+ recommended for future compatibility)
   - Download: https://adoptium.net/
3. **Firebase CLI**: Latest version
   ```bash
   npm install -g firebase-tools
   ```

### Verify Installation
```bash
node --version    # Should be v22+
java -version     # Should be 17+
firebase --version
```

---

## 🔧 Initial Setup

### 1. Download Emulator Binaries

The Firebase emulators need to download Java binaries on first run.

```bash
cd "d:\Nevado Trek Development\nevado-trek-backend"

# Download Firestore emulator
firebase setup:emulators:firestore

# Functions emulator uses Node.js (no separate download needed)
```

**Expected Output**:
```
i  firestore: downloading cloud-firestore-emulator-v1.19.8.jar...
Progress: ============================> (100% of 64MB)
```

### 2. Verify Configuration

Check that `firebase.json` has emulator configuration:

```json
{
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true
    },
    "singleProjectMode": true
  }
}
```

---

## ▶️ Running Emulators

### Start Emulators (Interactive)

Start emulators and keep them running:

```bash
firebase emulators:start --only firestore,functions --project nevadotrektest01
```

**Expected Output**:
```
i  emulators: Starting emulators: functions, firestore
i  firestore: Firestore Emulator logging to firestore-debug.log
+  firestore: Firestore Emulator UI websocket is running on 9150.
+  functions: Loaded functions definitions from source: api.
+  functions[us-central1-api]: http function initialized 
   (http://127.0.0.1:5001/nevadotrektest01/us-central1/api).

┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000                │
└─────────────────────────────────────────────────────────────┘
```

**Emulator URLs**:
- **API**: http://localhost:5001/nevadotrektest01/us-central1/api
- **Firestore**: http://localhost:8080
- **Emulator UI**: http://localhost:4000

### Start Emulators & Run Tests (One Command)

Run tests and automatically shutdown emulators after:

```bash
firebase emulators:exec --project nevadotrektest01 "node functions/test_emulator.js"
```

This command:
1. ✅ Starts emulators
2. ✅ Waits for them to be ready
3. ✅ Runs your test script
4. ✅ Shuts down emulators automatically
5. ✅ Returns test exit code

---

## 🧪 Testing with Emulators

### Emulator Test Script

**Location**: `functions/test_emulator.js`

**Key Differences from Production Tests**:
```javascript
// Emulator URL (local)
const API_URL = 'http://localhost:5001/nevadotrektest01/us-central1/api';

// Must use real admin key (loaded from .env.nevadotrektest01)
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
```

### Run Emulator Tests

**Option 1: Manual (emulators stay running)**
```bash
# Terminal 1 - Start emulators
firebase emulators:start --only firestore,functions

# Terminal 2 - Run tests
node functions/test_emulator.js
```

**Option 2: Automatic (recommended)**
```bash
firebase emulators:exec --project nevadotrektest01 "node functions/test_emulator.js"
```

### Expected Test Output

```
================================================================================
EMULATOR BOOKING ENDPOINTS TEST
================================================================================

📋 SETUP: Creating Tour
   ✅ Tour created: 1FgPPnPVJOAx2nQyjq15

TEST 1: joinBooking Type Field
✅ 1.1 Public booking has type field
✅ 1.2 Public booking type = PUBLIC

TEST 2: Convert Booking Type Field Update
✅ 2.1 Booking type changed to PRIVATE

TEST 3: Price Recalculation on Tour Update
✅ 3.1 Price recalculated correctly

================================================================================
TEST SUMMARY
================================================================================
✅ Passed: 4
❌ Failed: 0
================================================================================
```

---

## 🔑 Authentication with Emulators

### Admin Key Handling

Emulators **DO NOT** bypass authentication. You must use a valid admin key.

**Option 1: Environment File** (Recommended)
Create `.env.nevadotrektest01`:
```bash
ADMIN_SECRET_KEY=ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7
```

**Option 2: Hardcode in Test Script**
```javascript
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
```

---

## 🐛 Troubleshooting

### Issue: "No emulators to start"
**Error**: `Error: No emulators to start, run firebase init emulators to get started.`

**Cause**: Emulator binaries not downloaded or `firebase.json` missing config

**Fix**:
```bash
# Download binaries
firebase setup:emulators:firestore

# Verify firebase.json has emulators config (see above)
```

---

### Issue: "Invalid or missing admin secret key"
**Error**: `401 UNAUTHORIZED - Invalid or missing admin secret key`

**Cause**: Test script using wrong admin key

**Fix**: Ensure test script uses production admin key:
```javascript
const ADMIN_KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';
```

---

### Issue: Java version warning
**Warning**: `firebase-tools will drop support for Java version < 21`

**Cause**: Using Java 17 (still works but will be deprecated)

**Fix**: Upgrade to Java 21+
```bash
# Windows (using Chocolatey)
choco install openjdk21

# macOS (using Homebrew)
brew install openjdk@21

# Linux (using apt)
sudo apt install openjdk-21-jdk
```

---

### Issue: Port already in use
**Error**: `Port 5001 is already in use`

**Cause**: Another process using emulator ports

**Fix**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5001 | xargs kill -9
```

Or change ports in `firebase.json`:
```json
{
  "emulators": {
    "functions": { "port": 5002 },
    "firestore": { "port": 8081 }
  }
}
```

---

### Issue: Tests fail with connection errors
**Error**: `ECONNREFUSED 127.0.0.1:5001`

**Cause**: Emulators not fully started before tests run

**Fix**: Add wait time in test script:
```javascript
async function runTests() {
    // Wait for emulators to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ... rest of tests
}
```

---

## 📊 Emulator UI

The Emulator UI provides a web interface to inspect data.

**Access**: http://localhost:4000

**Features**:
- 📄 View Firestore collections and documents
- 🔍 Inspect function logs in real-time
- 🧪 Manually trigger functions
- 🗑️ Clear all emulator data

---

## 🔄 Data Persistence

**Default**: Emulator data is cleared on shutdown

**Enable Persistence** (optional):
```bash
firebase emulators:start --only firestore,functions --import=./emulator-data --export-on-exit=./emulator-data
```

This will:
- Import data from `./emulator-data` on start
- Export data to `./emulator-data` on shutdown

---

## ✅ Best Practices

1. **Always use `emulators:exec` for automated testing** - Ensures clean state
2. **Use separate test data** - Don't rely on production data structures
3. **Clear data between test runs** - Restart emulators or use `--import/--export`
4. **Test auth logic** - Don't bypass authentication even in emulators
5. **Monitor emulator logs** - Check `firestore-debug.log` for issues

---

## 📚 Additional Resources

- [Firebase Emulator Suite Docs](https://firebase.google.com/docs/emulator-suite)
- [Local Testing Guide](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)
- [Emulator UI Reference](https://firebase.google.com/docs/emulator-suite/install_and_configure#emulator_ui)

---

**Next Steps**: 
- See [`backend_status.md`](./backend_status.md) for current backend state
- See [`booking_logic_fixes_2025-11-22.md`](./booking_logic_fixes_2025-11-22.md) for recent fixes
