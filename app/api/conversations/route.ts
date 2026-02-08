import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const limit = searchParams.get('limit') || '10';
    const nextOnly = searchParams.get('next') === 'true';

    let query = supabaseAdmin
      .from('hp_roundtable_queue')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (nextOnly) {
      query = query.limit(1);
      const { data, error } = await query.maybeSingle();
      
      if (error) {
        console.error('Error fetching next conversation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    query = query.limit(parseInt(limit));
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
