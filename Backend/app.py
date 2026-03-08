import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

load_dotenv()

app = Flask(__name__)


def parse_allowed_origins():
    raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").strip()
    if raw_origins == "*" or raw_origins == "":
        return "*"
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


CORS(app, resources={r"/*": {"origins": parse_allowed_origins()}})

MONGO_URI = os.getenv("MONGO_URI")
users_collection = None

if not MONGO_URI:
    print("MONGO_URI is missing. Database connection is disabled.")
else:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        print("Successfully connected to MongoDB!")

        db = client["ElysianDB"]
        users_collection = db["users"]
    except Exception as error:
        print(f"Connection error: {error}")


def db_not_ready_response():
    return jsonify({"error": "Database is not connected."}), 503


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "db_connected": users_collection is not None,
        }
    ), 200


@app.post("/register")
def register():
    if users_collection is None:
        return db_not_ready_response()

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data sent"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User already exists."}), 409

        result = users_collection.insert_one({"email": email, "password": password})

        return (
            jsonify(
                {
                    "message": "User registered successfully!",
                    "id": str(result.inserted_id),
                }
            ),
            201,
        )
    except Exception as error:
        print(f"Error during registration: {error}")
        return jsonify({"error": str(error)}), 500


@app.post("/login")
def login():
    if users_collection is None:
        return db_not_ready_response()

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data sent"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = users_collection.find_one({"email": email, "password": password})
        if not user:
            return jsonify({"error": "User not found. Please register to log in."}), 404

        return jsonify({"message": "Login successful", "id": str(user["_id"])}), 200
    except Exception as error:
        print(f"Error during login: {error}")
        return jsonify({"error": str(error)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", debug=debug_mode, port=port)
