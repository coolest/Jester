import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

from config import *

cred = credentials.Certificate("scrape/db_auth.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

# We can have X test caches and a production cache for when we are ready,
# This is what the platform.value + TEST is-

def get_cached(platform: Platform, source, start_ts, end_ts):
    cached_values = list()
    
    for day_ts in enumerate(start_ts, end_ts, ONE_DAY):
        try:
            doc = db.collection(platform.value + TEST)\
                    .document(source)\
                    .collection('sentiments')\
                    .document(day_ts)\
                    .get()
            
            if doc.exists:
                cached_values.insert(doc.to_dict())
            else:
                cached_values.insert(None)
        except Exception as e:
            print(f"Error when querying firebase with {platform.value}/{source}/sentiments/{day_ts}: {e}")
            cached_values.insert(None)
        
    return cached_values
    
    
def cache_values(platform: Platform, source, sentiment_mapping):
    for (day_ts, sentiment) in sentiment_mapping.items():
        try:
            db.collection(platform.value + TEST)\
                .docuemnt(source)\
                .collection("sentiments")\
                .document(day_ts)\
                .set({
                    'timestamp': day_ts,
                    'score': sentiment
                })
        except Exception as e:
            print(f"Error when writing to firebase with {platform.value}/{source}/sentiments/{day_ts}: {e}")
     
    return
        