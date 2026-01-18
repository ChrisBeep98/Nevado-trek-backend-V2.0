const { sendTelegramAlert } = require('./src/utils/notifications');

async function test() {
  console.log("🚀 Enviando mensaje de prueba a Telegram...");
  await sendTelegramAlert("👋 <b>Hola Chris!</b>\n\nEsta es una prueba de conexión desde el Backend de Nevado Trek.\nSi lees esto, las notificaciones están funcionando correctamente. ✅");
}

test();
