'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { KPICard } from '@/components/KPICard';
import { MissionCard } from '@/components/MissionCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMissions } from '@/hooks/useMissions';
import { supabase, Objective, RoundtableQueue } from '@/lib/supabase';
import { Plus, Users, Calendar, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { missions, loading } = useMissions();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [nextConversation, setNextConversation] = useState<RoundtableQueue | null>(null);

  // Fetch objectives
  useEffect(() => {
    const fetchObjectives = async () => {
      const { data } = await supabase
        .from('hp_objectives')
        .select('*')
        .eq('status', 'active')
        .limit(3);
      if (data) setObjectives(data);
    };
    fetchObjectives();
  }, []);

  // Fetch next conversation
  useEffect(() => {
    const fetchNextConversation = async () => {
      const { data } = await supabase
        .from('hp_roundtable_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (data) setNextConversation(data);
    };
    fetchNextConversation();
  }, []);

  const activeMissions = missions.filter((m) => m.status === 'running' || m.status === 'pending');
  const recentMissions = missions.slice(0, 5);

  // Real KPIs - Autonomous Company Metrics
  const [kpis, setKpis] = useState([
    { title: 'Active Agents', current: 0, target: 13, unit: '', trend: 'stable' as const, trendValue: '0%' },
    { title: 'Conversations Today', current: 0, target: 8, unit: '', trend: 'up' as const, trendValue: '0%' },
    { title: 'Missions Completed', current: 0, target: 10, unit: '', trend: 'stable' as const, trendValue: '0%' },
    { title: 'System Autonomy', current: 0, target: 95, unit: '%', trend: 'up' as const, trendValue: '0%' },
  ]);

  // Fetch real company metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        console.log('🔍 Fetching metrics from Supabase...');
        
        // Count active agents (from relationships - unique agent_a + agent_b)
        const { data: relationships, error: relsError } = await supabase
          .from('hp_agent_relationships')
          .select('agent_a, agent_b');
        
        if (relsError) {
          console.error('❌ Error fetching relationships:', relsError);
        }
      
      const uniqueAgents = new Set<string>();
      relationships?.forEach(r => {
        uniqueAgents.add(r.agent_a);
        uniqueAgents.add(r.agent_b);
      });
      const activeAgents = uniqueAgents.size;

      // Count conversations today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: conversationsToday } = await supabase
        .from('hp_roundtable_queue')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Count completed missions
      const { count: completedMissions } = await supabase
        .from('hp_missions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Calculate autonomy (conversations succeeded / total conversations)
      const { count: totalConversations } = await supabase
        .from('hp_roundtable_queue')
        .select('*', { count: 'exact', head: true });
      
      const { count: succeededConversations } = await supabase
        .from('hp_roundtable_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'succeeded');

      const autonomy = totalConversations && totalConversations > 0 
        ? Math.round((succeededConversations || 0) / totalConversations * 100)
        : 0;

      console.log('✅ Metrics fetched:', { activeAgents, conversationsToday, completedMissions, autonomy });
      
      setKpis([
        { title: 'Active Agents', current: activeAgents, target: 13, unit: '', trend: 'stable' as const, trendValue: `${activeAgents}/13` },
        { title: 'Conversations Today', current: conversationsToday || 0, target: 8, unit: '', trend: 'up' as const, trendValue: `${conversationsToday || 0} today` },
        { title: 'Missions Completed', current: completedMissions || 0, target: 10, unit: '', trend: 'stable' as const, trendValue: `${completedMissions || 0} total` },
        { title: 'System Autonomy', current: autonomy, target: 95, unit: '%', trend: 'up' as const, trendValue: `${succeededConversations || 0}/${totalConversations || 0}` },
      ]);
      } catch (error) {
        console.error('❌ Error fetching metrics:', error);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            HelloPeople Autonomous Company - Executive Overview
          </p>
        </div>
        <Link href="/missions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Mission
          </Button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Active Missions */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Missions</CardTitle>
                <CardDescription>
                  {activeMissions.length} missions currently running
                </CardDescription>
              </div>
              <Link href="/missions">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading missions...</p>
            ) : recentMissions.length > 0 ? (
              <div className="space-y-4">
                {recentMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No active missions</p>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="col-span-3 space-y-4">
          {/* Objectives */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objectives
                  </CardTitle>
                  <CardDescription>Q1 2026 Goals</CardDescription>
                </div>
                <Link href="/objectives">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {objectives.length > 0 ? (
                <div className="space-y-4">
                  {objectives.map((obj) => {
                    const totalProgress = obj.key_results?.reduce(
                      (acc, kr) => acc + (kr.current / kr.target) * 100,
                      0
                    ) || 0;
                    const avgProgress = obj.key_results?.length
                      ? totalProgress / obj.key_results.length
                      : 0;

                    return (
                      <div key={obj.id} className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{obj.title}</p>
                            {obj.owner && (
                              <p className="text-xs text-muted-foreground">{obj.owner}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {avgProgress.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={avgProgress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No active objectives
                </p>
              )}
            </CardContent>
          </Card>

          {/* Next Conversation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Next Conversation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextConversation ? (
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold">
                    {formatDistanceToNow(new Date(nextConversation.scheduled_for || nextConversation.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextConversation.scheduled_for 
                      ? `Scheduled: ${new Date(nextConversation.scheduled_for).toLocaleString()}`
                      : `Created: ${new Date(nextConversation.created_at).toLocaleString()}`
                    }
                  </p>
                  <Link href="/conversations">
                    <Button variant="outline" size="sm" className="mt-2">
                      View Schedule
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No scheduled conversations
                </p>
              )}
            </CardContent>
          </Card>

          {/* Team Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Status
              </CardTitle>
              <CardDescription>5 teams, 13 agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Leadership', 'Product', 'Engineering', 'Marketing', 'Operations'].map(
                  (team) => (
                    <div key={team} className="flex items-center justify-between">
                      <span className="text-sm">{team}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                  )
                )}
              </div>
              <Link href="/agents">
                <Button variant="outline" className="w-full mt-4" size="sm">
                  View All Agents
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
