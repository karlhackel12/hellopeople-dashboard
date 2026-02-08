'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

const AGENTS = [
  'ceo', 'cto', 'cfo', 'product', 'engineering', 
  'marketing', 'sales', 'support', 'hr', 'legal',
  'data', 'design', 'operations'
];

const TEMPLATES = [
  {
    name: 'Weekly Review',
    agent: 'ceo',
    title: 'Weekly Company Review',
    description: 'Analyze company performance, team health, and strategic progress for the week',
    steps: ['analyze', 'reflect', 'decide', 'communicate'],
    priority: 'normal',
  },
  {
    name: 'User Analysis',
    agent: 'product',
    title: 'User Behavior Analysis',
    description: 'Deep dive into user engagement patterns and product usage metrics',
    steps: ['analyze', 'reflect', 'communicate'],
    priority: 'normal',
  },
  {
    name: 'Crisis Mode',
    agent: 'ceo',
    title: 'Emergency Response',
    description: 'Immediate action required for critical situation',
    steps: ['analyze', 'decide', 'act', 'communicate'],
    priority: 'critical',
  },
  {
    name: 'Market Research',
    agent: 'marketing',
    title: 'Competitive Market Analysis',
    description: 'Research competitors, market trends, and opportunities',
    steps: ['research', 'analyze', 'reflect', 'communicate'],
    priority: 'normal',
  },
];

export default function CreateMissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    agent_id: '',
    title: '',
    description: '',
    priority: 'normal',
  });

  const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
    setFormData({
      agent_id: template.agent,
      title: template.title,
      description: template.description,
      priority: template.priority,
    });
    toast.success(`Template "${template.name}" loaded`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create proposal
      const { data: proposal, error: proposalError } = await supabase
        .from('hp_proposals')
        .insert({
          agent_id: formData.agent_id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          steps: [
            { kind: 'analyze', description: 'Analyze situation' },
            { kind: 'reflect', description: 'Reflect on findings' },
            { kind: 'decide', description: 'Make decisions' },
            { kind: 'communicate', description: 'Communicate results' },
          ],
          status: 'pending',
        })
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Create mission
      const { data: mission, error: missionError } = await supabase
        .from('hp_missions')
        .insert({
          proposal_id: proposal.id,
          status: 'pending',
        })
        .select()
        .single();

      if (missionError) throw missionError;

      toast.success('Mission created successfully');
      router.push(`/missions/${mission.id}`);
    } catch (error) {
      toast.error('Failed to create mission');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/missions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Mission</h2>
          <p className="text-muted-foreground">
            Assign a new mission to an agent
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Templates */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Templates
            </CardTitle>
            <CardDescription>
              Quick start with pre-built templates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {TEMPLATES.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.agent}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Mission Details</CardTitle>
            <CardDescription>
              Configure the mission parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Select
                  value={formData.agent_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, agent_id: value })
                  }
                  required
                >
                  <SelectTrigger id="agent">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((agent) => (
                      <SelectItem key={agent} value={agent}>
                        {agent.charAt(0).toUpperCase() + agent.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Mission title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed mission description"
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Link href="/missions" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Mission'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
