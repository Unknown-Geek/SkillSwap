from flask import Blueprint, request, jsonify
from utils.db_config import users_collection, skills_collection

skill_routes = Blueprint("skill_routes", __name__)

@skill_routes.route("/api/users", methods=["POST"])
def add_user():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        required_fields = ['username', 'email', 'skills_offered', 'skills_needed']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        users_collection.insert_one(data)
        return jsonify({"message": "User added successfully"}), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@skill_routes.route("/api/users", methods=["GET"])
def get_users():
    users = list(users_collection.find({}, {"_id": 0}))
    return jsonify(users)

@skill_routes.route("/api/skills", methods=["POST"])
def add_skill():
    data = request.json
    skills_collection.insert_one(data)
    return jsonify({"message": "Skill added successfully"}), 201

@skill_routes.route("/api/skills", methods=["GET"])
def get_skills():
    skills = list(skills_collection.find({}, {"_id": 0}))
    return jsonify(skills)
