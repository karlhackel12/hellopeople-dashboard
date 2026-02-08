'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, Proposal } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      toast.error('Failed to load proposals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proposal: Proposal) => {
    if (!confirm(`Approve proposal "${proposal.title}"? This will create a mission.`)) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/proposals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposal.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve proposal');
      }

      const { mission } = await response.json();
      toast.success(`Proposal approved! Mission #${mission.id} created.`);
      fetchProposals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve proposal');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/proposals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proposal_id: selectedProposal.id,
          reason: rejectionReason 
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject proposal');
      }

      toast.success('Proposal rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedProposal(null);
      fetchProposals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject proposal');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setRejectDialogOpen(true);
  };

  // Get unique agents
  const agents = Array.from(new Set(proposals.map(p => p.agent_id)));

  // Filter proposals
  const filteredProposals = proposals.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (agentFilter !== 'all' && p.agent_id !== agentFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Accepted
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Proposals</h2>
          <p className="text-muted-foreground">
            Review and approve agent proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filteredProposals.length} proposals
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <Label htmlFor="status-filter" className="text-sm mb-2 block">Status</Label>
          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger id="status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <Label htmlFor="agent-filter" className="text-sm mb-2 block">Agent</Label>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger id="agent-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent} value={agent}>{agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {getStatusBadge(proposal.status)}
                  <CardTitle className="text-lg mt-2 flex items-start gap-2">
                    <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span>{proposal.title}</span>
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {proposal.agent_id}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
              {/* Description */}
              {proposal.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {proposal.description}
                </p>
              )}

              {/* Steps */}
              {proposal.step_kinds && proposal.step_kinds.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Steps ({proposal.step_kinds.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {proposal.step_kinds.map((step, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {step}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {proposal.metadata?.objective_id && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Objective:</span>{' '}
                  <Link 
                    href={`/objectives`}
                    className="text-blue-600 hover:underline"
                  >
                    #{proposal.metadata.objective_id.slice(0, 8)}
                  </Link>
                </div>
              )}

              {/* Mission Link (if accepted) */}
              {proposal.status === 'accepted' && proposal.mission_id && (
                <Link 
                  href={`/missions`}
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Mission <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              {/* Rejection Reason */}
              {proposal.status === 'rejected' && proposal.rejection_reason && (
                <div className="text-xs p-2 bg-red-50 text-red-700 rounded border border-red-200">
                  <p className="font-medium mb-1">Rejected:</p>
                  <p>{proposal.rejection_reason}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-auto pt-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(proposal.created_at), 'MMM d, yyyy HH:mm')}
              </div>

              {/* Actions (only for pending) */}
              {proposal.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(proposal)}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => openRejectDialog(proposal)}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProposals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {statusFilter !== 'all' || agentFilter !== 'all' 
                ? 'No proposals match your filters' 
                : 'No proposals yet'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Proposal</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{selectedProposal?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this proposal is being rejected..."
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedProposal(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
