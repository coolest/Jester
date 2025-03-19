import tweepy
import os
import argparse
import asyncio
import datetime
import pytz

from collections import defaultdict
import database

from config import *

def format_timestamp(timestamp):
    return "[" + datetime.datetime.fromtimestamp(timestamp, datetime.UTC).strftime('%Y-%m-%d %H:%M:%S') + "]"

def is_start_of_day(timestamp):
    dt_object_utc = datetime.datetime.fromtimestamp(timestamp, tz=pytz.utc)
    
    return dt_object_utc.hour == 0 and dt_object_utc.minute == 0 and dt_object_utc.second == 0 and dt_object_utc.microsecond == 0

async def safely_fetch_tweet_replies(api, tweet_id, username, max_retries=3):
    replies = []
    
    for attempt in range(max_retries + 1):
        try:
            search_query = f"to:{username}"
            tweets = tweepy.Cursor(
                api.search_tweets,
                q=search_query,
                since_id=tweet_id,
                tweet_mode='extended'
            ).items(35)  # Limit to 35 replies per tweet (seems the best...)
            
            # Filter to only get replies to this specific tweet, then return all the replies
            for tweet in tweets:
                if hasattr(tweet, 'in_reply_to_status_id_str') and tweet.in_reply_to_status_id_str == str(tweet_id):
                    replies.append(tweet)
            
            return replies
        except tweepy.TweepyException as e:
            print(f"Attempt {attempt + 1} failed for tweet {tweet_id}: {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)
                
                continue
            
            return []
        except Exception as e:
            print(f"Unexpected error for tweet {tweet_id}: {e}")
            
            return []
    
    return replies

async def process_tweets(api, hashtag, start_timestamp, end_timestamp):
    tweets_by_day = defaultdict(list)
    
    # Timestamps need to be datetimes for library used
    start_date = datetime.datetime.fromtimestamp(start_timestamp, tz=pytz.utc)
    end_date = datetime.datetime.fromtimestamp(end_timestamp, tz=pytz.utc)
    
    # Dates are (YYYY-MM-DD) for searching in twitter API
    # start_date_str = start_date.strftime('%Y-%m-%d')
    end_date_str = end_date.strftime('%Y-%m-%d')
    
    # If timespan if >7 days then chances are v1.1 doesn't have it :(
    days_difference = (end_date - start_date).days
    if days_difference > 7:
        print(f"Warning: Twitter API search only supports up to 7 days in the past")
    
    try:
        search_query = f"#{hashtag}"
        tweet_cursor = tweepy.Cursor(
            api.search_tweets,
            q=search_query,
            count=100,
            until=end_date_str,
            tweet_mode='extended'
        ).items()
        
        total_tweets = 0
        max_tweets = 1000  # Don't exhaust our limits (arbritrary number for testing)
        
        # Twitter 1.1 API doesn't provide async endpoints
        for tweet in tweet_cursor:
            tweet_timestamp = int(tweet.created_at.timestamp())
            
            # Reached the start date or max tweet count
            if tweet_timestamp < start_timestamp or total_tweets >= max_tweets:
                break
            
            if tweet_timestamp < end_timestamp:
                tweet_day_start = (tweet_timestamp - start_timestamp) // ONE_DAY
                day_timestamp = start_timestamp + ONE_DAY * tweet_day_start
                
                tweets_by_day[day_timestamp].append(tweet)
                total_tweets += 1
                
                if total_tweets % 100 == 0:
                    print(f"Collected {total_tweets} tweets so far...")
                    await asyncio.sleep(0.1)  # Small pause to allow other async tasks (choppy but works)
    
        if DEBUG_MODE:
            print(f"Collected a total of {total_tweets} tweets with hashtag #{hashtag}")
        
        return tweets_by_day
    
    except tweepy.TweepyException as e:
        print(f"Twitter API error: {e}")
        return defaultdict(list)
    except Exception as e:
        print(f"Unexpected error in process_tweets: {e}")
        return defaultdict(list)

async def handle_twitter(hashtag, start_timestamp, end_timestamp):
    if (end_timestamp - start_timestamp) % ONE_DAY != 0 or not is_start_of_day(start_timestamp) or start_timestamp > end_timestamp:
        raise ValueError("The timestamps provided are not X number days apart or invalid (not start of a day, or end_timestamp is before start_timestamp")
    
    try:
        consumer_key = os.getenv("X_API_KEY")
        consumer_secret = os.getenv("X_API_KEY_SECRET")
        access_token = os.getenv("X_ACCESS_TOKEN")
        access_token_secret = os.getenv("X_ACCESS_TOKEN_SECRET")
        
        if not all([consumer_key, consumer_secret, access_token, access_token_secret]):
            raise ValueError("Missing required Twitter API credentials in environment variables")
        
        auth = tweepy.OAuth1UserHandler(
            consumer_key, consumer_secret,
            access_token, access_token_secret
        )
        
        api = tweepy.API(auth, wait_on_rate_limit=True)
        
        # Fetch tweets with the hashtag in the timestamp interval and gives us the posts by day
        # {day, list(tweets)}
        tweets_by_day = await process_tweets(api, hashtag, start_timestamp, end_timestamp)
        
        if DEBUG_MODE:
            print("QUERYING DATABASE CACHE", end=' ')
            
        # Check database cache for existing sentiment data, same logic in reddit scrapper, more detailed comment there
        cache_by_day = await database.get_cached(Platform.TWITTER, hashtag, start_timestamp, end_timestamp)
        
        if DEBUG_MODE:
            print("[FINISHED]")
        
        all_posts_by_day = defaultdict(list)
        sentiment_by_day = defaultdict(int)
        
        # Process each day's tweets
        for day, tweets in tweets_by_day.items():
            if cache_by_day[day] > 0:
                sentiment_by_day[day] = cache_by_day[day]
                
                if DEBUG_MODE:
                    print(f"C[{day}] ", end=' ')
                
                continue
            
            # Needs sentiment analysis here
            for tweet in tweets:
                all_posts_by_day[day].append(tweet)
                
                # Fetch replies for tweet & add them to respective day
                tweet_id = tweet.id
                username = tweet.user.screen_name
                replies = await safely_fetch_tweet_replies(api, tweet_id, username)
                
                for reply in replies:
                    reply_timestamp = int(reply.created_at.timestamp())
                    if reply_timestamp > end_timestamp:
                        continue
                    
                    reply_day_start = (reply_timestamp - start_timestamp) // ONE_DAY
                    reply_day = start_timestamp + ONE_DAY * reply_day_start
                    all_posts_by_day[reply_day].append(reply)
            
            if DEBUG_MODE:
                print(f"F[{day}]", end=' ')
        
        if DEBUG_MODE:
            print()
            print("FINISHED FETCHING [ALL] TWEETS AND REPLIES")
        
        # ID -> Object mapping
        post_id_mapping = {}
        for _, posts in all_posts_by_day.items():
            for post in posts:
                post_id_mapping[post.id_str] = post
        
        posts_sentiment = {} # For database (people viewing individual tweets)
        
        # Process sentiment by day
        for day, posts in all_posts_by_day.items():
            day_sentiment = 0
            
            for post in posts:
                parents = []
                if hasattr(post, 'in_reply_to_status_id_str') and post.in_reply_to_status_id_str:
                    current_parent_id = post.in_reply_to_status_id_str
                    
                    while current_parent_id in post_id_mapping:
                        parent_post = post_id_mapping[current_parent_id]
                        parents.append(parent_post)
                        
                        if hasattr(parent_post, 'in_reply_to_status_id_str') and parent_post.in_reply_to_status_id_str:
                            current_parent_id = parent_post.in_reply_to_status_id_str
                        else:
                            break
                
                # Placeholder for sentiment analysis
                # Will do the sentiment LLM call here, and maybe some special formula regarding if there are multiple users, making them less weighted
                post_sentiment = 1
                posts_sentiment[post.id_str] = post_sentiment
                day_sentiment += post_sentiment
            
            # Average for now, but could be something more complicated
            if posts:
                sentiment_by_day[day] = day_sentiment / len(posts)
            else:
                sentiment_by_day[day] = -1 # No posts that day
        
        # Save results to database
        if DEBUG_MODE:
            print("SAVING TO DATABASE", end=' ')
        
        tasks = []
        tasks.append(database.save_posts(Platform.TWITTER, hashtag, posts_sentiment))
        tasks.append(database.cache_values(Platform.TWITTER, hashtag, sentiment_by_day))
        await asyncio.gather(*tasks)
        
        if DEBUG_MODE:
            print("[FINISHED]")
            
            # Collected tweets
            for day, tweets in tweets_by_day.items():
                print(f"NEW DAY: {format_timestamp(day)}")
                for tweet in tweets:
                    print(f"  [{tweet.id_str}] {tweet.user.screen_name}: {tweet.full_text[:50]}...")
                print("")
            
            # Conversation threads (replies, etc)
            for day, posts in all_posts_by_day.items():
                print(f"NEW DAY WITH REPLIES: {format_timestamp(day)}")
                for post in posts:
                    # Reply 
                    if hasattr(post, 'in_reply_to_status_id_str') and post.in_reply_to_status_id_str:
                        parents = []
                        current_parent_id = post.in_reply_to_status_id_str
                        
                        while current_parent_id in post_id_mapping:
                            parent_post = post_id_mapping[current_parent_id]
                            parents.append(parent_post)
                            
                            if hasattr(parent_post, 'in_reply_to_status_id_str') and parent_post.in_reply_to_status_id_str:
                                current_parent_id = parent_post.in_reply_to_status_id_str
                            else:
                                break
                        
                        print(f"  REPLY: [{post.id_str}] {post.user.screen_name} -> ", end="")
                        for parent in reversed(parents):
                            print(f"[{parent.id_str}] ", end="")
                        print(f": {post.full_text[:50]}...")
                    # Not reply
                    else:
                        print(f"  TWEET: [{post.id_str}] {post.user.screen_name}: {post.full_text[:50]}...")
                print("")
        
        return sentiment_by_day
    
    except Exception as e:
        print(f"Top level error on the Twitter scraper: {e}")
        
        return defaultdict(int)

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hashtag")
    parser.add_argument("--start")
    parser.add_argument("--end")
    
    args = parser.parse_args()
    
    if (not args.start or not args.end or not args.hashtag):
        return
    
    
    # Don't have access to API
    # Print template result here..
    
    # await handle_twitter(args.hashtag, int(args.start), int(args.end))

if __name__ == "__main__":
    asyncio.run(main())