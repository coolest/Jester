import os
from dotenv import load_dotenv
from enum import Enum

# https://stackoverflow.com/questions/64734118/environment-variable-not-loading-with-load-dotenv-in-linux
load_dotenv(override = True) # Doesn't work without override = True
DEBUG_MODE = os.getenv("DEBUG_MODE") == "1"
ONE_DAY = 86400

class Platform(Enum):
    REDDIT = "reddit"
    TWITTER = "twitter"
    YOUTUBE = "youtube"