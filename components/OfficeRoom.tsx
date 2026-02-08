'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

type AgentBehavior = 'working' | 'chatting' | 'coffee' | 'celebrating' | 'walking';
type TimeOfDay = 'day' | 'dusk' | 'night';

interface AgentState {
  id: string;
  name: string;
  behavior: AgentBehavior;
  position: { x: number; y: number };
  status: 'active' | 'idle';
  currentTask?: string;
}

const AGENTS = [
  { id: 'ceo', name: 'CEO', color: '#3b82f6' },
  { id: 'product', name: 'Product', color: '#8b5cf6' },
  { id: 'engineering', name: 'Engineering', color: '#10b981' },
  { id: 'marketing', name: 'Marketing', color: '#f59e0b' },
  { id: 'data', name: 'Data', color: '#ec4899' },
  { id: 'operations', name: 'Operations', color: '#6366f1' },
];

const BEHAVIOR_ICONS: Record<AgentBehavior, string> = {
  working: '💻',
  chatting: '💬',
  coffee: '☕',
  celebrating: '🎉',
  walking: '🚶',
};

export function OfficeRoom() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [metrics, setMetrics] = useState({
    activeMissions: 0,
    conversationsToday: 0,
    eventsLastHour: 0,
  });

  // Initialize agent positions
  useEffect(() => {
    const initialAgents = AGENTS.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      behavior: 'working' as AgentBehavior,
      position: {
        x: 10 + (index % 3) * 30,
        y: 20 + Math.floor(index / 3) * 35,
      },
      status: 'active' as const,
    }));
    setAgents(initialAgents);
  }, []);

  // Update time of day based on real time
  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 18) setTimeOfDay('day');
      else if (hour >= 18 && hour < 20) setTimeOfDay('dusk');
      else setTimeOfDay('night');
    };
    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      const [missions, conversations, events] = await Promise.all([
        supabase
          .from('hp_missions')
          .select('*', { count: 'exact', head: true })
          .in('status', ['running', 'pending']),
        supabase
          .from('hp_roundtable_queue')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('hp_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
      ]);

      setMetrics({
        activeMissions: missions.count || 0,
        conversationsToday: conversations.count || 0,
        eventsLastHour: events.count || 0,
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  // Simulate agent behaviors based on real events
  useEffect(() => {
    const channel = supabase
      .channel('office-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hp_events' },
        (payload) => {
          const event = payload.new as any;
          const agentId = event.agent_id;

          // Update agent behavior based on event kind
          setAgents((prev) =>
            prev.map((agent) => {
              if (agent.id === agentId) {
                let behavior: AgentBehavior = 'working';
                if (event.kind.includes('conversation') || event.kind.includes('roundtable')) {
                  behavior = 'chatting';
                } else if (event.kind.includes('succeeded') || event.kind.includes('completed')) {
                  behavior = 'celebrating';
                } else if (event.kind.includes('break') || event.kind === 'watercooler') {
                  behavior = 'coffee';
                }
                return { ...agent, behavior, currentTask: event.title, status: 'active' };
              }
              return agent;
            })
          );

          // Reset behavior after a few seconds
          setTimeout(() => {
            setAgents((prev) =>
              prev.map((agent) =>
                agent.id === agentId ? { ...agent, behavior: 'working' } : agent
              )
            );
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const skyColors = {
    day: 'from-blue-400 via-blue-300 to-blue-200',
    dusk: 'from-orange-400 via-pink-300 to-purple-200',
    night: 'from-indigo-900 via-purple-900 to-black',
  };

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
      {/* Sky Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${skyColors[timeOfDay]} transition-colors duration-1000`}>
        {/* Stars for night */}
        {timeOfDay === 'night' && (
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 50}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-700 to-gray-600">
        <div className="h-2 bg-gray-800" />
      </div>

      {/* Whiteboard with Metrics */}
      <div className="absolute top-6 right-6 bg-white p-4 rounded-lg shadow-lg border-4 border-gray-800 w-56">
        <h4 className="font-bold text-sm mb-2 text-gray-800">📊 Live Metrics</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Active Missions:</span>
            <span className="font-bold text-blue-600">{metrics.activeMissions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Convos Today:</span>
            <span className="font-bold text-purple-600">{metrics.conversationsToday}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Events/Hour:</span>
            <span className="font-bold text-green-600">{metrics.eventsLastHour}</span>
          </div>
        </div>
      </div>

      {/* Agents */}
      <div className="relative w-full h-full">
        {agents.map((agent) => {
          const agentConfig = AGENTS.find((a) => a.id === agent.id);
          const agentColor = agentConfig?.color || '#6366f1';

          return (
            <div
              key={agent.id}
              className="absolute transition-all duration-500 ease-in-out group"
              style={{
                left: `${agent.position.x}%`,
                top: `${agent.position.y}%`,
              }}
            >
              {/* Agent Avatar */}
              <div className="relative">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl cursor-pointer transform hover:scale-110 transition-transform"
                  style={{ backgroundColor: agentColor }}
                  title={agent.name}
                >
                  {BEHAVIOR_ICONS[agent.behavior]}
                </div>

                {/* Active Pulse */}
                {agent.status === 'active' && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: agentColor }}
                  />
                )}

              {/* Agent Name Badge */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Badge variant="secondary" className="text-xs">
                  {agent.name}
                </Badge>
              </div>

              {/* Current Task Tooltip */}
              {agent.currentTask && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-xs truncate">
                  {agent.currentTask}
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Time of Day Indicator */}
      <div className="absolute top-4 left-4">
        <Badge variant="outline" className="bg-white/80 backdrop-blur">
          {timeOfDay === 'day' && '☀️ Day'}
          {timeOfDay === 'dusk' && '🌅 Dusk'}
          {timeOfDay === 'night' && '🌙 Night'}
        </Badge>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg">
        <h4 className="font-bold text-xs mb-2 text-gray-800">Agent Behaviors</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(BEHAVIOR_ICONS).map(([behavior, icon]) => (
            <div key={behavior} className="flex items-center gap-1">
              <span>{icon}</span>
              <span className="text-gray-600 capitalize">{behavior}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
