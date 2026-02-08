'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, Deliverable } from '@/lib/supabase';
import { FileText, ExternalLink, Tag } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const typeIcons: Record<Deliverable['type'], string> = {
  post: '📱',
  code: '💻',
  document: '📄',
  design: '🎨',
  video: '🎥',
  article: '✍️',
  report: '📊',
  other: '📎',
};

const statusColors: Record<Deliverable['status'], string> = {
  draft: 'bg-gray-500',
  review: 'bg-yellow-500',
  published: 'bg-green-500',
  archived: 'bg-gray-400',
};

export default function DeliverablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDeliverables();

    // Real-time subscription
    const channel = supabase
      .channel('deliverables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hp_deliverables',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDeliverables((prev) => [payload.new as Deliverable, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDeliverables((prev) =>
              prev.map((d) =>
                d.id === payload.new.id ? (payload.new as Deliverable) : d
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDeliverables((prev) => prev.filter((d) => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeliverables = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_deliverables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliverables(data || []);
    } catch (error) {
      console.error('Failed to fetch deliverables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeliverables = deliverables.filter((d) => {
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const typeCounts = {
    all: deliverables.length,
    post: deliverables.filter((d) => d.type === 'post').length,
    code: deliverables.filter((d) => d.type === 'code').length,
    document: deliverables.filter((d) => d.type === 'document').length,
    design: deliverables.filter((d) => d.type === 'design').length,
    video: deliverables.filter((d) => d.type === 'video').length,
    article: deliverables.filter((d) => d.type === 'article').length,
    report: deliverables.filter((d) => d.type === 'report').length,
    other: deliverables.filter((d) => d.type === 'other').length,
  };

  const statusCounts = {
    all: deliverables.length,
    draft: deliverables.filter((d) => d.status === 'draft').length,
    review: deliverables.filter((d) => d.status === 'review').length,
    published: deliverables.filter((d) => d.status === 'published').length,
    archived: deliverables.filter((d) => d.status === 'archived').length,
  };

  const handleCardClick = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading deliverables...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Deliverables ({deliverables.length})
          </h2>
          <p className="text-muted-foreground">
            Track all agent deliverables and outputs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types ({typeCounts.all})</SelectItem>
            <SelectItem value="post">📱 Post ({typeCounts.post})</SelectItem>
            <SelectItem value="code">💻 Code ({typeCounts.code})</SelectItem>
            <SelectItem value="document">📄 Document ({typeCounts.document})</SelectItem>
            <SelectItem value="design">🎨 Design ({typeCounts.design})</SelectItem>
            <SelectItem value="video">🎥 Video ({typeCounts.video})</SelectItem>
            <SelectItem value="article">✍️ Article ({typeCounts.article})</SelectItem>
            <SelectItem value="report">📊 Report ({typeCounts.report})</SelectItem>
            <SelectItem value="other">📎 Other ({typeCounts.other})</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
            <SelectItem value="draft">Draft ({statusCounts.draft})</SelectItem>
            <SelectItem value="review">Review ({statusCounts.review})</SelectItem>
            <SelectItem value="published">Published ({statusCounts.published})</SelectItem>
            <SelectItem value="archived">Archived ({statusCounts.archived})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliverables.length > 0 ? (
          filteredDeliverables.map((deliverable) => (
            <Card
              key={deliverable.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCardClick(deliverable)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeIcons[deliverable.type]}</span>
                    <Badge variant="secondary">{deliverable.type}</Badge>
                  </div>
                  <Badge className={statusColors[deliverable.status]}>
                    {deliverable.status}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">{deliverable.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {deliverable.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">Agent:</span> {deliverable.agent_id}
                  </div>

                  {deliverable.tags && deliverable.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {deliverable.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {deliverable.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{deliverable.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {deliverable.url && (
                    <a
                      href={deliverable.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Link
                    </a>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {formatDistanceToNow(new Date(deliverable.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No deliverables match your filters'
                  : 'No deliverables yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedDeliverable && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{typeIcons[selectedDeliverable.type]}</span>
                  <Badge variant="secondary">{selectedDeliverable.type}</Badge>
                  <Badge className={statusColors[selectedDeliverable.status]}>
                    {selectedDeliverable.status}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedDeliverable.title}</DialogTitle>
                <DialogDescription>
                  {selectedDeliverable.description || 'No description available'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Agent ID</p>
                    <p className="text-sm">{selectedDeliverable.agent_id}</p>
                  </div>
                  {selectedDeliverable.conversation_id && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Conversation ID</p>
                      <p className="text-sm font-mono text-xs">
                        {selectedDeliverable.conversation_id}
                      </p>
                    </div>
                  )}
                  {selectedDeliverable.mission_id && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Mission ID</p>
                      <p className="text-sm font-mono text-xs">
                        {selectedDeliverable.mission_id}
                      </p>
                    </div>
                  )}
                </div>

                {selectedDeliverable.tags && selectedDeliverable.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDeliverable.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDeliverable.url && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">URL</p>
                    <a
                      href={selectedDeliverable.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedDeliverable.url}
                    </a>
                  </div>
                )}

                {selectedDeliverable.content && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Content</p>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {typeof selectedDeliverable.content === 'string'
                          ? selectedDeliverable.content
                          : JSON.stringify(selectedDeliverable.content, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {format(new Date(selectedDeliverable.created_at), 'PPpp')}
                    </p>
                  </div>
                  {selectedDeliverable.published_at && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Published</p>
                      <p className="text-sm">
                        {format(new Date(selectedDeliverable.published_at), 'PPpp')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Updated</p>
                    <p className="text-sm">
                      {format(new Date(selectedDeliverable.updated_at), 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
