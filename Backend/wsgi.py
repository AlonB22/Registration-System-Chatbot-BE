from app import app

# Azure App Service (Gunicorn) entrypoint:
# gunicorn --bind=0.0.0.0:$PORT wsgi:app
