const firebase = require('firebase-admin');
const path = require('path');
const fs = require('fs');

async function testDatabaseConnection() {
  try {
    // Adjusted path to db_auth.json file
    const dbAuthPath = path.join(process.cwd(), 'db_auth.json');
    
    // Check if file exists
    if (!fs.existsSync(dbAuthPath)) {
      throw new Error('Database credentials file (db_auth.json) not found');
    }
    
    let app;
    try {
      // Initialize Firebase with the service account credentials
      const serviceAccount = require(dbAuthPath);
      app = firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount)
      }, 'test-connection');
      
      // Get Firestore instance
      const db = app.firestore();
      
      // Test connection by attempting to get a collection
      // This will throw an error if the connection fails
      await db.collection('test').limit(1).get();
      
      console.log('Database connection successful!');
      return true;
    } finally {
      // Clean up: delete the app to avoid credential conflicts
      if (app) {
        await app.delete();
      }
    }
  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    throw error;
  }
}

// Run the test
(async () => {
  try {
    await testDatabaseConnection();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();