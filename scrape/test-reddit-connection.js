const snoowrap = require('snoowrap');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
let envFilePath = '';

for (const arg of args) {
  if (arg.startsWith('--env-file=')) {
    envFilePath = arg.replace('--env-file=', '');
  }
}

// Load environment variables from specified file
if (envFilePath && fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  dotenv.config();
}

async function testRedditConnection() {
  const client_id = process.env.REDDIT_CLIENT_ID;
  const client_secret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;
  
  console.log(`Testing connection with client ID: ${client_id}`);
  
  // Check if all required credentials are present
  if (!client_id || !client_secret || !username || !password) {
    throw new Error("Missing required Reddit API credentials in environment variables");
  }
  
  try {
    // Create Reddit client using snoowrap (the JavaScript wrapper for Reddit API)
    const reddit = new snoowrap({
      userAgent: 'SentimentJester/1.0 Testing',
      clientId: client_id,
      clientSecret: client_secret,
      username: username,
      password: password
    });
    
    // Test connection by fetching the user's profile
    const me = await reddit.getMe();
    console.log(`Connection successful! Authenticated as ${me.name}`);
    return true;
  } catch (error) {
    console.error(`Reddit connection failed: ${error.message}`);
    throw error;
  }
}

// Run the test
(async () => {
  try {
    await testRedditConnection();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();