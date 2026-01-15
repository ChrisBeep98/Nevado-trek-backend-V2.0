const axios = require('axios');

async function testExternalWebhook() {
    console.log('📡 Testeando Webhook desde Internet (Como si fuera Bold)...');
    try {
        const response = await axios.post('https://api-6ups4cehla-uc.a.run.app/public/payments/webhook', {
            payment_status: "APPROVED",
            reference: "NTK-uoGI9AnsVvB4mkXTMeFS-TEST-EXTERNAL",
            tx_id: "EXTERNAL-TEST-001"
        });
        console.log('✅ Respuesta:', response.status, response.data);
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.status : error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
}

testExternalWebhook();
