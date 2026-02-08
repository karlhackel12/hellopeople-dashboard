'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Users, Clock, Brain, MessageCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Agent color map for dialogue
const agentColors: Record<string, string> = {
  ceo: 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
  'product-lead': 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  product: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
  'dev-lead': 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
  'tech-lead': 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
  'backend-engineer': 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
  'frontend-engineer': 'border-l-teal-500 bg-teal-50 dark:bg-teal-950/20',
  'qa-lead': 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20',
  qa: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20',
  'marketing-lead': 'border-l-pink-500 bg-pink-50 dark:bg-pink-950/20',
  'marketing-agent': 'border-l-pink-500 bg-pink-50 dark:bg-pink-950/20',
  marketing: 'border-l-pink-500 bg-pink-50 dark:bg-pink-950/20',
  support: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  'ux-strategist': 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-950/20',
};

const agentBadgeColors: Record<string, string> = {
  ceo: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'product-lead': 'bg-blue-100 text-blue-800',
  product: 'bg-blue-100 text-blue-800',
  'dev-lead': 'bg-green-100 text-green-800',
  'tech-lead': 'bg-green-100 text-green-800',
  'qa-lead': 'bg-orange-100 text-orange-800',
  qa: 'bg-orange-100 text-orange-800',
  'marketing-lead': 'bg-pink-100 text-pink-800',
  'marketing-agent': 'bg-pink-100 text-pink-800',
  marketing: 'bg-pink-100 text-pink-800',
  support: 'bg-yellow-100 text-yellow-800',
};

export default function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await fetch(`/api/conversations?id=${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data, error: apiError } = await res.json();
        if (apiError) throw new Error(apiError);
        setConversation(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading conversation...</p>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">{error || 'Conversation not found'}</p>
            <Link href="/conversations">
              <Button className="mt-4">Back to Conversations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const history = conversation.history || [];
  const participants = conversation.participants || [];

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
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
                conversation.status === 'succeeded' ? 'bg-green-500'
                : conversation.status === 'running' ? 'bg-blue-500'
                : conversation.status === 'failed' ? 'bg-red-500'
                : 'bg-gray-500'
              }
            >
              {conversation.status}
            </Badge>
            <Badge variant="secondary">{conversation.format}</Badge>
            {conversation.status === 'running' && (
              <Badge variant="outline" className="animate-pulse">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                Live
              </Badge>
            )}
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            {conversation.topic || 'Untitled Conversation'}
          </h2>
          <p className="text-muted-foreground">
            {participants.length} participants · {history.length} turns
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Dialogue */}
        <div className="md:col-span-2 space-y-6">
          {/* Dialogue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Dialogue
              </CardTitle>
              <CardDescription>
                {history.length} turns between {participants.length} agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((turn: any, index: number) => {
                    const speaker = turn.speaker || 'unknown';
                    const colorClass = agentColors[speaker] || 'border-l-gray-400 bg-gray-50 dark:bg-gray-900/20';
                    const badgeClass = agentBadgeColors[speaker] || 'bg-gray-100 text-gray-800';

                    return (
                      <div
                        key={index}
                        className={`border-l-4 rounded-r-lg p-4 ${colorClass}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
                            {speaker}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Turn {turn.turn !== undefined ? turn.turn + 1 : index + 1}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{turn.dialogue}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  No dialogue recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                {participants.map((p: string, i: number) => {
                  const badgeClass = agentBadgeColors[p] || 'bg-gray-100 text-gray-800';
                  return (
                    <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}>
                      {p}
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Format</p>
                <p className="text-sm text-muted-foreground">{conversation.format}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Max Turns</p>
                <p className="text-sm text-muted-foreground">{conversation.max_turns || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Temperature</p>
                <p className="text-sm text-muted-foreground">{conversation.temperature ?? 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

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
              </div>
              {conversation.started_at && (
                <div>
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(conversation.started_at), 'PPpp')}
                  </p>
                </div>
              )}
              {conversation.completed_at && (
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(conversation.completed_at), 'PPpp')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ID */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">ID</p>
              <p className="text-xs text-muted-foreground font-mono break-all">{conversation.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
