from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    def __init__(self, username, email, auth_provider='local', provider_id=None, skills_offered=None, skills_needed=None):
        self.username = username
        self.email = email
        self.auth_provider = auth_provider
        self.provider_id = provider_id
        self.skills_offered = skills_offered or []
        self.skills_needed = skills_needed or []
        self.karma_points = 0
        self.created_at = datetime.utcnow()
        self.github_connected = False
        self.github_username = None
        self.github_access_token = None

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'auth_provider': self.auth_provider,
            'provider_id': self.provider_id,
            'skills_offered': self.skills_offered,
            'skills_needed': self.skills_needed,
            'karma_points': self.karma_points,
            'created_at': self.created_at,
            'github_connected': self.github_connected,
            'github_username': self.github_username,
            'github_access_token': self.github_access_token,
            'password': getattr(self, 'password', None)  # Only included if set
        }
