import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') || '50';
    const missionId = searchParams.get('id');

    // If fetching a single mission
    if (missionId) {
      const { data, error } = await supabaseAdmin
        .from('hp_missions')
        .select(`
          *,
          proposal:hp_proposals(*)
        `)
        .eq('id', missionId)
        .single();

      if (error) {
        console.error('Error fetching mission:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch all missions with proposals
    const { data, error } = await supabaseAdmin
      .from('hp_missions')
      .select(`
        *,
        proposal:hp_proposals(*)
      `)
      .order('id', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching missions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in missions API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch missions' },
      { status: 500 }
    );
  }
}
