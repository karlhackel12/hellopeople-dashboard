# Vercel Environment Variable Setup

## ⚠️ Required for Proposals API to Work

The Proposals page approve/reject functionality requires the **SUPABASE_SERVICE_KEY** environment variable to be set in Vercel.

## Steps to Add Environment Variable

### Option 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **hellopeople-dashboard**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `SUPABASE_SERVICE_KEY`
   - **Value**: 
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXFjdWltdGhrbHNkcXlmendoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTY3MywiZXhwIjoyMDg2MDc1NjczfQ.w20nOLonZgh7Z5Z8aEXyOaOm-IIIkUtDuA0NNYQSfzA
     ```
   - **Environments**: Select all (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** the application:
   - Go to **Deployments** tab
   - Click on latest deployment
   - Click **⋯ (three dots)** → **Redeploy**

### Option 2: Vercel CLI

```bash
# Login to Vercel (if not already)
vercel login

# Navigate to project
cd hellopeople-dashboard

# Add environment variable
vercel env add SUPABASE_SERVICE_KEY production

# When prompted, paste the value:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXFjdWltdGhrbHNkcXlmendoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTY3MywiZXhwIjoyMDg2MDc1NjczfQ.w20nOLonZgh7Z5Z8aEXyOaOm-IIIkUtDuA0NNYQSfzA

# Repeat for preview and development
vercel env add SUPABASE_SERVICE_KEY preview
vercel env add SUPABASE_SERVICE_KEY development

# Redeploy
vercel --prod
```

## Why This is Needed

The Proposals API routes (`/api/proposals/approve` and `/api/proposals/reject`) use `mission-control.ts`, which needs **admin-level access** to Supabase to:

- Update proposal status
- Create missions
- Create mission steps
- Log events

The **service role key** provides this elevated access securely on the server-side only.

## Security Notes

✅ **Safe to use** - This key is only accessible server-side (API routes)  
✅ **Not exposed to browser** - Only `NEXT_PUBLIC_*` variables are sent to client  
✅ **Read from process.env** - Loaded at build/runtime, not committed to git  

## Already Set

These environment variables are already configured:

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Verify Setup

After adding the variable and redeploying:

1. Visit: https://hellopeople-dashboard.vercel.app/proposals
2. Find a **pending** proposal
3. Click **Approve** button
4. Should see: "Proposal approved! Mission #XXX created."
5. Refresh page - proposal status should be "Accepted"

If you get an error, check:
- Environment variable is set correctly
- Deployment finished successfully
- No typos in the key name (`SUPABASE_SERVICE_KEY`)

## Troubleshooting

### Error: "Failed to approve proposal"
→ Check Vercel logs for details  
→ Verify env variable is set  
→ Ensure you redeployed after adding the variable

### Error: "No credentials found"
→ The service key is missing or incorrect  
→ Double-check the value matches exactly  

### 401 Unauthorized
→ The anon key is being used instead of service key  
→ Check that `process.env.SUPABASE_SERVICE_KEY` is accessible

## Complete Environment Variable List

```bash
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://ksuqcuimthklsdqyfzwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXFjdWltdGhrbHNkcXlmendoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI2NzgsImV4cCI6MjA0ODU0ODY3OH0.VEqxMYVNuVOz_qk4yL9SkIKIB3N2-lXdvNZK4_7JiJY

# Private (server-side only) - ADD THIS ONE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdXFjdWltdGhrbHNkcXlmendoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTY3MywiZXhwIjoyMDg2MDc1NjczfQ.w20nOLonZgh7Z5Z8aEXyOaOm-IIIkUtDuA0NNYQSfzA
```

---

**Once set up, the Proposals page will be fully functional! 🎉**
