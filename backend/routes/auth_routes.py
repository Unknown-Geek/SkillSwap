from flask import Blueprint, request, jsonify, current_app, redirect
from flask_jwt_extended import create_access_token
import requests
from models import User
from utils.db_config import users_collection
import os
import logging
from functools import wraps

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

@auth_routes.route('/google/callback', methods=['POST', 'OPTIONS'])
@single_request
def google_callback():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        code = request.json.get('code')
        if not code:
            return jsonify({'error': 'No code provided'}), 400

        logger.debug(f"Processing code: {code[:10]}...")
        
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'client_id': os.getenv('GOOGLE_CLIENT_ID'),
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
            'code': code,
            'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/google",
            'grant_type': 'authorization_code'
        }
        
        logger.debug(f"Token request data: {token_data}")
        token_response = requests.post(token_url, data=token_data)
        
        if not token_response.ok:
            logger.error(f"Token response error: {token_response.text}")
            return jsonify({'error': token_response.text}), 400

        access_token = token_response.json().get('access_token')
        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        userinfo_response.raise_for_status()

        userinfo = userinfo_response.json()
        
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

        token = create_access_token(identity=str(user['_id']))
        user_data = user.copy()
        user_data['_id'] = str(user_data['_id'])
        
        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'Authentication successful'
        })
        
    except requests.exceptions.RequestException as e:
        logger.error(f"OAuth error: {str(e)}")  # Debug logging
        return jsonify({'error': 'Failed to authenticate with Google'}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")  # Debug logging
        return jsonify({'error': 'Authentication failed'}), 400

@auth_routes.route('/github')
def github_auth():
    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    params = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/github",
        'scope': 'user:email',
    }
    auth_url = f"{GITHUB_AUTH_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return jsonify({'authUrl': auth_url})

@auth_routes.route('/github/callback', methods=['POST'])
@single_request
def github_callback():
    code = request.json.get('code')
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    token_response = requests.post(
        'https://github.com/login/oauth/access_token',
        data={
            'client_id': os.getenv('GITHUB_CLIENT_ID'),
            'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
            'code': code,
            'redirect_uri': f"{os.getenv('FRONTEND_URL')}/auth/callback/github",
        },
        headers={'Accept': 'application/json'}
    )
    
    if not token_response.ok:
        return jsonify({'error': 'Failed to get token'}), 400

    access_token = token_response.json().get('access_token')
    
    headers = {
        'Authorization': f'token {access_token}',
        'Accept': 'application/json'
    }
    
    user_response = requests.get('https://api.github.com/user', headers=headers)
    emails_response = requests.get('https://api.github.com/user/emails', headers=headers)
    
    if not user_response.ok or not emails_response.ok:
        return jsonify({'error': 'Failed to get user info'}), 400

    github_user = user_response.json()
    github_emails = emails_response.json()
    primary_email = next(email['email'] for email in github_emails if email['primary'])

    user = users_collection.find_one({"email": primary_email})
    if not user:
        new_user = User(
            username=github_user['login'],
            email=primary_email,
            auth_provider='github',
            provider_id=str(github_user['id'])
        )
        result = users_collection.insert_one(new_user.to_dict())
        user = users_collection.find_one({"_id": result.inserted_id})

    try:
        token = create_access_token(identity=str(user['_id']))
        user_data = user.copy()  # Create a copy of the user dict
        user_data['_id'] = str(user_data['_id'])  # Convert ObjectId to string
        return jsonify({
            'token': token,
            'user': user_data,
            'message': 'Authentication successful'
        })
    except Exception as e:
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

    token = create_access_token(identity=str(user['_id']))
    user_data = user.copy()
    user_data['_id'] = str(user_data['_id'])

    return jsonify({
        'token': token,
        'user': user_data,
        'message': 'Registration successful'
    })
