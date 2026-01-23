# Railway Deployment Guide

## 🚀 Quick Setup (Automated)

**Fastest way to deploy - just run one script!**

See [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md) for the automated setup guide.

### TL;DR:
```bash
# 1. Create Railway project and add PostgreSQL
# 2. Run setup script:
npm run railway:setup
```

---

## 📖 Manual Setup (Step-by-Step)

If you prefer to set up Railway manually, follow the detailed instructions below.

This guide will help you deploy the xTab Dashboard application to Railway.

## Prerequisites

- A [Railway account](https://railway.app/) (free tier available)
- A GitHub account with access to this repository
- Basic understanding of environment variables and PostgreSQL

## Overview

Railway is a modern Platform-as-a-Service (PaaS) that makes deployment straightforward. This application uses:
- **Nixpacks** for automatic build detection (preferred by Railway)
- **Dockerfile** as fallback build method
- **PostgreSQL** for data storage
- **Node.js 20** runtime

## Quick Deployment Steps

### 1. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account if needed
5. Select the `xTab-dashboard` repository

### 2. Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically:
   - Create a PostgreSQL instance
   - Generate a `DATABASE_URL` environment variable
   - Link it to your application

### 3. Configure Environment Variables

Railway will need the following environment variables. Click on your application service, then go to the **"Variables"** tab:

#### Required Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_URL` | PostgreSQL connection string | *Auto-set by Railway when you add PostgreSQL* |
| `SESSION_SECRET` | Secret key for session management | `your-random-secret-key-at-least-32-chars` |
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Application port | *Auto-set by Railway (usually 5000)* |

#### Optional Variables (AI Features)

These are only needed if you want to enable AI-powered features:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `AI_FEATURES_ENABLED` | Enable AI features | `true` or `false` |
| `GEMINI_API_KEY` | Google Gemini API key | [Get from Google AI Studio](https://makersuite.google.com/app/apikey) |
| `OPENAI_API_KEY` | OpenAI API key for image generation | [Get from OpenAI Platform](https://platform.openai.com/api-keys) |
| `MONGODB_URL` | MongoDB connection string for caching | Your MongoDB Atlas or local URL |

#### How to Set Environment Variables in Railway

1. Click on your application service in Railway dashboard
2. Go to the **"Variables"** tab
3. Click **"New Variable"**
4. Add each variable name and value
5. Click **"Add"**

**Important:** For `SESSION_SECRET`, generate a secure random string:
```bash
# Generate a random secret (run this locally)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Deploy the Application

Railway will automatically deploy when you:
- Push to the connected branch (usually `main`)
- Manually trigger a deployment from the dashboard

The build process will:
1. Install dependencies (`npm ci`)
2. Build the application (`npm run build`)
3. Start the server (`npm run start`)

### 5. Run Database Migrations

After the first deployment, you need to push the database schema:

**Option A: Using Railway CLI** (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run npm run db:push
   ```

**Option B: Using Railway Dashboard**

1. Go to your application service in Railway
2. Click on **"Deployments"** tab
3. Find the most recent deployment
4. Click the three dots menu → **"View Logs"**
5. You can manually trigger migrations by redeploying with a custom command (not recommended for first-time setup)

**Option C: One-time Deployment Command**

For the initial migration, you can modify your Railway service temporarily:
1. Go to **"Settings"** → **"Deploy"**
2. Override the start command with: `npm run db:push && npm run start`
3. Deploy once
4. Then change it back to just: `npm run start`

### 6. Verify Deployment

Once deployed, Railway will provide you with a URL (e.g., `https://your-app.railway.app`).

**Test these endpoints:**

1. **Health Check**: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"ok","timestamp":...}`

2. **Frontend**: `https://your-app.railway.app/`
   - Should load the xTab Dashboard interface

3. **API**: `https://your-app.railway.app/api/platforms`
   - Should return platform data (may be empty initially)

## Build Configuration

Railway can use either Nixpacks (preferred) or Docker for building your application.

### Using Nixpacks (Default)

Railway will automatically detect the `nixpacks.toml` file and use it for building.

Configuration in `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs-20_x"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

### Using Docker (Alternative)

If you prefer Docker, Railway will automatically detect the `Dockerfile`.

To force Docker builds:
1. Go to **"Settings"** → **"Deploy"**
2. Under **"Build Configuration"**, select **"Dockerfile"**

## Troubleshooting

### Application won't start

**Check logs:**
1. Go to your Railway project
2. Click on your service
3. Click **"Deployments"** → Select latest deployment → **"View Logs"**

**Common issues:**
- Missing `DATABASE_URL`: Make sure PostgreSQL is added and linked
- Port binding: Railway automatically sets `PORT` - don't override it
- Build failures: Check that all dependencies are in `package.json`

### Database connection errors

**Verify:**
- PostgreSQL service is running in your Railway project
- `DATABASE_URL` is set in environment variables
- Database migrations have been run (`npm run db:push`)

**Check the connection:**
```bash
# Using Railway CLI
railway run npm run db:push
```

### Build timeouts

If your build is timing out:
1. Check the build logs for specific errors
2. Ensure your `package.json` scripts are correct
3. Try reducing dependencies or optimizing build steps

### Environment variable not updating

After changing environment variables:
1. You may need to **redeploy** the application
2. Click **"Deploy"** → **"Redeploy"** in Railway dashboard

## Monitoring and Logs

### View Real-time Logs

1. Go to your service in Railway
2. Click on **"Deployments"**
3. Select a deployment
4. Click **"View Logs"**

### Health Check Endpoint

The application includes a health check endpoint at `/api/health`:

```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.456,
  "environment": "production"
}
```

You can use this for:
- External monitoring services
- Railway health checks
- Load balancer health checks

## Custom Domain

To add a custom domain:

1. Go to **"Settings"** → **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain name
4. Follow DNS configuration instructions
5. Railway will automatically provision SSL certificates

## Scaling

Railway automatically scales your application:
- **Horizontal scaling**: Add more instances in Settings
- **Vertical scaling**: Upgrade your plan for more resources

## Cost Considerations

Railway offers:
- **Hobby Plan**: Free tier with $5 credit per month
- **Pro Plan**: $20/month base + usage-based pricing
- **Database**: Additional charges based on usage

Monitor your usage in the **"Usage"** tab of your Railway dashboard.

## Database Backups

Railway automatically backs up PostgreSQL databases:
- **Hobby Plan**: Daily backups (7-day retention)
- **Pro Plan**: Hourly backups (30-day retention)

To restore a backup:
1. Go to your PostgreSQL service
2. Click **"Backups"**
3. Select a backup and restore

## CI/CD Integration

Railway automatically deploys when you push to your connected branch.

**To customize:**
1. Go to **"Settings"** → **"Deploy"**
2. Configure:
   - **Branch**: Which branch to deploy from
   - **Root Directory**: If your app is in a subdirectory
   - **Build Command**: Override the default build
   - **Start Command**: Override the default start

## Support and Resources

- **Railway Documentation**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app/
- **Project Repository**: https://github.com/AmVa456/xTab-dashboard

## Local Development vs Production

**Local Development:**
```bash
npm run dev  # Runs on http://localhost:5000
```

**Production (Railway):**
```bash
npm run build  # Build client and server
npm run start  # Start production server
```

**Key Differences:**
- Development uses Vite dev server with HMR
- Production serves pre-built static files
- Production requires `DATABASE_URL` to be set
- Railway automatically sets `PORT` environment variable

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong `SESSION_SECRET`** - At least 32 random characters
3. **Rotate secrets regularly** - Update in Railway variables
4. **Monitor logs** - Check for suspicious activity
5. **Keep dependencies updated** - Run `npm update` regularly

## Next Steps

After successful deployment:

1. **Test all features** - Create posts, check analytics
2. **Enable AI features** (optional) - Add API keys if needed
3. **Set up custom domain** (optional) - For professional branding
4. **Configure monitoring** - Set up external uptime monitoring
5. **Plan for scaling** - Monitor usage and upgrade plan as needed

---

**Need help?** Open an issue on the GitHub repository or check Railway documentation.
