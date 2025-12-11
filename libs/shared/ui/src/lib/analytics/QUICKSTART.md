# Analytics Dashboard - Quick Start

## Installation

All dependencies are already installed. No additional packages needed.

## Basic Usage

### 1. Create an Analytics Page

```tsx
// apps/geteducated/src/app/pages/AnalyticsPage.tsx
import { AnalyticsDashboard } from '@content-engine/ui';
import { useAnalytics } from '@content-engine/hooks';
import { supabase } from '../../lib/supabase';

export function AnalyticsPage() {
  const { data, isLoading, dateRange, updateDateRange } = useAnalytics({
    supabase,
  });

  return (
    <div className="p-8">
      <AnalyticsDashboard
        data={data}
        dateRange={dateRange}
        onDateRangeChange={updateDateRange}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 2. Add to Router

```tsx
// apps/geteducated/src/app/app.tsx
import { AnalyticsPage } from './pages/AnalyticsPage';

<Route path="/analytics" element={<AnalyticsPage />} />
```

### 3. Add to Navigation

```tsx
// Update Sidebar navigation
import { BarChart3 } from 'lucide-react';

{
  label: 'Analytics',
  path: '/analytics',
  icon: BarChart3,
}
```

## Custom Implementation

### Using Individual Components

```tsx
import { MetricCard, PerformanceChart, DateRangePicker } from '@content-engine/ui';
import { useAnalytics } from '@content-engine/hooks';
import { FileText } from 'lucide-react';

function CustomAnalytics() {
  const { data, isLoading, dateRange, updateDateRange } = useAnalytics({
    supabase,
  });

  return (
    <div className="space-y-6">
      {/* Date Picker */}
      <DateRangePicker value={dateRange} onChange={updateDateRange} />

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Articles"
          value={data?.metrics.totalArticles || 0}
          icon={<FileText className="w-4 h-4" />}
          colorClass="indigo"
          isLoading={isLoading}
        />
        {/* Add more metrics */}
      </div>

      {/* Chart */}
      <PerformanceChart
        data={data?.chartData || []}
        type="line"
        title="Production Over Time"
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Custom Date Ranges

```tsx
const { updateDateRange } = useAnalytics({ supabase });

// Last 7 days
updateDateRange({ preset: 'week' });

// Last 30 days
updateDateRange({ preset: 'month' });

// Custom range
updateDateRange({
  preset: 'custom',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});
```

### Manual Data Fetching

```tsx
const { refetch } = useAnalytics({ supabase, autoFetch: false });

// Fetch manually
useEffect(() => {
  refetch();
}, [someCondition]);
```

## Customization

### Metric Card Colors

Available colors: `indigo`, `amber`, `emerald`, `purple`, `orange`

```tsx
<MetricCard colorClass="emerald" />
```

### Chart Types

```tsx
<PerformanceChart type="line" />
<PerformanceChart type="bar" />
```

### Chart Data Series

```tsx
<PerformanceChart
  showArticles={true}
  showWords={true}
  showQuality={false}
/>
```

## Troubleshooting

### No data showing
1. Check tenant_id is set in Supabase RLS context
2. Verify articles exist in database for selected date range
3. Check browser console for errors

### Performance issues
1. Reduce date range (use shorter periods)
2. Add pagination for large datasets
3. Consider caching strategy

### Chart not rendering
1. Ensure Recharts is installed: `npm ls recharts`
2. Check data format matches `ChartDataPoint[]` interface
3. Verify ResponsiveContainer has parent with defined height

## API Reference

### Hook: useAnalytics

```typescript
useAnalytics({
  supabase: SupabaseClient,  // Required
  autoFetch?: boolean,       // Optional, default: true
})

Returns:
{
  data: AnalyticsData | null,
  isLoading: boolean,
  error: Error | null,
  dateRange: DateRangeFilter,
  updateDateRange: (range: DateRangeFilter, refetch?: boolean) => void,
  refetch: () => Promise<void>,
}
```

### Component: AnalyticsDashboard

```typescript
<AnalyticsDashboard
  data={AnalyticsData | null}
  dateRange={DateRangeFilter}
  onDateRangeChange={(range: DateRangeFilter) => void}
  isLoading={boolean}
  className={string}
/>
```

## Examples

See full implementation in:
- `libs/shared/ui/src/lib/analytics/README.md`
- `docs/ANALYTICS_IMPLEMENTATION.md`
