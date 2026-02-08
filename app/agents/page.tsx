'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Users, Brain, Rocket, MessageSquare } from 'lucide-react';

const AGENTS = [
  { id: 'ceo', name: 'CEO', team: 'Leadership', description: 'Strategic leadership and decision-making' },
  { id: 'cto', name: 'CTO', team: 'Leadership', description: 'Technology strategy and architecture' },
  { id: 'cfo', name: 'CFO', team: 'Leadership', description: 'Financial planning and management' },
  { id: 'product', name: 'Product Manager', team: 'Product', description: 'Product strategy and roadmap' },
  { id: 'engineering', name: 'Engineering Lead', team: 'Engineering', description: 'Technical execution and team management' },
  { id: 'design', name: 'Design Lead', team: 'Engineering', description: 'User experience and interface design' },
  { id: 'marketing', name: 'Marketing Lead', team: 'Marketing', description: 'Marketing strategy and campaigns' },
  { id: 'sales', name: 'Sales Lead', team: 'Marketing', description: 'Sales strategy and customer acquisition' },
  { id: 'support', name: 'Support Lead', team: 'Operations', description: 'Customer support and success' },
  { id: 'hr', name: 'HR Manager', team: 'Operations', description: 'Team culture and hiring' },
  { id: 'legal', name: 'Legal Counsel', team: 'Operations', description: 'Legal compliance and contracts' },
  { id: 'data', name: 'Data Analyst', team: 'Product', description: 'Data analysis and insights' },
  { id: 'operations', name: 'Operations Manager', team: 'Operations', description: 'Process optimization and efficiency' },
];

const TEAMS = ['Leadership', 'Product', 'Engineering', 'Marketing', 'Operations'];

export default function AgentsPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [agentStats, setAgentStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const fetchAgentStats = async () => {
    try {
      // Fetch mission counts per agent
      const { data: missions } = await supabase
        .from('hp_missions')
        .select('id, proposal:hp_proposals(agent_id)');

      // Fetch memory counts per agent
      const { data: memories } = await supabase
        .from('hp_agent_memory')
        .select('agent_id, confidence');

      const stats: Record<string, any> = {};

      AGENTS.forEach((agent) => {
        const agentMissions = missions?.filter(
          (m: any) => m.proposal?.agent_id === agent.id
        ) || [];
        const agentMemories = memories?.filter(
          (m: any) => m.agent_id === agent.id
        ) || [];

        const avgConfidence = agentMemories.length > 0
          ? agentMemories.reduce((acc, m) => acc + (m.confidence || 0), 0) / agentMemories.length
          : 0;

        stats[agent.id] = {
          missions: agentMissions.length,
          memories: agentMemories.length,
          avgConfidence,
        };
      });

      setAgentStats(stats);
    } catch (error) {
      console.error('Failed to fetch agent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = selectedTeam === 'all'
    ? AGENTS
    : AGENTS.filter((agent) => agent.team === selectedTeam);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
          <p className="text-muted-foreground">
            13 autonomous agents across 5 teams
          </p>
        </div>
      </div>

      {/* Team Filters */}
      <div className="flex gap-2">
        <Button
          variant={selectedTeam === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedTeam('all')}
        >
          All Teams ({AGENTS.length})
        </Button>
        {TEAMS.map((team) => (
          <Button
            key={team}
            variant={selectedTeam === team ? 'default' : 'outline'}
            onClick={() => setSelectedTeam(team)}
          >
            {team} ({AGENTS.filter((a) => a.team === team).length})
          </Button>
        ))}
      </div>

      {/* Agent Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => {
          const stats = agentStats[agent.id] || { missions: 0, memories: 0, avgConfidence: 0 };
          const autonomyScore = Math.round(stats.avgConfidence * 100);

          return (
            <Card key={agent.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <CardDescription>{agent.team}</CardDescription>
                  </div>
                  <Link href={`/agents/${agent.id}`}>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {agent.description}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Rocket className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.missions}</p>
                    <p className="text-xs text-muted-foreground">Missions</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Brain className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                    <p className="text-2xl font-bold">{stats.memories}</p>
                    <p className="text-xs text-muted-foreground">Memories</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <MessageSquare className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-2xl font-bold">{autonomyScore}%</p>
                    <p className="text-xs text-muted-foreground">Autonomy</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
