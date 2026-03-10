# Registration System Chatbot

Full-stack registration project with:
- React web client (`frontend/`)
- React Native (Expo) mobile client (`Mobile/`)
- Flask backend (`Backend/`) deployed on Azure
- Node.js toast microservice (`ToastServer/`) deployed on Azure

## GitHub Repo Description
`Full-stack registration system with React web/mobile clients, Flask + MongoDB auth backend, and an OpenAI-powered toast microservice deployed on Azure.`

## Live Services
- Backend: `https://regsys-backend-alonb.azurewebsites.net`
- Toast server: `https://regsys-toast-alonb.azurewebsites.net`
- Backend health: `https://regsys-backend-alonb.azurewebsites.net/health`
- Toast health: `https://regsys-toast-alonb.azurewebsites.net/health`

## Demo Videos
These are web and mobile app videos for demonstration:
- Web app demo: [frontend/public/web_app.mp4](./frontend/public/web_app.mp4)
- Mobile app demo: [frontend/public/mobile_app.mp4](./frontend/public/mobile_app.mp4)

<video src="./frontend/public/web_app.mp4" controls width="900"></video>
<video src="https://raw.githubusercontent.com/AlonB22/Registration-System-Chatbot/main/frontend/public/web_app.mp4" controls width="600"></video>
<video src="./frontend/public/mobile_app.mp4" controls width="420"></video>

## Quick Verification (No Local Backend Needed)

### 1) Toast service
```powershell
(Invoke-WebRequest -UseBasicParsing "https://regsys-toast-alonb.azurewebsites.net/health").Content
(Invoke-WebRequest -UseBasicParsing "https://regsys-toast-alonb.azurewebsites.net/api/registration-toast").Content
```

### 2) Register with required first/last name
```powershell
$base = "https://regsys-backend-alonb.azurewebsites.net"
$email = "review$(Get-Random)@test.com"
$body = @{ first_name="Alice"; last_name="Smith"; email=$email; password="12345678" } | ConvertTo-Json
(Invoke-WebRequest -UseBasicParsing "$base/register" -Method POST -ContentType "application/json" -Body $body).Content
```

### 3) Login and confirm toast comes through backend
```powershell
$loginBody = @{ email=$email; password="12345678" } | ConvertTo-Json
(Invoke-WebRequest -UseBasicParsing "$base/login" -Method POST -ContentType "application/json" -Body $loginBody).Content
```

Expected behavior:
- registration without names returns `400`
- registration with names returns `201`
- login returns `200`
- responses include a `toast` string

## What To Review In Code
- Backend API routes: `Backend/app.py`
- Registration/login validation + Mongo insert: `Backend/services/user_service.py`
- Mongo connection config: `Backend/database.py`
- Toast generation service: `ToastServer/server.js`
- Web registration modal + validation: `frontend/src/App.jsx`
- Mobile registration payload + validation: `Mobile/app/(tabs)/index.tsx`

## Local Frontend/Mobile (Optional)

If you want to run only client apps against live Azure services:

```bash
cd frontend
npm install
npm run dev
```

```bash
cd Mobile
npm install
npm run start
```

The repo already includes Azure URLs in:
- `frontend/.env`
- `Mobile/.env`

## Notes
- Backend and ToastServer source code are included for transparency, but reviewers do not need to run them locally to validate functionality.
- Deployment details are documented in [DEPLOY_AZURE.md](./DEPLOY_AZURE.md).
