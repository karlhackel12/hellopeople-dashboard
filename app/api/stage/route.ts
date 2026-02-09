import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🎭 Fetching stage data...');

    // 1. Get agent list with skills
    const { data: agentSkills, error: skillsError } = await supabaseAdmin
      .from('hp_agent_skills')
      .select('agent_id, skill_name');

    if (skillsError) {
      console.error('❌ Error fetching agent skills:', skillsError);
    }

    // Group skills by agent
    const agentsMap = new Map<string, string[]>();
    agentSkills?.forEach((row) => {
      if (!agentsMap.has(row.agent_id)) {
        agentsMap.set(row.agent_id, []);
      }
      agentsMap.get(row.agent_id)?.push(row.skill_name);
    });

    const agents = Array.from(agentsMap.entries()).map(([agent_id, skills]) => ({
      agent_id,
      skills,
    }));

    // 2. Get active missions
    const { data: activeMissions, error: missionsError } = await supabaseAdmin
      .from('hp_missions')
      .select('id, status, created_at')
      .in('status', ['running', 'pending']);

    if (missionsError) {
      console.error('❌ Error fetching missions:', missionsError);
    }

    // 3. Get recent mission steps (last 20, to show who's working)
    const { data: recentSteps, error: stepsError } = await supabaseAdmin
      .from('hp_mission_steps')
      .select('id, mission_id, step_kind, status, reserved_at, finished_at, output')
      .order('reserved_at', { ascending: false, nullsFirst: false })
      .limit(20);

    if (stepsError) {
      console.error('❌ Error fetching mission steps:', stepsError);
    }

    // 4. Get recent conversations (last hour or currently running)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentConversations, error: convoError } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('id, topic, participants, status, created_at, completed_at')
      .or(`status.eq.running,completed_at.gt.${oneHourAgo}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (convoError) {
      console.error('❌ Error fetching conversations:', convoError);
    }

    // 5. Count conversations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 6. Get recent memories (last 10)
    const { data: recentMemories, error: memoryError } = await supabaseAdmin
      .from('hp_agent_memory')
      .select('id, agent_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (memoryError) {
      console.error('❌ Error fetching memories:', memoryError);
    }

    // 7. Count deliverables
    const { count: deliverablesCount } = await supabaseAdmin
      .from('hp_deliverables')
      .select('*', { count: 'exact', head: true });

    console.log('✅ Stage data fetched:', {
      agentsCount: agents.length,
      activeMissionsCount: activeMissions?.length || 0,
      recentStepsCount: recentSteps?.length || 0,
      conversationsToday: conversationsToday || 0,
      deliverablesCount: deliverablesCount || 0,
    });

    return NextResponse.json({
      agents,
      activeMissions: activeMissions || [],
      recentSteps: recentSteps || [],
      recentConversations: recentConversations || [],
      conversationsToday: conversationsToday || 0,
      recentMemories: recentMemories || [],
      deliverablesCount: deliverablesCount || 0,
    });
  } catch (error: any) {
    console.error('❌ Error fetching stage data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stage data' },
      { status: 500 }
    );
  }
}
