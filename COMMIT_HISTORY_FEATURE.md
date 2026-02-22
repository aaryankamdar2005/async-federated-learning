# Commit History Feature Documentation

## Overview
The Commit History feature provides a comprehensive view of all model updates and contributions in your federated learning platform. It tracks what was committed, by whom, and associated metrics like accuracy improvements and bounty rewards.

## Components

### 1. Server-Side Implementation

#### New API Endpoint: `/repos/{repo_id}/commit-history`
**Method:** `GET`

**Parameters:**
- `repo_id`: The repository ID (path parameter)
- `limit`: Maximum number of commits to return (query parameter, default: 50)

**Response Format:**
```json
{
  "repo_id": "abc12345",
  "total_commits": 15,
  "commits": [
    {
      "id": "commit_001",
      "author": "client_001",
      "message": "Imp: 0.25% | Trust: 0.80",
      "status": "Merged ✅",
      "timestamp": "2026-02-22T10:30:00Z",
      "version_bump": "v1->v2",
      "bounty": 7,
      "improvement": 0.25
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Successfully returned commit history
- `500 Internal Server Error`: Database error

#### Helper Function: `extract_improvement()`
Parses the improvement percentage from the reason string using regex pattern matching.

### 2. Client-Side Components

#### CommitHistoryPanel Component
**Location:** `dashboard/components/CommitHistoryPanel.tsx`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `repoId` | string | Required | The repository ID to fetch commits for |
| `title` | string | "Commit History" | Panel title |
| `limit` | number | 10 | Maximum number of commits to display |

**Features:**
- Auto-fetch commit data on mount
- Real-time relative timestamps ("5m ago", "2h ago", etc.)
- Color-coded status indicators:
  - 🟢 **Merged** (Green): Successfully merged updates
  - 🔴 **Rejected** (Red): Rejected for fraud or no improvement
  - 🔵 **Unknown** (Blue): Other statuses
- Visual metrics:
  - **Improvement %**: Accuracy improvement percentage
  - **Version bump**: Model version changes
  - **Bounty points**: Rewards earned
  - **Verification badge**: Checkmark for merged commits
- Summary statistics at the bottom
- Loading and error states
- Empty state handling

#### CommitHistoryPage
**Location:** `dashboard/app/commits/page.tsx`

**Features:**
- Multi-repository selector
- Repository filtering with visual indicators
- Displays full commit history for selected repo
- Breadcrumb navigation back to main page
- Responsive grid layout for repo selection
- Enhanced styling with hover effects

## User Experience Flow

### 1. View All Commits (Main Dashboard)
Users can navigate to `/commits` from the main navigation menu to see:
- A list of all repositories
- Ability to select which repository to view
- Full commit history for the selected repository

### 2. Commit Details Displayed
For each commit, users see:
- **Author**: Client ID who submitted the update
- **Status**: Merged/Rejected with icon
- **Message**: Detailed reason including improvement metrics
- **Timestamp**: When the commit was made
- **Version**: Model version changes
- **Improvement %**: Accuracy improvement metrics
- **Bounty**: Points earned for contribution

### 3. Summary Statistics
Bottom of panel shows:
- Total commits count
- Number of merged commits
- Total bounty points earned

## Integration Points

### 1. Database Integration
The feature uses the existing `AsyncDatabase` class:
- `db.get_repo_commits(repo_id)`: Fetches all commits for a repository
- `db.add_commit()`: Adds new commits (already used in existing submit_update flow)

### 2. Styling
Uses the existing UI framework:
- **Colors**: Consistent with dark theme (Indigo, Green, Red accents)
- **Typography**: Geist for headers, Inter for body
- **Components**: Icons from lucide-react
- **Animations**: Smooth transitions, hover effects

## Design Decisions

### 1. Real-time Timestamp Formatting
Instead of absolute timestamps, we show relative time ("5 minutes ago") which is more user-friendly and adapts as time passes.

### 2. Status Color Coding
Used consistent colors across the application:
- Green for success/merged
- Red for errors/rejected
- Blue for neutral statuses

### 3. Metrics Display
Shows the most important metrics inline:
- Improvement percentage is prominently displayed
- Bounty rewards highlighted with icon
- Version changes shown compactly

### 4. Responsive Layout
The component is fully responsive:
- Single column on mobile
- Multi-column grids on larger screens
- Touch-friendly buttons and interactions

## Example Usage

### In a Page Component:
```tsx
import CommitHistoryPanel from '@/components/CommitHistoryPanel';

export default function MyPage() {
  return (
    <CommitHistoryPanel 
      repoId="abc12345" 
      title="Recent Updates"
      limit={20}
    />
  );
}
```

### Fetch commits programmatically:
```tsx
const response = await fetch(
  'http://localhost:8000/repos/abc12345/commit-history?limit=50'
);
const data = await response.json();
console.log(data.commits);
```

## Performance Considerations

1. **Pagination**: The `limit` parameter allows showing 10-50 commits without overwhelming the UI
2. **Lazy Loading**: Commits are only fetched when the component mounts or repoId changes
3. **Memoization**: Component optimized to avoid unnecessary re-renders
4. **Error Handling**: Graceful fallbacks for network errors or missing data

## Future Enhancements

1. **Commit Search**: Filter commits by author, date range, or status
2. **Commit Details Modal**: Click on commit to see full details
3. **Download Commit Data**: Export commit history as CSV/JSON
4. **Real-time Updates**: WebSocket integration for live commit notifications
5. **Pagination**: Load older commits on demand
6. **Analytics Charts**: Visualize contribution trends over time

## API Response Schema (TypeScript)
```typescript
interface CommitData {
  repo_id: string;
  total_commits: number;
  commits: CommitHistoryProps[];
  error?: string;
}

interface CommitHistoryProps {
  id: string;
  author: string;
  message: string;
  status: string;
  timestamp: string;
  version_bump: string;
  bounty: number;
  improvement: number;
}
```

## Testing

To test the feature:

1. **Server**: Ensure `/repos/{repo_id}/commit-history` endpoint is working
   ```bash
   curl http://localhost:8000/repos/abc12345/commit-history
   ```

2. **Client**: Navigate to `/commits` page and select a repository

3. **Data validation**: Check that metrics are correctly parsed and displayed

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to load commit history" | Check server is running on port 8000 |
| Empty commits list | Verify commits exist in database; check repo_id is correct |
| Timestamps not updating | Refresh page or check system time |
| Styling issues | Ensure Tailwind CSS is properly configured |

## Related Files
- [CommitCard.tsx](../dashboard/components/CommitCard.tsx) - Original commit display component
- [main.py](../server/main.py) - Server endpoints and core logic
- [commits/page.tsx](../dashboard/app/commits/page.tsx) - Commit history page
