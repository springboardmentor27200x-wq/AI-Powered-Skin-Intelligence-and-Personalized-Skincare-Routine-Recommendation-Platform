import os
import pymongo
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

mongo_client = None
active_db = None
is_mock = False

def init_mongo():
    global mongo_client, active_db, is_mock
    try:
        client = pymongo.MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        mongo_client = client
        active_db = mongo_client[settings.MONGO_DB_NAME]
        is_mock = False
        ensure_indexes(active_db)
    except Exception:
        import mongomock
        mongo_client = mongomock.MongoClient()
        active_db = mongo_client[settings.MONGO_DB_NAME]
        is_mock = True
        ensure_indexes(active_db)
    return active_db

def ensure_indexes(db):
    try:
        db["users"].create_index("email", unique=True)
        db["users"].create_index("id", unique=True)
        db["skin_profiles"].create_index("user_id", unique=True)
        db["skin_profiles"].create_index("id", unique=True)
        db["lifestyle_logs"].create_index([("user_id", 1), ("log_date", 1)], unique=True)
        db["sleep_logs"].create_index([("user_id", 1), ("log_date", 1)], unique=True)
        db["hydration_logs"].create_index([("user_id", 1), ("log_date", 1)], unique=True)
        db["environment_logs"].create_index([("user_id", 1), ("log_date", 1)], unique=True)
    except Exception:
        pass

def get_next_id(db, collection_name: str) -> int:
    last = db[collection_name].find_one(sort=[("id", -1)])
    if last and "id" in last and isinstance(last["id"], int):
        return last["id"] + 1
    return 1

init_mongo()

def get_db():
    global active_db
    if active_db is None:
        init_mongo()
    yield active_db
