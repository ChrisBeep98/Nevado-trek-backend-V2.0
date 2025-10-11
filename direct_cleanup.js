// Direct Firestore cleanup script
// This will directly delete documents from your Firestore collections

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to use your service account key for this to work
const serviceAccount = require('./adminkey.md.gitignore'); // Update this path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteCollection(collectionName) {
  console.log(`Starting to delete all documents from collection: ${collectionName}`);
  
  let deletedCount = 0;
  
  try {
    // Get all documents in the collection
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`Collection ${collectionName} is already empty`);
      return deletedCount;
    }
    
    console.log(`Found ${snapshot.size} documents in ${collectionName} collection`);
    
    // Delete each document
    for (const doc of snapshot.docs) {
      await db.collection(collectionName).doc(doc.id).delete();
      deletedCount++;
      console.log(`Deleted document: ${doc.id} from ${collectionName}`);
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Successfully deleted ${deletedCount} documents from ${collectionName}`);
  } catch (error) {
    console.error(`Error deleting from collection ${collectionName}:`, error);
  }
  
  return deletedCount;
}

async function main() {
  console.log('Starting direct Firestore cleanup...');
  
  const collections = ['tours', 'tourEvents', 'bookings', 'rateLimiter'];
  let totalDeleted = 0;
  
  for (const collection of collections) {
    const deletedCount = await deleteCollection(collection);
    totalDeleted += deletedCount;
  }
  
  console.log(`\nCleanup completed! Total documents deleted: ${totalDeleted}`);
  console.log('All test data has been removed from your Firestore database.');
}

// Handle error if service account file doesn't exist
if (require.main === module) {
  main().catch(error => {
    console.error('Error during cleanup:', error);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: Service account key file not found!');
      console.error('Please make sure you have a service account key file and update the path in this script.');
      console.error('You can download a service account key from Firebase Console > Project Settings > Service Accounts');
    }
  });
}