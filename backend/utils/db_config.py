from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import certifi

try:
    connection_string = "mongodb+srv://mojomaniac2005:LhGWYN1H7CuqZNU5@cluster0.vmqxhal.mongodb.net/skill_swap?retryWrites=true&w=majority&ssl=true"
    
    client = MongoClient(
        connection_string,
        serverSelectionTimeoutMS=5000,
        tlsCAFile=certifi.where()
    )
    
    # Test the connection with a shorter timeout
    client.admin.command('ping')
    
    db = client.skill_swap
    users_collection = db.users
    skills_collection = db.skills
    
    print("Successfully connected to MongoDB!")
    
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"Could not connect to MongoDB: {e}")
    raise

def get_db():
    return db
