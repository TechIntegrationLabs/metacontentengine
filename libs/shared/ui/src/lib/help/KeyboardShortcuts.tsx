import { useState, useEffect, useMemo } from 'react';
import { X, Search, Command, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface KeyboardShortcut {
  id: string;
  keys: string[]; // e.g., ['Cmd', 'K'] or ['Ctrl', 'S']
  description: string;
  category: string;
  action?: () => void;
}

export interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
  onShortcutTrigger?: (shortcutId: string) => void;
}

const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const defaultShortcuts: KeyboardShortcut[] = [
  // Navigation
  {
    id: 'nav-dashboard',
    keys: ['g', 'd'],
    description: 'Go to Dashboard',
    category: 'Navigation',
  },
  {
    id: 'nav-content-forge',
    keys: ['g', 'c'],
    description: 'Go to Content Forge',
    category: 'Navigation',
  },
  {
    id: 'nav-articles',
    keys: ['g', 'a'],
    description: 'Go to Articles',
    category: 'Navigation',
  },
  {
    id: 'nav-contributors',
    keys: ['g', 'p'],
    description: 'Go to Contributors',
    category: 'Navigation',
  },
  {
    id: 'nav-settings',
    keys: ['g', 's'],
    description: 'Go to Settings',
    category: 'Navigation',
  },

  // Editor
  {
    id: 'editor-save',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'S'],
    description: 'Save article',
    category: 'Editor',
  },
  {
    id: 'editor-bold',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'B'],
    description: 'Bold text',
    category: 'Editor',
  },
  {
    id: 'editor-italic',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'I'],
    description: 'Italic text',
    category: 'Editor',
  },
  {
    id: 'editor-link',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'K'],
    description: 'Insert link',
    category: 'Editor',
  },
  {
    id: 'editor-undo',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'Z'],
    description: 'Undo',
    category: 'Editor',
  },
  {
    id: 'editor-redo',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'Shift', 'Z'],
    description: 'Redo',
    category: 'Editor',
  },

  // Actions
  {
    id: 'action-search',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'K'],
    description: 'Search',
    category: 'Actions',
  },
  {
    id: 'action-new-article',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'N'],
    description: 'New article',
    category: 'Actions',
  },
  {
    id: 'action-help',
    keys: ['?'],
    description: 'Open keyboard shortcuts',
    category: 'Actions',
  },
  {
    id: 'action-quick-command',
    keys: [isMac ? 'Cmd' : 'Ctrl', 'P'],
    description: 'Quick command palette',
    category: 'Actions',
  },
];

export function KeyboardShortcuts({
  isOpen,
  onClose,
  shortcuts = defaultShortcuts,
  onShortcutTrigger,
}: KeyboardShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const filtered = searchQuery
      ? shortcuts.filter(
          (shortcut) =>
            shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shortcut.keys.some((key) => key.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : shortcuts;

    return filtered.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);
  }, [shortcuts, searchQuery]);

  // Listen for ? key to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).contentEditable === 'true'
      ) {
        return;
      }

      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onClose(); // Toggle
      }

      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trigger shortcuts when keys are pressed
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const matches = shortcut.keys.every((key, index) => {
          const lowerKey = key.toLowerCase();

          if (lowerKey === 'cmd' || lowerKey === 'ctrl') {
            return isMac ? e.metaKey : e.ctrlKey;
          }
          if (lowerKey === 'shift') return e.shiftKey;
          if (lowerKey === 'alt') return e.altKey;

          // For regular keys, check if it's the last key in the sequence
          if (index === shortcut.keys.length - 1) {
            return e.key.toLowerCase() === lowerKey;
          }

          return false;
        });

        if (matches) {
          e.preventDefault();
          shortcut.action?.();
          onShortcutTrigger?.(shortcut.id);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shortcuts, onShortcutTrigger]);

  const KeyBadge = ({ keyText }: { keyText: string }) => {
    // Replace platform-specific keys
    const displayKey = keyText
      .replace(/Cmd/i, isMac ? '⌘' : 'Ctrl')
      .replace(/Ctrl/i, isMac ? '⌃' : 'Ctrl')
      .replace(/Alt/i, isMac ? '⌥' : 'Alt')
      .replace(/Shift/i, '⇧');

    return (
      <kbd className="px-2 py-1 min-w-[28px] text-center bg-glass-200/50 border border-glass-300 rounded text-xs font-mono text-glass-300 shadow-sm">
        {displayKey}
      </kbd>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-void-900/95 backdrop-blur-xl border border-glass-200 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-glass-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-forge-purple to-forge-indigo flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-sm text-glass-400">
                    Press <kbd className="px-1.5 py-0.5 bg-glass-200/50 rounded text-xs">?</kbd> to toggle
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-glass-200/50 transition-colors text-glass-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-glass-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glass-400" />
                <input
                  type="text"
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-glass-200/50 border border-glass-300 rounded-lg text-white placeholder-glass-400 text-sm focus:outline-none focus:ring-2 focus:ring-forge-purple/50 focus:border-forge-purple transition-all"
                />
              </div>
            </div>

            {/* Shortcuts List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Command className="w-4 h-4 text-forge-purple" />
                    <h3 className="text-sm font-semibold text-glass-400 uppercase tracking-wider">
                      {category}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {categoryShortcuts.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-glass-200/30 hover:bg-glass-200/50 transition-colors"
                      >
                        <span className="text-white text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, index) => (
                            <div key={index} className="flex items-center gap-1">
                              <KeyBadge keyText={key} />
                              {index < shortcut.keys.length - 1 && (
                                <span className="text-glass-500 text-xs">+</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {Object.keys(groupedShortcuts).length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-glass-400 mx-auto mb-4" />
                  <p className="text-glass-400">No shortcuts found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-glass-200 bg-glass-200/20">
              <div className="flex items-center justify-center gap-2 text-xs text-glass-400">
                <span>Platform:</span>
                <span className="px-2 py-1 bg-glass-200/50 rounded font-mono text-glass-300">
                  {isMac ? 'macOS' : 'Windows/Linux'}
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
