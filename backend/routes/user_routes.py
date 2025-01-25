from flask import Blueprint, jsonify, request
from utils.db_config import users_collection
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
import requests # Add this import at the top
import os  # Add this import at the top
import logging
from utils.auth import auth_required
from datetime import datetime, timedelta
from collections import defaultdict
from calendar import monthrange
import math

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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

@user_routes.route('/users/me', methods=['GET', 'PUT'])
@auth_required
def manage_profile():
    try:
        current_user_id = get_jwt_identity()
        logger.debug(f"Accessing profile for user: {current_user_id}")
        
        if not current_user_id:
            logger.error("No user ID in JWT token")
            return jsonify({'error': 'User not authenticated'}), 401

        if request.method == 'GET':
            try:
                user = users_collection.find_one({'_id': ObjectId(current_user_id)}, {'password': 0})
                if not user:
                    logger.error(f"User not found: {current_user_id}")
                    return jsonify({'error': 'User not found'}), 404
                    
                user['_id'] = str(user['_id'])
                return jsonify(user)
            except Exception as e:
                logger.error(f"Error fetching user: {str(e)}")
                return jsonify({'error': 'Internal server error'}), 500

        elif request.method == 'PUT':
            try:
                update_data = request.json
                
                # Remove protected fields
                protected_fields = ['_id', 'email', 'auth_provider', 'provider_id', 'karma_points', 'created_at']
                for field in protected_fields:
                    update_data.pop(field, None)
                
                result = users_collection.update_one(
                    {'_id': ObjectId(current_user_id)},
                    {'$set': update_data}
                )
                
                # Always fetch and return the latest user data
                updated_user = users_collection.find_one({'_id': ObjectId(current_user_id)}, {'password': 0})
                if updated_user:
                    updated_user['_id'] = str(updated_user['_id'])
                    return jsonify(updated_user), 200
                
                return jsonify({'error': 'User not found'}), 404
                
            except Exception as e:
                print(f"Error updating user: {str(e)}")
                return jsonify({'error': str(e)}), 400

    except Exception as e:
        logger.error(f"Profile management error: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

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
@auth_required
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

@user_routes.route('/users/github/link', methods=['POST'])
@jwt_required()
def link_github():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        code = data.get('code')
        
        if not code:
            return jsonify({'error': 'No GitHub code provided'}), 400

        # Exchange code for token
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

        token_data = token_response.json()
        if 'error' in token_data:
            return jsonify({'error': token_data.get('error_description', 'Token exchange failed')}), 400

        access_token = token_data['access_token']
            
        # Get GitHub user info
        headers = {'Authorization': f'Bearer {access_token}'}
        github_response = requests.get('https://api.github.com/user', headers=headers)
        
        if not github_response.ok:
            return jsonify({'error': 'Failed to get GitHub user info'}), 400
            
        github_user = github_response.json()
        
        # Update user in database
        result = users_collection.update_one(
            {'_id': ObjectId(current_user_id)},
            {
                '$set': {
                    'github_connected': True,
                    'github_username': github_user['login'],
                    'github_access_token': access_token
                }
            }
        )
        
        if result.modified_count:
            updated_user = users_collection.find_one({'_id': ObjectId(current_user_id)}, {'password': 0})
            updated_user['_id'] = str(updated_user['_id'])
            return jsonify(updated_user)
        
        return jsonify({'error': 'Failed to update user'}), 400
            
    except Exception as e:
        print(f"GitHub linking error: {str(e)}")
        return jsonify({'error': str(e)}), 400

@user_routes.route('/users/github/activity', methods=['GET'])
@jwt_required()
def get_github_activity():
    try:
        current_user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        
        if not user or not user.get('github_connected'):
            return jsonify({'error': 'GitHub account not linked'}), 400
            
        if not user.get('github_access_token'):
            return jsonify({'error': 'GitHub token not found'}), 400

        headers = {
            'Authorization': f'token {user["github_access_token"]}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        username = user.get('github_username')
        activity_url = f'https://api.github.com/users/{username}/events/public'
        
        response = requests.get(activity_url, headers=headers)
        
        if response.status_code == 401:
            # Token expired or invalid
            return jsonify({'error': 'GitHub token expired'}), 401
            
        response.raise_for_status()
        activity = response.json()
        
        return jsonify(activity)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"GitHub API error: {str(e)}")
        return jsonify({'error': 'Failed to fetch GitHub activity'}), 500
    except Exception as e:
        logger.error(f"Error getting GitHub activity: {str(e)}")
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/github/commits', methods=['GET'])
@auth_required
def get_github_commits():
    try:
        current_user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        
        if not user or not user.get('github_connected'):
            return jsonify({'error': 'GitHub account not linked'}), 400
            
        if not user.get('github_access_token'):
            return jsonify({'error': 'GitHub token not found'}), 400

        headers = {
            'Authorization': f'token {user["github_access_token"]}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        username = user.get('github_username')
        
        # Get user's repositories
        repos_url = f'https://api.github.com/users/{username}/repos'
        repos_response = requests.get(repos_url, headers=headers)
        
        if repos_response.status_code == 401:
            return jsonify({'error': 'GitHub token expired'}), 401
            
        repos = repos_response.json()
        
        # Collect commit data for the last year
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        commit_data = defaultdict(int)
        
        for repo in repos:
            if repo['fork']:  # Skip forked repositories
                continue
                
            commits_url = f'https://api.github.com/repos/{username}/{repo["name"]}/commits'
            params = {
                'author': username,
                'since': start_date.isoformat(),
                'until': end_date.isoformat(),
                'per_page': 100
            }
            
            commits_response = requests.get(commits_url, headers=headers, params=params)
            
            if commits_response.ok:
                commits = commits_response.json()
                for commit in commits:
                    date = commit['commit']['author']['date'][:10]  # YYYY-MM-DD
                    commit_data[date] += 1
        
        # Format data for the graph
        graph_data = [
            {
                'date': date,
                'commits': count
            }
            for date, count in sorted(commit_data.items())
        ]
        
        return jsonify({
            'commit_data': graph_data,
            'total_commits': sum(commit_data.values()),
            'active_days': len(commit_data),
            'longest_streak': calculate_longest_streak(commit_data)
        })
        
    except requests.exceptions.RequestException as e:
        logger.error(f"GitHub API error: {str(e)}")
        return jsonify({'error': 'Failed to fetch GitHub commits'}), 500
    except Exception as e:
        logger.error(f"Error getting GitHub commits: {str(e)}")
        return jsonify({'error': str(e)}), 500

@user_routes.route('/users/github/contributions', methods=['GET'])
@auth_required
def get_github_contributions():
    try:
        current_user_id = get_jwt_identity()
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        
        if not user or not user.get('github_connected'):
            return jsonify({'error': 'GitHub account not linked'}), 400
            
        if not user.get('github_access_token'):
            return jsonify({'error': 'GitHub token not found'}), 400

        username = user.get('github_username')
        headers = {
            'Authorization': f'token {user["github_access_token"]}',
            'Accept': 'application/vnd.github.v3+json'
        }

        # Get contribution data for the last year
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)
        
        # Initialize contribution data structure
        contribution_data = {
            'total_contributions': 0,
            'contributions_by_day': defaultdict(int),
            'contributions_by_week': [],
            'longest_streak': 0,
            'current_streak': 0,
            'max_contributions': 0,
            'contribution_levels': [],
            'months': []
        }

        # Get all repositories
        repos_url = f'https://api.github.com/users/{username}/repos?per_page=100'
        repos_response = requests.get(repos_url, headers=headers)
        
        if repos_response.status_code == 401:
            return jsonify({'error': 'GitHub token expired'}), 401
            
        repos = repos_response.json()

        # Collect commit data
        for repo in repos:
            if repo['fork']:
                continue

            commits_url = f'https://api.github.com/repos/{username}/{repo["name"]}/commits'
            params = {
                'author': username,
                'since': start_date.isoformat(),
                'until': end_date.isoformat(),
                'per_page': 100
            }

            try:
                commits_response = requests.get(commits_url, headers=headers, params=params)
                if commits_response.ok:
                    commits = commits_response.json()
                    for commit in commits:
                        date = commit['commit']['author']['date'][:10]
                        contribution_data['contributions_by_day'][date] += 1
                        contribution_data['total_contributions'] += 1
            except Exception as e:
                logger.error(f"Error fetching commits for repo {repo['name']}: {str(e)}")
                continue

        # Process contribution data
        dates = sorted(contribution_data['contributions_by_day'].keys())
        if dates:
            # Calculate streaks
            current_streak = 0
            longest_streak = 0
            current_date = datetime.now().date()
            
            for date in reversed(dates):
                date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                if (current_date - date_obj).days <= 1:
                    if contribution_data['contributions_by_day'][date] > 0:
                        current_streak += 1
                        longest_streak = max(longest_streak, current_streak)
                    else:
                        break
                else:
                    break

            contribution_data['current_streak'] = current_streak
            contribution_data['longest_streak'] = longest_streak

            # Calculate contribution levels
            contributions = list(contribution_data['contributions_by_day'].values())
            max_contributions = max(contributions) if contributions else 0
            contribution_data['max_contributions'] = max_contributions
            
            # Define contribution levels (similar to GitHub)
            if max_contributions > 0:
                levels = [
                    0,
                    math.ceil(max_contributions / 4),
                    math.ceil(max_contributions / 2),
                    math.ceil(3 * max_contributions / 4),
                    max_contributions
                ]
                contribution_data['contribution_levels'] = levels

            # Organize data by weeks
            weeks = []
            current_week = []
            for date in dates:
                day_contributions = contribution_data['contributions_by_day'][date]
                current_week.append({
                    'date': date,
                    'count': day_contributions,
                    'level': next(i for i, level in enumerate(contribution_data['contribution_levels'])
                               if day_contributions <= level)
                })
                
                if len(current_week) == 7:
                    weeks.append(current_week)
                    current_week = []
            
            if current_week:
                weeks.append(current_week)
            
            contribution_data['contributions_by_week'] = weeks

            # Add month labels
            months = []
            current_month = None
            for date in dates:
                month = datetime.strptime(date, '%Y-%m-%d').strftime('%b')
                if month != current_month:
                    months.append(month)
                    current_month = month
            
            contribution_data['months'] = months

        return jsonify(contribution_data)
        
    except Exception as e:
        logger.error(f"Error getting GitHub contributions: {str(e)}")
        return jsonify({'error': str(e)}), 500

def calculate_longest_streak(commit_data):
    if not commit_data:
        return 0
        
    dates = sorted(commit_data.keys())
    longest_streak = current_streak = 1
    
    for i in range(1, len(dates)):
        current_date = datetime.strptime(dates[i], '%Y-%m-%d')
        prev_date = datetime.strptime(dates[i-1], '%Y-%m-%d')
        
        if (current_date - prev_date).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        else:
            current_streak = 1
            
    return longest_streak
