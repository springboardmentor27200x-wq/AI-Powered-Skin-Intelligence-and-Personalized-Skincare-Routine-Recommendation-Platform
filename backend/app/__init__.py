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

    # Create database tables
    with app.app_context():
        db.create_all()

    return app