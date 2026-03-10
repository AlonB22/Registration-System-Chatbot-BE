import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from database import get_database_error, init_database, is_database_ready
from services.user_service import login_user, register_user

load_dotenv()

app = Flask(__name__)


def parse_allowed_origins():
    raw_origins = os.getenv("CORS_ALLOWED_ORIGINS", "*").strip()
    if raw_origins == "*" or raw_origins == "":
        return "*"
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


CORS(app, resources={r"/*": {"origins": parse_allowed_origins()}})

# Initialize once on startup, but failures won't crash the app.
init_database()


@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "db_connected": is_database_ready(),
            "db_error": None if is_database_ready() else get_database_error(),
        }
    ), 200


@app.post("/register")
def register():
    service_result = register_user(request.get_json(silent=True))

    if service_result["success"]:
        return jsonify(service_result["data"]), service_result["status_code"]

    return jsonify({"error": service_result["error"]}), service_result["status_code"]


@app.post("/login")
def login():
    service_result = login_user(request.get_json(silent=True))

    if service_result["success"]:
        return jsonify(service_result["data"]), service_result["status_code"]

    return jsonify({"error": service_result["error"]}), service_result["status_code"]


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", debug=debug_mode, port=port)
