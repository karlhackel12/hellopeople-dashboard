'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-gray-500',
  running: 'bg-blue-500',
  succeeded: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations?limit=50');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data } = await res.json();
        setConversations(data || []);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    statusFilter === 'all' || conv.status === statusFilter
  );

  const statusCounts = {
    all: conversations.length,
    pending: conversations.filter((c) => c.status === 'pending').length,
    running: conversations.filter((c) => c.status === 'running').length,
    succeeded: conversations.filter((c) => c.status === 'succeeded').length,
    failed: conversations.filter((c) => c.status === 'failed').length,
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conversations</h2>
        <p className="text-muted-foreground">
          Agent roundtables and discussions — {conversations.length} total
        </p>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="running">Running ({statusCounts.running})</SelectItem>
            <SelectItem value="succeeded">Succeeded ({statusCounts.succeeded})</SelectItem>
            <SelectItem value="failed">Failed ({statusCounts.failed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conv) => {
            const turnCount = conv.history?.length || 0;
            const participants = conv.participants || [];

            return (
              <Link key={conv.id} href={`/conversations/${conv.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[conv.status] || 'bg-gray-500'}>
                            {conv.status}
                          </Badge>
                          <Badge variant="secondary">{conv.format}</Badge>
                          {turnCount > 0 && (
                            <span className="text-xs text-muted-foreground">{turnCount} turns</span>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {conv.topic || 'Untitled'}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {participants.map((p: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {conv.completed_at
                        ? `Completed ${formatDistanceToNow(new Date(conv.completed_at), { addSuffix: true })}`
                        : conv.started_at
                        ? `Started ${formatDistanceToNow(new Date(conv.started_at), { addSuffix: true })}`
                        : `Created ${formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}`
                      }
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {statusFilter !== 'all' ? 'No conversations match your filter' : 'No conversations yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
