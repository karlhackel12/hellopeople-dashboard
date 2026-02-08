'use client';

import { useState, useEffect } from 'react';
import { supabase, Mission, Proposal } from '@/lib/supabase';

export interface MissionWithProposal extends Mission {
  proposal: Proposal;
}

export function useMissions() {
  const [missions, setMissions] = useState<MissionWithProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMissions = async () => {
      try {
        const { data, error } = await supabase
          .from('hp_missions')
          .select(`
            *,
            proposal:hp_proposals(*)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setMissions(data as any);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();

    // Real-time subscription
    const channel = supabase
      .channel('missions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hp_missions',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full mission with proposal
            const { data } = await supabase
              .from('hp_missions')
              .select(`*, proposal:hp_proposals(*)`)
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setMissions((prev) => [data as any, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMissions((prev) =>
              prev.map((m) =>
                m.id === payload.new.id ? { ...m, ...payload.new } : m
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMissions((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { missions, loading, error };
}

export function useMission(id: string) {
  const [mission, setMission] = useState<MissionWithProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        const { data, error } = await supabase
          .from('hp_missions')
          .select(`*, proposal:hp_proposals(*)`)
          .eq('id', id)
          .single();

        if (error) throw error;
        setMission(data as any);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMission();

    // Real-time subscription
    const channel = supabase
      .channel(`mission-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hp_missions',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setMission((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { mission, loading, error };
}
