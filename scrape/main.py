
import os
import argparse
import asyncio
import aiohttp
import asyncpraw

from collections import defaultdict
from datetime import datetime, UTC
from dotenv import load_dotenv

# https://stackoverflow.com/questions/64734118/environment-variable-not-loading-with-load-dotenv-in-linux
load_dotenv(override = True) # Doesn't work without override = True
DEBUG_MODE = os.getenv("DEBUG_MODE") == "1"
ONE_DAY = 86400

def format_timestamp(timestamp):
    return "[" + datetime.fromtimestamp(timestamp, UTC).strftime('%Y-%m-%d %H:%M:%S') + "]"

async def process_submissions(subreddit, start_timestamp, end_timestamp, params=None):
    if params is None: 
        params = {} # Will be used to skip pages efficiently, lowering API usage and rate limits
    
    submissions_by_day = defaultdict(list)
        
    while True:
        batch = [submission async for submission in subreddit.new(limit=25, params=params)]
        if not batch:
            if DEBUG_MODE:
                print(f"EMPTY BATCH, params: {subreddit} {start_timestamp} {end_timestamp}")
                
            return submissions_by_day  # Return it

        # The ENTIRE page is newer than what we want, skip page using params
        if int(batch[-1].created_utc) >= end_timestamp:
            params["after"] = batch[-1].fullname
            
            continue
        
        # Else check the pages and put them in the submissions
        for submission in batch:
            if int(submission.created_utc) < start_timestamp: # NEWEST -> OLDEST, IF the submission is created BEFORE the start_timestamp, all further will ALSO be.
                if DEBUG_MODE:
                    print("FINISHED PROCESSING [ALL] SUBMISSIONS.")
                    print()
                    
                return submissions_by_day # Since we get no more valid submissions, return what we have.
            
            if int(submission.created_utc) >= end_timestamp: # Haven't reached a valid submission YET, but we expect to, so just filter current submission out.
                continue
            
            # Add submission to the mapping
            submission_day_start = (int(submission.created_utc) - start_timestamp) // ONE_DAY
            submissions_by_day[start_timestamp + ONE_DAY * submission_day_start].append(submission)
        
        # Keep paging through the posts.
        params["after"] = batch[-1].fullname

async def handle_reddit(reddit_name, start_timestamp, end_timestamp):
    client_id = os.getenv('REDDIT_CLIENT_ID')
    client_secret = os.getenv('REDDIT_CLIENT_SECRET')
    client_username = os.getenv("REDDIT_USERNAME")
    client_password = os.getenv("REDDIT_PASSWORD")
    
    # Need to authenticate
    if not all([client_id, client_secret, client_username, client_password]):
        raise ValueError("Missing required Reddit API credentials in environment variables")
    
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
    submissions_by_day = await process_submissions(subreddit, start_timestamp, end_timestamp) # Dictionary to store submissions by day 
    
    # See if we got the submissions correctly
    if DEBUG_MODE:
        for day, submissions in submissions_by_day.items():
            print(f"NEW DAY!")
            for submission in submissions:
                print(format_timestamp(day), submission.title)
            print("")
    
    await reddit.close()
    if DEBUG_MODE:
        print("REDDIT CLOSED SUCCESSFULLY.")
    
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
    