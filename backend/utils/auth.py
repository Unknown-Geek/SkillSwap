from functools import wraps
from flask import request, jsonify, current_app
import jwt
from datetime import datetime, timezone

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No authorization header'}), 401
        
        try:
            # Remove 'Bearer ' from token
            token = auth_header.split(' ')[1]
            
            # Verify token
            payload = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Check if token is expired
            exp = datetime.fromtimestamp(payload['exp'], tz=timezone.utc)
            if exp < datetime.now(timezone.utc):
                return jsonify({'error': 'Token has expired'}), 401
                
            # Add user_id to request object
            request.user_id = payload['sub']
            
            return f(*args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    return decorated
