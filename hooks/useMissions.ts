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
    // Initial fetch via API route (uses SERVICE_ROLE key)
    const fetchMissions = async () => {
      try {
        const response = await fetch('/api/missions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { data, error: apiError } = await response.json();
        
        if (apiError) throw new Error(apiError);
        setMissions(data || []);
      } catch (err) {
        console.error('Error fetching missions:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();

    // Real-time subscription (still works with ANON key for listening to changes)
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
            // Fetch the full mission with proposal via API
            const response = await fetch(`/api/missions?id=${payload.new.id}`);
            if (response.ok) {
              const { data } = await response.json();
              if (data) {
                setMissions((prev) => [data, ...prev]);
              }
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
        const response = await fetch(`/api/missions?id=${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { data, error: apiError } = await response.json();
        
        if (apiError) throw new Error(apiError);
        setMission(data);
      } catch (err) {
        console.error('Error fetching mission:', err);
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
