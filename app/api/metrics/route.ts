import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Fetching metrics via API route...');
    
    // Count active agents (from relationships - unique agent_a + agent_b)
    const { data: relationships, error: relsError } = await supabaseAdmin
      .from('hp_agent_relationships')
      .select('agent_a, agent_b');
    
    if (relsError) {
      console.error('❌ Error fetching relationships:', relsError);
    }
  
    const uniqueAgents = new Set<string>();
    relationships?.forEach(r => {
      uniqueAgents.add(r.agent_a);
      uniqueAgents.add(r.agent_b);
    });
    const activeAgents = uniqueAgents.size;

    // Count conversations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: conversationsToday } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Count completed missions
    const { count: completedMissions } = await supabaseAdmin
      .from('hp_missions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Calculate autonomy (conversations succeeded / total conversations)
    const { count: totalConversations } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*', { count: 'exact', head: true });
    
    const { count: succeededConversations } = await supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'succeeded');

    const autonomy = totalConversations && totalConversations > 0 
      ? Math.round((succeededConversations || 0) / totalConversations * 100)
      : 0;

    console.log('✅ Metrics fetched:', { activeAgents, conversationsToday, completedMissions, autonomy });
    
    return NextResponse.json({
      data: {
        activeAgents,
        conversationsToday: conversationsToday || 0,
        completedMissions: completedMissions || 0,
        succeededConversations: succeededConversations || 0,
        totalConversations: totalConversations || 0,
        autonomy
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
