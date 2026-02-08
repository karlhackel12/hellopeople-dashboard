import { approveProposal } from '@/lib/mission-control';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { proposal_id } = await req.json();

    if (!proposal_id) {
      return NextResponse.json(
        { error: 'proposal_id is required' },
        { status: 400 }
      );
    }

    const mission = await approveProposal(proposal_id);
    
    return NextResponse.json({ mission });
  } catch (error: any) {
    console.error('Error approving proposal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve proposal' },
      { status: 500 }
    );
  }
}
