'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Brain, Rocket, MessageSquare, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AGENT_INFO: Record<string, any> = {
  ceo: { name: 'CEO', team: 'Leadership', description: 'Strategic leadership and decision-making' },
  cto: { name: 'CTO', team: 'Leadership', description: 'Technology strategy and architecture' },
  cfo: { name: 'CFO', team: 'Leadership', description: 'Financial planning and management' },
  product: { name: 'Product Manager', team: 'Product', description: 'Product strategy and roadmap' },
  engineering: { name: 'Engineering Lead', team: 'Engineering', description: 'Technical execution' },
  design: { name: 'Design Lead', team: 'Engineering', description: 'User experience design' },
  marketing: { name: 'Marketing Lead', team: 'Marketing', description: 'Marketing strategy' },
  sales: { name: 'Sales Lead', team: 'Marketing', description: 'Sales and customer acquisition' },
  support: { name: 'Support Lead', team: 'Operations', description: 'Customer support' },
  hr: { name: 'HR Manager', team: 'Operations', description: 'Team culture and hiring' },
  legal: { name: 'Legal Counsel', team: 'Operations', description: 'Legal compliance' },
  data: { name: 'Data Analyst', team: 'Product', description: 'Data analysis and insights' },
  operations: { name: 'Operations Manager', team: 'Operations', description: 'Process optimization' },
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [memories, setMemories] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const agent = AGENT_INFO[id] || { name: id, team: 'Unknown', description: 'Unknown agent' };

  useEffect(() => {
    fetchAgentData();
  }, [id]);

  const fetchAgentData = async () => {
    try {
      // Fetch memories
      const { data: memoryData } = await supabase
        .from('hp_agent_memory')
        .select('*')
        .eq('agent_id', id)
        .order('confidence', { ascending: false })
        .limit(10);

      // Fetch missions
      const { data: missionData } = await supabase
        .from('hp_missions')
        .select('*, proposal:hp_proposals(*)')
        .eq('proposal.agent_id', id)
        .limit(10);

      setMemories(memoryData || []);
      setMissions(missionData || []);
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const avgConfidence =
    memories.length > 0
      ? memories.reduce((acc, m) => acc + m.confidence, 0) / memories.length
      : 0;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/agents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{agent.name}</h2>
          <p className="text-muted-foreground">{agent.team} • {agent.description}</p>
        </div>
        <Link href={`/missions/create?agent=${id}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Assign Mission
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Missions</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{missions.length}</div>
            <p className="text-xs text-muted-foreground">Missions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memories</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memories.length}</div>
            <p className="text-xs text-muted-foreground">Knowledge captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Autonomy Score</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgConfidence * 100)}%</div>
            <p className="text-xs text-muted-foreground">Average confidence</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Memories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Top Memories
            </CardTitle>
            <CardDescription>Highest confidence learnings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : memories.length > 0 ? (
              <div className="space-y-3">
                {memories.slice(0, 5).map((memory) => (
                  <div key={memory.id} className="border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{memory.memory_type}</Badge>
                      <Badge
                        className={
                          memory.confidence >= 0.8
                            ? 'bg-green-500'
                            : memory.confidence >= 0.5
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }
                      >
                        {Math.round(memory.confidence * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm">{memory.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No memories yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Recent Missions
            </CardTitle>
            <CardDescription>Latest assigned missions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : missions.length > 0 ? (
              <div className="space-y-3">
                {missions.slice(0, 5).map((mission: any) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="block border-b pb-3 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          mission.status === 'succeeded'
                            ? 'bg-green-500'
                            : mission.status === 'failed'
                            ? 'bg-red-500'
                            : mission.status === 'running'
                            ? 'bg-blue-500'
                            : 'bg-gray-500'
                        }
                      >
                        {mission.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {mission.proposal?.title || 'Untitled Mission'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(mission.created_at), { addSuffix: true })}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No missions yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
