'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMission } from '@/hooks/useMissions';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const statusColors = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  succeeded: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-orange-500',
};

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { mission, loading, error } = useMission(id);

  const handleCancel = async () => {
    try {
      const { error } = await supabase
        .from('hp_missions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Mission cancelled');
    } catch (error) {
      toast.error('Failed to cancel mission');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading mission...</p>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Mission not found</p>
            <Link href="/missions">
              <Button className="mt-4">Back to Missions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = mission.proposal?.steps || [];
  const completedSteps = mission.result?.completed_steps || 0;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/missions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={statusColors[mission.status]}>{mission.status}</Badge>
            {mission.proposal?.priority && (
              <Badge variant="outline">{mission.proposal.priority}</Badge>
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {mission.proposal?.title || 'Untitled Mission'}
          </h2>
          <p className="text-muted-foreground">
            Agent: {mission.proposal?.agent_id || 'Unknown'}
          </p>
        </div>
        {mission.status === 'running' && (
          <Button variant="destructive" onClick={handleCancel}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Mission
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {mission.proposal?.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* Steps Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                {completedSteps}/{steps.length} steps completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="h-3 mb-6" />
              <div className="space-y-4">
                {steps.map((step: any, index: number) => {
                  const isCompleted = index < completedSteps;
                  const isCurrent = index === completedSteps;

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-4 border-b last:border-0"
                    >
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : isCurrent ? (
                          <Clock className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          Step {index + 1}: {step.kind || 'Unknown'}
                        </p>
                        {step.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {mission.result && (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(mission.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(mission.created_at), 'PPpp')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}
                </p>
              </div>

              {mission.started_at && (
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(mission.started_at), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(mission.started_at), { addSuffix: true })}
                  </p>
                </div>
              )}

              {mission.completed_at && (
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(mission.completed_at), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(mission.completed_at), { addSuffix: true })}
                  </p>
                </div>
              )}

              {mission.started_at && !mission.completed_at && (
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(mission.started_at))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Mission ID</p>
                <p className="text-xs text-muted-foreground font-mono">{mission.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Proposal ID</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {mission.proposal_id}
                </p>
              </div>
              {mission.proposal?.agent_id && (
                <div>
                  <p className="text-sm font-medium">Agent</p>
                  <p className="text-sm text-muted-foreground">
                    {mission.proposal.agent_id}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
