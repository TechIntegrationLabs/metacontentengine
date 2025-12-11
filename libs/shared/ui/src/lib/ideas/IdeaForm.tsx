/**
 * IdeaForm Component
 *
 * Form for creating and editing content ideas with validation.
 */

import React, { useState } from 'react';
import { Input } from '../primitives/Input';
import { Textarea } from '../primitives/Textarea';
import { Button } from '../primitives/Button';
import {
  Lightbulb,
  Target,
  TrendingUp,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';

export interface IdeaFormData {
  title: string;
  description?: string;
  source: ContentIdea['source'];
  priority: ContentIdea['priority'];
  primaryKeyword?: string;
  searchVolume?: number;
  keywordDifficulty?: number;
  assignedContributorId?: string;
}

interface IdeaFormProps {
  initialData?: Partial<IdeaFormData>;
  contributors?: Array<{ id: string; name: string }>;
  onSubmit: (data: IdeaFormData) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function IdeaForm({
  initialData,
  contributors = [],
  onSubmit,
  onCancel,
  submitLabel = 'Create Idea',
  isLoading = false,
}: IdeaFormProps) {
  const [formData, setFormData] = useState<IdeaFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    source: initialData?.source || 'manual',
    priority: initialData?.priority || 'medium',
    primaryKeyword: initialData?.primaryKeyword || '',
    searchVolume: initialData?.searchVolume,
    keywordDifficulty: initialData?.keywordDifficulty,
    assignedContributorId: initialData?.assignedContributorId || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof IdeaFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof IdeaFormData, string>> = {};

    if (!formData.title || formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (formData.searchVolume !== undefined && formData.searchVolume < 0) {
      newErrors.searchVolume = 'Search volume must be positive';
    }

    if (
      formData.keywordDifficulty !== undefined &&
      (formData.keywordDifficulty < 0 || formData.keywordDifficulty > 100)
    ) {
      newErrors.keywordDifficulty = 'Keyword difficulty must be between 0-100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(formData);
  };

  const updateField = <K extends keyof IdeaFormData>(
    field: K,
    value: IdeaFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <Input
        label="Title"
        placeholder="e.g., How to optimize React performance in 2025"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
        leftIcon={<Lightbulb className="w-4 h-4" />}
        required
      />

      {/* Description */}
      <Textarea
        label="Description (Optional)"
        placeholder="Brief description or notes about this content idea..."
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        rows={3}
        showCharCount
        maxLength={500}
      />

      {/* Source + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Source
          </label>
          <select
            value={formData.source}
            onChange={(e) => updateField('source', e.target.value as ContentIdea['source'])}
            className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950 transition-all shadow-inner outline-none"
          >
            <option value="manual">Manual</option>
            <option value="ai_generated">AI Generated</option>
            <option value="keyword_research">Keyword Research</option>
            <option value="competitor">Competitor</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => updateField('priority', e.target.value as ContentIdea['priority'])}
            className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950 transition-all shadow-inner outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Keyword Research Section */}
      <div className="glass-panel rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-400" />
          Keyword Research
        </h3>

        <Input
          label="Primary Keyword"
          placeholder="e.g., react performance optimization"
          value={formData.primaryKeyword}
          onChange={(e) => updateField('primaryKeyword', e.target.value)}
          leftIcon={<Target className="w-4 h-4" />}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Search Volume"
            type="number"
            placeholder="e.g., 1200"
            value={formData.searchVolume || ''}
            onChange={(e) =>
              updateField('searchVolume', e.target.value ? parseInt(e.target.value) : undefined)
            }
            error={errors.searchVolume}
            leftIcon={<TrendingUp className="w-4 h-4" />}
            min={0}
          />

          <Input
            label="Keyword Difficulty (0-100)"
            type="number"
            placeholder="e.g., 45"
            value={formData.keywordDifficulty || ''}
            onChange={(e) =>
              updateField(
                'keywordDifficulty',
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            error={errors.keywordDifficulty}
            leftIcon={<Sparkles className="w-4 h-4" />}
            min={0}
            max={100}
          />
        </div>
      </div>

      {/* Contributor Assignment */}
      {contributors.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Assign to Contributor (Optional)
          </label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={formData.assignedContributorId}
              onChange={(e) => updateField('assignedContributorId', e.target.value || undefined)}
              className="w-full bg-void-950/50 border border-slate-700/50 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-void-950 transition-all shadow-inner outline-none"
            >
              <option value="">Unassigned</option>
              {contributors.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="flex-1"
        >
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export default IdeaForm;
