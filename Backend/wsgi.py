from app import app

# Azure App Service (Gunicorn) entrypoint:
# Run from Backend/ with:
# gunicorn --bind=0.0.0.0:$PORT wsgi:app
