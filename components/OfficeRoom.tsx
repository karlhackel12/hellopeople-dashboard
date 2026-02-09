'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type AgentBehavior = 'working' | 'chatting' | 'coffee' | 'celebrating';
type TimeOfDay = 'day' | 'dusk' | 'night';

interface AgentState {
  id: string;
  name: string;
  team: string;
  behavior: AgentBehavior;
  position: { x: number; y: number };
  status: 'active' | 'idle';
  currentTask?: string;
  color: string;
}

interface StageData {
  agents: Array<{ agent_id: string; skills: string[] }>;
  activeMissions: any[];
  recentSteps: Array<{
    id: string;
    mission_id: string;
    step_kind: string;
    status: string;
    reserved_at: string;
    finished_at: string;
    output: any;
  }>;
  recentConversations: Array<{
    id: string;
    topic: string;
    participants: string[];
    status: string;
    created_at: string;
    completed_at: string;
  }>;
  conversationsToday: number;
  recentMemories: any[];
  deliverablesCount: number;
}

// Real agent configuration organized by teams
const AGENT_CONFIG: Record<string, { name: string; team: string; color: string }> = {
  // Leadership
  'ceo': { name: 'CEO', team: 'Leadership', color: '#3b82f6' },
  
  // Marketing
  'marketing-lead': { name: 'Mktg Lead', team: 'Marketing', color: '#f59e0b' },
  'marketing-agent': { name: 'Marketer', team: 'Marketing', color: '#fbbf24' },
  'ux-strategist': { name: 'UX Strat', team: 'Marketing', color: '#f97316' },
  
  // Product
  'product-lead': { name: 'Prod Lead', team: 'Product', color: '#8b5cf6' },
  'product': { name: 'Product', team: 'Product', color: '#a78bfa' },
  'product-analyst': { name: 'Analyst', team: 'Product', color: '#c084fc' },
  
  // Dev
  'dev-lead': { name: 'Dev Lead', team: 'Dev', color: '#10b981' },
  'tech-lead': { name: 'Tech Lead', team: 'Dev', color: '#34d399' },
  'frontend-engineer': { name: 'Frontend', team: 'Dev', color: '#6ee7b7' },
  'backend-engineer': { name: 'Backend', team: 'Dev', color: '#059669' },
  
  // QA/Ops
  'qa-lead': { name: 'QA Lead', team: 'QA/Ops', color: '#ec4899' },
  'qa': { name: 'QA', team: 'QA/Ops', color: '#f472b6' },
  'support': { name: 'Support', team: 'QA/Ops', color: '#fb923c' },
  'security-engineer': { name: 'Security', team: 'QA/Ops', color: '#ef4444' },
  'devops-engineer': { name: 'DevOps', team: 'QA/Ops', color: '#6366f1' },
};

const TEAM_POSITIONS: Record<string, { x: number; y: number }> = {
  'Leadership': { x: 50, y: 15 },
  'Marketing': { x: 15, y: 35 },
  'Product': { x: 45, y: 35 },
  'Dev': { x: 75, y: 35 },
  'QA/Ops': { x: 30, y: 60 },
};

const BEHAVIOR_ICONS: Record<AgentBehavior, string> = {
  working: '💻',
  chatting: '💬',
  coffee: '☕',
  celebrating: '🎉',
};

export function OfficeRoom() {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [stageData, setStageData] = useState<StageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stage data from API
  const fetchStageData = async () => {
    try {
      const response = await fetch('/api/stage');
      const data = await response.json();
      setStageData(data);
      updateAgentStates(data);
    } catch (error) {
      console.error('Failed to fetch stage data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update agent states based on real data
  const updateAgentStates = (data: StageData) => {
    const now = Date.now();
    const thirtyMinAgo = now - 30 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Create a map of agent activities
    const agentActivity = new Map<string, { behavior: AgentBehavior; task?: string }>();

    // Check recent steps for working agents
    data.recentSteps?.forEach((step) => {
      // Extract agent from step_kind (e.g., "dev-lead:code-review" -> "dev-lead")
      const agentMatch = step.step_kind.match(/^([^:]+):/);
      const agentId = agentMatch ? agentMatch[1] : null;
      
      if (agentId && step.reserved_at) {
        const reservedTime = new Date(step.reserved_at).getTime();
        const finishedTime = step.finished_at ? new Date(step.finished_at).getTime() : null;

        // Agent is working if step is running and reserved in last 30 min
        if (step.status === 'running' && reservedTime > thirtyMinAgo) {
          agentActivity.set(agentId, {
            behavior: 'working',
            task: `${step.step_kind.split(':')[1] || 'working'}`,
          });
        }
        // Agent is celebrating if completed in last hour
        else if (step.status === 'succeeded' && finishedTime && finishedTime > oneHourAgo) {
          agentActivity.set(agentId, {
            behavior: 'celebrating',
            task: `Completed: ${step.step_kind.split(':')[1] || 'task'}`,
          });
        }
      }
    });

    // Check recent conversations for chatting agents
    data.recentConversations?.forEach((convo) => {
      convo.participants?.forEach((agentId) => {
        const createdTime = new Date(convo.created_at).getTime();
        const completedTime = convo.completed_at ? new Date(convo.completed_at).getTime() : null;

        // Agent is chatting if conversation is running or completed in last hour
        if (
          (convo.status === 'running' && createdTime > oneHourAgo) ||
          (completedTime && completedTime > oneHourAgo)
        ) {
          // Only update if not already celebrating
          if (!agentActivity.has(agentId) || agentActivity.get(agentId)?.behavior !== 'celebrating') {
            agentActivity.set(agentId, {
              behavior: 'chatting',
              task: convo.topic || 'In conversation',
            });
          }
        }
      });
    });

    // Create agent states organized by team
    const newAgents: AgentState[] = [];
    const agentIds = Object.keys(AGENT_CONFIG);

    agentIds.forEach((agentId, index) => {
      const config = AGENT_CONFIG[agentId];
      const team = config.team;
      const teamPos = TEAM_POSITIONS[team];
      
      // Calculate position within team cluster
      const teamMembers = agentIds.filter(id => AGENT_CONFIG[id].team === team);
      const indexInTeam = teamMembers.indexOf(agentId);
      const membersPerRow = 3;
      const row = Math.floor(indexInTeam / membersPerRow);
      const col = indexInTeam % membersPerRow;

      const activity = agentActivity.get(agentId);
      const behavior = activity?.behavior || 'coffee';
      const currentTask = activity?.task;

      newAgents.push({
        id: agentId,
        name: config.name,
        team: config.team,
        color: config.color,
        behavior,
        position: {
          x: teamPos.x + col * 8 - (Math.min(teamMembers.length, membersPerRow) - 1) * 4,
          y: teamPos.y + row * 12,
        },
        status: behavior !== 'coffee' ? 'active' : 'idle',
        currentTask,
      });
    });

    setAgents(newAgents);
  };

  // Initialize and set up polling
  useEffect(() => {
    fetchStageData();
    const interval = setInterval(fetchStageData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
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
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
  }, []);

  const skyColors = {
    day: 'from-blue-400 via-blue-300 to-blue-200',
    dusk: 'from-orange-400 via-pink-300 to-purple-200',
    night: 'from-indigo-900 via-purple-900 to-black',
  };

  if (loading) {
    return (
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border flex items-center justify-center">
        <p className="text-muted-foreground">Loading office activity...</p>
      </div>
    );
  }

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
            <span className="font-bold text-blue-600">{stageData?.activeMissions.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Convos Today:</span>
            <span className="font-bold text-purple-600">{stageData?.conversationsToday || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Deliverables:</span>
            <span className="font-bold text-green-600">{stageData?.deliverablesCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Agents Active:</span>
            <span className="font-bold text-orange-600">
              {agents.filter(a => a.status === 'active').length}/{agents.length}
            </span>
          </div>
        </div>
      </div>

      {/* Team Labels */}
      {Object.entries(TEAM_POSITIONS).map(([team, pos]) => (
        <div
          key={team}
          className="absolute text-white font-bold text-xs bg-black/30 px-2 py-1 rounded"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y - 8}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {team}
        </div>
      ))}

      {/* Agents */}
      <div className="relative w-full h-full">
        {agents.map((agent) => {
          return (
            <div
              key={agent.id}
              className="absolute transition-all duration-500 ease-in-out group"
              style={{
                left: `${agent.position.x}%`,
                top: `${agent.position.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Agent Avatar */}
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl cursor-pointer transform hover:scale-110 transition-transform shadow-lg"
                  style={{ backgroundColor: agent.color }}
                  title={`${agent.name} (${agent.id})`}
                >
                  {BEHAVIOR_ICONS[agent.behavior]}
                </div>

                {/* Active Pulse */}
                {agent.status === 'active' && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: agent.color }}
                  />
                )}

                {/* Agent Name Badge */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {agent.name}
                  </Badge>
                </div>

                {/* Current Task Tooltip */}
                {agent.currentTask && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity max-w-xs truncate z-10 pointer-events-none">
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

      {/* Auto-refresh indicator */}
      <div className="absolute bottom-4 right-4">
        <Badge variant="outline" className="bg-white/80 backdrop-blur text-xs animate-pulse">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
          Live (15s)
        </Badge>
      </div>
    </div>
  );
}
