
import os
import argparse
import asyncio
import aiohttp

import asyncpraw
from asyncpraw.exceptions import APIException, ClientException
from asyncprawcore.exceptions import AsyncPrawcoreException  # Async-specific core exceptions

from collections import defaultdict
import datetime
import pytz
import database

# Constants etc that multiple files will use
from config import *

def format_timestamp(timestamp):
    return "[" + datetime.datetime.fromtimestamp(timestamp, datetime.UTC).strftime('%Y-%m-%d %H:%M:%S') + "]"
    
def is_start_of_day(timestamp):
    dt_object_utc = datetime.datetime.fromtimestamp(timestamp, tz=pytz.utc)
    
    return dt_object_utc.hour == 0 and dt_object_utc.minute == 0 and dt_object_utc.second == 0 and dt_object_utc.microsecond == 0

async def safely_fetch_comments(submission, max_retries=5):
    for attempt in range(max_retries + 1):
        try:
            await submission.load()  # Loads attributes like comments, etc.

            # Check if comments exist in the first place...
            if not hasattr(submission, "comments") or submission.comments is None:
                return []

            # "MoreComments" is a comment tree of comments to the post, then comments to particular comments, etc.
            # Replace "MoreComments" safely
            while True:
                more_comments = await submission.comments.replace_more(limit=5)
                
                # Guard against "comments" attribute becoming None mid-replacement -- .replace_more() is a mutating function of the comments attribute
                if submission.comments is None:
                    print(f"Comments became None for {submission.id} during replace_more() call!")
                    return []
                
                if not more_comments:
                    break

            # Flatten and filter the loaded the comments
            comments = submission.comments.list()
            return [c for c in comments if c is not None] # Filter None/deleted comments
        except (APIException, ClientException, AsyncPrawcoreException, AttributeError) as e:
            print(f"Attempt {attempt + 1} failed for {submission.id}: {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt) # Exponentially sleep
                await submission.load()  # Refresh attributes
                
                continue
            
            return []
        except Exception as e:
            print(f"Unexpected error for {submission.id}: {e}")
            return []

    return []
        
async def process_submissions(subreddit, start_timestamp, end_timestamp, params=None):
    if params is None: 
        params = {} # Will be used to skip pages efficiently, lowering API usage and rate limits
    
    submissions_by_day = defaultdict(list)
        
    while True:
        try:
            batch = [submission async for submission in subreddit.new(limit=25, params=params)]
        except Exception as e:
            print(f"Error fetching submissions batch: {e}")
            
            return defaultdict(list) # Once again, error produces undefined behavior, don't return anything
        
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
            # Make sure the submission exists (API Limit, possibly)
            if submission is None:
                continue
            
            if int(submission.created_utc) < start_timestamp: # NEWEST -> OLDEST, IF the submission is created BEFORE the start_timestamp, all further will ALSO be.
                if DEBUG_MODE:
                    print("FINISHED PROCESSING [ALL] SUBMISSIONS.")
                    
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
    
    # Make sure it is a clean division between days, if start_timestamp is at the start of UTC day so is end_timestamp
    if (end_timestamp - start_timestamp) % ONE_DAY != 0 or not is_start_of_day(start_timestamp) or start_timestamp > end_timestamp:
        raise ValueError("The timestamps provided are not X number days apart or invalid (not start of a day, or end_timestamp is before start_timestamp")
    
    try: 
        reddit = asyncpraw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            password=client_password,
            username=client_username,

            user_agent='SentimentJester/1.0',
            ratelimit_seconds=300)

        subreddit = await reddit.subreddit(reddit_name, fetch=True) # Get the subreddit, make sure we fetch, not create
        submissions_by_day = await process_submissions(subreddit, start_timestamp, end_timestamp) # Dictionary to store submissions by day 
        
        # IT'S OK TO FETCH ALL SUBMISSIONS THEN CHECK CACHE TO SEE IF I NEED COMMENTS...
        # If I have a cache of [-1, cache1, cache2, cache3, -1, -1, -1, -1],
        # I would still need to backtrack behind the cached values ANYWAYS to get the oldest day cache... plus submission count is usually low compared to comments
        if DEBUG_MODE:
            print("QUERYING DATABASE CACHE", end=' ')
            
        cache_by_day = await database.get_cached(Platform.REDDIT, reddit_name, start_timestamp, end_timestamp) # Timestamps are already validated... database shouldn't need to validate...
        
        if DEBUG_MODE:
            print("[FINISHED]")
        
        # Expand to get ALL posts/comments/etc
        posts_by_day = defaultdict(list)
        
        # Answers
        sentiment_by_day = defaultdict(int)
            
        for day, submissions in submissions_by_day.items():
            if (cache_by_day[day] > 0): # Don't need to fetch comments
                sentiment_by_day[day] = cache_by_day[day]
                
                if DEBUG_MODE:
                    print(f"C[{day}] ", end=' ')
                
                continue
            
            for submission in submissions:
                # Re-append submission
                posts_by_day[day].append(submission)
                
                # 'Join' all of the comments so they load/ are fetched, if ratelimited, waits.
                comments = await safely_fetch_comments(submission)
                
                for comment in comments:
                    comment_ts = int(comment.created_utc)
                    if comment_ts > end_timestamp: # Comment created after the end day...
                        continue
                    
                    # Append comment in the posts dictionary
                    comment_day_start = (comment_ts - start_timestamp) // ONE_DAY
                    posts_by_day[start_timestamp + ONE_DAY * comment_day_start].append(comment)
                    
            if DEBUG_MODE:
                print(f"F[{day}]", end = ' ')
            
        if DEBUG_MODE:
            print()
            print("FINISHED FETCHING [ALL] COMMENTS")
                
        post_id_mapping = defaultdict()
        for _, posts in posts_by_day.items():
            for post in posts:
                post_id_mapping[post.fullname] = post
        
        posts_data = defaultdict()
        
        # Do sentiment analysis here
        for day, posts in posts_by_day.items():
            for post in posts:
                parents = list()
                current_parent_id = getattr(post, 'parent_id', None)

                while current_parent_id in post_id_mapping:
                    parent_post = post_id_mapping[current_parent_id]
                    parents.append(parent_post)
                    
                    current_parent_id = getattr(parent_post, 'parent_id', None)
                    
                # Query the sentiment analysis
                sentiment = 1
                sentiment_by_day[day] = sentiment
                
                # Create the post data with all required fields
                post_data = {
                    'timestamp': int(post.created_utc),
                    'context': getattr(post, 'parent_id', None),
                    'score': sentiment
                }
                
                # Store in dictionary for saving in firebase
                posts_data[post.fullname] = post_data
        
        # Save to database
        if DEBUG_MODE:
            print("SAVING TO DATABASE", end = ' ')
            
        tasks = []
        tasks.append(database.save_posts(Platform.REDDIT, reddit_name, posts_data))
        tasks.append(database.cache_values(Platform.REDDIT, reddit_name, sentiment_by_day))
        await asyncio.gather(*tasks) # Block until the data has been saved...
        
        if DEBUG_MODE:
            print("[FINISHED]")
            print() # Now print submissions/comments found
            
        # See if we got the submissions correctly
        if DEBUG_MODE:
            for day, submissions in submissions_by_day.items():
                print(f"NEW DAY!")
                for submission in submissions:
                    print(format_timestamp(day), f"[{submission.id}]", submission.title)
                print("")
            
            for day, posts in posts_by_day.items():
                print(f"NEW DAY!")
                for post in posts:
                    if hasattr(post, "title"):
                        print(format_timestamp(day), f"[{post.fullname}]", post.title)
                    elif hasattr(post, "body"):
                        parents = list()
                        current_parent_id = post.parent_id

                        while current_parent_id in post_id_mapping:
                            parent_post = post_id_mapping[current_parent_id]
                            parents.append(parent_post)
                            
                            current_parent_id = getattr(parent_post, 'parent_id', None)
                        
                        print(format_timestamp(day), "CONTEXT: ", end = "")
                        for parent_post in reversed(parents):
                            print(parent_post.fullname, end=" ")
                        print("POST: ", post.fullname)
                print("")
        
        # Or print JSON formatted version
        return sentiment_by_day
                
    except Exception as e:
        print(f"Top level error on the reddit scraper shown as {e}")
        
    finally:
        await reddit.close()
        
        if DEBUG_MODE:
            print("REDDIT CLOSED SUCCESSFULLY.")
    
async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reddit")
    parser.add_argument("--start")
    parser.add_argument("--end")
    
    args = parser.parse_args()
    
    if (not args.start or not args.end or not args.reddit):
        return
    
    await handle_reddit(args.reddit, int(args.start), int(args.end))

if __name__ == "__main__":
    asyncio.run(main())
    