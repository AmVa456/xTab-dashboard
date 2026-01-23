#!/bin/bash

# Railway Deployment Setup Script for xTab-Dashboard
# This script automates the entire Railway deployment process

set -e  # Exit on error

echo "🚀 xTab-Dashboard Railway Setup"
echo "================================"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "🔐 Logging into Railway..."
railway login

echo ""
echo "🔗 Linking to Railway project..."
echo "   (Select your xTab-dashboard project from the list)"
railway link

echo ""
echo "🗄️  Setting up environment variables..."
echo ""

# Generate SESSION_SECRET
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated secure SESSION_SECRET (hidden for security)"

# Set required environment variables
echo "Setting NODE_ENV=production..."
railway variables set NODE_ENV=production

echo "Setting SESSION_SECRET..."
railway variables set SESSION_SECRET="$SESSION_SECRET"

echo ""
echo "📊 Current environment variables:"
railway variables

echo ""
echo "⚠️  IMPORTANT: Make sure you have added PostgreSQL database in Railway dashboard:"
echo "   1. Go to your Railway project"
echo "   2. Click 'New' → 'Database' → 'Add PostgreSQL'"
echo "   3. Wait for it to provision"
echo "   4. The DATABASE_URL will be automatically linked"
echo ""
read -p "Have you added PostgreSQL? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please add PostgreSQL first, then run this script again"
    exit 1
fi

echo ""
echo "🚀 Deploying application..."
railway up

echo ""
echo "⏳ Waiting for deployment to complete..."
sleep 10

echo ""
echo "🗃️  Running database migrations..."
railway run npm run db:push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 View your application:"
railway open

echo ""
echo "📋 Useful commands:"
echo "   railway logs     - View application logs"
echo "   railway run      - Run commands in Railway environment"
echo "   railway open     - Open your deployed app"
echo "   railway status   - Check deployment status"
echo ""
echo "🎉 Setup complete! Your xTab-Dashboard is now live on Railway!"
