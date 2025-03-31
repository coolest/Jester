const tweepy = require('tweepy');
const dotenv = require('dotenv');
const fs = require('fs');

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

async function testTwitterConnection() {
  // Get credentials from environment variables
  const consumer_key = process.env.X_API_KEY;
  const consumer_secret = process.env.X_API_KEY_SECRET;
  const access_token = process.env.X_ACCESS_TOKEN;
  const access_token_secret = process.env.X_ACCESS_TOKEN_SECRET;
  
  // Check if all required credentials are present
  if (!consumer_key || !consumer_secret || !access_token || !access_token_secret) {
    throw new Error("Missing required Twitter API credentials in environment variables");
  }
  
  try {
    // Create Twitter client
    const auth = new tweepy.OAuth1UserHandler(
      consumer_key, consumer_secret,
      access_token, access_token_secret
    );
    
    const api = new tweepy.API(auth);
    
    // Test connection by verifying credentials
    const user = await api.verify_credentials();
    console.log(`Connection successful! Authenticated as @${user.screen_name}`);
    return true;
  } catch (error) {
    console.error(`Twitter connection failed: ${error.message}`);
    throw error;
  }
}

// Run the test
(async () => {
  try {
    await testTwitterConnection();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();