const axios = require("axios");

/**
 * Send a message to the Admin via Telegram
 * @param {string} message - The message content (supports HTML)
 */
async function sendTelegramAlert(message) {
  // Try to get config from environment variables
  // In Firebase Gen 2, these should be set via secrets or .env files
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("⚠️ [TELEGRAM] Skipping notification: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });
    console.log("✅ [TELEGRAM] Notification sent successfully.");
  } catch (error) {
    console.error("❌ [TELEGRAM ERROR] Failed to send notification:", error.message);
  }
}

module.exports = { sendTelegramAlert };
