import os
import argparse
import asyncio
import aiohttp
import asyncpraw

from datetime import datetime, UTC
from dotenv import load_dotenv

# https://stackoverflow.com/questions/64734118/environment-variable-not-loading-with-load-dotenv-in-linux
load_dotenv(override = True) # Doesn't work without override = True
DEBUG_MODE = os.getenv("DEBUG_MODE") == "1"
ONE_DAY = 86400

def format_timestamp(timestamp):
    return "[" + datetime.fromtimestamp(timestamp, UTC).strftime('%Y-%m-%d %H:%M:%S') + "]"

async def handle_reddit(reddit_name, start_timestamp, end_timestamp):
    client_id = os.getenv('REDDIT_CLIENT_ID')
    client_secret = os.getenv('REDDIT_CLIENT_SECRET')
    client_username = os.getenv("REDDIT_USERNAME")
    client_password = os.getenv("REDDIT_PASSWORD")
    
    # Make sure it is a clean division between days
    if (end_timestamp - start_timestamp) % ONE_DAY != 0:
        raise ValueError("The timestamps provided are not X number days apart")
    
    reddit = asyncpraw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        password=client_password,
        username=client_username,

        user_agent='SentimentJester/1.0')

    subreddit = await reddit.subreddit(reddit_name, fetch=True) # Get the subreddit, make sure we fetch, not create
    # Look through the submission between every day in the timestamp range, [START, END)
    for day_start_ts in range(start_timestamp, end_timestamp, ONE_DAY):
        subreddit_query = "timestamp:{}..{}".format(day_start_ts, day_start_ts + ONE_DAY) # Search for posts in this time range
        
        if DEBUG_MODE: 
            print("STARTING DAY " + format_timestamp(day_start_ts))
        
        async for submission in subreddit.search(subreddit_query, sort='new'):
            if DEBUG_MODE:
                print(submission.title)
    
    await reddit.close()
    
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reddit")
    parser.add_argument("--start")
    parser.add_argument("--end")
    
    args = parser.parse_args()
    
    if (not args.start or not args.end):
        return
    
    if (args.reddit):
        await handle_reddit(args.reddit, int(args.start), int(args.end))
    
    return

if __name__ == "__main__":
    asyncio.run(main())
    