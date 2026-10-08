import os
import sys

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def setup_database():
    from app.core.config import settings
    from app.db.session import init_mongo, ensure_indexes
    from app.db.init_db import init_db

    try:
        db = init_mongo()
        ensure_indexes(db)
        init_db()
        print(f"MongoDB setup completed successfully on {settings.MONGO_URI}/{settings.MONGO_DB_NAME}")
        return True
    except Exception as e:
        print(f"Error setting up MongoDB: {e}")
        return False

if __name__ == "__main__":
    setup_database()
