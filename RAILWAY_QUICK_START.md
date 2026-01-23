# Railway Quick Start Guide

## Automated Setup (Recommended)

### Prerequisites
1. Create a [Railway account](https://railway.app/)
2. Create a new Railway project and link your GitHub repository
3. Add PostgreSQL database to your Railway project:
   - Click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Wait for provisioning to complete

### Run Setup Script

#### macOS/Linux:
```bash
chmod +x scripts/railway-setup.sh
./scripts/railway-setup.sh
```

#### Windows (PowerShell):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\railway-setup.ps1
```

The script will:
- ✅ Install Railway CLI
- ✅ Login to Railway
- ✅ Link to your project
- ✅ Generate secure SESSION_SECRET
- ✅ Set environment variables
- ✅ Deploy your application
- ✅ Run database migrations

## Manual Setup

If you prefer manual setup, follow these commands:

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login and Link Project
```bash
railway login
railway link
```

### 3. Set Environment Variables
```bash
# Generate session secret
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set variables
railway variables set NODE_ENV=production
railway variables set SESSION_SECRET="$SESSION_SECRET"
```

### 4. Deploy
```bash
railway up
```

### 5. Run Database Migrations
```bash
railway run npm run db:push
```

### 6. Open Your App
```bash
railway open
```

## Troubleshooting

### View Logs
```bash
railway logs
```

### Check Status
```bash
railway status
```

### Re-run Migrations
```bash
railway run npm run db:push
```

### List Environment Variables
```bash
railway variables
```

## Adding AI Features (Optional)

If you want to enable AI-powered features:

```bash
railway variables set AI_FEATURES_ENABLED=true
railway variables set GEMINI_API_KEY="your-gemini-api-key"
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set MONGODB_URL="your-mongodb-connection-string"
```

Get API keys:
- **Gemini**: https://makersuite.google.com/app/apikey
- **OpenAI**: https://platform.openai.com/api-keys
- **MongoDB**: https://www.mongodb.com/cloud/atlas

## Need Help?

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: https://github.com/AmVa456/xTab-dasboard/issues
