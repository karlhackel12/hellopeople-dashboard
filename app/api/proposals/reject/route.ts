import { rejectProposal } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { proposal_id, reason } = await req.json();

    if (!proposal_id) {
      return NextResponse.json(
        { error: 'proposal_id is required' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      );
    }

    await rejectProposal(proposal_id, reason);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting proposal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject proposal' },
      { status: 500 }
    );
  }
}
