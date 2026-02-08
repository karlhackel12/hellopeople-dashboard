/**
 * Worker Heartbeat Example
 *
 * Add this code to each of your VPS workers to report status to Supabase.
 * This enables the Worker Status Monitor on the dashboard.
 */

import { createClient } from '@supabase/supabase-js';

// ===== CONFIGURATION =====
const WORKER_NAME = 'roundtable-worker'; // Change per worker: x-autopost, analyze-worker, content-worker, crawl-worker
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const MAX_ERRORS_BEFORE_CIRCUIT_BREAK = 10;

// ===== SUPABASE CLIENT =====
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ksuqcuimthklsdqyfzwh.supabase.co',
  process.env.SUPABASE_SERVICE_KEY // Use service key for workers
);

// ===== WORKER STATE =====
let jobsProcessed = 0;
let errorCount = 0;
let circuitBreakerOpen = false;

// ===== HEARTBEAT FUNCTION =====
async function reportHeartbeat() {
  try {
    const { error } = await supabase
      .from('hp_worker_status')
      .upsert({
        worker_name: WORKER_NAME,
        status: circuitBreakerOpen ? 'crashed' : 'running',
        last_heartbeat: new Date().toISOString(),
        jobs_processed: jobsProcessed,
        error_count: errorCount,
        circuit_breaker_open: circuitBreakerOpen,
        metadata: {
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          node_version: process.version,
        },
      });

    if (error) {
      console.error(`[${WORKER_NAME}] Heartbeat failed:`, error);
    } else {
      console.log(`[${WORKER_NAME}] ❤️ Heartbeat sent (jobs: ${jobsProcessed}, errors: ${errorCount})`);
    }
  } catch (err) {
    console.error(`[${WORKER_NAME}] Heartbeat error:`, err);
  }
}

// ===== START HEARTBEAT =====
const heartbeatInterval = setInterval(reportHeartbeat, HEARTBEAT_INTERVAL);

// Report initial heartbeat immediately
reportHeartbeat();

// ===== GRACEFUL SHUTDOWN =====
async function shutdown() {
  console.log(`[${WORKER_NAME}] Shutting down gracefully...`);
  clearInterval(heartbeatInterval);

  // Report final status as stopped
  await supabase
    .from('hp_worker_status')
    .update({
      status: 'stopped',
      last_heartbeat: new Date().toISOString(),
    })
    .eq('worker_name', WORKER_NAME);

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// ===== HELPER FUNCTIONS =====

/**
 * Call this after successfully processing a job
 */
export function incrementJobCount() {
  jobsProcessed++;
}

/**
 * Call this when an error occurs
 */
export function incrementErrorCount() {
  errorCount++;

  // Implement circuit breaker pattern
  if (errorCount >= MAX_ERRORS_BEFORE_CIRCUIT_BREAK && !circuitBreakerOpen) {
    circuitBreakerOpen = true;
    console.error(`[${WORKER_NAME}] 🚨 Circuit breaker opened! Too many errors (${errorCount})`);
    // Optionally: stop processing new jobs, send alert, etc.
  }
}

/**
 * Reset error count (e.g., after successful recovery)
 */
export function resetErrorCount() {
  if (errorCount > 0) {
    console.log(`[${WORKER_NAME}] Resetting error count from ${errorCount} to 0`);
    errorCount = 0;
    circuitBreakerOpen = false;
  }
}

// ===== EXAMPLE USAGE IN WORKER =====
/*

// In your worker's main loop:

import { incrementJobCount, incrementErrorCount, resetErrorCount } from './worker-heartbeat.mjs';

async function processJob(job) {
  try {
    // ... do work ...

    incrementJobCount();

    // If this was successful after errors, consider resetting
    if (jobsProcessed % 10 === 0) {
      resetErrorCount();
    }

  } catch (error) {
    console.error('Job failed:', error);
    incrementErrorCount();
  }
}

*/

console.log(`[${WORKER_NAME}] 💓 Heartbeat monitor started (interval: ${HEARTBEAT_INTERVAL}ms)`);
