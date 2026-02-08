import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const limit = searchParams.get('limit') || '10';

    const { data, error } = await supabaseAdmin
      .from('hp_objectives')
      .select('*')
      .eq('status', status)
      .limit(parseInt(limit));

    if (error) {
      console.error('Error fetching objectives:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error in objectives API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch objectives' },
      { status: 500 }
    );
  }
}
