# Azure Deployment Runbook

This runbook deploys:
- `Backend/` (Flask + MongoDB) to Azure App Service (Python)
- `ToastServer/` (Node + OpenAI) to Azure App Service (Node)

## 1. Prerequisites

- Azure CLI installed
- Active Azure subscription
- MongoDB Atlas connection string
- OpenAI API key

Login:

```bash
az login
az account set --subscription "<SUBSCRIPTION_ID>"
```

## 2. Create Resource Group and App Service Plan

```bash
az group create --name rg-regsys --location eastus
az appservice plan create --name plan-regsys --resource-group rg-regsys --is-linux --sku B1
```

## 3. Create Web Apps

Pick globally unique names:
- `<BACKEND_APP_NAME>`
- `<TOAST_APP_NAME>`

```bash
az webapp create --resource-group rg-regsys --plan plan-regsys --name <BACKEND_APP_NAME> --runtime "PYTHON|3.12"
az webapp create --resource-group rg-regsys --plan plan-regsys --name <TOAST_APP_NAME> --runtime "NODE|20-lts"
```

## 4. Configure Backend App Settings

```bash
az webapp config appsettings set --resource-group rg-regsys --name <BACKEND_APP_NAME> --settings \
MONGO_URI="<MONGODB_ATLAS_URI>" \
PORT=8000 \
FLASK_DEBUG=false \
CORS_ALLOWED_ORIGINS="*"
```

Set startup command (Gunicorn):

```bash
az webapp config set --resource-group rg-regsys --name <BACKEND_APP_NAME> \
  --startup-file "gunicorn --bind=0.0.0.0:\$PORT wsgi:app"
```

## 5. Configure Toast Server App Settings

```bash
az webapp config appsettings set --resource-group rg-regsys --name <TOAST_APP_NAME> --settings \
OPENAI_API_KEY="<OPENAI_API_KEY>" \
OPENAI_MODEL="gpt-4.1-mini" \
PORT=8080 \
CORS_ALLOWED_ORIGINS="*"
```

## 6. Deploy Code (ZIP Deploy)

From repository root (PowerShell):

```powershell
Compress-Archive -Path .\Backend\* -DestinationPath .\backend.zip -Force
Compress-Archive -Path .\ToastServer\* -DestinationPath .\toastserver.zip -Force
```

Deploy:

```bash
az webapp deploy --resource-group rg-regsys --name <BACKEND_APP_NAME> --src-path backend.zip --type zip
az webapp deploy --resource-group rg-regsys --name <TOAST_APP_NAME> --src-path toastserver.zip --type zip
```

## 7. Verify

```bash
curl https://<BACKEND_APP_NAME>.azurewebsites.net/health
curl https://<TOAST_APP_NAME>.azurewebsites.net/health
```

## 8. Point Clients to Azure URLs

Frontend `.env`:

```env
VITE_BACKEND_URL=https://<BACKEND_APP_NAME>.azurewebsites.net
VITE_TOAST_SERVER_URL=https://<TOAST_APP_NAME>.azurewebsites.net
```

Mobile `.env`:

```env
EXPO_PUBLIC_BACKEND_URL=https://<BACKEND_APP_NAME>.azurewebsites.net
EXPO_PUBLIC_TOAST_SERVER_URL=https://<TOAST_APP_NAME>.azurewebsites.net
```

