const admin = require('firebase-admin');

// Initialize Firebase Admin with project ID
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'nevadotrektest01'
    });
}

const db = admin.firestore();

/**
 * Cleanup script - Removes all departures and bookings
 * Preserves tours for testing
 */
async function cleanupTestData() {
    console.log('🧹 Starting cleanup...');

    try {
        // Delete all bookings
        console.log('Deleting bookings...');
        const bookingsSnapshot = await db.collection('bookings').get();
        const bookingBatch = db.batch();
        let bookingCount = 0;

        bookingsSnapshot.forEach(doc => {
            bookingBatch.delete(doc.ref);
            bookingCount++;
        });

        await bookingBatch.commit();
        console.log(`✅ Deleted ${bookingCount} bookings`);

        // Delete all departures
        console.log('Deleting departures...');
        const departuresSnapshot = await db.collection('departures').get();
        const departureBatch = db.batch();
        let departureCount = 0;

        departuresSnapshot.forEach(doc => {
            departureBatch.delete(doc.ref);
            departureCount++;
        });

        await departureBatch.commit();
        console.log(`✅ Deleted ${departureCount} departures`);

        console.log('✅ Cleanup complete!');
        console.log(`Total removed: ${bookingCount} bookings + ${departureCount} departures`);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Run cleanup
cleanupTestData()
    .then(() => {
        console.log('🎉 Database cleaned successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Error:', error);
        process.exit(1);
    });
