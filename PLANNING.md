# Sidekick 6 Golf App - Master Planning Document

## 🎯 Project Overview
A mobile-first golf stat tracking app that helps golfers identify and fix their biggest on-course problems. Built with Next.js, Convex, Clerk, and shadcn/ui.

## 📱 Core Features
1. **Quick Round Tracking** - Track 6 key stats per hole
2. **Problem Identification** - Automatically identify your biggest issues
3. **Historical Analysis** - View trends and patterns over time
4. **Mobile-First** - Designed for use on the golf course

## 🏗 Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **UI**: shadcn/ui with Tailwind v4
- **State**: Convex React hooks

## 🔐 Authentication (Clerk + Convex)

### Clerk Integration
- **User Management**: Handled by Clerk
- **User ID**: Stored in Convex as `userId` (from Clerk's `user.id`)
- **Protected Routes**: Using Clerk's middleware
- **Convex Auth**: Using `convexAuth` from Clerk integration

### Auth Flow
1. User signs in via Clerk (Google, Email, etc.)
2. Clerk provides user object with unique ID
3. Convex functions use `ctx.auth.getUserIdentity()` to get user
4. All data queries filtered by user's Clerk ID

## 📊 Database Schema (Convex)

### Tables

#### `rounds`
```typescript
{
  userId: string,        // Clerk user ID (from auth.getUserIdentity())
  date: number,         // Unix timestamp
  courseName: string,
  totalScore: number,
  totalPar: number,
  createdAt: number,
  completedAt?: number,
  isComplete: boolean
}
```

#### `holes`
```typescript
{
  roundId: Id<"rounds">,
  holeNumber: number,    // 1-18
  par: number,           // 3, 4, or 5
  strokes: number,
  stats: {
    threePutt: boolean,
    penalty: boolean,
    bunker: boolean,
    waterHazard: boolean,
    outOfBounds: boolean,
    duffedChip: boolean
  },
  createdAt: number
}
```

#### `userStats`
```typescript
{
  userId: string,        // Clerk user ID
  lastUpdated: number,
  averages: {
    score: number,
    threePutts: number,
    penalties: number,
    bunkers: number,
    waterHazards: number,
    outOfBounds: number,
    duffedChips: number
  },
  roundsPlayed: number
}
```

## 🗂 File Structure
```
app/
├── (dashboard)/
│   ├── page.tsx              // Dashboard home
│   └── layout.tsx
├── round/
│   ├── new/
│   │   └── page.tsx          // Start new round
│   ├── [roundId]/
│   │   ├── hole/[holeNum]/
│   │   │   └── page.tsx      // Active hole tracking
│   │   └── summary/
│   │       └── page.tsx      // Round summary
├── history/
│   ├── page.tsx              // Round history list
│   └── [roundId]/
│       └── page.tsx          // Individual round view
└── api/
    └── ...

components/
├── ui/                       // shadcn components
├── dashboard/
│   ├── QuickStats.tsx
│   ├── ProblemAlert.tsx
│   └── StatsGrid.tsx
├── round/
│   ├── HoleTracker.tsx
│   ├── StatButtons.tsx
│   ├── ScoreEntry.tsx
│   └── RoundProgress.tsx
├── history/
│   ├── RoundCard.tsx
│   └── RoundFilters.tsx
└── shared/
    ├── Navigation.tsx
    └── MobileNav.tsx

convex/
├── schema.ts
├── rounds.ts
├── holes.ts
├── stats.ts
└── auth.config.ts
```

## 🎨 Component Map

### Phase 1: Core Setup ✅
- [x] Next.js + Convex + Clerk setup
- [x] shadcn/ui installation with Tailwind v4
- [ ] Database schema in Convex
- [ ] Authentication flow

### Phase 2: Dashboard
- [ ] Layout with navigation
- [ ] QuickStats component (Card + Chart)
- [ ] ProblemAlert component
- [ ] StatsGrid component
- [ ] Convex queries for user stats

### Phase 3: Round Tracking
- [ ] New round creation flow
- [ ] Hole tracker interface
- [ ] Stat toggle buttons (Toggle Group)
- [ ] Score entry with +/- buttons
- [ ] Progress indicator
- [ ] Convex mutations for saving hole data

### Phase 4: Round Summary
- [ ] Summary screen after hole 18
- [ ] Stats breakdown table
- [ ] Save round functionality
- [ ] Navigation back to dashboard

### Phase 5: History & Analytics
- [ ] Round history list
- [ ] Filtering and pagination
- [ ] Individual round view (Sheet/Dialog)
- [ ] Export functionality
- [ ] Trend charts

### Phase 6: Polish
- [ ] Mobile navigation (bottom tabs)
- [ ] Loading states (Skeleton)
- [ ] Empty states
- [ ] Error handling
- [ ] Toast notifications
- [ ] PWA configuration

## 📋 Implementation Checklist

### Immediate Next Steps
1. [ ] Create Convex schema file
2. [ ] Set up database tables
3. [ ] Create API functions for rounds
4. [ ] Build dashboard layout
5. [ ] Implement navigation

### Convex Functions Needed (with Clerk Auth)

#### `rounds.ts`
```typescript
// All functions check ctx.auth.getUserIdentity() first
- `createRound` - Start new round (uses Clerk userId)
- `getRounds` - List user's rounds (filtered by userId)
- `getRound` - Get single round (verify ownership)
- `updateRound` - Update round info (verify ownership)
- `deleteRound` - Delete a round (verify ownership)
- `completeRound` - Mark as complete
```

#### `holes.ts`
```typescript
// Verify round ownership through userId
- `saveHole` - Save hole data
- `getHole` - Get single hole
- `getHolesForRound` - Get all holes in round
- `updateHole` - Edit hole data
```

#### `stats.ts`
```typescript
// All stats filtered by authenticated userId
- `getUserStats` - Get aggregated stats for current user
- `getRecentRounds` - Last 5 rounds for current user
- `getBiggestProblem` - Identify main issue for current user
- `getStatTrends` - Historical trends for current user
```

## 🎯 UI Components Priority

### Must Have (MVP)
- Button, Card, Badge, Alert
- Form inputs (Input, Select)
- Toggle Group for stats
- Tabs for navigation
- Table for data display

### Nice to Have
- Charts for trends
- Sheet for mobile modals
- Skeleton for loading
- Toast for notifications
- Accordion for hole details

## 📱 Mobile Responsiveness Rules
1. **Touch targets**: Min 44px height
2. **Buttons**: Use size="lg" on mobile
3. **Cards**: Full width on mobile, max-w-2xl on desktop
4. **Grid**: Stack on mobile, grid on tablet+
5. **Navigation**: Bottom tabs on mobile, sidebar on desktop
6. **Forms**: Single column on mobile
7. **Text**: Larger fonts for outdoor readability

## 🚀 Development Workflow
1. Build components in isolation
2. Test on mobile first
3. Add Convex integration
4. Test with real data
5. Add loading/error states
6. Deploy and test on course

## 📈 Success Metrics
- [ ] Can track a round in < 30 seconds per hole
- [ ] Dashboard loads in < 2 seconds
- [ ] Works offline (PWA)
- [ ] Identifies problems accurately
- [ ] Mobile-friendly touch targets

## 🐛 Known Issues
- Tailwind v4 OKLCH colors need HSL conversion
- Convex dev server needs proper setup
- Mobile keyboard handling for score entry

## 📝 Notes
- Keep UI simple and large for outdoor use
- Minimize typing - use buttons/toggles
- Show most important info first
- Progressive disclosure for details
- Optimistic updates for better UX

---

**Last Updated**: Aug 23, 2025
**Status**: Phase 1 Complete, Starting Phase 2