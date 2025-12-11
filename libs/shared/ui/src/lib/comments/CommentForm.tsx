import { useState, useRef, useEffect } from 'react';
import { Button } from '../primitives/Button';
import { Textarea } from '../primitives/Textarea';
import { Send, X } from 'lucide-react';

export interface CommentFormProps {
  onSubmit: (content: string, mentions: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  maxLength?: number;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  initialValue = '',
  autoFocus = false,
  submitLabel = 'Comment',
  maxLength = 2000,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const canSubmit = content.trim().length > 0 && !isOverLimit;

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (canSubmit) {
      onSubmit(content.trim(), mentions);
      setContent('');
      setMentions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }

    // Detect @ for mentions
    if (e.key === '@') {
      setShowMentionPicker(true);
    }

    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Detect @ mentions in content
    const mentionRegex = /@(\w+)/g;
    const detectedMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(value)) !== null) {
      detectedMentions.push(match[1]);
    }
    setMentions(detectedMentions);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-void-800/50 border-white/10 focus:border-forge-accent/50 rounded-xl min-h-[100px] resize-none"
          maxLength={maxLength}
        />

        {/* Character counter */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-500">
          <span className={isOverLimit ? 'text-red-400' : ''}>
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Mention picker placeholder - TODO: Implement autocomplete */}
      {showMentionPicker && (
        <div className="text-xs text-slate-500">
          Mention autocomplete coming soon...
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Use @ to mention users • <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">⌘ Enter</kbd> to submit
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CommentForm;
