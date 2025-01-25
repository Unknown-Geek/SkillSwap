from datetime import datetime

class User:
    def __init__(self, username, email, auth_provider=None, provider_id=None, skills_offered=None, skills_needed=None):
        self.username = username
        self.email = email
        self.auth_provider = auth_provider
        self.provider_id = provider_id
        self.skills_offered = skills_offered or []
        self.skills_needed = skills_needed or []
        self.karma_points = 0
        self.skill_progress = {}
        self.created_at = datetime.utcnow()

    def to_dict(self):
        return {
            "username": self.username,
            "email": self.email,
            "auth_provider": self.auth_provider,
            "provider_id": self.provider_id,
            "skills_offered": self.skills_offered,
            "skills_needed": self.skills_needed,
            "karma_points": self.karma_points,
            "skill_progress": self.skill_progress,
            "created_at": self.created_at
        }

class Message:
    def __init__(self, user_id, message):
        self.user_id = user_id
        self.message = message
        self.timestamp = datetime.utcnow()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "message": self.message,
            "timestamp": self.timestamp
        }
