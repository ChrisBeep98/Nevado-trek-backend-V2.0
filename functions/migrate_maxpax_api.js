const axios = require('axios');

const API = 'https://api-wgfhwjbpva-uc.a.run.app';
const KEY = 'ntk_admin_prod_key_2025_x8K9mP3nR7wE5vJ2hQ9zY4cA6bL8sD1fG5jH3mN0pX7';

async function migrateViaAPI() {
    console.log('\n🔄 Migrating Private Departures: maxPax 99 → 8\n');

    try {
        // Get all departures
        const res = await axios.get(`${API}/admin/departures?startDate=2020-01-01&endDate=2030-12-31`, {
            headers: { 'X-Admin-Secret-Key': KEY }
        });

        console.log(`Found ${res.data.length} total departures`);

        const privateWithOldMax = res.data.filter(dep =>
            dep.type === 'private' && dep.maxPax === 99
        );

        console.log(`Found ${privateWithOldMax.length} private departures with maxPax=99\n`);

        if (privateWithOldMax.length === 0) {
            console.log('✅ No departures to migrate');
            return;
        }

        let updated = 0;
        for (const dep of privateWithOldMax) {
            console.log(`Updating ${dep.departureId}: maxPax 99 → 8`);

            await axios.put(`${API}/admin/departures/${dep.departureId}`, {
                maxPax: 8
            }, {
                headers: { 'X-Admin-Secret-Key': KEY }
            });

            updated++;
        }

        console.log(`\n✅ Successfully updated ${updated} departures`);

    } catch (error) {
        console.error('❌ Migration failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

migrateViaAPI();
