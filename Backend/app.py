import os
from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
    
    db = client['ElysianDB']
    users_collection = db['users']
except Exception as e:
    print(f"Connection error: {e}")

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data sent"}), 400
            
        result = users_collection.insert_one(data)
        
        return jsonify({
            "message": "User registered successfully!",
            "id": str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)