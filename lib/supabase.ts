import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Mission {
  id: string;
  proposal_id: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  result: any;
  created_at: string;
}

export interface Proposal {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  step_kinds: string[];
  status: 'pending' | 'accepted' | 'rejected';
  rejection_reason?: string | null;
  decided_at?: string | null;
  metadata?: any;
  mission_id?: string | null;
  created_at: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  owner: string | null;
  quarter: string | null;
  deadline: string | null;
  key_results: KeyResult[];
  status: 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface KeyResult {
  title: string;
  target: number;
  current: number;
  unit: string;
}

export interface AgentMemory {
  id: string;
  agent_id: string;
  conversation_id: string;
  content: string;
  memory_type: string;
  confidence: number;
  created_at: string;
}

export interface RoundtableQueue {
  id: string;
  format: string;
  topic: string;
  participants: string[];
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  history: Array<{ turn: number; speaker: string; dialogue: string }>;
  max_turns: number;
  temperature: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  scheduled_for?: string;
}

export interface Conversation extends RoundtableQueue {
  // Alias for compatibility
  scheduled_for: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  type: 'post' | 'code' | 'document' | 'design' | 'video' | 'article' | 'report' | 'other';
  agent_id: string;
  conversation_id: string | null;
  mission_id: string | null;
  content: any;
  url: string | null;
  status: 'draft' | 'review' | 'published' | 'archived';
  tags: string[];
  created_at: string;
  published_at: string | null;
  updated_at: string;
}
