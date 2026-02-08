# HelloPeople Dashboard - Deployment Guide

Complete guide to deploy the HelloPeople Dashboard to Vercel.

## Prerequisites

- GitHub account (to connect repository)
- Vercel account (free tier works)
- Supabase project (already configured)

## Quick Deploy (Recommended)

### Option 1: Deploy from Local

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
cd /root/.openclaw/workspace/hellopeople-dashboard
vercel --prod
```

4. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `hellopeople-dashboard` (or custom)
   - Directory? `./`
   - Override settings? **N**

5. **Add environment variables** (when prompted or via Vercel Dashboard):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ksuqcuimthklsdqyfzwh.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

6. **Done!** Your dashboard will be live at `https://hellopeople-dashboard.vercel.app`

### Option 2: Deploy from GitHub

1. **Push to GitHub**:
```bash
cd /root/.openclaw/workspace/hellopeople-dashboard
git init
git add .
git commit -m "Initial commit - HelloPeople Dashboard"
git remote add origin https://github.com/YOUR_USERNAME/hellopeople-dashboard.git
git push -u origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Next.js
     - **Root Directory**: `./`
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`

3. **Add Environment Variables**:
   - In project settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://ksuqcuimthklsdqyfzwh.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
   - Apply to: Production, Preview, Development

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Done!

## Database Setup

Before first use, run the database migration:

### Method 1: Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `ksuqcuimthklsdqyfzwh`
3. Navigate to **SQL Editor**
4. Click "New Query"
5. Paste contents of `migrations/create_objectives_table.sql`
6. Click "Run"
7. Verify: Check **Table Editor** → `hp_objectives` exists

### Method 2: psql (Command Line)

```bash
# Get your database password from Supabase Dashboard → Settings → Database

psql "postgresql://postgres:[YOUR_PASSWORD]@db.ksuqcuimthklsdqyfzwh.supabase.co:5432/postgres" \
  < migrations/create_objectives_table.sql
```

## Verify Deployment

1. **Visit your deployment URL**: `https://your-project.vercel.app`

2. **Check pages load**:
   - `/` - Dashboard
   - `/missions` - Missions list
   - `/objectives` - OKRs
   - `/agents` - Agent profiles
   - `/conversations` - Conversation feed
   - `/insights` - Memory insights

3. **Test real-time**:
   - Open two browser tabs
   - In one tab, create a mission (`/missions/create`)
   - In other tab, watch `/missions` update automatically

4. **Check Vercel Logs**:
   - Vercel Dashboard → Your Project → Deployments → Latest
   - Click "View Function Logs"
   - Should see successful requests, no errors

## Configuration

### Custom Domain

1. **Vercel Dashboard** → Your Project → Settings → Domains
2. Add your domain: `dashboard.hellopeople.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, ~1 minute)

### Environment Variables

Production variables (already set):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional enhancements:
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `NEXT_PUBLIC_ANALYTICS_ID` - Analytics tracking ID

### Build Settings

Default settings work perfectly:

- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x (auto-detected)

## Performance Optimization

### Enable Analytics

```bash
# In Vercel Dashboard
Settings → Analytics → Enable Web Analytics
```

### Configure Caching

Already optimized with Next.js automatic static optimization:
- Static pages: Cached at edge
- Dynamic pages: On-demand rendering
- API routes: Serverless functions

### Image Optimization

Next.js Image component auto-optimizes:
```tsx
import Image from 'next/image'

<Image src="/logo.png" alt="Logo" width={200} height={50} />
```

## Monitoring

### Vercel Dashboard

- **Analytics**: Page views, top pages, countries
- **Speed Insights**: Core Web Vitals
- **Function Logs**: Errors, warnings, requests
- **Deployments**: History, rollback capability

### Supabase Dashboard

- **Database**: Query performance, connections
- **Realtime**: Active subscriptions
- **Logs**: Database queries, API requests

## Troubleshooting

### Build Fails

**Error**: `Type error: Cannot find module '@/lib/supabase'`

Fix:
```bash
# Check tsconfig.json paths are correct
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Error**: `Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined`

Fix: Add in Vercel Dashboard → Settings → Environment Variables

### Real-time Not Working

1. Check Supabase Realtime is enabled:
   - Dashboard → Settings → API → Enable Realtime
2. Verify table RLS policies allow SELECT
3. Check browser console for WebSocket errors

### 404 on Supabase Requests

1. Verify `.env.local` variables
2. Check Supabase project status (not paused)
3. Verify anon key is correct (not expired)

### Slow Performance

1. Enable Vercel Analytics to identify slow pages
2. Check Supabase query performance
3. Add database indexes if needed:
   ```sql
   CREATE INDEX idx_missions_status ON hp_missions(status);
   ```

## Rollback

If deployment has issues:

1. **Vercel Dashboard** → Deployments
2. Find previous working deployment
3. Click "⋯" → "Promote to Production"
4. Instant rollback (0 downtime)

## Production Checklist

Before going live:

- [ ] Database migration run (`hp_objectives` table exists)
- [ ] Environment variables set in Vercel
- [ ] All pages load without errors
- [ ] Real-time subscriptions working
- [ ] Create mission flow works end-to-end
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Team has access to Vercel project
- [ ] Backup/monitoring alerts configured

## Continuous Deployment

After initial setup, every push to `main` triggers automatic deployment:

```bash
git add .
git commit -m "Update dashboard"
git push origin main
# Vercel automatically deploys in ~2 minutes
```

## Scaling

Vercel auto-scales:
- **Traffic**: Automatic edge scaling
- **Database**: Supabase can handle 100+ concurrent connections
- **Realtime**: Supabase handles 500+ simultaneous subscriptions

If you exceed free tier:
- Vercel Pro: $20/month (unlimited bandwidth)
- Supabase Pro: $25/month (higher limits)

## Support

### Vercel

- Docs: [vercel.com/docs](https://vercel.com/docs)
- Support: [vercel.com/support](https://vercel.com/support)

### Supabase

- Docs: [supabase.com/docs](https://supabase.com/docs)
- Support: [supabase.com/support](https://supabase.com/support)

### Issues

For dashboard-specific issues:
1. Check Vercel Function Logs
2. Check Supabase Logs
3. Review browser console errors
4. Contact development team

---

**Estimated Deploy Time**: 5-10 minutes
**Difficulty**: Easy
**Cost**: $0 (free tiers work perfectly)

Happy deploying! 🚀
