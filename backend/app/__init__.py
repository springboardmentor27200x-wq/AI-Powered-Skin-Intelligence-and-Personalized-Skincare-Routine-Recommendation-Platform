from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Secret key for JWT
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-later")
    from datetime import timedelta
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=30)
    
    # Database
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        "postgresql://postgres:postgres123@localhost:5432/skin_intelligence"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Allow React frontend to talk to this backend
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)

    # Import and register routes
    from app.routes import main
    app.register_blueprint(main)

    # ===== NEW: Register Reports blueprint =====
    from app.reports import reports_bp
    app.register_blueprint(reports_bp)
    # ==========================================

    # Create database tables and seed initial demo accounts if empty
    with app.app_context():
        db.create_all()
        try:
            from app.models import User
            from werkzeug.security import generate_password_hash
            if User.query.count() == 0:
                demo_user = User(
                    name="Demo User",
                    email="user@test.com",
                    password=generate_password_hash("password123"),
                    role="user"
                )
                demo_doc = User(
                    name="Dr. Sarah Connor",
                    email="doctor@test.com",
                    password=generate_password_hash("password123"),
                    role="dermatologist"
                )
                demo_admin = User(
                    name="Admin",
                    email="admin@test.com",
                    password=generate_password_hash("password123"),
                    role="admin"
                )
                db.session.add_all([demo_user, demo_doc, demo_admin])
                db.session.commit()
        except Exception:
            pass

    return app