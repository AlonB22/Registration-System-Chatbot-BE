import os
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

load_dotenv()

_client: Optional[MongoClient] = None
_db: Optional[Database] = None
_users_collection: Optional[Collection] = None
_last_connection_error: Optional[str] = None


def init_database() -> bool:
    global _client, _db, _users_collection, _last_connection_error

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        _last_connection_error = "MONGO_URI is missing."
        _client = None
        _db = None
        _users_collection = None
        return False

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")

        _client = client
        _db = client[os.getenv("MONGO_DB_NAME", "ElysianDB")]
        _users_collection = _db[os.getenv("MONGO_USERS_COLLECTION", "users")]
        _last_connection_error = None
        return True
    except Exception as error:
        _last_connection_error = str(error)
        _client = None
        _db = None
        _users_collection = None
        return False


def get_db() -> Optional[Database]:
    if _db is None:
        init_database()
    return _db


def get_users_collection() -> Optional[Collection]:
    if _users_collection is None:
        init_database()
    return _users_collection


def is_database_ready() -> bool:
    return get_users_collection() is not None


def get_database_error() -> str:
    if _users_collection is None and _last_connection_error is None:
        init_database()
    return _last_connection_error or "Database connection is not available."

