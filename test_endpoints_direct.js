const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://api-wgfhwjbpva-uc.a.run.app';
const SECRET_FILE_PATH = path.resolve(__dirname, 'secret_value.txt');

async function testEndpoints() {
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

    const headers = {
        'X-Admin-Secret-Key': ADMIN_KEY,
        'Content-Type': 'application/json'
    };

    console.log('\n=== Testing GET /admin/stats ===');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Testing GET /admin/bookings ===');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/bookings`, { headers });
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Response: ${data.length} bookings found`);
        if (data.length > 0) {
            console.log('First booking:', JSON.stringify(data[0], null, 2));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Testing GET /admin/tours ===');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/tours`, { headers });
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Response: ${data.length} tours found`);
    } catch (error) {
        console.error('Error:', error.message);
    }

    console.log('\n=== Testing GET /admin/departures ===');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/departures`, { headers });
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Response: ${data.length} departures found`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testEndpoints();
