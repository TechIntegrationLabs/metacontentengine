/**
 * IdeaForm Component
 *
 * Form for creating and editing content ideas with keyword research data.
 */

import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Save,
  X,
  Target,
  TrendingUp,
  Gauge,
  User,
  Sparkles,
  Search,
  AlertTriangle,
} from 'lucide-react';
import type { ContentIdea } from '@content-engine/types';

interface IdeaFormProps {
  idea?: ContentIdea | null;
  contributors?: Array<{ id: string; name: string }>;
  onSubmit: (data: IdeaFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export interface IdeaFormData {
  title: string;
  description: string;
  source: ContentIdea['source'];
  priority: ContentIdea['priority'];
  primaryKeyword: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  assignedContributorId: string | null;
}

const DEFAULT_FORM_DATA: IdeaFormData = {
  title: '',
  description: '',
  source: 'manual',
  priority: 'medium',
  primaryKeyword: '',
  searchVolume: null,
  keywordDifficulty: null,
  assignedContributorId: null,
};

export function IdeaForm({
  idea,
  contributors = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className = '',
}: IdeaFormProps) {
  const [formData, setFormData] = useState<IdeaFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof IdeaFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!idea;

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title,
        description: idea.description || '',
        source: idea.source,
        priority: idea.priority,
        primaryKeyword: idea.primaryKeyword || '',
        searchVolume: idea.searchVolume ?? null,
        keywordDifficulty: idea.keywordDifficulty ?? null,
        assignedContributorId: idea.assignedContributorId || null,
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
    setErrors({});
  }, [idea]);

  const handleChange = (
    field: keyof IdeaFormData,
    value: string | number | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof IdeaFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title should be at least 10 characters';
    }

    if (formData.searchVolume !== null && formData.searchVolume < 0) {
      newErrors.searchVolume = 'Search volume cannot be negative';
    }

    if (formData.keywordDifficulty !== null) {
      if (formData.keywordDifficulty < 0 || formData.keywordDifficulty > 100) {
        newErrors.keywordDifficulty = 'Keyword difficulty must be 0-100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`glass-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {isEditing ? 'Edit Idea' : 'New Content Idea'}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Enter a descriptive title for this content idea"
            className={`w-full px-4 py-2 bg-void-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange ${
              errors.title ? 'border-red-500' : 'border-white/10'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Provide additional context or notes about this idea"
            rows={3}
            className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange resize-none"
          />
        </div>

        {/* Source and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value as ContentIdea['source'])}
              className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            >
              <option value="manual">Manual Entry</option>
              <option value="ai_generated">AI Generated</option>
              <option value="keyword_research">Keyword Research</option>
              <option value="competitor">Competitor Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value as ContentIdea['priority'])}
              className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Keyword Research Section */}
        <div className="border border-white/10 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Keyword Research</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Target className="w-3.5 h-3.5 inline mr-1" />
              Primary Keyword
            </label>
            <input
              type="text"
              value={formData.primaryKeyword}
              onChange={(e) => handleChange('primaryKeyword', e.target.value)}
              placeholder="e.g., best hiking boots"
              className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
                Search Volume
              </label>
              <input
                type="number"
                value={formData.searchVolume ?? ''}
                onChange={(e) =>
                  handleChange(
                    'searchVolume',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Monthly searches"
                min="0"
                className={`w-full px-4 py-2 bg-void-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange ${
                  errors.searchVolume ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {errors.searchVolume && (
                <p className="mt-1 text-xs text-red-400">{errors.searchVolume}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Gauge className="w-3.5 h-3.5 inline mr-1" />
                Keyword Difficulty
              </label>
              <input
                type="number"
                value={formData.keywordDifficulty ?? ''}
                onChange={(e) =>
                  handleChange(
                    'keywordDifficulty',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="0-100"
                min="0"
                max="100"
                className={`w-full px-4 py-2 bg-void-900 border rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange ${
                  errors.keywordDifficulty ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {errors.keywordDifficulty && (
                <p className="mt-1 text-xs text-red-400">{errors.keywordDifficulty}</p>
              )}
            </div>
          </div>
        </div>

        {/* Assignment */}
        {contributors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Assign to Contributor
            </label>
            <select
              value={formData.assignedContributorId || ''}
              onChange={(e) =>
                handleChange('assignedContributorId', e.target.value || null)
              }
              className="w-full px-4 py-2 bg-void-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-forge-orange/50 focus:border-forge-orange"
            >
              <option value="">Unassigned</option>
              {contributors.map((contributor) => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-2 bg-forge-orange hover:bg-forge-orange/90 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Update Idea' : 'Create Idea'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default IdeaForm;
