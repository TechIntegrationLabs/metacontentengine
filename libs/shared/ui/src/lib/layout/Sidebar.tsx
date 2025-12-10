import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, LogOut } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface SidebarProps {
  items: NavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  brand?: {
    name: string;
    subtitle?: string;
  };
  user?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
}

export function Sidebar({ items, activeItem, onItemClick, brand, user, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside 
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      className={[
        isCollapsed ? 'w-20' : 'w-64',
        'bg-void-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col transition-all duration-500 z-50 fixed h-full left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.4)]'
      ].join(' ')}
    >
      {/* Logo */}
      <div className="p-6 flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-indigo-500 to-forge-accent flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!isCollapsed && brand && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-xl font-display font-bold tracking-tight whitespace-nowrap overflow-hidden"
            >
              {brand.name}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={[
                'w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group relative',
                isActive 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
              ].join(' ')}
            >
              <div className="relative">
                <Icon className={[
                  'w-5 h-5',
                  isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''
                ].join(' ')} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-forge-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="p-4 border-t border-white/5 bg-void-900/50">
          <div className={['flex items-center', isCollapsed ? 'justify-center' : 'space-x-3'].join(' ')}>
            <div className="w-8 h-8 min-w-[32px] rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold border border-white/10 ring-2 ring-void-950">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 overflow-hidden"
                  >
                    <p className="text-sm font-medium truncate text-white">{user.name}</p>
                    {user.role && (
                      <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{user.role}</p>
                    )}
                  </motion.div>
                  {onLogout && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={onLogout}
                      className="p-1 hover:bg-white/5 rounded"
                    >
                      <LogOut className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" />
                    </motion.button>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
