const { TwitterApi } = require('twitter-api-v2');
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
  const apiKey = process.env.X_API_KEY;
  const apiKeySecret = process.env.X_API_KEY_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  
  // Check if all required credentials are present
  if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
    throw new Error("Missing required Twitter API credentials in environment variables");
  }
  
  try {
    // Create Twitter client using twitter-api-v2
    const twitterClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiKeySecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
    
    // Test connection by verifying credentials
    const currentUser = await twitterClient.v2.me();
    console.log(`Connection successful! Authenticated as @${currentUser.data.username}`);
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