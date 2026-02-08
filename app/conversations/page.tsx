'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, RoundtableQueue as Conversation } from '@/lib/supabase';
import { MessageSquare, Users, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const statusColors = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  succeeded: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchConversations();

    // Real-time subscription
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hp_roundtable_queue',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === payload.new.id ? (payload.new as Conversation) : c
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_roundtable_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    statusFilter === 'all' || conv.status === statusFilter
  );

  const statusCounts = {
    all: conversations.length,
    pending: conversations.filter((c) => c.status === 'pending').length,
    running: conversations.filter((c) => c.status === 'running').length,
    succeeded: conversations.filter((c) => c.status === 'succeeded').length,
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
          <p className="text-muted-foreground">
            Real-time agent conversations and roundtables
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="running">Running ({statusCounts.running})</SelectItem>
            <SelectItem value="succeeded">Succeeded ({statusCounts.succeeded})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            const isRunning = conversation.status === 'running';
            const participantCount = conversation.participants?.length || 0;

            return (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusColors[conversation.status]}>
                          {conversation.status}
                        </Badge>
                        {isRunning && (
                          <Badge variant="outline" className="animate-pulse">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                            Live
                          </Badge>
                        )}
                        <Badge variant="secondary">{conversation.format}</Badge>
                      </div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        {conversation.format === 'roundtable'
                          ? 'Roundtable Discussion'
                          : `${conversation.format.charAt(0).toUpperCase() + conversation.format.slice(1)} Conversation`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {participantCount} participants
                        </span>
                        {conversation.started_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Started {formatDistanceToNow(new Date(conversation.started_at), { addSuffix: true })}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Link href={`/conversations/${conversation.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {conversation.participants && conversation.participants.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {conversation.participants.map((participant, index) => (
                        <Badge key={index} variant="outline">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })} •{' '}
                    {format(new Date(conversation.created_at), 'PPpp')}
                    {conversation.completed_at && (
                      <>
                        {' '}• Completed {formatDistanceToNow(new Date(conversation.completed_at), { addSuffix: true })}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'all'
                  ? 'No conversations match your filter'
                  : 'No conversations yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
