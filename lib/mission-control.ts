/**
 * Mission Control Client
 * Library for agents to interact with the autonomous system
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CreateProposalParams {
  agent_id: string;
  title: string;
  description: string;
  step_kinds: string[];
  metadata?: any;
}

interface LogEventParams {
  agent_id: string;
  event_type: string;
  tags: string[];
  payload: any;
}

/**
 * Create proposal
 */
export async function createProposal({ agent_id, title, description, step_kinds, metadata }: CreateProposalParams) {
  const { data, error } = await supabaseAdmin
    .from('hp_proposals')
    .insert({ agent_id, title, description, step_kinds, metadata })
    .select()
    .single();

  if (error) throw error;
  
  // Log event
  await logEvent({
    agent_id,
    event_type: 'proposal_created',
    tags: ['proposal'],
    payload: { proposal_id: data.id, title }
  });

  return data;
}

/**
 * List pending proposals
 */
export async function listPendingProposals() {
  const { data, error } = await supabaseAdmin
    .from('hp_proposals')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Approve proposal (creates mission)
 */
export async function approveProposal(proposal_id: string) {
  // Fetch proposal
  const { data: proposal, error: propError } = await supabaseAdmin
    .from('hp_proposals')
    .select('*')
    .eq('id', proposal_id)
    .single();

  if (propError) throw propError;

  // Update proposal to accepted
  await supabaseAdmin
    .from('hp_proposals')
    .update({ status: 'accepted', decided_at: new Date().toISOString() })
    .eq('id', proposal_id);

  // Create mission
  const { data: mission, error: missionError } = await supabaseAdmin
    .from('hp_missions')
    .insert({ proposal_id })
    .select()
    .single();

  if (missionError) throw missionError;

  // Create steps
  const steps = proposal.step_kinds.map((step_kind: string) => ({
    mission_id: mission.id,
    step_kind,
    input: { proposal }
  }));

  await supabaseAdmin.from('hp_mission_steps').insert(steps);

  // Log event
  await logEvent({
    agent_id: 'ceo',
    event_type: 'proposal_approved',
    tags: ['proposal', 'mission'],
    payload: { proposal_id, mission_id: mission.id }
  });

  return mission;
}

/**
 * Reject proposal
 */
export async function rejectProposal(proposal_id: string, reason: string) {
  const { error } = await supabaseAdmin
    .from('hp_proposals')
    .update({ 
      status: 'rejected', 
      rejection_reason: reason,
      decided_at: new Date().toISOString() 
    })
    .eq('id', proposal_id);

  if (error) throw error;

  // Log event
  await logEvent({
    agent_id: 'ceo',
    event_type: 'proposal_rejected',
    tags: ['proposal'],
    payload: { proposal_id, reason }
  });
}

/**
 * Claim next step for execution
 */
export async function claimNextStep(agent_id: string) {
  // Fetch queued steps
  const { data: steps, error } = await supabaseAdmin
    .from('hp_mission_steps')
    .select('*, mission:hp_missions(*)')
    .eq('status', 'queued')
    .is('reserved_at', null)
    .order('id', { ascending: true })
    .limit(10);

  if (error) throw error;
  if (!steps || steps.length === 0) return null;

  // Find first step that has no pending prerequisites
  let step = null;
  for (const candidate of steps) {
    // Check if this step has prerequisites (other steps in same mission)
    const { data: allSteps } = await supabaseAdmin
      .from('hp_mission_steps')
      .select('id, status')
      .eq('mission_id', candidate.mission_id)
      .order('id', { ascending: true });
    
    const candidateIndex = allSteps?.findIndex((s: any) => s.id === candidate.id) ?? -1;
    const previousSteps = allSteps?.slice(0, candidateIndex) ?? [];
    
    // All previous steps must be succeeded or failed
    const allPrevDone = previousSteps.every((s: any) => 
      s.status === 'succeeded' || s.status === 'failed'
    );
    
    if (allPrevDone) {
      step = candidate;
      break;
    }
  }

  if (!step) return null;

  // Atomic claim: compare-and-swap (only succeeds if step is still queued)
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('hp_mission_steps')
    .update({
      status: 'running',
      reserved_at: new Date().toISOString()
    })
    .eq('id', step.id)
    .eq('status', 'queued')  // Only if STILL queued — atomic CAS
    .select('id')
    .maybeSingle();

  if (claimError || !claimed) {
    return null; // Another worker claimed it
  }

  // Load previous step outputs
  const { data: prevSteps } = await supabaseAdmin
    .from('hp_mission_steps')
    .select('step_kind, output')
    .eq('mission_id', step.mission_id)
    .eq('status', 'succeeded')
    .order('id', { ascending: true });

  // Enrich input with previous outputs
  const enrichedInput = {
    ...step.input,
    previous_steps: prevSteps || [],
    outputs: (prevSteps || []).reduce((acc: any, s: any) => {
      acc[s.step_kind] = s.output;
      return acc;
    }, {})
  };

  return {
    ...step,
    input: enrichedInput
  };
}

/**
 * Mark step as succeeded
 */
export async function markStepSucceeded(step_id: string, output: any) {
  const { error } = await supabaseAdmin
    .from('hp_mission_steps')
    .update({ 
      status: 'succeeded',
      output,
      finished_at: new Date().toISOString()
    })
    .eq('id', step_id);

  if (error) throw error;

  // Check if mission finished
  await maybeFinalizeMission(step_id);
}

/**
 * Mark step as failed
 */
export async function markStepFailed(step_id: string, error_msg: string) {
  const { error } = await supabaseAdmin
    .from('hp_mission_steps')
    .update({ 
      status: 'failed',
      last_error: error_msg,
      finished_at: new Date().toISOString()
    })
    .eq('id', step_id);

  if (error) throw error;

  // Log event
  await logEvent({
    agent_id: 'system',
    event_type: 'step_failed',
    tags: ['mission', 'failure'],
    payload: { step_id, error: error_msg }
  });

  // Check if mission failed
  await maybeFinalizeMission(step_id);
}

/**
 * Check if mission finished (all steps succeeded or any failed)
 */
async function maybeFinalizeMission(step_id: string) {
  // Fetch mission from step
  const { data: step } = await supabaseAdmin
    .from('hp_mission_steps')
    .select('mission_id')
    .eq('id', step_id)
    .single();

  if (!step) return;

  // Fetch all steps from mission
  const { data: allSteps } = await supabaseAdmin
    .from('hp_mission_steps')
    .select('status')
    .eq('mission_id', step.mission_id);

  const failed = allSteps?.some((s: any) => s.status === 'failed');
  const allDone = allSteps?.every((s: any) => ['succeeded', 'failed'].includes(s.status));

  if (failed) {
    // Mission failed
    await supabaseAdmin
      .from('hp_missions')
      .update({ status: 'failed', finished_at: new Date().toISOString() })
      .eq('id', step.mission_id);

    await logEvent({
      agent_id: 'system',
      event_type: 'mission_failed',
      tags: ['mission', 'failure'],
      payload: { mission_id: step.mission_id }
    });
  } else if (allDone) {
    // Mission succeeded
    await supabaseAdmin
      .from('hp_missions')
      .update({ status: 'succeeded', finished_at: new Date().toISOString() })
      .eq('id', step.mission_id);

    await logEvent({
      agent_id: 'system',
      event_type: 'mission_succeeded',
      tags: ['mission', 'success'],
      payload: { mission_id: step.mission_id }
    });
  }
}

/**
 * Log event
 */
export async function logEvent({ agent_id, event_type, tags, payload }: LogEventParams) {
  const { error } = await supabaseAdmin
    .from('hp_events')
    .insert({ agent_id, event_type, tags, payload });

  if (error) console.error('Failed to log event:', error);
}

/**
 * Get policy
 */
export async function getPolicy(key: string) {
  const { data, error } = await supabaseAdmin
    .from('hp_policies')
    .select('value')
    .eq('key', key)
    .single();

  if (error) throw error;
  return data.value;
}

/**
 * Check daily quota
 */
export async function checkDailyQuota(quota_key: string) {
  const policy = await getPolicy(quota_key);
  const limit = policy.limit;

  // Count today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from('hp_events')
    .select('count')
    .gte('created_at', today.toISOString())
    .contains('tags', [quota_key]);

  if (error) throw error;

  const used = (data?.[0] as any)?.count || 0;
  const remaining = limit - used;

  return { limit, used, remaining, available: remaining > 0 };
}
