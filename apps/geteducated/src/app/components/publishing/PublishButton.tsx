import React, { useState } from 'react';
import {
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Calendar,
  Globe,
  FileText,
} from 'lucide-react';

export type PublishStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

interface PublishButtonProps {
  status: PublishStatus;
  scheduledFor?: Date;
  qualityScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isWebhookConfigured: boolean;
  onPublish: (mode: 'now' | 'draft' | 'schedule', scheduledDate?: Date) => Promise<void>;
  onUnpublish?: () => Promise<void>;
  disabled?: boolean;
}

const PublishButton: React.FC<PublishButtonProps> = ({
  status,
  scheduledFor,
  qualityScore,
  riskLevel,
  isWebhookConfigured,
  onPublish,
  onUnpublish,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('10:00');

  const canPublish = isWebhookConfigured && riskLevel !== 'CRITICAL';
  const needsReview = riskLevel === 'HIGH' || (qualityScore !== undefined && qualityScore < 60);

  const handlePublish = async (mode: 'now' | 'draft' | 'schedule') => {
    setIsLoading(true);
    try {
      if (mode === 'schedule' && scheduleDate) {
        const scheduledDate = new Date(`${scheduleDate}T${scheduleTime}`);
        await onPublish(mode, scheduledDate);
      } else {
        await onPublish(mode);
      }
      setIsOpen(false);
      setShowScheduler(false);
    } catch (error) {
      console.error('Publish failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'published':
        return { icon: CheckCircle2, text: 'Published', color: 'text-emerald-400' };
      case 'scheduled':
        return { icon: Clock, text: 'Scheduled', color: 'text-amber-400' };
      case 'publishing':
        return { icon: Loader2, text: 'Publishing...', color: 'text-indigo-400' };
      case 'failed':
        return { icon: AlertCircle, text: 'Failed', color: 'text-red-400' };
      default:
        return { icon: FileText, text: 'Draft', color: 'text-slate-400' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (!isWebhookConfigured) {
    return (
      <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-500/10 text-slate-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Configure webhook to publish</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main button with dropdown */}
      <div className="inline-flex rounded-lg overflow-hidden shadow-lg">
        {/* Primary action */}
        <button
          onClick={() => {
            if (status === 'draft') {
              handlePublish('now');
            } else if (status === 'published' && onUnpublish) {
              onUnpublish();
            }
          }}
          disabled={disabled || isLoading || !canPublish || status === 'publishing'}
          className={[
            'px-4 py-2 flex items-center space-x-2 transition-all',
            status === 'published'
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : status === 'scheduled'
              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <StatusIcon className={[
              'w-4 h-4',
              status === 'publishing' ? 'animate-spin' : '',
            ].join(' ')} />
          )}
          <span>
            {status === 'draft' ? 'Publish Now' : statusDisplay.text}
          </span>
        </button>

        {/* Dropdown toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isLoading || status === 'publishing'}
          className={[
            'px-2 border-l transition-colors',
            status === 'published'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
              : status === 'scheduled'
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 hover:bg-amber-500/30'
              : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500',
            'disabled:opacity-50',
          ].join(' ')}
        >
          <ChevronDown className={[
            'w-4 h-4 transition-transform',
            isOpen ? 'rotate-180' : '',
          ].join(' ')} />
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowScheduler(false);
            }}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-void-800 rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
            {/* Publish options */}
            <div className="p-2">
              <button
                onClick={() => handlePublish('now')}
                disabled={!canPublish}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center space-x-3 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-white">Publish Now</p>
                  <p className="text-xs text-slate-500">Send to webhook immediately</p>
                </div>
              </button>

              <button
                onClick={() => setShowScheduler(!showScheduler)}
                disabled={!canPublish}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center space-x-3 transition-colors disabled:opacity-50"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-white">Schedule</p>
                  <p className="text-xs text-slate-500">Set publish date and time</p>
                </div>
              </button>

              <button
                onClick={() => handlePublish('draft')}
                className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-white/5 flex items-center space-x-3 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-white">Save as Draft</p>
                  <p className="text-xs text-slate-500">Don't publish yet</p>
                </div>
              </button>
            </div>

            {/* Scheduler */}
            {showScheduler && (
              <div className="p-3 border-t border-white/5 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-void-950/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-void-950/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <button
                  onClick={() => handlePublish('schedule')}
                  disabled={!scheduleDate}
                  className="w-full px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Schedule Publish
                </button>
              </div>
            )}

            {/* Warning for high-risk content */}
            {needsReview && (
              <div className="p-3 border-t border-white/5 bg-amber-500/5">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-300">
                    {riskLevel === 'HIGH'
                      ? 'This content has high risk and requires manual review before publishing.'
                      : 'Quality score is below threshold. Review recommended.'}
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled info */}
            {status === 'scheduled' && scheduledFor && (
              <div className="p-3 border-t border-white/5 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Scheduled for</p>
                    <p className="text-sm text-amber-400">
                      {scheduledFor.toLocaleDateString()} at {scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePublish('draft')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PublishButton;
