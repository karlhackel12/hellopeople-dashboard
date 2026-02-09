import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export interface AgentEvent {
  id: string;
  kind: string;
  title: string;
  summary?: string;
  agent_id: string;
  created_at: string;
  tags: string[];
  payload?: any;
}

export async function GET() {
  try {
    console.log('📡 Fetching events from multiple sources...');

    const events: AgentEvent[] = [];

    // 1. Fetch recent mission steps as events
    const { data: steps, error: stepsError } = await supabaseAdmin
      .from('hp_mission_steps')
      .select('id, mission_id, step_kind, status, reserved_at, finished_at, output')
      .order('reserved_at', { ascending: false, nullsFirst: false })
      .limit(50);

    if (!stepsError && steps) {
      steps.forEach((step) => {
        const agentMatch = step.step_kind.match(/^([^:]+):/);
        const agentId = agentMatch ? agentMatch[1] : 'system';
        const taskName = step.step_kind.split(':')[1] || step.step_kind;

        let kind = 'step_started';
        let title = `${agentId} started ${taskName}`;
        let created_at = step.reserved_at;

        if (step.status === 'succeeded' && step.finished_at) {
          kind = 'step_succeeded';
          title = `${agentId} completed ${taskName}`;
          created_at = step.finished_at;
        } else if (step.status === 'failed' && step.finished_at) {
          kind = 'step_failed';
          title = `${agentId} failed ${taskName}`;
          created_at = step.finished_at;
        }

        if (created_at) {
          events.push({
            id: `step-${step.id}`,
            kind,
            title,
            summary: step.output?.summary || undefined,
            agent_id: agentId,
            created_at,
            tags: ['mission', 'step', step.status],
          });
        }
      });
    }

    // 2. Fetch recent conversations as events
    const { data: conversations, error: convosError } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('id, topic, participants, status, created_at, completed_at, outcome')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!convosError && conversations) {
      conversations.forEach((convo) => {
        const agentId = convo.participants?.[0] || 'system';
        
        // Started event
        events.push({
          id: `convo-start-${convo.id}`,
          kind: 'conversation_started',
          title: `Conversation: ${convo.topic}`,
          summary: `Participants: ${convo.participants?.join(', ')}`,
          agent_id: agentId,
          created_at: convo.created_at,
          tags: ['conversation', 'roundtable'],
        });

        // Completed event
        if (convo.status === 'succeeded' && convo.completed_at) {
          events.push({
            id: `convo-complete-${convo.id}`,
            kind: 'conversation_completed',
            title: `Completed: ${convo.topic}`,
            summary: convo.outcome?.summary || 'Conversation completed successfully',
            agent_id: agentId,
            created_at: convo.completed_at,
            tags: ['conversation', 'completed'],
          });
        }
      });
    }

    // 3. Fetch recent memories as events
    const { data: memories, error: memoriesError } = await supabaseAdmin
      .from('hp_agent_memory')
      .select('id, agent_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!memoriesError && memories) {
      memories.forEach((memory) => {
        const contentPreview = typeof memory.content === 'string' 
          ? memory.content.substring(0, 100)
          : JSON.stringify(memory.content).substring(0, 100);

        events.push({
          id: `memory-${memory.id}`,
          kind: 'memory_created',
          title: `${memory.agent_id} learned something new`,
          summary: contentPreview,
          agent_id: memory.agent_id,
          created_at: memory.created_at,
          tags: ['memory', 'learning'],
        });
      });
    }

    // 4. Fetch real hp_events if the table exists (fallback)
    try {
      const { data: realEvents, error: eventsError } = await supabaseAdmin
        .from('hp_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!eventsError && realEvents) {
        realEvents.forEach((event: any) => {
          events.push({
            id: `event-${event.id}`,
            kind: event.event_type || event.kind || 'unknown',
            title: event.title || `${event.event_type} event`,
            summary: event.summary,
            agent_id: event.agent_id || 'system',
            created_at: event.created_at,
            tags: event.tags || [],
            payload: event.payload,
          });
        });
      }
    } catch (e) {
      // hp_events table might not exist yet, that's okay
      console.log('hp_events table not available (expected)');
    }

    // Sort all events by created_at descending
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Take the most recent 100 events
    const recentEvents = events.slice(0, 100);

    console.log('✅ Events fetched:', {
      totalEvents: recentEvents.length,
      steps: steps?.length || 0,
      conversations: conversations?.length || 0,
      memories: memories?.length || 0,
    });

    return NextResponse.json({ events: recentEvents });
  } catch (error: any) {
    console.error('❌ Error fetching events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
