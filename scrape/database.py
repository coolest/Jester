import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from config import *

cred = credentials.Certificate("scrape/db_auth.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def get_cached(platform: Platform, source, start_ts, end_ts):
    days = (end_ts - start_ts) // ONE_DAY
    
    cached_values = list()
    for day in enumerate(start_ts, end_ts, ONE_DAY): # Make sure it is the start of a day... (CURRENTLY ISN'T- i don't think)
        # Query db and if result then put it in list, otherwise put -1
        # If the HTTP call fails just put -1, have it in a try/catch
        
        return cached_values
    
    
def cache_values(platform: Platform, source, sentiment_mapping):
    # Get the collection of platform and source (subreddit, twitter hashtag, youtube search)
    
    # Loop through the (DAY, SCORE) mapping of sentiment and do a HTTP put into the document caching the value for future results...
    # Have try/catches and make sure it does everything correctly... if fails it is ok it is just not cached, no need to report error
     
    return
        