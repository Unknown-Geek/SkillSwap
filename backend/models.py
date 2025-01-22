from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    skills_offered = db.Column(db.PickleType, nullable=False)
    skills_needed = db.Column(db.PickleType, nullable=False)
    karma_points = db.Column(db.Integer, default=0)
    skill_progress = db.Column(db.PickleType, default={})

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "skills_offered": self.skills_offered,
            "skills_needed": self.skills_needed,
            "karma_points": self.karma_points,
            "skill_progress": self.skill_progress
        }

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "message": self.message,
            "timestamp": self.timestamp
        }
