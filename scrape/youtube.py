import os
import argparse
import asyncio
import aiohttp

from collections import defaultdict
import datetime
import pytz
import database

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from config import *

def format_timestamp(timestamp):
    return "[" + datetime.datetime.fromtimestamp(timestamp, datetime.UTC).strftime('%Y-%m-%d %H:%M:%S') + "]"
    
def is_start_of_day(timestamp):
    dt_object_utc = datetime.datetime.fromtimestamp(timestamp, tz=pytz.utc)
    
    return dt_object_utc.hour == 0 and dt_object_utc.minute == 0 and dt_object_utc.second == 0 and dt_object_utc.microsecond == 0

def convert_youtube_time_to_timestamp(youtube_time):
    dt = datetime.datetime.fromisoformat(youtube_time.replace('Z', '+00:00'))
    
    return int(dt.timestamp())

async def safely_fetch_comments(youtube, video_id, max_retries=5):
    comments = []
    page_token = None
    
    for attempt in range(max_retries + 1):
        try:
            while True:
                request = youtube.commentThreads().list(
                    part="snippet",
                    videoId=video_id,
                    maxResults=100,
                    pageToken=page_token
                )
                
                response = await asyncio.to_thread(request.execute)
                
                for item in response.get('items', []):
                    comment = item['snippet']['topLevelComment']['snippet']
                    comments.append({
                        'id': item['id'],
                        'text': comment['textDisplay'],
                        'author': comment['authorDisplayName'],
                        'created_utc': convert_youtube_time_to_timestamp(comment['publishedAt']),
                        'likes': comment['likeCount'],
                        'video_id': video_id,
                        'fullname': f"yt_comment_{item['id']}" 
                    })
                
                    if item['snippet']['totalReplyCount'] > 0:
                        replies_request = youtube.comments().list(
                            part="snippet",
                            parentId=item['id'],
                            maxResults=100
                        )
                        
                        replies_response = await asyncio.to_thread(replies_request.execute)
                        
                        for reply in replies_response.get('items', []):
                            reply_snippet = reply['snippet']
                            comments.append({
                                'id': reply['id'],
                                'text': reply_snippet['textDisplay'],
                                'author': reply_snippet['authorDisplayName'],
                                'created_utc': convert_youtube_time_to_timestamp(reply_snippet['publishedAt']),
                                'likes': reply_snippet['likeCount'],
                                'video_id': video_id,
                                'parent_id': f"yt_comment_{reply_snippet['parentId']}",  
                                'fullname': f"yt_reply_{reply['id']}"
                            })
                
                if 'nextPageToken' in response:
                    page_token = response['nextPageToken']
                else:
                    break
                    
            return comments
                
        except HttpError as e:
            print(f"Attempt {attempt + 1} failed for video {video_id}: {e}")
            if attempt < max_retries:
                await asyncio.sleep(2 ** attempt)
                
                continue
            
            return comments
        except Exception as e:
            print(f"Unexpected error for video {video_id}: {e}")
            
            return comments
    
    return comments

async def fetch_videos(youtube, search_term=None, start_timestamp=None, end_timestamp=None, max_results=50):
    videos_by_day = defaultdict(list)
    
    try:
        if start_timestamp:
            start_time = datetime.datetime.fromtimestamp(start_timestamp, tz=pytz.utc).isoformat()
        if end_timestamp:
            end_time = datetime.datetime.fromtimestamp(end_timestamp, tz=pytz.utc).isoformat()
        
        request = youtube.search().list(
            part="snippet",
            q=search_term,
            maxResults=max_results,
            order="date",
            type="video",
            publishedAfter=start_time,
            publishedBefore=end_time
        )
        
        response = await asyncio.to_thread(request.execute)
        
        for item in response.get('items', []):
            if item['id']['kind'] != 'youtube#video':
                continue
                
            video_id = item['id']['videoId']
            
            video_request = youtube.videos().list(
                part="snippet,statistics",
                id=video_id
            )
            
            video_response = await asyncio.to_thread(video_request.execute)
            
            if not video_response.get('items'):
                continue
                
            video_info = video_response['items'][0]
            published_at = video_info['snippet']['publishedAt']
            created_utc = convert_youtube_time_to_timestamp(published_at)
            
            if (start_timestamp and created_utc < start_timestamp) or (end_timestamp and created_utc >= end_timestamp):
                continue
            
            video = {
                'id': video_id,
                'title': video_info['snippet']['title'],
                'description': video_info['snippet']['description'],
                'channel_id': video_info['snippet']['channelId'],
                'channel_title': video_info['snippet']['channelTitle'],
                'created_utc': created_utc,
                'view_count': int(video_info['statistics'].get('viewCount', 0)),
                'like_count': int(video_info['statistics'].get('likeCount', 0)),
                'comment_count': int(video_info['statistics'].get('commentCount', 0)),
                'fullname': f"yt_video_{video_id}"
            }
            
            if start_timestamp:
                video_day_start = (created_utc - start_timestamp) // ONE_DAY
                videos_by_day[start_timestamp + ONE_DAY * video_day_start].append(video)
            else:
                day_start = datetime.datetime.fromtimestamp(created_utc, tz=pytz.utc).replace(
                    hour=0, minute=0, second=0, microsecond=0
                ).timestamp()
                videos_by_day[int(day_start)].append(video)
                
        return videos_by_day
        
    except HttpError as e:
        print(f"Error fetching videos: {e}")
        
        return videos_by_day
    except Exception as e:
        print(f"Unexpected error fetching videos: {e}")
        
        return videos_by_day

async def handle_youtube(channel_or_search, start_timestamp=None, end_timestamp=None):
    api_key = os.getenv('YT_KEY')
    
    if not api_key:
        raise ValueError("Missing required YouTube API key in environment variables")
    
    if (end_timestamp - start_timestamp) % ONE_DAY != 0 or not is_start_of_day(start_timestamp) or start_timestamp > end_timestamp:
        raise ValueError("The timestamps provided are not X number days apart or invalid (not start of a day, or end_timestamp is before start_timestamp")
    
    try:
        youtube = build('youtube', 'v3', developerKey=api_key)

        videos_by_day = await fetch_videos(youtube, search_term=channel_or_search, start_timestamp=start_timestamp, end_timestamp=end_timestamp)
        identifier = f"search_{channel_or_search}"
        
        if DEBUG_MODE:
            print("QUERYING DATABASE CACHE", end=' ')
            
        cache_by_day = await database.get_cached(Platform.YOUTUBE, identifier, start_timestamp, end_timestamp)
        
        if DEBUG_MODE:
            print("[FINISHED]")
        
        posts_by_day = defaultdict(list)
        sentiment_by_day = defaultdict(int)
        comments_to_post = defaultdict()
        
        for day, videos in videos_by_day.items():
            if cache_by_day[day] > 0:
                sentiment_by_day[day] = cache_by_day[day]
                
                if DEBUG_MODE:
                    print(f"C[{day}] ", end=' ')
                    
                continue
            
            for video in videos:
                posts_by_day[day].append(video)
                
                if video['comment_count'] > 0:
                    comments = await safely_fetch_comments(youtube, video['id'])
                    
                    for comment in comments:
                        comment_ts = comment['created_utc']
                        if end_timestamp and comment_ts > end_timestamp:
                            continue
                        
                        comments_to_post[comment['fullname']] = video['fullname']
                        
                        if start_timestamp:
                            comment_day_start = (comment_ts - start_timestamp) // ONE_DAY
                            posts_by_day[start_timestamp + ONE_DAY * comment_day_start].append(comment)
                        else:
                            day_start = datetime.datetime.fromtimestamp(comment_ts, tz=pytz.utc).replace(
                                hour=0, minute=0, second=0, microsecond=0
                            ).timestamp()
                            posts_by_day[int(day_start)].append(comment)
                            
            if DEBUG_MODE:
                print(f"F[{day}]", end=' ')
                
        if DEBUG_MODE:
            print()
            print("FINISHED FETCHING [ALL] COMMENTS")
        
        post_id_mapping = {}
        for _, posts in posts_by_day.items():
            for post in posts:
                post_id_mapping[post['fullname']] = post
        
        posts_sentiment = {}
        for day, posts in posts_by_day.items():
            for post in posts:
                parents = []
                current_parent_id = post.get('parent_id')
                
                while current_parent_id and current_parent_id in post_id_mapping:
                    parent_post = post_id_mapping[current_parent_id]
                    parents.append(parent_post)
                    current_parent_id = parent_post.get('parent_id')
                
                sentiment = 1
                sentiment_by_day[day] += sentiment
                
                posts_sentiment[post['fullname']] = sentiment
        
        if DEBUG_MODE:
            print("SAVING TO DATABASE", end=' ')
            
        tasks = []
        tasks.append(database.save_posts(Platform.YOUTUBE, identifier, posts_sentiment))
        tasks.append(database.cache_values(Platform.YOUTUBE, identifier, sentiment_by_day))
        await asyncio.gather(*tasks)
        
        if DEBUG_MODE:
            print("[FINISHED]")
            
            for day, videos in videos_by_day.items():
                print(f"NEW DAY! {format_timestamp(day)}")
                for video in videos:
                    print(f"[{video['id']}] {video['title']} - {video['comment_count']} comments")
                print("")
                
            for day, posts in posts_by_day.items():
                print(f"NEW DAY! {format_timestamp(day)}")
                for post in posts:
                    if 'title' in post: 
                        print(f"[{post['fullname']}] {post['title']}")
                    elif 'text' in post:
                        parents = []
                        current_parent_id = post.get('parent_id')
                        
                        while current_parent_id and current_parent_id in post_id_mapping:
                            parent_post = post_id_mapping[current_parent_id]
                            parents.append(parent_post)
                            current_parent_id = parent_post.get('parent_id')
                        
                        print(f"CONTEXT: {comments_to_post[post['fullname']]} ", end="")
                        for parent_post in reversed(parents):
                            print(parent_post['fullname'], end=" ")
                        print(f"POST: {post['fullname']} - {post['text']}")
                print("")
        
        return sentiment_by_day
    
    except Exception as e:
        print(f"Top level error on the YouTube scraper: {e}")
    
    finally:
        if 'youtube' in locals():
            youtube.close()
            
        if DEBUG_MODE:
            print("YOUTUBE API CLIENT CLOSED SUCCESSFULLY.")

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--search")
    parser.add_argument("--start")
    parser.add_argument("--end")
    
    args = parser.parse_args()

    await handle_youtube(args.search,
                        start_timestamp=int(args.start),
                        end_timestamp=int(args.end))

if __name__ == "__main__":
    asyncio.run(main())