# Telegram Notification System Integration

**Version**: v1.0  
**Implemented**: January 18, 2026  
**Status**: 🟢 Active in Staging  

---

## 🎯 Overview

The backend now includes a lightweight notification system that sends real-time alerts to the Administrator's Telegram via a dedicated bot. This bypasses the complexity and costs of WhatsApp Business API while providing reliable, instant alerts.

## ⚙️ Configuration

The system relies on two environment variables (Google Cloud Secrets in Gen 2 functions).

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | The API Token provided by @BotFather | `123456:ABC-Def...` |
| `TELEGRAM_CHAT_ID` | The numeric ID of the admin user | `6331979725` |

### How to obtain credentials

1.  **Bot Token**:
    *   Chat with **@BotFather** on Telegram.
    *   Send `/newbot`.
    *   Copy the token provided.
2.  **Chat ID**:
    *   Start a chat with your new bot (Click **Start**).
    *   Chat with **@userinfobot**.
    *   Copy the `Id` provided.

### Setting Secrets in Firebase

```bash
cd functions
firebase functions:secrets:set TELEGRAM_BOT_TOKEN
firebase functions:secrets:set TELEGRAM_CHAT_ID
```

---

## 🚀 Trigger Points

Notifications are triggered in the following events:

### 1. New Booking (Admin)
*   **Trigger**: `POST /admin/bookings`
*   **Info**: Customer Name, Phone, Tour Name, Pax, Date.
*   **Status**: Pending payment.

### 2. New Booking (Public Join)
*   **Trigger**: `POST /public/bookings/join`
*   **Info**: Customer Name, Tour Name (fetched via relation), Date.
*   **Context**: Joining an existing group.

### 3. New Booking (Public Private)
*   **Trigger**: `POST /public/bookings/private`
*   **Info**: Customer Name, Tour Name, Requested Date.
*   **Context**: Requesting a new private departure.

### 4. Payment Received (Bold)
*   **Trigger**: `POST /public/payments/webhook`
*   **Condition**: Only when `paymentStatus === 'paid'` (Approved).
*   **Enrichment**: The system fetches the `booking` document to include the **Customer Name** and **Booking ID** in the payment alert, linking the money to the person.

---

## 💻 Code Implementation

**File**: `functions/src/utils/notifications.js`

```javascript
const axios = require("axios");

async function sendTelegramAlert(message) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
}
```

**Usage Example:**

```javascript
const { sendTelegramAlert } = require("../utils/notifications");

// Inside controller
const alertMsg = `🚀 <b>New Booking</b>\n👤 ${customer.name}`;
sendTelegramAlert(alertMsg).catch(console.error);
```

---

## ⚠️ Known Behaviors

*   **Non-Blocking**: The alerts are sent asynchronously (`.catch(console.error)`) so they do **not** slow down the API response time for the user.
*   **Fail-Safe**: If Telegram API fails, the error is logged but the Booking/Payment process completes successfully.
