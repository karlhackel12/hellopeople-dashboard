import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') || '50';

    // Fetch single proposal by ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('hp_proposals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching proposal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch all proposals
    const { data, error } = await supabaseAdmin
      .from('hp_proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching proposals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in proposals API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}
