'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, Conversation } from '@/lib/supabase';
import { ArrowLeft, MessageSquare, Users, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversation();

    // Real-time subscription
    const channel = supabase
      .channel(`conversation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hp_roundtable_queue',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setConversation(payload.new as Conversation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchConversation = async () => {
    try {
      const { data: convData, error: convError } = await supabase
        .from('hp_roundtable_queue')
        .select('*')
        .eq('id', id)
        .single();

      if (convError) throw convError;
      setConversation(convData);

      // Fetch related memories
      const { data: memData } = await supabase
        .from('hp_agent_memory')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      setMemories(memData || []);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Conversation not found</p>
            <Link href="/conversations">
              <Button className="mt-4">Back to Conversations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRunning = conversation.status === 'running';
  const participantCount = conversation.participants?.length || 0;

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/conversations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              className={
                conversation.status === 'succeeded'
                  ? 'bg-green-500'
                  : conversation.status === 'running'
                  ? 'bg-blue-500'
                  : conversation.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }
            >
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
          <h2 className="text-3xl font-bold tracking-tight">
            {conversation.format === 'roundtable'
              ? 'Roundtable Discussion'
              : `${conversation.format.charAt(0).toUpperCase() + conversation.format.slice(1)} Conversation`}
          </h2>
          <p className="text-muted-foreground">
            {participantCount} participants
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {conversation.participants && conversation.participants.length > 0 ? (
                  conversation.participants.map((participant, index) => (
                    <Link key={index} href={`/agents/${participant}`}>
                      <Badge variant="outline" className="hover:bg-gray-100 cursor-pointer">
                        {participant}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No participants</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Memories Extracted */}
          <Card>
            <CardHeader>
              <CardTitle>Memories Extracted</CardTitle>
              <CardDescription>
                {memories.length} insights captured during this conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memories.length > 0 ? (
                <div className="space-y-4">
                  {memories.map((memory) => (
                    <div key={memory.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{memory.agent_id}</Badge>
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
                          {Math.round(memory.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm">{memory.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No memories captured yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(conversation.created_at), 'PPpp')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                </p>
              </div>

              {conversation.started_at && (
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(conversation.started_at), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conversation.started_at), { addSuffix: true })}
                  </p>
                </div>
              )}

              {conversation.completed_at && (
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(conversation.completed_at), 'PPpp')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(conversation.completed_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}

              {conversation.started_at && !conversation.completed_at && (
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.started_at))}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Conversation ID</p>
                <p className="text-xs text-muted-foreground font-mono">{conversation.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Format</p>
                <p className="text-sm text-muted-foreground">{conversation.format}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm text-muted-foreground">{conversation.status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
