# Worker Status Monitor - Complete Setup

**Status**: ✅ Code added to all workers
**Date**: 2026-02-08

---

## Summary

I've added heartbeat monitoring to all 5 VPS workers in the mission-control backend repository. The workers will now report their status every 30 seconds to the dashboard.

---

## Workers Updated

### 1. mission-worker-v2.js
- **Location**: `/scripts/mission-worker-v2.js`
- **Function**: Executes mission steps with skill executors
- **Heartbeat**: Reports every 30s, tracks jobs processed and errors

### 2. roundtable-worker.mjs
- **Location**: `/scripts/roundtable-worker.mjs`
- **Function**: Orchestrates agent conversations
- **Heartbeat**: Reports every 30s, tracks conversations completed

### 3. initiative-worker.mjs
- **Location**: `/scripts/initiative-worker.mjs`
- **Function**: Generates proposals from agent initiatives
- **Heartbeat**: Reports every 30s, tracks initiatives processed

### 4. objective-to-proposal-worker.mjs
- **Location**: `/scripts/objective-to-proposal-worker.mjs`
- **Function**: Transforms objectives into actionable proposals
- **Heartbeat**: Reports every 30s, tracks proposals created

### 5. outcome-learner.mjs
- **Location**: `/scripts/outcome-learner.mjs`
- **Function**: Analyzes performance and extracts lessons
- **Heartbeat**: Reports every 30s, tracks lessons learned

---

## Changes Made

### Backend (mission-control repo)

#### 1. Created Shared Heartbeat Library
**File**: `scripts/lib/worker-heartbeat.mjs`

```javascript
import { startHeartbeat, incrementJobCount, incrementErrorCount } from './lib/worker-heartbeat.mjs';

startHeartbeat('mission-worker');
incrementJobCount(); // After successful job
incrementErrorCount(); // After failed job
```

#### 2. Updated Each Worker
Added heartbeat imports and tracking to:
- mission-worker-v2.js
- roundtable-worker.mjs
- initiative-worker.mjs
- objective-to-proposal-worker.mjs
- outcome-learner.mjs

### Frontend (mission-control-dashboard repo)

#### 1. Updated Worker List
**File**: `components/WorkerStatus.tsx`

Changed from placeholder workers to actual workers:
- mission-worker
- roundtable-worker
- initiative-worker
- objective-proposal-worker
- outcome-learner

#### 2. SQL Migration
**File**: `migrations/update_worker_names.sql`

Updates worker_status table with correct worker names.

---

## Next Steps

### Step 1: Update Supabase Table

Run this SQL in your Supabase dashboard:

```sql
-- Remove old placeholder workers
DELETE FROM hp_worker_status
WHERE worker_name IN ('x-autopost', 'analyze-worker', 'content-worker', 'crawl-worker');

-- Add actual workers
INSERT INTO hp_worker_status (worker_name, status, last_heartbeat) VALUES
  ('mission-worker', 'unknown', now()),
  ('roundtable-worker', 'unknown', now()),
  ('initiative-worker', 'unknown', now()),
  ('objective-proposal-worker', 'unknown', now()),
  ('outcome-learner', 'unknown', now())
ON CONFLICT (worker_name) DO NOTHING;
```

### Step 2: Deploy Backend Changes

Push the updated workers to your VPS:

```bash
# In mission-control repository
cd /Users/karlhackel/Documents/Github/mission-control

# Check what changed
git status

# Commit changes
git add scripts/lib/worker-heartbeat.mjs
git add scripts/mission-worker-v2.js
git add scripts/roundtable-worker.mjs
git add scripts/initiative-worker.mjs
git add scripts/objective-to-proposal-worker.mjs
git add scripts/outcome-learner.mjs

git commit -m "feat: add heartbeat monitoring to all workers"

# Push to remote
git push origin main
```

### Step 3: Deploy to VPS

SSH into your VPS and pull the changes:

```bash
# On your VPS
cd /path/to/mission-control
git pull origin main

# Restart all workers (adjust commands based on your process manager)

# If using systemd:
sudo systemctl restart mission-worker
sudo systemctl restart roundtable-worker
sudo systemctl restart initiative-worker
sudo systemctl restart objective-proposal-worker
sudo systemctl restart outcome-learner

# If using PM2:
pm2 restart mission-worker
pm2 restart roundtable-worker
pm2 restart initiative-worker
pm2 restart objective-proposal-worker
pm2 restart outcome-learner

# If using cron (workers run periodically):
# No restart needed - next cron run will use new code
```

### Step 4: Update Dashboard

Deploy the updated dashboard to Vercel:

```bash
# In mission-control-dashboard repository
cd /Users/karlhackel/Documents/Github/mission-control-dashboard

# Commit changes
git add components/WorkerStatus.tsx
git add migrations/update_worker_names.sql
git add WORKER-STATUS-COMPLETE.md

git commit -m "feat: update worker status with actual worker names"

# Push to remote (triggers Vercel deployment)
git push origin main
```

### Step 5: Verify on Dashboard

1. Go to: https://mission-control-dashboard-tau.vercel.app
2. Check the **Worker Status** section
3. You should see 5 workers:
   - mission-worker
   - roundtable-worker
   - initiative-worker
   - objective-proposal-worker
   - outcome-learner
4. Wait 30-60 seconds for first heartbeat
5. Status should change from "unknown" to "running"

---

## Expected Behavior

### Before Workers Run
```
Worker Status                    0/5 Running

mission-worker              ⚠️ Unknown
- No heartbeat received yet
- Jobs: 0 | Errors: 0

roundtable-worker           ⚠️ Unknown
- No heartbeat received yet
- Jobs: 0 | Errors: 0

...
```

### After Workers Run (30-60 seconds)
```
Worker Status                    5/5 Running

mission-worker              ✅ Running
- Executes mission steps with skills
- Last seen: 12 seconds ago
- Jobs: 42 | Errors: 1

roundtable-worker           ✅ Running
- Agent conversation orchestration
- Last seen: 8 seconds ago
- Jobs: 15 | Errors: 0

initiative-worker           ✅ Running
- Agent-driven proposal generation
- Last seen: 22 seconds ago
- Jobs: 7 | Errors: 0

objective-proposal-worker   ✅ Running
- Objective-to-proposal transformation
- Last seen: 18 seconds ago
- Jobs: 12 | Errors: 0

outcome-learner             ✅ Running
- Performance analysis and learning
- Last seen: 35 seconds ago
- Jobs: 5 | Errors: 0
```

---

## Troubleshooting

### Issue: Workers still show "Unknown"

**Possible causes:**
1. Workers haven't run yet (they run via cron)
2. Workers don't have SUPABASE_SERVICE_KEY env var
3. Workers haven't been restarted with new code

**Solution:**
```bash
# Check if workers are running
pm2 list
# or
systemctl status mission-worker

# Check worker logs
pm2 logs mission-worker
# or
journalctl -u mission-worker -f

# Manually run a worker to test
cd /path/to/mission-control
node scripts/mission-worker-v2.js
# Should see: "💓 Heartbeat monitor started"
```

### Issue: Workers show "Stopped"

**Cause**: No heartbeat in 5+ minutes

**Solution:**
- Check if workers crashed
- Check worker logs for errors
- Restart the worker

### Issue: Heartbeat fails with auth error

**Cause**: Missing or invalid SUPABASE_SERVICE_KEY

**Solution:**
```bash
# In mission-control .env file
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Restart workers after updating .env
```

---

## Code Summary

### What Was Added

**All workers now include:**

1. **Import heartbeat functions:**
   ```javascript
   import { startHeartbeat, incrementJobCount, incrementErrorCount } from './lib/worker-heartbeat.mjs';
   ```

2. **Start heartbeat on worker initialization:**
   ```javascript
   startHeartbeat('worker-name');
   ```

3. **Track successful jobs:**
   ```javascript
   incrementJobCount(); // After job succeeds
   ```

4. **Track failed jobs:**
   ```javascript
   incrementErrorCount(); // After job fails
   ```

5. **Automatic features:**
   - Reports status every 30 seconds
   - Sends process metadata (PID, uptime, memory)
   - Handles graceful shutdown (SIGTERM/SIGINT)
   - Circuit breaker (auto-marks as crashed after 10 errors)

---

## Files Modified

### Backend (mission-control)
- ✅ `scripts/lib/worker-heartbeat.mjs` (NEW)
- ✅ `scripts/mission-worker-v2.js` (UPDATED)
- ✅ `scripts/roundtable-worker.mjs` (UPDATED)
- ✅ `scripts/initiative-worker.mjs` (UPDATED)
- ✅ `scripts/objective-to-proposal-worker.mjs` (UPDATED)
- ✅ `scripts/outcome-learner.mjs` (UPDATED)

### Frontend (mission-control-dashboard)
- ✅ `components/WorkerStatus.tsx` (UPDATED)
- ✅ `migrations/update_worker_names.sql` (NEW)
- ✅ `WORKER-STATUS-COMPLETE.md` (NEW)

---

## Summary Checklist

- [x] Create heartbeat library (worker-heartbeat.mjs)
- [x] Add heartbeat to mission-worker-v2.js
- [x] Add heartbeat to roundtable-worker.mjs
- [x] Add heartbeat to initiative-worker.mjs
- [x] Add heartbeat to objective-to-proposal-worker.mjs
- [x] Add heartbeat to outcome-learner.mjs
- [x] Update dashboard WorkerStatus component
- [x] Create SQL migration for correct worker names
- [ ] Run SQL migration in Supabase
- [ ] Commit and push backend changes
- [ ] Deploy to VPS
- [ ] Commit and push frontend changes
- [ ] Verify on dashboard

---

**Once complete, your dashboard will show real-time health of all 5 VPS workers!** 🎉

**Estimated Time**: 10-15 minutes
