import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PenTool, FileText, Users, Settings as SettingsIcon, BarChart3, Flame, LogOut, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthProvider, useAuth, TenantProvider, useTenant } from '@content-engine/hooks';
import Dashboard from './pages/Dashboard';
import ContentForge from './pages/ContentForge';
import MagicSetup, { BrandProfile } from './pages/MagicSetup';
import Articles from './pages/Articles';
import ArticleEditor from './pages/ArticleEditor';
import Contributors from './pages/Contributors';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import KeywordResearch from './pages/KeywordResearch';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/auth';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password';

const STORAGE_KEY = 'perdia_brand_profile';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/forge', label: 'Content Forge', icon: PenTool },
  { path: '/articles', label: 'Articles', icon: FileText },
  { path: '/keywords', label: 'Keywords', icon: Search },
  { path: '/contributors', label: 'Contributors', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-void-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
}

// Auth wrapper component to handle authentication flow
function AuthWrapper() {
  const { isLoading, isAuthenticated, signOut } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  // Check URL for auth callbacks (reset password, email confirmation)
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const type = params.get('type');

    if (type === 'recovery') {
      setAuthView('reset-password');
    }

    // Also check pathname for /auth routes
    const pathname = window.location.pathname;
    if (pathname === '/auth/reset-password') {
      setAuthView('reset-password');
    }
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Show auth pages
    switch (authView) {
      case 'register':
        return (
          <Register
            onNavigate={(page) => setAuthView(page as AuthView)}
            onSuccess={() => {}} // Will auto-redirect via auth state change
          />
        );
      case 'forgot-password':
        return (
          <ForgotPassword
            onNavigate={(page) => setAuthView(page as AuthView)}
          />
        );
      case 'reset-password':
        return (
          <ResetPassword
            onSuccess={() => {
              // Clear hash/params and reload
              window.history.replaceState(null, '', window.location.pathname);
            }}
          />
        );
      default:
        return (
          <Login
            onNavigate={(page) => setAuthView(page as AuthView)}
            onSuccess={() => {}} // Will auto-redirect via auth state change
          />
        );
    }
  }

  // User is authenticated, show the main app
  return <AuthenticatedApp onSignOut={signOut} />;
}

// Main app component (shown when authenticated)
function AuthenticatedApp({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { tenant, isLoading: tenantLoading } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if brand profile exists in localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBrandProfile(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored brand profile');
      }
    }
    setIsInitialized(true);
  }, []);

  const handleSetupComplete = (profile: BrandProfile) => {
    setBrandProfile(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const handleSignOut = async () => {
    await onSignOut();
    // Clear brand profile on sign out
    localStorage.removeItem(STORAGE_KEY);
  };

  // Show loading state while checking localStorage or tenant
  if (!isInitialized || tenantLoading) {
    return <LoadingSpinner />;
  }

  // Show onboarding wizard if no brand profile
  if (!brandProfile) {
    return (
      <div className="min-h-screen bg-void-950 text-white font-sans">
        <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-forge-accent/5 blur-[150px] rounded-full pointer-events-none" />
        <MagicSetup onComplete={handleSetupComplete} />
      </div>
    );
  }

  // Get display name from user metadata or email
  const displayName = tenant?.appName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = user?.app_metadata?.role || 'viewer';

  // Check if current route is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-void-950 text-white flex overflow-hidden font-sans">
      <aside
        onMouseEnter={() => setIsSidebarCollapsed(false)}
        onMouseLeave={() => setIsSidebarCollapsed(true)}
        className={[
          isSidebarCollapsed ? 'w-20' : 'w-64',
          'bg-void-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col',
          'transition-all duration-500 z-50 fixed h-full left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.4)]'
        ].join(' ')}
      >
        <div className="p-6 flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-indigo-500 to-forge-accent flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Flame className="w-5 h-5 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-xl font-display font-bold tracking-tight whitespace-nowrap">
              {tenant?.appName || 'Perdia'}
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={[
                  'w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-300 group relative',
                  active
                    ? 'bg-gradient-to-r from-indigo-500/10 to-transparent text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                ].join(' ')}
              >
                <Icon className={['w-5 h-5', active ? 'text-indigo-400' : ''].join(' ')} />
                {!isSidebarCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/10">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-void-900/50">
          <div className={['flex items-center', isSidebarCollapsed ? 'justify-center' : 'space-x-3'].join(' ')}>
            <div className="w-8 h-8 min-w-[32px] rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate text-white">{displayName}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className={['flex-1 overflow-y-auto relative scroll-smooth transition-all duration-500', isSidebarCollapsed ? 'ml-20' : 'ml-64'].join(' ')}>
        <div className="sticky top-0 h-8 bg-gradient-to-b from-void-950 to-transparent z-40 pointer-events-none" />
        <div className="p-8 max-w-[1920px] mx-auto min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/forge" element={<ContentForge />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/new" element={<ArticleEditor />} />
            <Route path="/articles/:id" element={<ArticleEditor />} />
            <Route path="/contributors" element={<Contributors />} />
            <Route path="/keywords" element={<KeywordResearch />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-forge-accent/5 blur-[150px] rounded-full pointer-events-none" />
      </main>
    </div>
  );
}

// Root app with providers
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider supabase={supabase}>
        <TenantProvider supabase={supabase}>
          <AuthWrapper />
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
