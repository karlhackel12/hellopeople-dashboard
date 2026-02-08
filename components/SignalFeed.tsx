'use client';

import { useEffect, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase, AgentEvent } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const EVENT_COLORS: Record<string, string> = {
  mission_started: 'bg-blue-500',
  mission_succeeded: 'bg-green-500',
  mission_failed: 'bg-red-500',
  conversation_started: 'bg-purple-500',
  conversation_completed: 'bg-purple-600',
  proposal_created: 'bg-yellow-500',
  proposal_accepted: 'bg-green-600',
  proposal_rejected: 'bg-red-600',
  memory_created: 'bg-pink-500',
  insight_promoted: 'bg-orange-500',
  tweet_posted: 'bg-cyan-500',
  default: 'bg-gray-500',
};

const EVENT_ICONS: Record<string, any> = {
  mission_started: Clock,
  mission_succeeded: CheckCircle,
  mission_failed: XCircle,
  conversation_started: Activity,
  conversation_completed: CheckCircle,
  proposal_created: Zap,
  proposal_accepted: CheckCircle,
  proposal_rejected: XCircle,
  default: Activity,
};

export function SignalFeed() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch initial events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('hp_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        setEvents(data || []);
        setFilteredEvents(data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('signal-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hp_events' },
        (payload) => {
          const newEvent = payload.new as AgentEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 500)); // Keep max 500 events
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter events
  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.agent_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Agent filter
    if (agentFilter !== 'all') {
      filtered = filtered.filter((event) => event.agent_id === agentFilter);
    }

    // Kind filter
    if (kindFilter !== 'all') {
      filtered = filtered.filter((event) => event.kind === kindFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, agentFilter, kindFilter]);

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  const uniqueAgents = Array.from(new Set(events.map((e) => e.agent_id)));
  const uniqueKinds = Array.from(new Set(events.map((e) => e.kind)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {uniqueAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {uniqueKinds.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {kind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Event Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
        </p>
        {filteredEvents.length > 0 && (
          <Badge variant="outline" className="animate-pulse">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
            Live
          </Badge>
        )}
      </div>

      {/* Virtualized Event List */}
      <div
        ref={parentRef}
        className="h-[500px] overflow-auto border rounded-lg bg-gray-50/50"
      >
        {filteredEvents.length > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const event = filteredEvents[virtualItem.index];
              const Icon = EVENT_ICONS[event.kind] || EVENT_ICONS.default;
              const colorClass = EVENT_COLORS[event.kind] || EVENT_COLORS.default;

              return (
                <div
                  key={event.id}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full px-4 py-2"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${colorClass} text-white flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.agent_id}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {event.kind}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(event.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{event.title}</h4>
                        {event.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {event.summary}
                          </p>
                        )}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {event.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || agentFilter !== 'all' || kindFilter !== 'all'
                ? 'No events match your filters'
                : 'No events yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
