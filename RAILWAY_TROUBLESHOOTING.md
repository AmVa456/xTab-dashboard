# Railway Troubleshooting Guide

This guide helps you diagnose and fix common issues when deploying xTab Dashboard to Railway.

## Table of Contents

- [Accessing Railway Logs](#accessing-railway-logs)
- [Environment Variables](#environment-variables)
- [Common Deployment Errors](#common-deployment-errors)
- [Database Issues](#database-issues)
- [Build Failures](#build-failures)
- [Runtime Errors](#runtime-errors)
- [Health Check Failures](#health-check-failures)
- [Module Resolution Errors](#module-resolution-errors)

---

## Accessing Railway Logs

Logs are your best friend for debugging Railway deployments.

### Via Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your application service
3. Click **"Deployments"** tab
4. Select the most recent deployment
5. Click **"View Logs"** or **"Build Logs"**

### Via Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs in real-time
railway logs

# View logs with follow mode
railway logs --follow
```

---

## Environment Variables

### How to Check Environment Variables

**Via Railway Dashboard:**
1. Click on your service
2. Go to **"Variables"** tab
3. Review all set variables

**Via Railway CLI:**
```bash
railway variables
```

### Required Environment Variables

| Variable | Required | Description | How to Set |
|----------|----------|-------------|------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Automatically set when you add PostgreSQL service |
| `SESSION_SECRET` | ✅ Yes | Secret key for sessions (32+ chars) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | ⚠️ Recommended | Set to `production` | Manually set in Variables tab |
| `PORT` | ℹ️ Auto-set | Application port | Railway sets this automatically |

### Optional Environment Variables (AI Features)

| Variable | Description | How to Get |
|----------|-------------|------------|
| `AI_FEATURES_ENABLED` | Enable AI features | Set to `true` or `false` |
| `GEMINI_API_KEY` | Google Gemini API key | [Get from Google AI Studio](https://makersuite.google.com/app/apikey) |
| `OPENAI_API_KEY` | OpenAI API key | [Get from OpenAI Platform](https://platform.openai.com/api-keys) |
| `MONGODB_URL` | MongoDB for hashtag caching | Your MongoDB connection string |

### Common Environment Variable Issues

#### Missing SESSION_SECRET

**Error Message:**
```
❌ Missing required environment variables: SESSION_SECRET
```

**Solution:**
1. Generate a secure secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Add to Railway:
   - Go to Variables tab
   - Click "New Variable"
   - Name: `SESSION_SECRET`
   - Value: (paste the generated secret)
   - Click "Add"

#### Missing DATABASE_URL

**Error Message:**
```
❌ Missing required environment variables: DATABASE_URL
```

**Solution:**
1. Add PostgreSQL database to your Railway project:
   - In your project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Wait for it to provision (usually 1-2 minutes)
   - `DATABASE_URL` will be automatically added to your service

2. If PostgreSQL is already added but `DATABASE_URL` is missing:
   - Delete the existing PostgreSQL service
   - Add it again
   - Or manually copy the connection string from the PostgreSQL service variables

---

## Common Deployment Errors

### Error: "Application failed to respond"

**Symptoms:**
- Deployment shows as "Failed" or "Crashed"
- Health check endpoint returns 500 or no response
- Logs show startup errors

**Debugging Steps:**

1. **Check the logs** for the actual error message:
   ```bash
   railway logs
   ```

2. **Verify environment variables** are set (see [Environment Variables](#environment-variables))

3. **Check the port binding:**
   - Railway automatically sets the `PORT` environment variable
   - The app should listen on `process.env.PORT` (it does by default)
   - Don't override or hardcode the port

4. **Verify database connection:**
   ```bash
   railway run npm run db:push
   ```

### Error: "Build failed"

**Symptoms:**
- Build logs show errors
- Deployment never reaches "Running" state

**Common Causes:**

1. **Missing dependencies in package.json**
   - Make sure all dependencies are in `package.json`, not just `node_modules`

2. **TypeScript errors**
   - Run `npm run check` locally to find type errors
   - Fix all TypeScript errors before deploying

3. **Out of memory during build**
   - Upgrade your Railway plan for more build resources
   - Or optimize your build process

### Error: "Module not found" or Module Resolution Errors

**Error Message:**
```
Error: Cannot find module '@shared/schema'
```

**Solution:**
This should be fixed in the current version. The build script now properly bundles all shared code into the output. If you still see this error:

1. **Verify the build completed successfully:**
   ```bash
   npm run build
   ls -la dist/
   ```
   You should see `dist/index.js` with the bundled code.

2. **Check that the Dockerfile doesn't have unnecessary copies:**
   The Dockerfile should copy `dist/` but NOT copy `shared/` separately (as it's already bundled).

3. **Redeploy after verifying the fix:**
   ```bash
   git add .
   git commit -m "Fix module resolution"
   git push
   ```

---

## Database Issues

### Database Connection Failures

**Error Message:**
```
Error: connect ECONNREFUSED
Error: Connection terminated unexpectedly
```

**Solutions:**

1. **Verify PostgreSQL service is running:**
   - Check Railway dashboard
   - PostgreSQL service should show "Active" status

2. **Verify DATABASE_URL is set:**
   ```bash
   railway variables | grep DATABASE_URL
   ```

3. **Test database connection:**
   ```bash
   railway run npm run db:push
   ```

### Database Migrations Not Running

**Symptoms:**
- App starts but database tables don't exist
- Queries fail with "relation does not exist"

**Solution:**

Run migrations manually:

```bash
# Using Railway CLI
railway run npm run db:push

# Or from Railway Dashboard
# Go to Settings → Deploy → Custom Start Command
# Temporarily change to: npm run db:push && npm run start
# Deploy once, then change back to: npm run start
```

### Database Reset (Nuclear Option)

If your database is in a bad state:

⚠️ **WARNING: This will delete ALL data**

```bash
# Using Railway CLI
railway run npm run db:push

# Or delete and recreate PostgreSQL service in Railway dashboard
```

---

## Build Failures

### TypeScript Build Errors

**Error Message:**
```
error TS2xxx: [various TypeScript errors]
```

**Solution:**

1. Run type check locally:
   ```bash
   npm run check
   ```

2. Fix all TypeScript errors in your code

3. Commit and push the fixes

### esbuild Bundling Errors

**Error Message:**
```
✘ [ERROR] Could not resolve "..."
```

**Solution:**

1. Verify the import path is correct
2. Check that the imported module exists
3. For external packages, ensure they're in `dependencies` (not `devDependencies`)

### Vite Build Errors

**Error Message:**
```
[vite] Error: Transform failed
```

**Solution:**

1. Clear local cache and rebuild:
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. Check for syntax errors in client-side code

3. Verify all imported components exist

---

## Runtime Errors

### Application Crashes After Startup

**Symptoms:**
- Build succeeds
- App starts then immediately crashes
- Logs show runtime errors

**Debugging Steps:**

1. **Check the crash logs:**
   ```bash
   railway logs | grep -i error
   ```

2. **Common runtime issues:**
   - Uncaught exceptions
   - Promise rejections
   - Invalid environment variable values
   - Database connection failures

3. **Test locally in production mode:**
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm run start
   ```

### Memory Issues

**Symptoms:**
- "JavaScript heap out of memory" errors
- App crashes randomly under load

**Solutions:**

1. **Upgrade Railway plan** for more memory

2. **Optimize code:**
   - Fix memory leaks
   - Reduce in-memory caching
   - Optimize database queries

3. **Set Node.js memory limit** (if needed):
   In Railway Variables, add:
   ```
   NODE_OPTIONS=--max-old-space-size=2048
   ```

---

## Health Check Failures

### /api/health Returns 500

**Symptoms:**
```
GET /api/health → 500 Internal Server Error
```

**Debugging:**

1. **Check logs for the actual error:**
   ```bash
   railway logs | grep health
   ```

2. **Common causes:**
   - Database connection failed
   - Required services (cache, hashtag) failed to initialize
   - Environment variables missing

3. **Test health endpoint locally:**
   ```bash
   curl http://localhost:5000/api/health
   ```

### /api/health Times Out or No Response

**Symptoms:**
- Request hangs
- No response from health endpoint

**Solutions:**

1. **Verify the app is actually running:**
   ```bash
   railway logs | grep "serving on port"
   ```
   You should see: `serving on port XXXX`

2. **Check Railway port configuration:**
   - Railway should auto-set `PORT` variable
   - App listens on `process.env.PORT || 5000`

3. **Check firewall rules:**
   - Railway automatically handles this
   - But verify no custom networking configuration is blocking requests

---

## Module Resolution Errors

### "Cannot find module" Errors in Production

**Error Message:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/shared/schema'
```

**Why This Happens:**
- esbuild with `--packages=external` doesn't bundle local path aliases by default
- The `@shared/*` imports need to be either bundled or path-mapped correctly

**Solution:**
This is now fixed in the build configuration:

1. **Verify the fix is in place:**
   - Check that `dist/index.js` includes the shared code
   - Run: `grep "insertPostSchema" dist/index.js`
   - Should find the schema definitions in the bundle

2. **If still seeing errors, verify:**
   - The build completed successfully: `npm run build`
   - The Dockerfile doesn't copy `shared/` folder unnecessarily
   - Railway is using the latest code (redeploy if needed)

### Path Alias Resolution Issues

**If using custom path aliases:**

1. **Ensure tsconfig.json paths are correct:**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./client/src/*"],
         "@shared/*": ["./shared/*"]
       }
     }
   }
   ```

2. **For server-side code:**
   - Path aliases need to be resolved at build time
   - esbuild bundles everything, resolving paths automatically

3. **For client-side code:**
   - Vite handles path resolution via `vite.config.ts`

---

## Testing Your Deployment

### Step-by-Step Verification

After fixing issues, verify your deployment works:

#### 1. Check Health Endpoint

```bash
curl https://your-app.railway.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.456,
  "environment": "production"
}
```

#### 2. Check Frontend

Visit: `https://your-app.railway.app/`

**Should see:**
- xTab Dashboard interface loads
- No console errors (check browser DevTools)
- Can navigate between pages

#### 3. Check API Endpoints

```bash
# Test platforms endpoint
curl https://your-app.railway.app/api/platforms

# Test posts endpoint
curl https://your-app.railway.app/api/posts
```

**Expected:**
- Should return JSON (may be empty arrays initially)
- No 500 errors

#### 4. Check Database Connection

```bash
railway run npm run db:push
```

**Expected:**
- No errors
- "✓ Success" message

#### 5. Check Logs for Errors

```bash
railway logs --follow
```

**Should see:**
- "serving on port XXXX"
- No error messages during startup
- API requests logging correctly

---

## Getting More Help

If you're still stuck after trying these solutions:

### 1. Check Railway Status

Visit: https://status.railway.app/

Railway may be experiencing issues.

### 2. Review Railway Documentation

- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### 3. Check Application Logs Thoroughly

```bash
# Get all logs
railway logs > railway-logs.txt

# Search for specific errors
cat railway-logs.txt | grep -i error
cat railway-logs.txt | grep -i warning
```

### 4. Enable Debug Logging

Add to Railway Variables:
```
DEBUG=*
LOG_LEVEL=debug
```

Redeploy and check logs again.

### 5. Test Locally in Production Mode

```bash
# Set environment variables
export NODE_ENV=production
export DATABASE_URL="your-database-url"
export SESSION_SECRET="your-secret"

# Build and run
npm run build
npm run start
```

If it works locally but not on Railway, the issue is likely:
- Environment variables not set correctly
- Port configuration
- Railway-specific build issues

### 6. Open an Issue

If nothing works, open an issue on the GitHub repository with:
- Description of the problem
- Railway logs (sanitized of secrets)
- Steps you've already tried
- Your Railway configuration

---

## Prevention Tips

### Before Deploying

✅ **Always test locally first:**
```bash
npm run build && npm run start
```

✅ **Run type checking:**
```bash
npm run check
```

✅ **Test with production environment variables**

✅ **Verify all dependencies are in package.json**

### After Deploying

✅ **Check health endpoint immediately**

✅ **Review logs for any warnings**

✅ **Test critical functionality**

✅ **Monitor for the first 30 minutes**

### Ongoing Maintenance

✅ **Monitor Railway usage dashboard**

✅ **Set up external uptime monitoring** (e.g., UptimeRobot)

✅ **Keep dependencies updated:**
```bash
npm update
npm audit fix
```

✅ **Review logs periodically for warnings**

---

## Quick Reference Commands

```bash
# Railway CLI commands
railway login                    # Login to Railway
railway link                     # Link to project
railway logs                     # View logs
railway logs --follow            # Follow logs in real-time
railway variables                # List environment variables
railway run npm run db:push      # Run migrations
railway up                       # Deploy
railway open                     # Open app in browser
railway status                   # Check deployment status

# Local testing
npm run build                    # Build for production
npm run start                    # Start production server
npm run check                    # Type checking
npm run db:push                  # Push database schema

# Windows-specific
npm run railway:setup:windows    # Run Railway setup on Windows
```

---

**Last Updated:** January 2026

For setup instructions, see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) or [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md).
