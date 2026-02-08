'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

function safeFormat(dateStr: string | null | undefined, fmt: string) {
  if (!dateStr) return '';
  try { return format(new Date(dateStr), fmt); } catch { return dateStr; }
}

function safeDistance(dateStr: string | null | undefined, opts?: any) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(new Date(dateStr), opts); } catch { return ''; }
}

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        const res = await fetch(`/api/missions?id=${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setMission(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMission();
  }, [id]);

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
            <p className="text-muted-foreground">{error || 'Mission not found'}</p>
            <Link href="/missions">
              <Button className="mt-4">Back to Missions</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const steps = Array.isArray(mission.steps) ? mission.steps : [];
  const completedSteps = steps.filter((s: any) => s.status === 'succeeded').length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const proposal = mission.proposal || {};

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
            {proposal.title || 'Untitled Mission'}
          </h2>
          <p className="text-muted-foreground">
            Agent: {proposal.agent_id || 'Unknown'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {proposal.description || 'No description provided'}
              </p>
            </CardContent>
          </Card>

          {/* Steps */}
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
                  <div key={step.id || index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className="mt-0.5">{stepStatusIcon(step.status || 'queued')}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Step {index + 1}: {step.step_kind || 'unknown'}</p>
                        <Badge variant="outline" className="text-xs">{step.status || 'queued'}</Badge>
                      </div>
                      {step.last_error && (
                        <p className="text-sm text-red-500 mt-1">Error: {step.last_error}</p>
                      )}
                      {step.output && (
                        <details className="mt-2">
                          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                            View output
                          </summary>
                          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-lg overflow-auto mt-2 max-h-60">
                            {typeof step.output === 'string' ? step.output : JSON.stringify(step.output, null, 2)}
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
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mission.started_at && (
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">{safeFormat(mission.started_at, 'PPpp')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{safeDistance(mission.started_at, { addSuffix: true })}</p>
                </div>
              )}
              {mission.finished_at && (
                <div>
                  <p className="text-sm font-medium">Finished</p>
                  <p className="text-sm text-muted-foreground">{safeFormat(mission.finished_at, 'PPpp')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{safeDistance(mission.finished_at, { addSuffix: true })}</p>
                </div>
              )}
              {mission.started_at && !mission.finished_at && (
                <div>
                  <p className="text-sm font-medium">Running for</p>
                  <p className="text-sm text-muted-foreground">{safeDistance(mission.started_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Mission ID</p>
                <p className="text-xs text-muted-foreground font-mono break-all">{mission.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Proposal ID</p>
                <p className="text-xs text-muted-foreground font-mono break-all">{mission.proposal_id}</p>
              </div>
              {proposal.agent_id && (
                <div>
                  <p className="text-sm font-medium">Agent</p>
                  <p className="text-sm text-muted-foreground">{proposal.agent_id}</p>
                </div>
              )}
              {Array.isArray(proposal.step_kinds) && proposal.step_kinds.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Step Kinds</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {proposal.step_kinds.map((sk: string) => (
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
