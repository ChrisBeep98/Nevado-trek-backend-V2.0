/**
 * Migration Script: Update maxPax for all private departures
 * Changes maxPax from 99 to 8 for all existing private departures
 */

const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp({
    projectId: 'nevadotrektest01'
});

const db = admin.firestore();

async function migratePrivateDepartures() {
    console.log('\n🔄 Starting Migration: Update Private Departure maxPax\n');

    try {
        // Get all private departures with maxPax = 99
        const snapshot = await db.collection('departures')
            .where('type', '==', 'private')
            .where('maxPax', '==', 99)
            .get();

        console.log(`Found ${snapshot.size} private departures with maxPax=99\n`);

        if (snapshot.empty) {
            console.log('✅ No departures to migrate');
            return;
        }

        // Update in batches
        const batch = db.batch();
        let count = 0;

        snapshot.forEach(doc => {
            console.log(`Updating departure ${doc.id}: maxPax 99 → 8`);
            batch.update(doc.ref, { maxPax: 8 });
            count++;
        });

        await batch.commit();

        console.log(`\n✅ Successfully updated ${count} departures`);
        console.log('Migration complete!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

migratePrivateDepartures();
