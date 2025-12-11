import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import type { DateRangeFilter, DateRangePreset } from '@content-engine/types';

interface DateRangePickerProps {
  value: DateRangeFilter;
  onChange: (range: DateRangeFilter) => void;
  className?: string;
}

const presets: { value: DateRangePreset; label: string }[] = [
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'quarter', label: 'Last 90 days' },
  { value: 'year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const currentLabel = presets.find((p) => p.value === value.preset)?.label || 'Last 30 days';

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      onChange({ preset, startDate: undefined, endDate: undefined });
    } else {
      onChange({ preset });
      setIsOpen(false);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        preset: 'custom',
        startDate: new Date(customStart),
        endDate: new Date(customEnd),
      });
      setIsOpen(false);
    }
  };

  return (
    <div className={['relative', className].join(' ')}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-white/5 transition-colors group"
      >
        <Calendar className="w-4 h-4 text-indigo-400" />
        <span className="text-sm font-medium text-slate-300">{currentLabel}</span>
        <ChevronDown
          className={[
            'w-4 h-4 text-slate-500 transition-transform',
            isOpen ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full mt-2 right-0 z-20 glass-panel rounded-xl shadow-xl shadow-black/50 min-w-[240px] overflow-hidden border border-slate-700/50">
            {/* Preset options */}
            <div className="p-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={[
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    value.preset === preset.value
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'text-slate-300 hover:bg-white/5',
                  ].join(' ')}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {value.preset === 'custom' && (
              <div className="border-t border-slate-700/50 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default DateRangePicker;
