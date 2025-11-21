const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const SECRET_FILE_PATH = path.resolve(__dirname, 'secret_value.txt');

async function testBookingsEndpoint() {
    let ADMIN_KEY;
    try {
        if (fs.existsSync(SECRET_FILE_PATH)) {
            ADMIN_KEY = fs.readFileSync(SECRET_FILE_PATH, 'utf-8').trim();
            console.log(`✓ Loaded ADMIN_KEY`);
        } else {
            console.error('❌ Secret file NOT FOUND');
            return;
        }
    } catch (e) {
        console.error('Error reading secret file:', e);
        return;
    }

    const headers = {
        'X-Admin-Secret-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
    };

    console.log('\n=== Testing GET /admin/bookings with full details ===');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, { headers });
        console.log(`Status: ${response.status}`);
        console.log(`Status Text: ${response.statusText}`);
        console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log(`Response Body:`, text);

        if (response.status === 404) {
            console.log('\n❌ 404 Error - Endpoint not found');
            console.log('This suggests the route is not registered or the function is not deployed correctly');
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testBookingsEndpoint();
