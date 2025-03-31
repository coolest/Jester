import firebase_admin
import asyncio
from firebase_admin import credentials
from firebase_admin import firestore

from config import *

cred = credentials.Certificate("scrape/db_auth.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# We can have X test caches and a production cache for when we are ready,
# This is what the platform.value + TEST is-

# Get Cache
async def get_cached(platform: Platform, source, start_ts, end_ts):
    tasks = [] # Async tasks go here, then asyncio waits on them together
    day_timestamps = []
    
    # Create a task for each day and track the timestamps
    for day_ts in range(start_ts, end_ts + ONE_DAY, ONE_DAY):
        tasks.append(get_day_data(platform, source, day_ts))
        
        day_timestamps.append(day_ts)
    
    # Run all tasks concurrently
    cached_values = await asyncio.gather(*tasks)
    
    # Format results {(timestamp, sentiment)}
    result = {}
    for i, value in enumerate(cached_values):
        if value is None:
            result[day_timestamps[i]] = -1 # Default value when no cache exists
        else:
            result[day_timestamps[i]] = value.get('score', -1)  # Extract score or default to 0
    
    return result

# One singular sync. call for the day (used by function above)
async def get_day_data(platform: Platform, source, day_ts):
    try:
        doc = db.collection(platform.value + TEST)\
                .document(source)\
                .collection('sentiments')\
                .document(str(day_ts))\
                .get()
        
        if doc.exists:
            return doc.to_dict()
        else:
            return None
    except Exception as e:
        print(f"Error when querying firebase with {platform.value}/{source}/sentiments/{day_ts}: {e}")
        return None
    
# Cache

async def cache_values(platform: Platform, source, sentiment_mapping):
    tasks = []
    
    # Create a task for each day-sentiment pair, same idea as above, put all of the 'sets' in a task list
    for day_ts, sentiment in sentiment_mapping.items():
        tasks.append(cache_day_value(platform, source, day_ts, sentiment))
    
    # Run all tasks concurrently
    await asyncio.gather(*tasks)
    
    return

async def cache_day_value(platform: Platform, source, day_ts, sentiment):
    # Singular sync. call to add the sentiment for the day
    
    try:
        db.collection(platform.value + TEST)\
            .document(source)\
            .collection("sentiments")\
            .document(str(day_ts))\
            .set({
                'timestamp': day_ts,
                'score': sentiment
            })
    except Exception as e:
        print(f"Error when writing to firebase with {platform.value}/{source}/sentiments/{day_ts}: {e}")
    
# Saving posts
async def save_posts(platform: Platform, source, post_data_mapping):
    tasks = []
    
    # Create a task for each post-sentiment pair to add into the database
    for post, data in post_data_mapping.items():
        tasks.append(save_post(platform, source, post, data))
    
    # Run all tasks concurrently...
    await asyncio.gather(*tasks)
    
    return

async def save_post(platform: Platform, source, post, data):
    # Again, singular sync. call to add post/sentiment pair in the database
    
    try:
        db.collection(platform.value + TEST)\
            .document(source)\
            .collection("posts")\
            .document(post)\
            .set(data)
    except Exception as e:
        print(f"Error when writing to firebase with {platform.value}/{source}/posts/{post}: {e}")
        
# DELETING A COLLECTION (Mainly for testing purposes)

async def delete_collection_async(collection_path, batch_size=500):
    coll_ref = db.collection(collection_path)
    
    while True:
        docs = list(coll_ref.limit(batch_size).stream())
        if not docs:
            break
            
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
            
        await asyncio.to_thread(batch.commit)
        print(f"Deleted {len(docs)} documents from {collection_path}")
        
if __name__ == "__main__":
    asyncio.run(delete_collection_async(Platform.REDDIT.value + TEST))