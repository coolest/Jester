const { google } = require('googleapis');
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

async function testYoutubeConnection() {
  // Get API key from environment variables
  const apiKey = process.env.YT_KEY;
  
  // Check if API key is present
  if (!apiKey) {
    throw new Error("Missing required YouTube API key in environment variables");
  }
  
  try {
    // Create YouTube client using googleapis
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey
    });
    
    // Test connection by making a simple API call
    const response = await youtube.videos.list({
      part: 'snippet',
      chart: 'mostPopular',
      regionCode: 'US',
      maxResults: 1
    });
    
    // Check if we got a valid response
    if (response.data && response.data.items && response.data.items.length > 0) {
      const videoTitle = response.data.items[0].snippet.title;
      console.log(`Connection successful! Retrieved video: "${videoTitle}"`);
      return true;
    } else {
      throw new Error("Received empty response from YouTube API");
    }
  } catch (error) {
    console.error(`YouTube connection failed: ${error.message}`);
    throw error;
  }
}

// Run the test
(async () => {
  try {
    await testYoutubeConnection();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
})();