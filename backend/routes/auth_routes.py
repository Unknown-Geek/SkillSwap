from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import create_access_token
import requests
from models import User
from utils.db_config import users_collection
import os
import logging
from functools import wraps
from datetime import timedelta

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Update the blueprint initialization with a URL prefix
auth_routes = Blueprint('auth', __name__, url_prefix='/auth')

# Remove '/auth' from route definitions since it's now in the prefix
@auth_routes.route('/google')
def google_auth():
    logger.debug(f"Google Auth initiated with CLIENT_ID: {os.getenv('GOOGLE_CLIENT_ID')}")
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        'client_id': os.getenv('GOOGLE_CLIENT_ID'),
        'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/google",
        'response_type': 'code',
        'scope': 'email profile openid',
        'access_type': 'offline',
        'prompt': 'consent',
        'include_granted_scopes': 'true'
    }
    auth_url = f"{GOOGLE_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    logger.debug(f"Generated auth URL: {auth_url}")
    return jsonify({'authUrl': auth_url})

def single_request(f):
    """Decorator to ensure a request is processed only once"""
    processed_codes = set()
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        code = request.json.get('code') if request.is_json else None
        if code in processed_codes:
            return jsonify({'error': 'Code already processed'}), 400
        processed_codes.add(code)
        try:
            return f(*args, **kwargs)
        finally:
            processed_codes.discard(code)
    return decorated_function

def create_user_token(user_id):
    return create_access_token(
        identity=str(user_id),
        expires_delta=timedelta(days=1)  # Set token expiration to 1 day
    )

@auth_routes.route('/google/callback', methods=['POST', 'OPTIONS'])
def google_callback():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        code = request.json.get('code')
        if not code:
            return jsonify({'error': 'No code provided'}), 400

        # Exchange code for token
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'code': code,
                'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/google",
                'grant_type': 'authorization_code'
            }
        )

        if not token_response.ok:
            return jsonify({'error': 'Failed to get token'}), 400
            
        access_token = token_response.json().get('access_token')
        userinfo = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        ).json()

        # Find or create user
        user = users_collection.find_one({"email": userinfo['email']})
        if not user:
            new_user = User(
                username=userinfo.get('name', ''),
                email=userinfo['email'],
                auth_provider='google',
                provider_id=userinfo['id']
            )
            result = users_collection.insert_one(new_user.to_dict())
            user = users_collection.find_one({"_id": result.inserted_id})
            
        # Create JWT token
        token = create_user_token(user['_id'])
        user_data = user.copy()
        user_data['_id'] = str(user_data['_id'])
        
        return jsonify({
            'token': token,
            'user': user_data
        })

    except Exception as e:
        logger.error(f"Google callback error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@auth_routes.route('/github')
def github_auth():
    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    params = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/github",  # Updated redirect URI
        'scope': 'user:email repo',
        'state': os.urandom(16).hex()
    }
    auth_url = f"{GITHUB_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return jsonify({'authUrl': auth_url})

@auth_routes.route('/github/callback', methods=['POST', 'OPTIONS'])
def github_callback():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        code = request.json.get('code')
        if not code:
            return jsonify({'error': 'No code provided'}), 400

        # Exchange code for token with proper headers
        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': os.getenv('GITHUB_CLIENT_ID'),
                'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
                'code': code,
                'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/github"
            },
            headers={
                'Accept': 'application/json'
            }
        )

        if not token_response.ok:
            logger.error(f"GitHub token error response: {token_response.text}")
            return jsonify({'error': 'Failed to get token'}), 400

        token_data = token_response.json()
        if 'error' in token_data:
            logger.error(f"GitHub token error data: {token_data}")
            return jsonify({'error': token_data.get('error_description', 'Token exchange failed')}), 400

        access_token = token_data.get('access_token')
        if not access_token:
            return jsonify({'error': 'No access token in response'}), 400

        # Update GitHub API request headers to use token correctly
        headers = {
            'Accept': 'application/json',
            'Authorization': f'token {access_token}'  # Changed from 'Bearer' to 'token'
        }
        
        # Make user request
        user_response = requests.get('https://api.github.com/user', headers=headers)
        if not user_response.ok:
            logger.error(f"GitHub user API error: {user_response.text}")
            return jsonify({'error': 'Failed to get user info'}), 400
            
        github_user = user_response.json()

        # Make emails request
        emails_response = requests.get('https://api.github.com/user/emails', headers=headers)
        if not emails_response.ok:
            logger.error(f"GitHub emails API error: {emails_response.text}")
            return jsonify({'error': 'Failed to get user emails'}), 400

        github_emails = emails_response.json()
        
        try:
            primary_email = next(email['email'] for email in github_emails if email['primary'])
        except StopIteration:
            primary_email = github_emails[0]['email'] if github_emails else github_user.get('email')

        if not primary_email:
            return jsonify({'error': 'No email found'}), 400

        # Find or create user
        user = users_collection.find_one({"email": primary_email})
        if not user:
            new_user = {
                "username": github_user['login'],
                "email": primary_email,
                "auth_provider": "github",
                "provider_id": str(github_user['id']),
                "github_connected": True,
                "github_username": github_user['login'],
                "github_access_token": access_token
            }
            result = users_collection.insert_one(new_user)
            user = users_collection.find_one({"_id": result.inserted_id})
        else:
            # Update existing user with GitHub info
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "github_connected": True,
                        "github_username": github_user['login'],
                        "github_access_token": access_token
                    }
                }
            )

        # Create JWT token
        token = create_user_token(user['_id'])
        user_data = {k: v for k, v in user.items() if k != 'password'}
        user_data['_id'] = str(user_data['_id'])

        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'GitHub authentication successful'
        })

    except Exception as e:
        logger.exception("GitHub callback error")
        return jsonify({'error': str(e)}), 400

@auth_routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    skills_offered = data.get('skills_offered', [])
    skills_needed = data.get('skills_needed', [])

    if not username or not email or not password:
        return jsonify({'error': 'Missing required fields'}), 400

    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 400

    new_user = User(
        username=username,
        email=email,
        skills_offered=skills_offered,
        skills_needed=skills_needed
    )
    new_user.set_password(password)  # Assuming you have a method to hash the password
    result = users_collection.insert_one(new_user.to_dict())
    user = users_collection.find_one({"_id": result.inserted_id})

    token = create_user_token(user['_id'])
    user_data = user.copy()
    user_data['_id'] = str(user_data['_id'])

    return jsonify({
        'token': token,
        'user': user_data,
        'message': 'Registration successful'
    })

@auth_routes.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create User instance to use password check method
        user_obj = User(
            username=user['username'],
            email=user['email'],
            auth_provider=user.get('auth_provider', 'local')
        )
        user_obj.password = user.get('password')

        if not user_obj.check_password(password):
            return jsonify({'error': 'Invalid password'}), 401

        # Create token
        token = create_access_token(
            identity=str(user['_id']),
            expires_delta=timedelta(days=1)
        )

        user_data = {k: v for k, v in user.items() if k != 'password'}
        user_data['_id'] = str(user_data['_id'])

        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'Login successful'
        })

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 400
