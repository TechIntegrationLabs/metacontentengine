import React, { ReactNode } from 'react';

interface AppLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarCollapsed?: boolean;
}

export function AppLayout({ sidebar, children, sidebarCollapsed = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-void-950 text-white flex overflow-hidden font-sans">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <main className={[
        'flex-1 overflow-y-auto relative scroll-smooth transition-all duration-500',
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      ].join(' ')}>
        {/* Top Gradient Fade */}
        <div className="sticky top-0 h-8 bg-gradient-to-b from-void-950 to-transparent z-40 pointer-events-none" />

        <div className="p-8 max-w-[1920px] mx-auto min-h-screen">
          {children}
        </div>

        {/* Ambient Background Lights */}
        <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-forge-accent/5 blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      </main>
    </div>
  );
}

export default AppLayout;
