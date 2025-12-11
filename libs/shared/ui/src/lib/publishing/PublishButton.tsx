import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';

export type PublishStatus =
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed';

interface PublishButtonProps {
  status: PublishStatus;
  onPublishNow?: () => void;
  onSchedule?: () => void;
  onSaveDraft?: () => void;
  isHighRisk?: boolean;
  highRiskMessage?: string;
  disabled?: boolean;
  lastPublishedAt?: Date;
  scheduledFor?: Date;
}

const PublishButton: React.FC<PublishButtonProps> = ({
  status,
  onPublishNow,
  onSchedule,
  onSaveDraft,
  isHighRisk = false,
  highRiskMessage = 'This content may need review before publishing.',
  disabled = false,
  lastPublishedAt,
  scheduledFor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePublishNow = () => {
    if (isHighRisk && !showRiskWarning) {
      setShowRiskWarning(true);
      return;
    }
    setShowRiskWarning(false);
    setIsOpen(false);
    onPublishNow?.();
  };

  const handleSchedule = () => {
    setIsOpen(false);
    onSchedule?.();
  };

  const handleSaveDraft = () => {
    setIsOpen(false);
    onSaveDraft?.();
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          icon: Save,
          text: 'Draft',
          color: 'text-void-400',
          bgColor: 'bg-void-800',
        };
      case 'scheduled':
        return {
          icon: Clock,
          text: scheduledFor
            ? `Scheduled for ${scheduledFor.toLocaleDateString()}`
            : 'Scheduled',
          color: 'text-forge-indigo',
          bgColor: 'bg-forge-indigo/10',
        };
      case 'publishing':
        return {
          icon: Loader2,
          text: 'Publishing...',
          color: 'text-forge-orange',
          bgColor: 'bg-forge-orange/10',
          spin: true,
        };
      case 'published':
        return {
          icon: CheckCircle2,
          text: lastPublishedAt
            ? `Published ${lastPublishedAt.toLocaleDateString()}`
            : 'Published',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
        };
      case 'failed':
        return {
          icon: AlertCircle,
          text: 'Publish Failed',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
        };
      default:
        return {
          icon: Send,
          text: 'Publish',
          color: 'text-void-100',
          bgColor: 'bg-void-800',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const isDisabled = disabled || status === 'publishing';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* High-Risk Warning */}
      {showRiskWarning && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 shadow-xl z-50">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-300 mb-1">
                High-Risk Content Detected
              </h4>
              <p className="text-xs text-amber-200/80">{highRiskMessage}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRiskWarning(false)}
              className="flex-1 px-3 py-1.5 bg-void-800 hover:bg-void-700 text-void-100 text-sm rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishNow}
              className="flex-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded transition-colors"
            >
              Publish Anyway
            </button>
          </div>
        </div>
      )}

      {/* Main Button */}
      <div className="flex gap-1">
        <button
          onClick={handlePublishNow}
          disabled={isDisabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-l-lg transition-colors ${statusConfig.bgColor} ${statusConfig.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <StatusIcon
            className={`w-4 h-4 ${statusConfig.spin ? 'animate-spin' : ''}`}
          />
          <span className="text-sm font-medium">{statusConfig.text}</span>
          {isHighRisk && status !== 'published' && status !== 'publishing' && (
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Dropdown Toggle */}
        {status !== 'publishing' && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isDisabled}
            className={`px-2 py-2 rounded-r-lg border-l border-void-700 transition-colors ${statusConfig.bgColor} ${statusConfig.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-56 bg-void-900 border border-void-700 rounded-lg shadow-xl overflow-hidden z-50">
          {onPublishNow && (
            <button
              onClick={handlePublishNow}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-void-100 hover:bg-void-800 transition-colors border-b border-void-800"
            >
              <Send className="w-4 h-4 text-forge-orange" />
              <div>
                <div className="text-sm font-medium">Publish Now</div>
                <div className="text-xs text-void-500">
                  Make content live immediately
                </div>
              </div>
            </button>
          )}

          {onSchedule && (
            <button
              onClick={handleSchedule}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-void-100 hover:bg-void-800 transition-colors border-b border-void-800"
            >
              <Calendar className="w-4 h-4 text-forge-indigo" />
              <div>
                <div className="text-sm font-medium">Schedule</div>
                <div className="text-xs text-void-500">
                  Choose a publish date & time
                </div>
              </div>
            </button>
          )}

          {onSaveDraft && (
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-void-100 hover:bg-void-800 transition-colors"
            >
              <Save className="w-4 h-4 text-void-400" />
              <div>
                <div className="text-sm font-medium">Save as Draft</div>
                <div className="text-xs text-void-500">
                  Keep for later editing
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PublishButton;
