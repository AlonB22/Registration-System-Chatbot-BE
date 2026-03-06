import requests

# הכתובת של השרת שלך
url = 'http://127.0.0.1:5000/register'

# נתונים שאנחנו "ממציאים" כדי לבדוק את המערכת
test_user = {
    "first_name": "Alon",
    "last_name": "Berla",
    "email": "test@gmail.com",
    "status": "Checking if it works!"
}

print("sending test registration data to the server...")

try:
    # שליחת הבקשה לשרת
    response = requests.post(url, json=test_user)
    
    # הדפסת התשובה מהשרת
    print(f"status: {response.status_code}")
    print(f"server response: {response.json()}")
except Exception as e:
    print(f"oops, something went wrong:{e}")