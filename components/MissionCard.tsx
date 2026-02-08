'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MissionWithProposal } from '@/hooks/useMissions';
import { Eye, XCircle } from 'lucide-react';

interface MissionCardProps {
  mission: MissionWithProposal;
  onCancel?: (id: string) => void;
}

const statusColors = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  succeeded: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-orange-500',
};

export function MissionCard({ mission, onCancel }: MissionCardProps) {
  const steps = mission.proposal?.step_kinds || [];
  const completedSteps = mission.result?.completed_steps || 0;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={statusColors[mission.status]}>{mission.status}</Badge>
            </div>
            <CardTitle className="text-lg">{mission.proposal?.title || 'Untitled Mission'}</CardTitle>
            <CardDescription>
              Agent: {mission.proposal?.agent_id || 'Unknown'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Link href={`/missions/${mission.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </Link>
            {mission.status === 'running' && onCancel && (
              <Button size="sm" variant="destructive" onClick={() => onCancel(mission.id)}>
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mission.proposal?.description && (
          <p className="text-sm text-muted-foreground mb-3">
            {mission.proposal.description}
          </p>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="text-muted-foreground">
              {completedSteps}/{steps.length} steps
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {mission.started_at ? (
            <span>Started {formatDistanceToNow(new Date(mission.started_at), { addSuffix: true })}</span>
          ) : (
            <span>Created {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
