from flask import Blueprint, jsonify, request
from utils.db_config import users_collection
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

user_routes = Blueprint('users', __name__)

@user_routes.route('/users', methods=['GET'])
def get_users():
    try:
        users = list(users_collection.find({}, {'password': 0}))
        # Convert ObjectId to string for JSON serialization
        for user in users:
            user['_id'] = str(user['_id'])
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/<user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
        if user:
            user['_id'] = str(user['_id'])
            return jsonify(user)
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        update_data = request.get_json()
        # Remove any attempt to update sensitive fields
        sensitive_fields = ['_id', 'password', 'auth_provider', 'provider_id']
        for field in sensitive_fields:
            update_data.pop(field, None)

        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )

        if result.modified_count:
            updated_user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            updated_user['_id'] = str(updated_user['_id'])
            return jsonify(updated_user)
        return jsonify({'error': 'User not found or no changes made'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/skills/<user_id>', methods=['PUT'])
@jwt_required()
def update_user_skills(user_id):
    try:
        current_user_id = get_jwt_identity()
        if current_user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        skills_offered = data.get('skills_offered', [])
        skills_needed = data.get('skills_needed', [])

        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$set': {
                    'skills_offered': skills_offered,
                    'skills_needed': skills_needed
                }
            }
        )

        if result.modified_count:
            updated_user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            updated_user['_id'] = str(updated_user['_id'])
            return jsonify(updated_user)
        return jsonify({'error': 'User not found or no changes made'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/<user_id>/karma', methods=['PUT'])
@jwt_required()
def update_karma(user_id):
    try:
        data = request.get_json()
        karma_change = data.get('karma_change', 0)

        result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'karma_points': karma_change}}
        )

        if result.modified_count:
            updated_user = users_collection.find_one({'_id': ObjectId(user_id)}, {'password': 0})
            updated_user['_id'] = str(updated_user['_id'])
            return jsonify(updated_user)
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(current_user_id)}, {'password': 0})
        if user:
            user['_id'] = str(user['_id'])
            return jsonify(user)
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
