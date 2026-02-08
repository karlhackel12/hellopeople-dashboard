# HelloPeople Dashboard

Executive dashboard for the HelloPeople Autonomous Company. Built with Next.js 14, Supabase, and shadcn/ui.

## Features

- **Dashboard**: Executive overview with KPIs, active missions, and objectives
- **Missions**: Create, track, and manage agent missions in real-time
- **Objectives**: OKR management with progress tracking
- **Agents**: View agent profiles, stats, and activity
- **Conversations**: Real-time agent conversation feed
- **Insights**: Knowledge base from agent memories

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **UI**: shadcn/ui + TailwindCSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date handling**: date-fns
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (already configured)

### Installation

1. **Clone and install dependencies**:
```bash
cd hellopeople-dashboard
npm install
```

2. **Environment variables are already configured** in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ksuqcuimthklsdqyfzwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. **Run database migration**:
```bash
# Connect to Supabase and run the migration
psql "postgresql://postgres:[password]@db.ksuqcuimthklsdqyfzwh.supabase.co:5432/postgres" < migrations/create_objectives_table.sql
```

Or use Supabase Dashboard → SQL Editor → paste the migration content.

4. **Start development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
hellopeople-dashboard/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Dashboard (/)
│   ├── missions/            # Missions pages
│   │   ├── page.tsx         # List view
│   │   ├── create/          # Create mission
│   │   └── [id]/            # Mission detail
│   ├── objectives/          # OKRs management
│   ├── agents/              # Agent profiles
│   ├── conversations/       # Conversation feed
│   └── insights/            # Memory insights
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui components
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── KPICard.tsx          # KPI display card
│   └── MissionCard.tsx      # Mission card
├── hooks/                   # Custom React hooks
│   └── useMissions.ts       # Real-time missions hook
├── lib/                     # Utilities
│   ├── supabase.ts          # Supabase client + types
│   └── utils.ts             # Helper functions
├── migrations/              # Database migrations
│   └── create_objectives_table.sql
└── public/                  # Static assets
```

## Database Tables

The dashboard uses these Supabase tables:

- `hp_missions` - Mission tracking
- `hp_proposals` - Mission proposals/definitions
- `hp_objectives` - OKRs and goals (created by migration)
- `hp_agent_memory` - Agent knowledge and insights
- `hp_conversations` - Agent conversation logs
- `hp_roundtable_queue` - Scheduled roundtables

## Real-Time Features

The dashboard uses Supabase real-time subscriptions for:

- **Missions**: Live updates when missions are created, updated, or completed
- **Conversations**: Live conversation status and participant updates
- **Objectives**: Instant progress updates (future enhancement)

Example subscription (see `hooks/useMissions.ts`):

```typescript
const channel = supabase
  .channel('missions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'hp_missions'
  }, (payload) => {
    // Handle real-time updates
  })
  .subscribe();
```

## Development

### Adding a New Page

1. Create page file: `app/my-page/page.tsx`
2. Add to navigation: `components/Sidebar.tsx`
3. Create necessary hooks/components
4. Add types to `lib/supabase.ts` if needed

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add calendar
```

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous/public key

## Build

```bash
npm run build
npm run start
```

## Deployment

See [FRONTEND-DEPLOYMENT.md](./FRONTEND-DEPLOYMENT.md) for Vercel deployment instructions.

## Key Features Explained

### Dashboard (/)

- **KPIs**: Current vs target metrics with color-coded progress bars
- **Active Missions**: Real-time list of running missions
- **Objectives**: Q1 2026 goals progress
- **Next Conversation**: Countdown to scheduled roundtable
- **Team Status**: 5 teams, 13 agents status

### Missions (/missions)

- **List View**: All missions with filters (status, search)
- **Create**: Form with templates (Weekly Review, User Analysis, Crisis Mode)
- **Detail**: Step-by-step progress, timeline, metadata
- **Real-time**: Live updates when missions start/complete

### Objectives (/objectives)

- **CRUD**: Create, Read, Update, Delete objectives
- **Key Results**: Multiple KRs per objective with current/target tracking
- **Progress**: Visual progress bars and percentage completion
- **Quarters**: Organize by Q1-Q4 2026

### Agents (/agents)

- **Grid View**: All 13 agents with stats
- **Team Filters**: Filter by Leadership, Product, Engineering, etc.
- **Profile**: Agent detail with missions, memories, autonomy score
- **Quick Actions**: Assign mission directly from profile

### Conversations (/conversations)

- **Feed**: Real-time conversation list
- **Live Indicator**: Animated badge for running conversations
- **Detail**: Participants, memories extracted, timeline
- **Filters**: Status (pending/running/completed)

### Insights (/insights)

- **Top Memories**: Highest confidence learnings
- **Confidence Distribution**: Visual breakdown (high/medium/low)
- **Search & Filter**: By content, type, agent
- **Stats**: Total memories, high confidence count, types

## Troubleshooting

### Real-time subscriptions not working

1. Check Supabase project settings → API → Enable Realtime
2. Verify table has Row Level Security policies allowing `SELECT`
3. Check browser console for WebSocket errors

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Type errors

```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id ksuqcuimthklsdqyfzwh > lib/database.types.ts
```

## License

Proprietary - HelloPeople Autonomous Company

## Support

For issues or questions, contact the development team.
