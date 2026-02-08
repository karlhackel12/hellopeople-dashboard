'use client';

import { useEffect, useState } from 'react';
import { supabase, Policy } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Edit, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PolicyWithParsed extends Policy {
  parsed?: any;
  error?: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<PolicyWithParsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<PolicyWithParsed | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('hp_policy')
        .select('*')
        .order('key', { ascending: true });

      if (error) throw error;

      // Parse JSON values
      const parsedPolicies = (data || []).map((policy) => {
        try {
          return {
            ...policy,
            parsed: typeof policy.value === 'string' ? JSON.parse(policy.value) : policy.value,
          };
        } catch (e) {
          return {
            ...policy,
            error: 'Invalid JSON',
          };
        }
      });

      setPolicies(parsedPolicies);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (key: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('hp_policy')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      toast.success('Policy updated successfully');
      fetchPolicies();
      setEditingPolicy(null);
    } catch (error) {
      console.error('Failed to update policy:', error);
      toast.error('Failed to update policy');
    }
  };

  const togglePolicyEnabled = async (key: string, currentValue: any) => {
    const newValue = {
      ...currentValue,
      enabled: !currentValue.enabled,
    };
    await updatePolicy(key, newValue);
  };

  const handleEditOpen = (policy: PolicyWithParsed) => {
    setEditingPolicy(policy);
    setEditValue(JSON.stringify(policy.parsed || policy.value, null, 2));
  };

  const handleEditSave = async () => {
    if (!editingPolicy) return;

    try {
      const parsed = JSON.parse(editValue);
      await updatePolicy(editingPolicy.key, parsed);
    } catch (e) {
      toast.error('Invalid JSON format');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <p className="text-muted-foreground text-center py-12">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Policy Management</h2>
          <p className="text-muted-foreground">
            Control your autonomous business behavior without code deployment
          </p>
        </div>
        <Button onClick={fetchPolicies} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Policy Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {policies.map((policy) => {
          const hasEnabled = policy.parsed && typeof policy.parsed.enabled === 'boolean';
          const isEnabled = hasEnabled ? policy.parsed.enabled : true;

          return (
            <Card key={policy.key} className={`${!isEnabled && hasEnabled ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{formatPolicyName(policy.key)}</CardTitle>
                      {hasEnabled && (
                        <Badge variant={isEnabled ? 'default' : 'secondary'}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      )}
                      {policy.error && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {policy.error}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      Last updated: {new Date(policy.updated_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasEnabled && (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => togglePolicyEnabled(policy.key, policy.parsed)}
                      />
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(policy)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Policy: {formatPolicyName(policy.key)}</DialogTitle>
                          <DialogDescription>
                            Modify the policy configuration (JSON format)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="policy-value">Policy Value (JSON)</Label>
                            <Textarea
                              id="policy-value"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="font-mono text-sm h-64"
                              placeholder='{"enabled": true, "limit": 10}'
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setEditingPolicy(null)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button onClick={handleEditSave}>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PolicyValueDisplay policy={policy} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {policies.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No policies configured yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PolicyValueDisplay({ policy }: { policy: PolicyWithParsed }) {
  if (policy.error) {
    return (
      <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-x-auto">
        {JSON.stringify(policy.value, null, 2)}
      </pre>
    );
  }

  const value = policy.parsed || policy.value;

  return (
    <div className="space-y-2">
      {Object.entries(value).map(([key, val]) => {
        if (key === 'enabled') return null; // Already shown in header

        return (
          <div key={key} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{formatPolicyName(key)}:</span>
            <span className="font-medium">
              {typeof val === 'boolean' ? (
                <Badge variant={val ? 'default' : 'secondary'}>{val ? 'Yes' : 'No'}</Badge>
              ) : typeof val === 'object' ? (
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {JSON.stringify(val)}
                </code>
              ) : (
                String(val)
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatPolicyName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
