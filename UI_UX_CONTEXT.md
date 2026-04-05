# AsyncShield Dashboard — Current Components

**Quick Reference**: What exists in the UI right now for agent design tasks.  
**Framework**: Next.js 16.1 + React 19.2 + TypeScript + Tailwind CSS  
**Theme**: Dark glassmorphism (Blue `#3861FB` accent)

---

## 📦 Existing Components

### 1. **Navbar** (`components/Navbar.tsx`)
- **Sticky**: Top, z-50
- **Height**: 64px (h-16)  
- **Sections**: Logo | 5 Nav Links | Network Status Badge
- **Links**: /server, /client, /compute, /monitoring
- **Active State**: Blue background (0.12), border (0.25), glow shadow

### 2. **AuthWrapper** (`components/AuthWrapper.tsx`)
- **Purpose**: Auth context provider
- **Props**: `children` (function with user, logout, refreshUser)
- **User Object**: `{ username, tokens, role }`
- **Used by**: Server, Client, Compute pages

### 3. **CommitCard** (`components/CommitCard.tsx`)
- **Props**: `{ client, status, reason?, version_bump?, bounty }`
- **Statuses**: APPLIED (blue) | REJECTED (red) | BUFFERED (yellow)
- **Shows**: Author, status badge, improvement %, bounty tokens, timestamp

### 4. **CommitHistoryPanel** (`components/CommitHistoryPanel.tsx`)
- **Props**: `{ repoId, limit?, onFilterChange? }`
- **Features**: Fetches from `GET /commits/{repoId}`, scrollable list, stats
- **Contains**: Multiple CommitCard components

### 5. **LeaderboardTable** (`components/LeaderboardTable.tsx`)
- **Displays**: Rank | Contributor | Commits | Avg Improvement | Tokens
- **Used in**: Repository details pages

### 6. **UI Hero** (`components/ui/starfall-portfolio-landing.tsx`)
- **Purpose**: Landing page hero with animated background
- **Features**: 3 feature cards, 3 stat cards, CTA buttons

---

## 📄 Pages

| Route | File | Auth | Purpose |
|-------|------|------|---------|
| `/` | `app/page.tsx` | No | Hero landing + role selection |
| `/server` | `app/server/page.tsx` | Yes | Create repos, view my repos |
| `/client` | `app/client/page.tsx` | Yes | Select repo, upload .pth file |
| `/commits` | `app/commits/page.tsx` | No | Browse all commits by repo |
| `/compute` | `app/compute/page.tsx` | Yes | Code editor + dataset upload |
| `/monitoring` | `app/monitoring/page.tsx` | Future | System health dashboard |
| `/repo/[id]` | `app/repo/[id]/page.tsx` | Future | Repo details + commit history |

---

## 🎨 Design Tokens

### Colors
```
Primary:       #3861FB (accent blue)
Primary Light: #5b7fff (hover)
Dark BG:       #06091a (page background)
Surface:       #0a0f2e (card base)
Success:       #22C55E (applied, badges)
Danger:        #EF4444 (rejected)
Warning:       #F59E0B (tokens)
Text:          #E2E8F0 (primary)
Muted:         #64748B (secondary)
```

### CSS Classes (from globals.css)
- `.glass-card` — Blurred card with gradient
- `.primary-button` — Blue gradient button
- `.glass-button` — Semi-transparent button
- `.badge-success` — Green badge
- `.badge-danger` — Red badge
- `.badge-info` — Blue badge
- `.token-badge` — Gold/warning badge
- `.form-input` — Dark input with blue focus

---

## 🔄 Page States & Interactions

### Server Page (`/server`)
| State | Behavior |
|-------|----------|
| Empty repos | Shows "No repositories created yet" |
| Create repo | Form: Model Name, Description, Golden Dataset (.zip) |
| Show my repos | List filtered by `owner === user.username` |
| Click History | Navigate to `/repo/{repo_id}` |

### Client Page (`/client`)
| State | Behavior |
|-------|----------|
| No repo selected | Upload zone hidden, show repo cards |
| Repo selected | Upload zone appears (blue border glow) |
| File chosen | Show filename in input |
| Processing | Spinner + "VERIFYING ZERO-TRUST..." text |
| Success | Alert with bounty, tokens refresh |
| Rejected | Alert with rejection reason |

### Commits Page (`/commits`)
| State | Behavior |
|-------|----------|
| Loading | Show spinner |
| Show repos | Grid selector (1 col mobile, 3 cols desktop) |
| Repo selected | Active state (blue background + glow border) |
| Show commits | List of CommitCard components |

---

## 📡 API Endpoints Used

| Endpoint | Method | Used In | Data |
|----------|--------|---------|------|
| `/repos` | GET | Server, Client, Commits | `[{ id, name, owner, version }]` |
| `/create_repo` | POST | Server | Form: name, description, owner, golden_dataset |
| `/submit_update` | POST | Client | File upload: .pth file |
| `/commits/{repo_id}` | GET | Commits, Repo Detail | `[{ client, status, bounty, improvement }]` |
| `/repo/{repo_id}` | GET | Repo Detail | `{ id, name, owner, version, commits: [] }` |

---

## 📏 Layout Grid System

### Desktop (1024px+)
- **Server**: 2-col grid (left: form, right: repo list)
- **Client**: 3-col repo selector, centered upload zone
- **Commits**: 3-col repo selector

### Tablet (768px)
- **Server**: 2-col grid
- **Client**: 2-col repo selector
- **Commits**: 2-col repo selector

### Mobile (< 768px)
- **All**: 1-col stacked
- Repo selector: Single column

---

## 🔑 Key Props & Interfaces

### User Object
```typescript
{
  username: string;
  tokens: number;
  role: "server" | "client";
}
```

### Repo Object
```typescript
{
  id: string;
  name: string;
  description: string;
  owner: string;
  version: number;
  created_at: string;
}
```

### Commit Object
```typescript
{
  client: string;
  status: "APPLIED" | "REJECTED" | "BUFFERED";
  reason?: string;  // rejection only
  version_bump?: string;  // applied only
  bounty: number;
  improvement?: number;  // % improvement
  timestamp: string;
}
```

---

## ⚙️ Component Styling Patterns

### Buttons
```tsx
// Primary action
<button className="primary-button py-3 rounded-xl">Submit</button>

// Secondary action
<button className="glass-button px-4 py-2 rounded-xl">Cancel</button>
```

### Cards
```tsx
<div className="glass-card p-6 rounded-2xl">
  <h2 className="text-xl font-bold text-[#E2E8F0]">Title</h2>
  <p className="text-sm text-[#64748B]">Muted text</p>
</div>
```

### Form Inputs
```tsx
<input 
  type="text"
  className="w-full form-input rounded-xl p-3"
  placeholder="Enter value"
/>
```

### Badges
```tsx
<span className="badge-success px-3 py-1 rounded-full text-xs">APPLIED</span>
<span className="badge-danger px-3 py-1 rounded-full text-xs">REJECTED</span>
<span className="token-badge px-3 py-1 rounded-full text-xs">+175 🪙</span>
```

---

## 🎯 Current Gaps (For Future Agents)

- ❌ `/repo/[id]` detail page not implemented
- ❌ `/monitoring` page not implemented
- ❌ Real-time updates (no WebSocket, using polling)
- ❌ Leaderboard page not implemented
- ❌ Advanced filters on commits
- ❌ Analytics/charts
- ❌ Notifications

---

**Last Updated**: April 2026  
For component details, check source files in `dashboard/components/` and `dashboard/app/`
