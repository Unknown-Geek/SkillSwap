from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from routes.skill_routes import skill_routes
from models import db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///skillswap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

app.register_blueprint(skill_routes)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
