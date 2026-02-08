#!/bin/bash
# HelloPeople Dashboard - Quick Deploy Script

set -e

echo "🚀 HelloPeople Dashboard - Quick Deploy"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from hellopeople-dashboard directory"
    exit 1
fi

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo ""
echo "✅ Prerequisites met!"
echo ""
echo "📋 Deployment Checklist:"
echo "  1. Database migration run? (See FRONTEND-DEPLOYMENT.md)"
echo "  2. Environment variables ready?"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
echo ""

# Deploy
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Run database migration if not done (see FRONTEND-DEPLOYMENT.md)"
echo "  2. Visit your dashboard URL"
echo "  3. Test creating a mission"
echo "  4. Share with your team!"
echo ""
echo "🎉 Happy managing!"
