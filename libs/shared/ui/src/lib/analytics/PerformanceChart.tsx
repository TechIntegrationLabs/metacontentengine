import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from '@content-engine/types';

interface PerformanceChartProps {
  data: ChartDataPoint[];
  type?: 'line' | 'bar';
  title?: string;
  height?: number;
  showArticles?: boolean;
  showWords?: boolean;
  showQuality?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function PerformanceChart({
  data,
  type = 'line',
  title,
  height = 300,
  showArticles = true,
  showWords = true,
  showQuality = false,
  isLoading = false,
  className = '',
}: PerformanceChartProps) {
  if (isLoading) {
    return (
      <div className={['glass-card rounded-2xl p-6', className].join(' ')}>
        {title && <h3 className="text-lg font-display font-bold text-white mb-4">{title}</h3>}
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-slate-700 rounded w-48" />
          <div className="h-64 bg-slate-700/30 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={['glass-card rounded-2xl p-6', className].join(' ')}>
        {title && <h3 className="text-lg font-display font-bold text-white mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-64 text-slate-500">
          <p>No data available for the selected period</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel rounded-xl p-3 shadow-xl shadow-black/50 border border-slate-700/50">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between space-x-4">
                <span className="text-xs text-slate-400 capitalize">{entry.name}:</span>
                <span className="text-sm font-bold" style={{ color: entry.color }}>
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartComponents = type === 'line' ? (
    <>
      {showArticles && (
        <Line
          type="monotone"
          dataKey="articles"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Articles"
        />
      )}
      {showWords && (
        <Line
          type="monotone"
          dataKey="words"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Words"
        />
      )}
      {showQuality && (
        <Line
          type="monotone"
          dataKey="quality"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Quality"
        />
      )}
    </>
  ) : (
    <>
      {showArticles && <Bar dataKey="articles" fill="#6366f1" name="Articles" radius={[8, 8, 0, 0]} />}
      {showWords && <Bar dataKey="words" fill="#f97316" name="Words" radius={[8, 8, 0, 0]} />}
      {showQuality && <Bar dataKey="quality" fill="#10b981" name="Quality" radius={[8, 8, 0, 0]} />}
    </>
  );

  const Chart = type === 'line' ? LineChart : BarChart;

  return (
    <div className={['glass-card rounded-2xl p-6', className].join(' ')}>
      {title && (
        <h3 className="text-lg font-display font-bold text-white mb-4">{title}</h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <Chart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#334155" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.3} />

          <XAxis
            dataKey="date"
            stroke="#64748b"
            style={{ fontSize: '12px', fontFamily: 'Space Grotesk' }}
            tick={{ fill: '#64748b' }}
          />

          <YAxis
            stroke="#64748b"
            style={{ fontSize: '12px', fontFamily: 'Space Grotesk' }}
            tick={{ fill: '#64748b' }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => (
              <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 600 }}>
                {value}
              </span>
            )}
          />

          {chartComponents}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
}

export default PerformanceChart;
