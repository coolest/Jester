const asyncpraw = require('asyncpraw');
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
  const client_username = process.env.REDDIT_USERNAME;
  const client_password = process.env.REDDIT_PASSWORD;
  
  // Check if all required credentials are present
  if (!client_id || !client_secret || !client_username || !client_password) {
    throw new Error("Missing required Reddit API credentials in environment variables");
  }
  
  let reddit = null;
  
  try {
    // Create Reddit client
    reddit = new asyncpraw.Reddit({
      client_id: client_id,
      client_secret: client_secret,
      password: client_password,
      username: client_username,
      user_agent: 'SentimentJester/1.0 Testing'
    });
    
    // Test connection by fetching the user's profile
    const me = await reddit.user.me();
    console.log(`Connection successful! Authenticated as ${me.name}`);
    return true;
  } catch (error) {
    console.error(`Reddit connection failed: ${error.message}`);
    throw error;
  } finally {
    // Close the Reddit client if it was created
    if (reddit) {
      await reddit.close();
    }
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