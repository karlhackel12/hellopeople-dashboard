'use client';

import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMission } from '@/hooks/useMissions';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, Circle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500',
  'in-progress': 'bg-blue-500',
  running: 'bg-blue-500',
  queued: 'bg-gray-400',
  succeeded: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-orange-500',
  blocked: 'bg-yellow-500',
};

const stepStatusIcon = (status: string) => {
  switch (status) {
    case 'succeeded': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
    case 'running': case 'in-progress': return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
    case 'blocked': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    default: return <Circle className="h-5 w-5 text-gray-300" />;
  }
};

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { mission, loading, error } = useMission(id);

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

  // Use real steps from DB (joined via API), fallback to proposal.step_kinds
  const steps = (mission as any).steps || [];
  const completedSteps = steps.filter((s: any) => s.status === 'succeeded').length;
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
            <Badge className={statusColors[mission.status] || 'bg-gray-500'}>{mission.status}</Badge>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {mission.proposal?.title || 'Untitled Mission'}
          </h2>
          <p className="text-muted-foreground">
            Agent: {mission.proposal?.agent_id || 'Unknown'}
          </p>
        </div>
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
                {steps.map((step: any, index: number) => (
                  <div
                    key={step.id || index}
                    className="flex items-start gap-3 pb-4 border-b last:border-0"
                  >
                    <div className="mt-0.5">
                      {stepStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          Step {index + 1}: {step.step_kind}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {step.status}
                        </Badge>
                      </div>
                      {step.last_error && (
                        <p className="text-sm text-red-500 mt-1">
                          Error: {step.last_error}
                        </p>
                      )}
                      {step.output && (
                        <details className="mt-2">
                          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                            View output
                          </summary>
                          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto mt-2 max-h-60">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                {steps.length === 0 && (
                  <p className="text-sm text-muted-foreground">No steps recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {mission.finished_at && (
                <div>
                  <p className="text-sm font-medium">Finished</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(mission.finished_at), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(mission.finished_at), { addSuffix: true })}
                  </p>
                </div>
              )}

              {mission.started_at && mission.finished_at && (
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(mission.started_at), { 
                      includeSeconds: true 
                    }).replace('about ', '~')}
                  </p>
                </div>
              )}

              {mission.started_at && !mission.finished_at && (
                <div>
                  <p className="text-sm font-medium">Running for</p>
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
              {mission.proposal?.step_kinds && (
                <div>
                  <p className="text-sm font-medium">Step Kinds</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {mission.proposal.step_kinds.map((sk: string) => (
                      <Badge key={sk} variant="outline" className="text-xs">{sk}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
