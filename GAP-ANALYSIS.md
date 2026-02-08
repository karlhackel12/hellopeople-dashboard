# Mission Control Dashboard - Gap Analysis & Improvement Plan

**Date**: 2026-02-08
**Current State**: Production Ready Dashboard (Basic Features)
**Target State**: Full Tutorial Implementation (Advanced Multi-Agent Visualization)

---

## Executive Summary

The current dashboard successfully implements **basic monitoring** for the autonomous agent system:
- ✅ Dashboard overview with KPIs
- ✅ Missions list and CRUD operations
- ✅ Proposals approval/rejection workflow
- ✅ Agent profiles and stats
- ✅ Conversations list view
- ✅ Memory/insights browser
- ✅ Real-time Supabase subscriptions

However, compared to the tutorial's **Stage Page** with pixel-art office and complete system transparency, there are **13 critical gaps** that limit observability and user engagement.

---

## Gap Analysis: What's Missing

### 🎨 **TIER 1: Critical Visualization Gaps** (High Impact, High Value)

These are the "wow factor" features from the tutorial that make the system transparent and engaging.

#### 1. **The Stage Page / OfficeRoom Component** ❌
**Tutorial Reference**: Chapter 7 - "The pixel art office with 6 agents"

**What's Missing**:
- Pixel-art cyberpunk office visualization
- Agent avatars with behavior states (working/chatting/coffee/celebrating/walking)
- Sky changes (day/dusk/night) synced to real time
- Whiteboard displaying live OPS metrics
- Walking animations and spatial positioning

**Current State**: No visual representation of agents in an office environment

**Impact**: **HIGH** - This is the signature feature that makes the system feel "alive"

**Effort**: High (requires custom canvas/SVG rendering, animations, state management)

---

#### 2. **Real-Time Signal Feed** ❌
**Tutorial Reference**: Chapter 7 - "SignalFeed.tsx with virtualization"

**What's Missing**:
- Real-time event stream from `hp_events` table
- Virtualized scrolling for hundreds of events
- Event filtering (by agent, by kind, by tags)
- Live updates as events happen
- Event type indicators (mission_started, tweet_posted, insight_promoted, etc.)

**Current State**: No unified event stream visualization. Events are scattered across different pages.

**Impact**: **HIGH** - Without this, you can't see "what's happening right now" across the system

**Effort**: Medium (use @tanstack/react-virtual, real-time Supabase subscription)

---

#### 3. **Mission Playback Timeline** ❌
**Tutorial Reference**: Chapter 7 - "Mission Playback with video-like controls"

**What's Missing**:
- Step-by-step replay of mission execution
- Timeline scrubber
- Play/pause controls
- Event details at each step
- Visual representation of mission flow

**Current State**: Missions show final status only, no playback

**Impact**: **MEDIUM-HIGH** - Critical for debugging and understanding how missions executed

**Effort**: Medium (timeline component, event sequencing, UI controls)

---

#### 4. **Agent Relationships Visualization** ❌
**Tutorial Reference**: Chapter 4 - "Dynamic Affinity System"

**What's Missing**:
- Network graph showing agent relationships
- Affinity scores between pairs (0.10-0.95)
- Drift history visualization
- Interaction count display
- Color-coded relationship strength

**Current State**: Relationship data exists in `hp_agent_relationships` table but not visualized

**Impact**: **MEDIUM** - Understanding agent dynamics is key to the system's personality

**Effort**: Medium (D3.js or React Flow for network visualization)

---

### ⚙️ **TIER 2: System Management Gaps** (Critical for Operations)

#### 5. **Policy Management Dashboard** ❌
**Tutorial Reference**: Chapter 1 - "ops_policy table with key-value structure"

**What's Missing**:
- UI to view all policies (auto_approve, x_daily_quota, content_policy, etc.)
- Toggle switches for enabled/disabled policies
- JSON editor for policy values
- Policy change history
- Real-time policy updates without redeployment

**Current State**: No policy management UI (must edit database directly)

**Impact**: **HIGH** - Operators can't adjust system behavior without database access

**Effort**: Low-Medium (CRUD interface with JSON editor)

---

#### 6. **Trigger Rules Management** ❌
**Tutorial Reference**: Chapter 1 - "ops_trigger_rules table with reactive + proactive triggers"

**What's Missing**:
- List of all trigger rules (reactive + proactive)
- Enable/disable toggles
- Fire count and last fired timestamp
- Cooldown status
- Edit trigger conditions

**Current State**: No trigger rules UI

**Impact**: **MEDIUM-HIGH** - Can't monitor or adjust what causes agents to act

**Effort**: Medium (CRUD interface, rule editor)

---

#### 7. **Reaction Matrix Visualization** ❌
**Tutorial Reference**: Chapter 1 - "Reaction Matrix showing agent-to-agent interactions"

**What's Missing**:
- Matrix view showing "when Agent A does X with tags Y, Agent B reacts with Z"
- Probability and cooldown display
- Edit reaction patterns
- Recent reactions log

**Current State**: No visualization of the reaction system

**Impact**: **MEDIUM** - Understanding agent interactions is hidden

**Effort**: Medium (matrix grid component, pattern editor)

---

#### 8. **Heartbeat Health Monitor** ❌
**Tutorial Reference**: Chapter 1 - "Heartbeat runs every 5 minutes, does 6 things"

**What's Missing**:
- Heartbeat status (last run, next run)
- Health checks for each subsystem (triggers, reactions, insights, outcomes, stale recovery)
- Error log from failed heartbeats
- Manual trigger button
- Heartbeat history

**Current State**: No visibility into heartbeat health

**Impact**: **MEDIUM-HIGH** - Can't tell if the system is "alive" or stuck

**Effort**: Low-Medium (status dashboard, logs table)

---

### 📊 **TIER 3: Enhanced Monitoring Gaps**

#### 9. **Voice Evolution Dashboard** ❌
**Tutorial Reference**: Chapter 6 - "Personality modifiers derived from memory"

**What's Missing**:
- Agent personality evolution over time
- Memory stats (lesson_count, pattern_count, strategy_count)
- Voice modifiers currently active
- Before/after personality comparison

**Current State**: No visualization of how agent voices evolve

**Impact**: **LOW-MEDIUM** - Interesting insight but not critical

**Effort**: Low (stats aggregation, timeline chart)

---

#### 10. **Initiative Queue Monitor** ❌
**Tutorial Reference**: Chapter 5 - "ops_initiative_queue for agent-proposed ideas"

**What's Missing**:
- Pending initiative proposals
- Initiative generation history
- Agent initiative frequency
- Prerequisites met/unmet

**Current State**: No initiative queue visualization

**Impact**: **MEDIUM** - Can't see what agents want to do proactively

**Effort**: Low (simple queue table view)

---

#### 11. **Cap Gates Status** ❌
**Tutorial Reference**: Chapter 1 - "Cap Gates check quotas at proposal entry"

**What's Missing**:
- Real-time quota usage (e.g., "5/8 tweets posted today")
- Gate status (open/blocked)
- Gate types (write_content, post_tweet, deploy)
- Reset timers

**Current State**: No quota visibility

**Impact**: **MEDIUM** - Operators can't see why proposals are being rejected

**Effort**: Low (quota counters, status badges)

---

#### 12. **Conversation Memories Extraction** ❌
**Tutorial Reference**: Chapter 3 - "After each conversation, distill memories"

**What's Missing**:
- Show which memories came from which conversation
- Memory distillation status (pending/complete)
- Link conversations → memories
- Idempotent dedup log

**Current State**: Memories exist but no link to source conversations

**Impact**: **LOW-MEDIUM** - Traceability for debugging

**Effort**: Low (add source linking, display in UI)

---

#### 13. **Worker Status Monitor** ❌
**Tutorial Reference**: Chapter 8 - "5 workers running on VPS"

**What's Missing**:
- Worker health status (running/stopped/crashed)
- Last poll timestamp
- Jobs processed count
- Error rates
- Circuit breaker status

**Current State**: No worker visibility

**Impact**: **HIGH** - Can't tell if workers are running or failed

**Effort**: Medium (requires worker heartbeat reporting to Supabase)

---

## Database Schema Gaps

Based on the tutorial, your Supabase database should have these tables (not all may be visualized yet):

**Tables You Have** (confirmed from code):
- ✅ `hp_proposals`
- ✅ `hp_missions`
- ✅ `hp_mission_steps`
- ✅ `hp_agent_events`
- ✅ `hp_agent_memory`
- ✅ `hp_roundtable_queue`
- ✅ `hp_agent_relationships`
- ✅ `hp_objectives`

**Tables You Might Be Missing** (check your backend repo):
- ❓ `hp_policy` (ops_policy in tutorial)
- ❓ `hp_trigger_rules` (ops_trigger_rules)
- ❓ `hp_agent_reactions` (ops_agent_reactions queue)
- ❓ `hp_initiative_queue` (ops_initiative_queue)
- ❓ `hp_action_runs` (ops_action_runs - heartbeat logs)

---

## Recommended Implementation Phases

### **Phase 1: Foundation** (Week 1)
**Goal**: Get core monitoring in place

1. **Real-Time Signal Feed** (Gap #2)
   - Create `/stage` page (new)
   - Event stream component with virtualization
   - Connect to `hp_events` table
   - Real-time subscription

2. **Worker Status Monitor** (Gap #13)
   - Add `hp_worker_status` table
   - Display worker health on dashboard
   - Alert if workers are down

3. **Heartbeat Health Monitor** (Gap #8)
   - Show last heartbeat timestamp
   - Display subsystem health checks
   - Manual trigger button

**Deliverable**: Operators can see "is the system running?"

---

### **Phase 2: System Control** (Week 2)
**Goal**: Give operators control knobs

4. **Policy Management Dashboard** (Gap #5)
   - CRUD interface for `hp_policy`
   - JSON editor with validation
   - Toggle enabled/disabled

5. **Trigger Rules Management** (Gap #6)
   - List all triggers (reactive + proactive)
   - Enable/disable toggles
   - Fire count display

6. **Cap Gates Status** (Gap #11)
   - Quota usage display (e.g., "5/8 tweets today")
   - Gate status indicators

**Deliverable**: Operators can adjust system behavior without touching code

---

### **Phase 3: Agent Intelligence** (Week 3)
**Goal**: Understand agent behavior

7. **Agent Relationships Visualization** (Gap #4)
   - Network graph with D3.js or React Flow
   - Affinity scores displayed
   - Drift history

8. **Initiative Queue Monitor** (Gap #10)
   - Show pending agent proposals
   - Initiative history

9. **Voice Evolution Dashboard** (Gap #9)
   - Memory stats per agent
   - Active personality modifiers

**Deliverable**: Understand agent personalities and dynamics

---

### **Phase 4: Mission Intelligence** (Week 4)
**Goal**: Deep mission insights

10. **Mission Playback Timeline** (Gap #3)
    - Step-by-step replay
    - Video-like controls
    - Event details

11. **Conversation Memories Extraction** (Gap #12)
    - Link conversations → memories
    - Show distillation status

**Deliverable**: Full mission/conversation transparency

---

### **Phase 5: The Stage (Optional, High Impact)** (Week 5)
**Goal**: Visual "wow factor"

12. **The OfficeRoom Component** (Gap #1)
    - Pixel-art office with agent avatars
    - Behavior states (working/chatting/walking)
    - Sky changes (day/dusk/night)
    - Whiteboard with live metrics

13. **Reaction Matrix Visualization** (Gap #7)
    - Matrix showing agent → agent reactions
    - Pattern editor

**Deliverable**: Engaging visual representation that makes the system feel alive

---

## Technical Stack Additions Needed

| Gap | Technology | Why |
|-----|-----------|-----|
| Signal Feed (Gap #2) | @tanstack/react-virtual | Smooth scrolling for 1000+ events |
| Agent Relationships (Gap #4) | D3.js or React Flow | Network graph visualization |
| Mission Playback (Gap #3) | Custom timeline component | Scrubbing through event history |
| OfficeRoom (Gap #1) | Canvas/SVG + CSS animations | Pixel-art rendering |
| Policy Editor (Gap #5) | Monaco Editor or CodeMirror | JSON editing with syntax highlighting |

---

## Priority Recommendations

**If you only have time for 3 features, do these**:

1. **Real-Time Signal Feed** (Gap #2) - Highest ROI, shows system activity
2. **Policy Management** (Gap #5) - Critical for operators to control the system
3. **Worker Status Monitor** (Gap #13) - Know if the system is alive

**If you want maximum "wow factor"**:

- **The OfficeRoom Component** (Gap #1) - This is what makes people say "holy sh*t"

---

## Current Dashboard Strengths

Don't throw away what works! Your current dashboard already has:

✅ Clean shadcn/ui components
✅ Real-time Supabase subscriptions
✅ TypeScript type safety
✅ Next.js 14 App Router
✅ Mobile responsive design
✅ Good separation of concerns (components/lib/hooks)
✅ Proposal approval workflow
✅ Mission CRUD operations
✅ Agent profiles with stats

These are solid foundations. The gaps are in **visibility** and **control** of the backend system.

---

## Next Steps

1. **Verify Database Schema** - Confirm which tables exist in your backend repo
2. **Choose a Phase** - Pick Phase 1, 2, 3, 4, or 5 based on priorities
3. **Implement Incrementally** - One feature at a time, ship often
4. **Test with Real Data** - Use actual agent events, not mock data

**Questions to clarify**:
- Which backend repository contains the worker logic?
- Are all 8 tables from the tutorial already created?
- What's the deployment target (Vercel + Supabase + VPS)?
- What's the most painful gap right now (observability? control? debugging?)?

---

## Cost Estimate (Development Time)

| Phase | Features | Effort | Time |
|-------|----------|--------|------|
| Phase 1 | Signal Feed + Worker Status + Heartbeat | Medium | 5-7 days |
| Phase 2 | Policy + Triggers + Cap Gates | Low-Medium | 3-5 days |
| Phase 3 | Relationships + Initiative + Voice | Medium | 4-6 days |
| Phase 4 | Mission Playback + Memory Links | Medium | 3-5 days |
| Phase 5 | OfficeRoom + Reaction Matrix | High | 7-10 days |

**Total (All Phases)**: ~22-33 days of development

**MVP (Phase 1 + Phase 2)**: ~8-12 days

---

**Status**: 📋 Ready for review and prioritization
