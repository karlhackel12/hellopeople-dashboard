'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, AgentMemory } from '@/lib/supabase';
import { Lightbulb, Search, Brain, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function InsightsPage() {
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_agent_memory')
        .select('*')
        .order('confidence', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter((memory) => {
    const matchesSearch = 
      !searchQuery ||
      memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memory.agent_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || memory.memory_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group by memory type
  const memoryTypes = Array.from(new Set(memories.map((m) => m.memory_type)));
  const topMemories = filteredMemories.slice(0, 20);

  // Calculate confidence distribution
  const highConfidence = memories.filter((m) => m.confidence >= 0.8).length;
  const mediumConfidence = memories.filter((m) => m.confidence >= 0.5 && m.confidence < 0.8).length;
  const lowConfidence = memories.filter((m) => m.confidence < 0.5).length;

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Insights</h2>
          <p className="text-muted-foreground">
            Knowledge and learnings from agent memory
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Memories</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memories.length}</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highConfidence}</div>
            <p className="text-xs text-muted-foreground">
              {((highConfidence / memories.length) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Types</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoryTypes.length}</div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {memoryTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confidence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Distribution</CardTitle>
          <CardDescription>Memory quality across the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-muted-foreground">High (≥80%)</div>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(highConfidence / memories.length) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-right">{highConfidence}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-muted-foreground">Medium (50-80%)</div>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500"
                  style={{ width: `${(mediumConfidence / memories.length) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-right">{mediumConfidence}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 text-sm text-muted-foreground">Low (&lt;50%)</div>
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${(lowConfidence / memories.length) * 100}%` }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-right">{lowConfidence}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Insights */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Top Insights</h3>
        {topMemories.length > 0 ? (
          topMemories.map((memory) => {
            const confidencePercent = Math.round(memory.confidence * 100);
            const confidenceColor =
              memory.confidence >= 0.8
                ? 'bg-green-500'
                : memory.confidence >= 0.5
                ? 'bg-yellow-500'
                : 'bg-red-500';

            return (
              <Card key={memory.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{memory.agent_id}</Badge>
                        <Badge variant="secondary">{memory.memory_type}</Badge>
                        <Badge className={confidenceColor}>
                          {confidencePercent}% confidence
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{memory.content}</p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || typeFilter !== 'all'
                  ? 'No insights match your filters'
                  : 'No insights yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
