import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Save,
  Camera,
  Loader2,
  RefreshCw,
  AlertCircle,
  Star,
  Palmtree
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useContributors, Contributor, CreateContributorInput, ContentType } from '@content-engine/hooks';

const styleDescriptions: Record<string, string> = {
  academic: 'Formal, research-backed, citation-heavy',
  conversational: 'Friendly, relatable, uses personal anecdotes',
  analytical: 'Data-driven, precise, methodical',
  friendly: 'Warm, encouraging, accessible language'
};

interface ContributorModalProps {
  contributor?: Contributor | null;
  onClose: () => void;
  onSave: (contributor: CreateContributorInput) => Promise<void>;
  isSaving: boolean;
}

const ContributorModal: React.FC<ContributorModalProps> = ({ contributor, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: contributor?.name || '',
    display_name: contributor?.display_name || '',
    bio: contributor?.bio || '',
    expertise_areas: contributor?.expertise_areas?.join(', ') || '',
    style_proxy: contributor?.style_proxy || '',
    formality_scale: contributor?.voice_profile?.formality_scale || 5,
    description: contributor?.voice_profile?.description || '',
    is_active: contributor?.is_active ?? true,
    is_default: contributor?.is_default ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: formData.name,
      display_name: formData.display_name || formData.name,
      bio: formData.bio,
      expertise_areas: formData.expertise_areas.split(',').map(s => s.trim()).filter(Boolean),
      style_proxy: formData.style_proxy || undefined,
      voice_profile: {
        formality_scale: formData.formality_scale,
        description: formData.description,
        signature_phrases: [],
        transition_words: [],
        phrases_to_avoid: [],
        topics_to_avoid: [],
      },
      is_active: formData.is_active,
      is_default: formData.is_default,
      content_types: ['blog_post'] as ContentType[],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-void-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-display font-bold text-white">
            {contributor ? 'Edit Contributor' : 'Add New Contributor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Avatar Preview - PCC brand gradient */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-pcc-teal to-pcc-gold flex items-center justify-center text-2xl font-bold text-white">
                {formData.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'XX'}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-pcc-teal text-white shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
                placeholder="Kimo Kealoha"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
                placeholder="Kimo"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 h-24 resize-none"
              placeholder="Brief professional background..."
            />
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Expertise Areas (comma-separated)</label>
            <input
              type="text"
              value={formData.expertise_areas}
              onChange={(e) => setFormData({ ...formData, expertise_areas: e.target.value })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
              placeholder="Polynesian Culture, Hawaii Tourism, Pacific Islands"
            />
          </div>

          {/* Style Proxy */}
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Style Proxy (Writing style inspiration)</label>
            <input
              type="text"
              value={formData.style_proxy}
              onChange={(e) => setFormData({ ...formData, style_proxy: e.target.value })}
              className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50"
              placeholder="e.g., Anthony Bourdain, National Geographic"
            />
          </div>

          {/* Voice Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Voice Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-void-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 h-20 resize-none"
                placeholder="Describe the writing voice and style..."
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">
                Formality: {formData.formality_scale}/10
              </label>
              <div className="flex items-center space-x-3 mt-4">
                <span className="text-xs text-slate-500">Formal</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.formality_scale}
                  onChange={(e) => setFormData({ ...formData, formality_scale: parseInt(e.target.value) })}
                  className="flex-1 accent-pcc-teal"
                />
                <span className="text-xs text-slate-500">Casual</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded accent-pcc-teal"
              />
              <span className="text-sm text-slate-400">Active</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 rounded accent-pcc-teal"
              />
              <span className="text-sm text-slate-400">Default Contributor</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-pcc-teal to-pcc-gold hover:from-pcc-teal/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{contributor ? 'Update' : 'Create'} Contributor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Contributors: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const {
    contributors,
    isLoading,
    error,
    createContributor,
    updateContributor,
    deleteContributor,
    setDefaultContributor,
    refetch
  } = useContributors({
    supabase,
    filters: {
      search: searchQuery || undefined,
    }
  });

  const handleEdit = (contributor: Contributor) => {
    setEditingContributor(contributor);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingContributor(null);
    setShowModal(true);
  };

  const handleSave = async (data: CreateContributorInput) => {
    setIsSaving(true);
    try {
      if (editingContributor) {
        await updateContributor({
          id: editingContributor.id,
          ...data,
        });
      } else {
        await createContributor(data);
      }
      setShowModal(false);
      setEditingContributor(null);
    } catch (err) {
      console.error('Failed to save contributor:', err);
      alert('Failed to save contributor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contributor?')) return;

    setIsDeleting(id);
    try {
      await deleteContributor(id);
      if (selectedContributor?.id === id) {
        setSelectedContributor(null);
      }
    } catch (err) {
      console.error('Failed to delete contributor:', err);
      alert('Failed to delete contributor');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultContributor(id);
    } catch (err) {
      console.error('Failed to set default contributor:', err);
      alert('Failed to set default contributor');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-400">Failed to load contributors</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-pcc-teal text-white rounded-lg hover:bg-pcc-teal/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center space-x-3">
            <Palmtree className="w-8 h-8 text-pcc-teal" />
            <span>Contributors</span>
          </h1>
          <p className="text-slate-500 mt-1">Manage AI writing personas and expert voices</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-void-900/50 border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pcc-coral to-pcc-gold hover:from-pcc-coral/90 hover:to-pcc-gold/90 text-white flex items-center space-x-2 transition-all shadow-lg shadow-pcc-coral/20"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Contributor</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contributors..."
          className="w-full bg-void-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pcc-teal/50 focus:border-pcc-teal/50"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-pcc-teal animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && contributors.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">No contributors found</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-pcc-teal text-white rounded-lg hover:bg-pcc-teal/90 transition-colors"
          >
            Add your first contributor
          </button>
        </div>
      )}

      {/* Contributors Grid */}
      {!isLoading && contributors.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contributors.map((contributor) => {
            const initials = contributor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

            return (
              <div
                key={contributor.id}
                className={[
                  'bg-void-900/50 rounded-2xl border p-6 transition-all cursor-pointer',
                  selectedContributor?.id === contributor.id
                    ? 'border-pcc-teal/50 shadow-lg shadow-pcc-teal/10'
                    : 'border-white/5 hover:border-white/10'
                ].join(' ')}
                onClick={() => setSelectedContributor(contributor)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {contributor.avatar_url ? (
                        <img
                          src={contributor.avatar_url}
                          alt={contributor.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pcc-teal to-pcc-gold flex items-center justify-center text-lg font-bold text-white">
                          {initials}
                        </div>
                      )}
                      {contributor.is_active && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-void-900" />
                      )}
                      {contributor.is_default && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-pcc-gold rounded-full border-2 border-void-900 flex items-center justify-center">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white text-lg">{contributor.display_name || contributor.name}</h3>
                      <p className="text-sm text-slate-500">{contributor.style_proxy || 'AI Contributor'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!contributor.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(contributor.id);
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-pcc-gold transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(contributor);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(contributor.id);
                      }}
                      disabled={isDeleting === contributor.id}
                      className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {isDeleting === contributor.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {contributor.bio && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{contributor.bio}</p>
                )}

                {contributor.expertise_areas && contributor.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {contributor.expertise_areas.slice(0, 3).map((exp, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-pcc-teal/10 text-pcc-teal text-xs rounded-lg border border-pcc-teal/20"
                      >
                        {exp}
                      </span>
                    ))}
                    {contributor.expertise_areas.length > 3 && (
                      <span className="px-2 py-1 bg-white/5 text-slate-500 text-xs rounded-lg">
                        +{contributor.expertise_areas.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Articles</p>
                    <p className="text-lg font-bold text-white">{contributor.article_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Avg Quality</p>
                    <p className={[
                      'text-lg font-bold',
                      (contributor.average_quality_score || 0) >= 90 ? 'text-emerald-400' :
                      (contributor.average_quality_score || 0) >= 80 ? 'text-pcc-teal' :
                      (contributor.average_quality_score || 0) > 0 ? 'text-pcc-gold' : 'text-slate-600'
                    ].join(' ')}>
                      {contributor.average_quality_score ? contributor.average_quality_score.toFixed(0) : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Formality</p>
                    <p className="text-lg font-bold text-white">
                      {contributor.voice_profile?.formality_scale || 5}/10
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ContributorModal
          contributor={editingContributor}
          onClose={() => {
            setShowModal(false);
            setEditingContributor(null);
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

export default Contributors;
