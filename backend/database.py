import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env
load_dotenv()

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not url or not key:
    print("WARNING: Supabase URL or Service Key is missing. Check your .env file.")

# Create the singleton client to be used across all routes
supabase: Client = create_client(url, key)
