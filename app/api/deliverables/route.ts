import { supabaseAdmin } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') || '50';

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('hp_deliverables')
        .select('*')
        .eq('id', id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data });
    }

    const { data, error } = await supabaseAdmin
      .from('hp_deliverables')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
