import os
import re
from typing import Any, Dict, Tuple

import requests
from requests import RequestException

from database import get_database_error, get_users_collection, is_database_ready

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DEFAULT_REGISTER_TOAST = "Registration complete. Welcome aboard."
DEFAULT_LOGIN_TOAST = "Welcome back."
USER_NOT_FOUND_MESSAGE = "User not found. Please register to log in."


def _validate_auth_payload(payload: Dict[str, Any] | None) -> Tuple[bool, Dict[str, Any]]:
    if not payload:
        return False, {"error": "No data sent", "status_code": 400}

    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", "")).strip()

    if not email or not password:
        return False, {"error": "Email and password are required", "status_code": 400}

    if not EMAIL_PATTERN.match(email):
        return False, {"error": "Invalid email format", "status_code": 400}

    return True, {"email": email, "password": password}


def _fetch_toast_message(endpoint_path: str, fallback_message: str) -> str:
    toast_base_url = os.getenv("TOAST_SERVER_URL", "http://localhost:3001").rstrip("/")
    endpoint = f"{toast_base_url}{endpoint_path}"

    try:
        response = requests.get(endpoint, timeout=5)
        if response.ok:
            payload = response.json()
            message = payload.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
    except (RequestException, ValueError):
        pass

    return fallback_message


def _fetch_registration_toast_message() -> str:
    return _fetch_toast_message("/api/registration-toast", DEFAULT_REGISTER_TOAST)


def _fetch_login_toast_message() -> str:
    return _fetch_toast_message("/api/login-toast", DEFAULT_LOGIN_TOAST)


def register_user(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    if not is_database_ready():
        return {
            "success": False,
            "status_code": 503,
            "error": f"Database is not connected. {get_database_error()}",
        }

    is_valid, result = _validate_auth_payload(payload)
    if not is_valid:
        return {
            "success": False,
            "status_code": result["status_code"],
            "error": result["error"],
        }

    password = result["password"]
    if len(password) < 6:
        return {
            "success": False,
            "status_code": 400,
            "error": "Password must be at least 6 characters",
        }

    users_collection = get_users_collection()
    if users_collection is None:
        return {
            "success": False,
            "status_code": 503,
            "error": f"Database is not connected. {get_database_error()}",
        }

    try:
        if users_collection.find_one({"email": result["email"]}):
            return {
                "success": False,
                "status_code": 409,
                "error": "User already exists.",
            }

        insert_result = users_collection.insert_one(
            {
                "email": result["email"],
                "password": password,
            }
        )

        return {
            "success": True,
            "status_code": 201,
            "data": {
                "message": "User registered successfully!",
                "id": str(insert_result.inserted_id),
                "toast": _fetch_registration_toast_message(),
            },
        }
    except Exception as error:
        return {
            "success": False,
            "status_code": 500,
            "error": f"Registration failed. {error}",
        }


def login_user(payload: Dict[str, Any] | None) -> Dict[str, Any]:
    if not is_database_ready():
        return {
            "success": False,
            "status_code": 503,
            "error": f"Database is not connected. {get_database_error()}",
        }

    is_valid, result = _validate_auth_payload(payload)
    if not is_valid:
        return {
            "success": False,
            "status_code": result["status_code"],
            "error": result["error"],
        }

    users_collection = get_users_collection()
    if users_collection is None:
        return {
            "success": False,
            "status_code": 503,
            "error": f"Database is not connected. {get_database_error()}",
        }

    try:
        user = users_collection.find_one({"email": result["email"]})
        if not user:
            return {"success": False, "status_code": 404, "error": USER_NOT_FOUND_MESSAGE}

        stored_password = str(user.get("password", ""))
        if stored_password != result["password"]:
            return {"success": False, "status_code": 404, "error": USER_NOT_FOUND_MESSAGE}

        return {
            "success": True,
            "status_code": 200,
            "data": {
                "message": "Login successful",
                "id": str(user["_id"]),
                "toast": _fetch_login_toast_message(),
            },
        }
    except Exception as error:
        return {
            "success": False,
            "status_code": 500,
            "error": f"Login failed. {error}",
        }
