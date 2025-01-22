from flask import Flask
from flask_cors import CORS
from routes.skill_routes import skill_routes

app = Flask(__name__)
CORS(app)

app.register_blueprint(skill_routes)

if __name__ == "__main__":
    app.run(debug=True)
