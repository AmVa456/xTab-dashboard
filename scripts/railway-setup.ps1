# Railway Deployment Setup Script for xTab-Dashboard (Windows)
# This script automates the entire Railway deployment process

Write-Host "🚀 xTab-Dashboard Railway Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI already installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    Write-Host "✅ Railway CLI installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔐 Logging into Railway..." -ForegroundColor Cyan
railway login

Write-Host ""
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Cyan
Write-Host "   (Select your xTab-dashboard project from the list)" -ForegroundColor Gray
railway link

Write-Host ""
Write-Host "🗄️  Setting up environment variables..." -ForegroundColor Cyan
Write-Host ""

# Generate SESSION_SECRET
$SESSION_SECRET = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "Generated secure SESSION_SECRET (hidden for security)" -ForegroundColor Green

# Set required environment variables
Write-Host "Setting NODE_ENV=production..." -ForegroundColor Yellow
railway variables set NODE_ENV=production

Write-Host "Setting SESSION_SECRET..." -ForegroundColor Yellow
railway variables set SESSION_SECRET="$SESSION_SECRET"

Write-Host ""
Write-Host "📊 Current environment variables:" -ForegroundColor Cyan
railway variables

Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure you have added PostgreSQL database in Railway dashboard:" -ForegroundColor Yellow
Write-Host "   1. Go to your Railway project" -ForegroundColor Gray
Write-Host "   2. Click 'New' → 'Database' → 'Add PostgreSQL'" -ForegroundColor Gray
Write-Host "   3. Wait for it to provision" -ForegroundColor Gray
Write-Host "   4. The DATABASE_URL will be automatically linked" -ForegroundColor Gray
Write-Host ""
$response = Read-Host "Have you added PostgreSQL? (y/n)"

if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "❌ Please add PostgreSQL first, then run this script again" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying application..." -ForegroundColor Cyan
railway up

Write-Host ""
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🗃️  Running database migrations..." -ForegroundColor Cyan
railway run npm run db:push

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 View your application:" -ForegroundColor Cyan
railway open

Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Cyan
Write-Host "   railway logs     - View application logs" -ForegroundColor Gray
Write-Host "   railway run      - Run commands in Railway environment" -ForegroundColor Gray
Write-Host "   railway open     - Open your deployed app" -ForegroundColor Gray
Write-Host "   railway status   - Check deployment status" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Setup complete! Your xTab-Dashboard is now live on Railway!" -ForegroundColor Green
