import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') || '50';
    const nextOnly = searchParams.get('next') === 'true';

    // Fetch single conversation by ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('hp_roundtable_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch next pending
    if (nextOnly) {
      const { data, error } = await supabaseAdmin
        .from('hp_roundtable_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching next conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch all conversations (optionally filter by status)
    let query = supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
