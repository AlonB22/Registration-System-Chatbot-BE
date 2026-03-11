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
These are web and mobile app videos for demonstration.

GitHub may not preview larger `.mp4` files inline. Use these direct links:
- Web app demo (download/open): [web_app.mp4](https://github.com/AlonB22/Registration-System-Chatbot/blob/main/frontend/public/web_app.mp4?raw=1)
- Mobile app demo (download/open): [mobile_app.mp4](https://github.com/AlonB22/Registration-System-Chatbot/blob/main/frontend/public/mobile_app.mp4?raw=1)

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

## Watch Chat Log File Changes (Azure Excel)

The chatbot appends rows to an Excel blob in Azure Storage:
- Container: `chatlogs`
- Blob: `AB_Deliveries_Chatbot_Logs.xlsx`

Use a read-only SAS URL so HR/reviewers can track updates without Azure account access.

### Admin: generate read-only SAS URL (one-time share)
```powershell
az storage blob generate-sas `
  --account-name <storage-account> `
  --container-name chatlogs `
  --name AB_Deliveries_Chatbot_Logs.xlsx `
  --permissions r `
  --expiry 2026-12-31T23:59:00Z `
  --https-only `
  --auth-mode key `
  --account-key <account-key> -o tsv
```

Build the full URL and share it:
```text
https://<storage-account>.blob.core.windows.net/chatlogs/AB_Deliveries_Chatbot_Logs.xlsx?<sas-token>
```

Notes:
- Share once, not per file change.
- Send a new URL only when SAS expires or is revoked.

### HR/Reviewer: check file updates
Set the SAS URL:
```powershell
$SAS_URL = "<PASTE_FULL_SAS_URL_HERE>"
```

Check last modified time:
```powershell
(Invoke-WebRequest -Uri $SAS_URL -Method Head).Headers["Last-Modified"]
```

Download latest file:
```powershell
Invoke-WebRequest -Uri $SAS_URL -OutFile ".\AB_Deliveries_Chatbot_Logs.xlsx"
```

Open it:
```powershell
Start-Process ".\AB_Deliveries_Chatbot_Logs.xlsx"
```

### Optional: watch continuously (every 30 seconds)
```powershell
$prev = ""
while ($true) {
  $lm = (Invoke-WebRequest -Uri $SAS_URL -Method Head).Headers["Last-Modified"]
  if ($lm -ne $prev) {
    Write-Host "$(Get-Date -Format s) Updated: $lm"
    Invoke-WebRequest -Uri $SAS_URL -OutFile ".\AB_Deliveries_Chatbot_Logs.xlsx"
    $prev = $lm
  }
  Start-Sleep -Seconds 30
}
```

## What To Review In Code
- Backend API routes: `Backend/app.py`
- Registration/login validation + Mongo insert: `Backend/services/user_service.py`
- Mongo connection config: `Backend/database.py`
- Toast generation service: `ToastServer/server.js`
- Web registration modal + validation: `frontend/src/App.jsx`
- Mobile registration payload + validation: `Mobile/app/(tabs)/index.tsx`
- Chatbot system base prompt:
```text
        "אתה נציג שירות ומכירות של A.B Deliveries.\n"
        "חובות התפקיד שלך:\n"
        "1) שירות לקוחות בנושא סטטוס משלוחים וחבילות.\n"
        "2) תמיכה מכירתית שמעודדת את הלקוח להזמין יותר משלוחים בצורה נעימה ולא אגרסיבית.\n\n"
        "כללי שפה והצגה:\n"
        "- כתוב בעברית בלבד.\n"
        "- גם אם המשתמש כותב באנגלית או שפה אחרת, השב בעברית בלבד.\n"
        "- שמור על ניסוח ברור, ידידותי ומקצועי.\n"
        "- השתמש בפורמט שמתאים ל-RTL (משפטים קצרים, רשימות קצרות כשצריך).\n\n"
        "כללי שירות:\n"
        "- כשמבקשים סטטוס חבילה, מספר המעקב חייב להיות באורך 10 תווים (אותיות/מספרים).\n"
        "- אם אין מספר מעקב תקין, הסבר זאת במפורש ובקש מספר מעקב של 10 תווים.\n"
        "- אם אין מספיק מידע, הסבר מה חסר ובקש את המינימום הנדרש להמשך.\n"
        "- סטטוס המשלוח הוא סימולציה פנימית; ספק סטטוס אפשרי באופן בטוח ואחיד.\n\n"
        "כללי מכירה:\n"
        "- בכל תשובה נסה להוסיף הצעה קצרה ורלוונטית להזמנה נוספת או לשדרוג שירות משלוחים.\n"
        "- הדגש ערך עסקי: חיסכון בזמן, אמינות, איסוף מהיר, ושירות לעסקים.\n"
```


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
