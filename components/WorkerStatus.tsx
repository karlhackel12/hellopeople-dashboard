'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WorkerStatusData {
  id: string;
  worker_name: string;
  status: 'running' | 'stopped' | 'crashed' | 'unknown';
  last_heartbeat: string;
  jobs_processed: number;
  error_count: number;
  circuit_breaker_open: boolean;
  metadata: any;
  updated_at: string;
}

interface WorkerConfig {
  name: string;
  description: string;
  interval_minutes?: number; // Expected interval for periodic workers
}

const EXPECTED_WORKERS: WorkerConfig[] = [
  { name: 'mission-worker', description: 'Executes mission steps with skills', interval_minutes: 5 },
  { name: 'roundtable-worker', description: 'Agent conversation orchestration', interval_minutes: 10 },
  { name: 'initiative-worker', description: 'Agent-driven proposal generation', interval_minutes: 30 },
  { name: 'objective-proposal-worker', description: 'Objective-to-proposal transformation', interval_minutes: 60 },
  { name: 'outcome-learner', description: 'Performance analysis and learning', interval_minutes: 60 },
];

export function WorkerStatus() {
  const [workers, setWorkers] = useState<WorkerStatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchWorkerStatus();
    const interval = setInterval(fetchWorkerStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchWorkerStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_worker_status')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        // Table might not exist yet - this is expected
        console.log('Worker status table not found (expected for new setups)');
        setWorkers([]);
      } else {
        setWorkers(data || []);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch worker status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkerStatus = (workerName: string, config: WorkerConfig) => {
    const worker = workers.find((w) => w.worker_name === workerName);
    if (!worker) return null;

    const minutesSinceHeartbeat = (Date.now() - new Date(worker.last_heartbeat).getTime()) / 60000;
    const interval = config.interval_minutes || 5;

    // Determine health status based on interval
    let healthStatus: 'healthy' | 'warning' | 'error' | 'unknown';
    
    if (minutesSinceHeartbeat < interval * 2) {
      healthStatus = 'healthy';
    } else if (minutesSinceHeartbeat < interval * 3) {
      healthStatus = 'warning';
    } else {
      healthStatus = 'error';
    }

    return { ...worker, healthStatus, minutesSinceHeartbeat };
  };

  const getStatusBadge = (workerData: ReturnType<typeof getWorkerStatus>) => {
    if (!workerData) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          No Data
        </Badge>
      );
    }

    const { healthStatus, minutesSinceHeartbeat } = workerData;

    switch (healthStatus) {
      case 'healthy':
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Healthy
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-yellow-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Delayed
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Stale
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading worker status...</p>
        </CardContent>
      </Card>
    );
  }

  // If no worker status table exists
  if (workers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Worker Status
              </CardTitle>
              <CardDescription>VPS worker health monitoring</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchWorkerStatus}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-sm font-medium mb-2">Worker monitoring not configured</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add worker heartbeat reporting to enable health monitoring
            </p>
            <details className="text-left text-xs text-muted-foreground bg-gray-50 p-3 rounded">
              <summary className="cursor-pointer font-medium mb-2">Setup Instructions</summary>
              <pre className="mt-2 overflow-x-auto">
{`-- Create worker status table
CREATE TABLE hp_worker_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL,
  jobs_processed INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  circuit_breaker_open BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add to your VPS workers:
// Report heartbeat every 30s
setInterval(async () => {
  await supabase.from('hp_worker_status').upsert({
    worker_name: 'worker-name',
    status: 'running',
    last_heartbeat: new Date().toISOString(),
    jobs_processed: jobCount,
    error_count: errorCount,
  });
}, 30000);`}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthyCount = EXPECTED_WORKERS.filter((config) => {
    const workerData = getWorkerStatus(config.name, config);
    return workerData && workerData.healthStatus === 'healthy';
  }).length;
  const totalCount = EXPECTED_WORKERS.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Worker Status
              <Badge variant={healthyCount === totalCount ? 'default' : 'destructive'}>
                {healthyCount}/{totalCount} Healthy
              </Badge>
            </CardTitle>
            <CardDescription>
              Last updated: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchWorkerStatus}>
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {EXPECTED_WORKERS.map((config) => {
            const workerData = getWorkerStatus(config.name, config);

            return (
              <div
                key={config.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{config.name}</p>
                    {getStatusBadge(workerData)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                  {workerData ? (
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last run: {formatDistanceToNow(new Date(workerData.last_heartbeat), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>Jobs: {workerData.jobs_processed}</span>
                      {workerData.error_count > 0 && (
                        <span className="text-red-600">Errors: {workerData.error_count}</span>
                      )}
                      {workerData.circuit_breaker_open && (
                        <Badge variant="destructive" className="text-xs">
                          Circuit Breaker Open
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <AlertTriangle className="h-3 w-3" />
                      No data available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
