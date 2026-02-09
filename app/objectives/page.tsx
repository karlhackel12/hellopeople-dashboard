'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Target, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface KeyResult {
  title: string;
  target: number;
  current: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  quarter?: string;
  deadline?: string;
  status: string;
  key_results?: KeyResult[];
  created_at: string;
  updated_at: string;
}

export default function ObjectivesPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner: '',
    quarter: 'Q1 2026',
    deadline: '',
    key_results: [] as KeyResult[],
  });

  useEffect(() => {
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    try {
      const response = await fetch('/api/objectives');
      if (!response.ok) throw new Error('Failed to fetch objectives');
      
      const result = await response.json();
      setObjectives(result.data || []);
    } catch (error) {
      toast.error('Failed to load objectives');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      owner: '',
      quarter: 'Q1 2026',
      deadline: '',
      key_results: [],
    });
    setEditingObjective(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingObjective) {
        const response = await fetch(`/api/objectives?id=${editingObjective.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update objective');
        toast.success('Objective updated');
      } else {
        const response = await fetch('/api/objectives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to create objective');
        toast.success('Objective created');
      }

      setIsCreateOpen(false);
      resetForm();
      fetchObjectives();
    } catch (error) {
      toast.error('Failed to save objective');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this objective?')) return;

    try {
      const response = await fetch(`/api/objectives?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete objective');
      toast.success('Objective deleted');
      fetchObjectives();
    } catch (error) {
      toast.error('Failed to delete objective');
      console.error(error);
    }
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    setFormData({
      title: objective.title,
      description: objective.description || '',
      owner: objective.owner || '',
      quarter: objective.quarter || 'Q1 2026',
      deadline: objective.deadline || '',
      key_results: objective.key_results || [],
    });
    setIsCreateOpen(true);
  };

  const addKeyResult = () => {
    setFormData({
      ...formData,
      key_results: [
        ...formData.key_results,
        { title: '', target: 0, current: 0, unit: '' },
      ],
    });
  };

  const updateKeyResult = (index: number, field: keyof KeyResult, value: any) => {
    const updated = [...formData.key_results];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, key_results: updated });
  };

  const removeKeyResult = (index: number) => {
    setFormData({
      ...formData,
      key_results: formData.key_results.filter((_, i) => i !== index),
    });
  };

  const calculateProgress = (obj: Objective) => {
    if (!obj.key_results || obj.key_results.length === 0) return 0;
    const total = obj.key_results.reduce(
      (acc, kr) => {
        if (kr.target === 0) return acc;
        return acc + (kr.current / kr.target) * 100;
      },
      0
    );
    return Math.min(100, total / obj.key_results.length);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading objectives...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Objectives & Key Results</h2>
          <p className="text-muted-foreground">
            Track company goals and progress
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingObjective ? 'Edit Objective' : 'Create New Objective'}
              </DialogTitle>
              <DialogDescription>
                Define your objective and key results to track progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Reach 1,000 Active Users"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of this objective"
                  className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <Input
                    id="owner"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    placeholder="e.g., Marketing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarter">Quarter</Label>
                  <Select
                    value={formData.quarter}
                    onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                  >
                    <SelectTrigger id="quarter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                      <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                      <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                      <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Key Results</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addKeyResult}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                {formData.key_results.map((kr, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Key result title"
                          value={kr.title}
                          onChange={(e) => updateKeyResult(index, 'title', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyResult(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Current"
                          value={kr.current || ''}
                          onChange={(e) => updateKeyResult(index, 'current', Number(e.target.value))}
                        />
                        <Input
                          type="number"
                          placeholder="Target"
                          value={kr.target || ''}
                          onChange={(e) => updateKeyResult(index, 'target', Number(e.target.value))}
                        />
                        <Input
                          placeholder="Unit"
                          value={kr.unit}
                          onChange={(e) => updateKeyResult(index, 'unit', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingObjective ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {objectives.map((objective) => {
          const progress = calculateProgress(objective);
          const isOnTrack = progress >= 70;

          return (
            <Card key={objective.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={isOnTrack ? 'default' : 'secondary'}>
                        {objective.quarter || 'No quarter'}
                      </Badge>
                      <Badge variant="outline">{objective.status}</Badge>
                    </div>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <Target className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <span>{objective.title}</span>
                    </CardTitle>
                    {objective.owner && (
                      <CardDescription className="mt-1">
                        Owner: {objective.owner}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(objective)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(objective.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {objective.description && (
                  <p className="text-sm text-muted-foreground">
                    {objective.description}
                  </p>
                )}

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {objective.key_results && objective.key_results.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Key Results</p>
                    {objective.key_results.map((kr, index) => {
                      const krProgress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{kr.title}</span>
                            <span className="font-medium">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                          <Progress value={Math.min(100, krProgress)} className="h-1" />
                        </div>
                      );
                    })}
                  </div>
                )}

                {objective.deadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline: {format(new Date(objective.deadline), 'PPP')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {objectives.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No objectives yet</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Objective
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
