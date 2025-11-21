const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const SECRET_FILE_PATH = path.resolve(__dirname, 'secret_value.txt');

async function debugStats() {
    let ADMIN_KEY;
    try {
        if (fs.existsSync(SECRET_FILE_PATH)) {
            ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();
            console.log(`✓ Loaded ADMIN_KEY. Length: ${ADMIN_KEY.length}`);
        } else {
            console.error('❌ Secret file NOT FOUND at:', SECRET_FILE_PATH);
            return;
        }
    } catch (e) {
        console.error('Error reading secret file:', e);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            headers: {
                'X-Admin-Secret-Key': ADMIN_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        const text = await response.text();
        console.log('Response Body:', text);
    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

debugStats();
