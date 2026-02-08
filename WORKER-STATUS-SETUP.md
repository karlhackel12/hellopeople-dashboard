# Worker Status Monitor - Setup Guide

This guide will help you set up the Worker Status Monitor for your autonomous business dashboard.

---

## Step 1: Create the Database Table

Run the SQL migration in your Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/ksuqcuimthklsdqyfzwh
2. Click **SQL Editor** in the sidebar
3. Click **New Query**
4. Copy and paste the contents of: `migrations/create_worker_status_table.sql`
5. Click **Run** (or press Cmd+Enter)

**What this creates:**
- ✅ `hp_worker_status` table
- ✅ Indexes for performance
- ✅ 5 initial worker entries (status: unknown)
- ✅ Auto-update timestamp trigger
- ✅ Row-level security policies

---

## Step 2: Add Heartbeat to Your Workers

In your **mission-control** backend repository, add heartbeat reporting to each worker.

### Option A: Standalone Heartbeat Module

Create a shared heartbeat module:

```bash
# In your mission-control repo
cd workers
cp /path/to/migrations/worker-heartbeat-example.mjs ./lib/worker-heartbeat.mjs
```

Then import it in each worker:

```javascript
// In roundtable-worker.mjs
import './lib/worker-heartbeat.mjs';
```

### Option B: Inline Heartbeat Code

Add this to each worker file:

```javascript
import { createClient } from '@supabase/supabase-js';

const WORKER_NAME = 'roundtable-worker'; // Change per worker
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

let jobsProcessed = 0;
let errorCount = 0;

// Report heartbeat every 30 seconds
setInterval(async () => {
  try {
    await supabase.from('hp_worker_status').upsert({
      worker_name: WORKER_NAME,
      status: 'running',
      last_heartbeat: new Date().toISOString(),
      jobs_processed: jobsProcessed,
      error_count: errorCount,
      circuit_breaker_open: false,
    });
  } catch (err) {
    console.error('Heartbeat failed:', err);
  }
}, 30000);

// In your job processing:
async function processJob(job) {
  try {
    // ... do work ...
    jobsProcessed++;
  } catch (error) {
    errorCount++;
  }
}
```

---

## Step 3: Update Each Worker

Apply the heartbeat code to all 5 workers:

### Workers to Update

1. **roundtable-worker** (`WORKER_NAME = 'roundtable-worker'`)
   - Handles conversation orchestration
   - Location: `workers/roundtable-worker.mjs` (or similar)

2. **x-autopost** (`WORKER_NAME = 'x-autopost'`)
   - Handles tweet publishing
   - Location: `workers/x-autopost.mjs` (or similar)

3. **analyze-worker** (`WORKER_NAME = 'analyze-worker'`)
   - Handles analysis tasks
   - Location: `workers/analyze-worker.mjs` (or similar)

4. **content-worker** (`WORKER_NAME = 'content-worker'`)
   - Handles content creation
   - Location: `workers/content-worker.mjs` (or similar)

5. **crawl-worker** (`WORKER_NAME = 'crawl-worker'`)
   - Handles web crawling
   - Location: `workers/crawl-worker.mjs` (or similar)

### Important Notes

- ✅ Each worker MUST use a unique `WORKER_NAME`
- ✅ Use `SUPABASE_SERVICE_KEY` (not anon key)
- ✅ Increment `jobsProcessed` after each successful job
- ✅ Increment `errorCount` on failures

---

## Step 4: Restart Workers

After adding heartbeat code, restart all workers:

```bash
# If using systemd
sudo systemctl restart roundtable-worker
sudo systemctl restart x-autopost
sudo systemctl restart analyze-worker
sudo systemctl restart content-worker
sudo systemctl restart crawl-worker

# If using PM2
pm2 restart roundtable-worker
pm2 restart x-autopost
pm2 restart analyze-worker
pm2 restart content-worker
pm2 restart crawl-worker

# If using node directly
# Stop all workers (Ctrl+C) and restart them
```

---

## Step 5: Verify on Dashboard

1. Go to your dashboard: https://mission-control-dashboard-tau.vercel.app
2. Scroll down to the **Worker Status** section
3. You should now see:
   - ✅ 5 workers listed
   - ✅ Status: "Running" (with green checkmark)
   - ✅ Last heartbeat: "X seconds ago"
   - ✅ Jobs processed count
   - ✅ Error count

### Expected Output

```
Worker Status                    5/5 Running

roundtable-worker        ✅ Running
- Conversation orchestration
- Last seen: 15 seconds ago
- Jobs: 142 | Errors: 0

x-autopost               ✅ Running
- Tweet publishing
- Last seen: 12 seconds ago
- Jobs: 89 | Errors: 0

analyze-worker           ✅ Running
- Analysis tasks
- Last seen: 8 seconds ago
- Jobs: 201 | Errors: 1

content-worker           ✅ Running
- Content creation
- Last seen: 22 seconds ago
- Jobs: 67 | Errors: 0

crawl-worker             ✅ Running
- Web crawling
- Last seen: 18 seconds ago
- Jobs: 45 | Errors: 0
```

---

## Troubleshooting

### Issue: Workers show "Unknown" status

**Cause**: Workers haven't reported heartbeat yet

**Solution**:
1. Check that workers are running
2. Verify `SUPABASE_SERVICE_KEY` is set in worker environment
3. Check worker logs for heartbeat errors
4. Wait 30 seconds for first heartbeat

---

### Issue: Workers show "Stopped" status

**Cause**: No heartbeat received in 5+ minutes

**Solution**:
1. Check if workers are actually running:
   ```bash
   systemctl status roundtable-worker
   # or
   pm2 list
   ```
2. Check worker logs for errors
3. Restart the worker

---

### Issue: Heartbeat fails with "Invalid API key"

**Cause**: Using anon key instead of service key

**Solution**:
- Ensure workers use `SUPABASE_SERVICE_KEY` (not `SUPABASE_ANON_KEY`)
- Verify the key is correct in your `.env` file

---

### Issue: Permission denied on upsert

**Cause**: RLS policy blocking service role

**Solution**:
Run this SQL in Supabase:

```sql
-- Grant service role full access
CREATE POLICY "Allow service role full access" ON hp_worker_status
  FOR ALL
  USING (true);
```

---

## Advanced Features

### Circuit Breaker Pattern

The example heartbeat code includes a circuit breaker that auto-disables workers after too many errors:

```javascript
const MAX_ERRORS_BEFORE_CIRCUIT_BREAK = 10;

// After 10 errors, circuit breaker opens
if (errorCount >= MAX_ERRORS_BEFORE_CIRCUIT_BREAK) {
  circuitBreakerOpen = true;
  // Stop processing new jobs, send alert, etc.
}
```

When the circuit breaker is open:
- ✅ Dashboard shows "⚠️ Circuit Breaker Open" badge
- ✅ Worker status changes to "crashed"
- ✅ You get visual feedback that something's wrong

### Custom Metadata

Add worker-specific metadata:

```javascript
await supabase.from('hp_worker_status').upsert({
  worker_name: WORKER_NAME,
  status: 'running',
  metadata: {
    version: '1.2.3',
    last_job_id: jobId,
    queue_size: queueLength,
    custom_metric: someValue,
  },
});
```

### Graceful Shutdown

The example code includes graceful shutdown handlers:

```javascript
process.on('SIGTERM', async () => {
  // Report status as "stopped"
  await supabase.from('hp_worker_status').update({
    status: 'stopped',
    last_heartbeat: new Date().toISOString(),
  }).eq('worker_name', WORKER_NAME);

  process.exit(0);
});
```

---

## Files Reference

- **SQL Migration**: `migrations/create_worker_status_table.sql`
- **Heartbeat Example**: `migrations/worker-heartbeat-example.mjs`
- **This Guide**: `WORKER-STATUS-SETUP.md`

---

## Summary Checklist

- [ ] Run SQL migration in Supabase dashboard
- [ ] Add heartbeat code to all 5 workers
- [ ] Set `SUPABASE_SERVICE_KEY` in worker environments
- [ ] Restart all workers
- [ ] Verify status on dashboard (should show "Running")
- [ ] Monitor for 5 minutes to ensure heartbeats continue

---

**Once complete, your dashboard will show real-time health of all VPS workers!** 🎉

**Estimated Setup Time**: 15-20 minutes
