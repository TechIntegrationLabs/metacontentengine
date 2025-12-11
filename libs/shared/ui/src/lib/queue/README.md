# Queue UI Components

Queue management UI components for the Meta Content Engine generation system.

## Components

### QueueStatsCard

Displays generation queue statistics with visual indicators.

**Features:**
- Real-time queue metrics (pending, scheduled, processing, completed, failed)
- Average processing time display
- Items completed in last hour
- Estimated wait time
- Loading skeleton state
- Color-coded status indicators

**Usage:**
```tsx
import { QueueStatsCard } from '@content-engine/ui';
import type { QueueStats } from '@content-engine/generation';

const stats: QueueStats = {
  pending: 5,
  scheduled: 2,
  processing: 1,
  completed: 42,
  failed: 3,
  avgProcessingTime: 180000, // 3 minutes in ms
  itemsLastHour: 8,
  estimatedWaitTime: 900000, // 15 minutes in ms
};

<QueueStatsCard stats={stats} isLoading={false} />
```

### QueueItemCard

Displays individual queue item with actions and metadata.

**Features:**
- Status badge with color coding
- Progress bar for processing items
- Priority controls (up/down arrows)
- Content type indicator (idea vs article)
- Position in queue display
- Estimated wait time
- Error messages for failed items
- Action buttons: View, Retry, Cancel, Remove
- Detailed metadata: priority, attempts, timestamps

**Usage:**
```tsx
import { QueueItemCard } from '@content-engine/ui';
import type { QueueItem } from '@content-engine/generation';

const item: QueueItem = {
  id: 'abc-123',
  tenantId: 'tenant-1',
  contentIdeaId: 'idea-456',
  priority: 5,
  status: 'pending',
  attempts: 0,
  maxAttempts: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};

<QueueItemCard
  item={item}
  position={3}
  estimatedWaitTime={540000} // 9 minutes
  onView={(item) => console.log('View', item)}
  onRetry={(item) => console.log('Retry', item)}
  onCancel={(item) => console.log('Cancel', item)}
  onRemove={(item) => console.log('Remove', item)}
  onPriorityUp={(item) => console.log('Priority up', item)}
  onPriorityDown={(item) => console.log('Priority down', item)}
  showActions={true}
/>
```

### GenerationQueue

Full queue management interface with filtering and bulk actions.

**Features:**
- Queue statistics overview
- Search by ID or content reference
- Status filter tabs (all, pending, processing, completed, failed)
- Bulk actions: Clear Completed, Clear Failed
- Refresh and Add to Queue actions
- Empty state with call-to-action
- Results count display
- Automatic sorting by priority and creation time

**Usage:**
```tsx
import { GenerationQueue } from '@content-engine/ui';
import type { QueueItem, QueueStats } from '@content-engine/generation';

const items: QueueItem[] = [/* ... */];
const stats: QueueStats = {/* ... */};

<GenerationQueue
  items={items}
  stats={stats}
  isLoading={false}
  onRefresh={() => refetchQueue()}
  onAddToQueue={() => openAddDialog()}
  onViewItem={(item) => navigate(`/item/${item.id}`)}
  onRetryItem={(item) => retryGeneration(item)}
  onCancelItem={(item) => cancelGeneration(item)}
  onRemoveItem={(item) => removeFromQueue(item)}
  onPriorityUp={(item) => increasePriority(item)}
  onPriorityDown={(item) => decreasePriority(item)}
  onClearCompleted={() => clearCompletedItems()}
  onClearFailed={() => clearFailedItems()}
/>
```

## Status Colors

| Status | Color | Icon |
|--------|-------|------|
| pending | Blue (`text-blue-400`) | Clock |
| scheduled | Purple (`text-purple-400`) | Calendar |
| processing | Amber (`text-amber-400`) | Play |
| completed | Emerald (`text-emerald-400`) | CheckCircle2 |
| failed | Red (`text-red-400`) | XCircle |
| cancelled | Gray (`text-gray-400`) | Ban |

## Dependencies

- `@content-engine/generation` - Queue types and service
- `lucide-react` - Icons
- `framer-motion` - Animations (via GlassCard)
- Internal UI components: GlassCard, Button, Input

## Design System

Follows the "Kinetic Modernism" design system with:
- Glass-morphism aesthetic
- Dark backgrounds (void colors)
- Accent colors (forge palette)
- Frosted glass surfaces
- Subtle animations and transitions
