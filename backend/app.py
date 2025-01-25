from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from routes.skill_routes import skill_routes
from routes.auth_routes import auth_routes
from routes.user_routes import user_routes  # Add this import
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configuration
app.config.update(
    GOOGLE_CLIENT_ID=os.getenv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET=os.getenv('GOOGLE_CLIENT_SECRET'),
    GITHUB_CLIENT_ID=os.getenv('GITHUB_CLIENT_ID'),
    GITHUB_CLIENT_SECRET=os.getenv('GITHUB_CLIENT_SECRET'),
    JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
    FRONTEND_URL=os.getenv('FRONTEND_URL', 'http://localhost:5173')
)

# Updated CORS configuration
CORS(app, 
     resources={
         r"/api/*": {
             "origins": ["http://localhost:5173"],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "Accept"],
             "expose_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True,
             "max_age": 120
         }
     })

jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(skill_routes, url_prefix='/api/skills')
app.register_blueprint(user_routes, url_prefix='/api')  # Add this line

if __name__ == "__main__":
    app.run(debug=True)
