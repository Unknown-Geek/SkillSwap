from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from routes.skill_routes import skill_routes
from routes.auth_routes import auth_routes
from routes.user_routes import user_routes  # Add this import
import os
from datetime import timedelta

# Load environment variables
load_dotenv()

from app import create_app
app = create_app()

# Configuration
app.config.update(
    GOOGLE_CLIENT_ID=os.getenv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET=os.getenv('GOOGLE_CLIENT_SECRET'),
    GITHUB_CLIENT_ID=os.getenv('GITHUB_CLIENT_ID'),
    GITHUB_CLIENT_SECRET=os.getenv('GITHUB_CLIENT_SECRET'),
    JWT_SECRET_KEY=os.getenv('JWT_SECRET_KEY'),
    FRONTEND_URL=os.getenv('FRONTEND_URL', 'http://localhost:5173'),
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=1),
    JWT_HEADER_TYPE='Bearer',
    JWT_HEADER_NAME='Authorization',
    JWT_TOKEN_LOCATION=['headers'],
)

# Updated CORS configuration
CORS(app, 
     resources={
         r"/api/*": {
             "origins": [os.getenv('FRONTEND_URL', 'http://localhost:5173')],
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "expose_headers": ["Authorization"],
             "supports_credentials": True,
             "max_age": 120  # Caching preflight requests
         }
     })

jwt = JWTManager(app)

# Add JWT error handlers
@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'error': 'Invalid token',
        'message': 'The token provided is not valid'
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    return jsonify({
        'error': 'Token expired',
        'message': 'The token has expired'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'error': 'Authorization required',
        'message': 'Token is missing'
    }), 401

# Register blueprints
app.register_blueprint(auth_routes, url_prefix='/api/auth')
app.register_blueprint(skill_routes, url_prefix='/api')
app.register_blueprint(user_routes, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)
