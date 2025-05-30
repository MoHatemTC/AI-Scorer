import os
from fastapi import HTTPException
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

# Supabase setup
connect_to_db = os.getenv("CONNECT_TO_DB", "false").lower() == "true"
supabase_client = None

# Configure Supabase connection if enabled
if connect_to_db:
    try:
        # Get Supabase connection info from environment variables
        SUPABASE_URL = os.getenv("SUPABASE_URL")
        SUPABASE_KEY = os.getenv("SUPABASE_KEY")

        if not SUPABASE_URL or not SUPABASE_KEY:
            print("ERROR: Missing Supabase URL or API key")
            connect_to_db = False
        else:
            try:
                supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("Supabase client configured successfully")
            except Exception as e:
                print(f"Supabase connection error: {e}")
                connect_to_db = False
    except Exception as e:
        print(f"Error setting up Supabase client: {e}")
        connect_to_db = False


# Dependency to get Supabase client
def get_db():
    if not connect_to_db or supabase_client is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    return supabase_client
