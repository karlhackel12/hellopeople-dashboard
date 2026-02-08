'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MissionCard } from '@/components/MissionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMissions } from '@/hooks/useMissions';
import { supabase } from '@/lib/supabase';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function MissionsPage() {
  const { missions, loading } = useMissions();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMissions = missions.filter((mission) => {
    const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
    const matchesSearch = 
      !searchQuery ||
      mission.proposal?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.proposal?.agent_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCancelMission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hp_missions')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Mission cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel mission');
      console.error(error);
    }
  };

  const statusCounts = {
    all: missions.length,
    pending: missions.filter((m) => m.status === 'pending').length,
    running: missions.filter((m) => m.status === 'running').length,
    succeeded: missions.filter((m) => m.status === 'succeeded').length,
    failed: missions.filter((m) => m.status === 'failed').length,
    cancelled: missions.filter((m) => m.status === 'cancelled').length,
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Missions</h2>
          <p className="text-muted-foreground">
            Manage and track all agent missions
          </p>
        </div>
        <Link href="/missions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Mission
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search missions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({statusCounts.all})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="running">Running ({statusCounts.running})</SelectItem>
            <SelectItem value="succeeded">Succeeded ({statusCounts.succeeded})</SelectItem>
            <SelectItem value="failed">Failed ({statusCounts.failed})</SelectItem>
            <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading missions...</p>
        ) : filteredMissions.length > 0 ? (
          filteredMissions.map((mission) => (
            <MissionCard 
              key={mission.id} 
              mission={mission} 
              onCancel={handleCancelMission}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No missions match your filters' 
                : 'No missions yet'}
            </p>
            <Link href="/missions/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Mission
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
