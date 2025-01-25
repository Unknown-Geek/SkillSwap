from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import certifi
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize collections as None
db = None
users_collection = None
skills_collection = None
messages_collection = None

try:
    # Get MongoDB URI from environment variable
    connection_string = os.getenv('MONGODB_URI')
    if not connection_string:
        raise ValueError("MONGODB_URI not found in environment variables")

    # Initialize MongoDB client
    client = MongoClient(
        connection_string,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where()
    )
    
    # Test connection
    client.admin.command('ping')
    
    # Initialize database and collections
    db = client.skill_swap
    users_collection = db.users
    skills_collection = db.skills
    messages_collection = db.messages
    
    print("Successfully connected to MongoDB Atlas!")

except Exception as e:
    print(f"Error connecting to MongoDB: {str(e)}")
    raise

def get_db():
    if not db:
        raise ConnectionError("Database not initialized")
    return db