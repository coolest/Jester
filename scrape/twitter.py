import tweepy
import os
import argparse
import asyncio

import config

# Authentication
consumer_key = os.getenv("X_API_KEY")
consumer_secret = os.getenv("X_API_KEY_SECRET")
access_token = os.getenv("X_ACCESS_TOKEN")
access_token_secret = os.getenv("X_ACCESS_TOKEN_SECRET")
    
# Set up auth
auth = tweepy.OAuth1UserHandler(
   consumer_key, consumer_secret,
   access_token, access_token_secret
)

# API object
api = tweepy.API(auth)

async def handle_twitter(hashtag, start, end):
    # Search here, look up db, etc
    # May have to limit to get ~50 per day (?) or ~25 per day (?)
    
    return

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hashtag")
    parser.add_argument("--start")
    parser.add_argument("--end")
    
    args = parser.parse_args()
    
    if (not args.start or not args.end or not args.hashtag):
        return
    
    await handle_twitter(args.hashtag, int(args.start), int(args.end))

if __name__ == "__main__":
    asyncio.run(main())