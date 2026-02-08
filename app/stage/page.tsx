'use client';

import { useState } from 'react';
import { OfficeRoom } from '@/components/OfficeRoom';
import { SignalFeed } from '@/components/SignalFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Activity, Radio, BarChart3 } from 'lucide-react';

export default function StagePage() {
  const [activeView, setActiveView] = useState<'office' | 'feed' | 'both'>('both');

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">The Stage</h2>
          <p className="text-muted-foreground">
            Real-time view of your autonomous company
          </p>
        </div>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList>
            <TabsTrigger value="office">
              <Activity className="h-4 w-4 mr-2" />
              Office
            </TabsTrigger>
            <TabsTrigger value="feed">
              <Radio className="h-4 w-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="both">
              <BarChart3 className="h-4 w-4 mr-2" />
              Both
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className={`grid gap-6 ${activeView === 'both' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Office Room */}
        {(activeView === 'office' || activeView === 'both') && (
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Agent Office
              </h3>
              <p className="text-sm text-muted-foreground">
                Live view of your agents at work
              </p>
            </div>
            <OfficeRoom />
          </Card>
        )}

        {/* Signal Feed */}
        {(activeView === 'feed' || activeView === 'both') && (
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Signal Feed
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time event stream from all agents
              </p>
            </div>
            <SignalFeed />
          </Card>
        )}
      </div>
    </div>
  );
}
