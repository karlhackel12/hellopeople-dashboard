# 🚀 HelloPeople Dashboard - Quick Start

## ⚡ 3-Step Deploy (10 minutes)

### Step 1: Database (2 min)

Go to **Supabase Dashboard** → SQL Editor → Run this:

```sql
-- Copy from migrations/create_objectives_table.sql
-- Creates hp_objectives table with sample data
```

Or paste the full migration from: `migrations/create_objectives_table.sql`

### Step 2: Deploy (5 min)

```bash
cd /root/.openclaw/workspace/hellopeople-dashboard
./deploy.sh
```

When prompted, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ksuqcuimthklsdqyfzwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXFjdWltdGhrbHNkcXlmendoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI2NzgsImV4cCI6MjA0ODU0ODY3OH0.VEqxMYVNuVOz_qk4yL9SkIKIB3N2-lXdvNZK4_7JiJY
```

### Step 3: Test (3 min)

1. Visit your URL (e.g., `https://hellopeople-dashboard.vercel.app`)
2. Create a mission: **Missions** → **Create Mission** → Use "Weekly Review" template
3. Check real-time: Open 2 browser tabs, watch updates
4. Done! 🎉

---

## 📁 Project Location

```
/root/.openclaw/workspace/hellopeople-dashboard/
```

---

## 📚 Documentation

**Full Guides**:
- `FRONTEND-README.md` - Setup & development
- `FRONTEND-DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT-COMPLETE.md` - Build summary
- `DASHBOARD-SUMMARY.md` - Complete project overview (THIS IS THE MAIN ONE!)

**Quick Reference**:
- Database migration: `migrations/create_objectives_table.sql`
- Deploy script: `./deploy.sh`
- Environment vars: `.env.local`

---

## 🎯 What You Get

**6 Pages**:
1. **Dashboard** (/) - Executive overview
2. **Missions** (/missions) - Create & track missions
3. **Objectives** (/objectives) - OKR management
4. **Agents** (/agents) - Agent profiles
5. **Conversations** (/conversations) - Real-time feed
6. **Insights** (/insights) - Knowledge base

**Key Features**:
- ✅ Real-time updates (missions, conversations)
- ✅ Mission templates (4 pre-built)
- ✅ OKR tracking with key results
- ✅ Agent stats & activity
- ✅ Search & filters everywhere
- ✅ Mobile responsive
- ✅ Professional UI (shadcn/ui)

---

## 🔧 Local Development

```bash
cd /root/.openclaw/workspace/hellopeople-dashboard
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🐛 Troubleshooting

**Build fails?**
```bash
npm run build
# Check for errors in output
```

**Real-time not working?**
- Check Supabase Realtime is enabled (Dashboard → Settings → API)
- Verify environment variables are set

**404 errors?**
- Verify `.env.local` has correct Supabase URL
- Check Supabase project is not paused

---

## 📞 Quick Help

**Need setup help?** → Read `FRONTEND-README.md`  
**Need deploy help?** → Read `FRONTEND-DEPLOYMENT.md`  
**Want full overview?** → Read `DASHBOARD-SUMMARY.md` (⭐ START HERE!)

**Vercel Support**: https://vercel.com/support  
**Supabase Support**: https://supabase.com/support

---

## 🎉 Status

✅ **Build**: Success (0 errors)  
✅ **Tests**: All passing  
✅ **Deploy**: Ready (10 min)  
✅ **Docs**: Complete  

**Ready to go live!** 🚀

---

**Quick Commands**:
```bash
# Build locally
npm run build

# Start dev server
npm run dev

# Deploy to Vercel
./deploy.sh

# Or manual deploy
vercel --prod
```

---

Built for **HelloPeople Autonomous Company**  
Next.js 14 • Supabase • TypeScript • shadcn/ui
