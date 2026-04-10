import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Menu, Settings, X } from 'lucide-react';

import { getTabMeta, type AppTabId } from '@/lib/navigation';
import { cn } from '@/lib/utils';

type AppShellProps = {
  activeTab: AppTabId;
  onTabChange: (tab: AppTabId) => void;
  userLabel?: string;
  children: ReactNode;
};

export function AppShell({ activeTab, onTabChange, userLabel, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeMeta = useMemo(() => getTabMeta(activeTab), [activeTab]);
  const primaryTabs = useMemo(() => {
    const allTabs = [
      'dashboard',
      'leaderboard',
      'node',
      'mining',
      'wallet',
      'tasks',
      'referrals',
      'profile',
      'settings',
    ] as const;

    return allTabs
      .map((id) => getTabMeta(id))
      .filter((tab) => !tab.pinnedToFooter);
  }, []);
  const settingsMeta = getTabMeta('settings');

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-realm-black text-realm-text-primary">
      <a
        href="#workspace-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-realm-black"
      >
        Skip to content
      </a>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[90] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-realm-surface/90 text-white/70 shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur md:hidden"
      >
        <Menu size={18} />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] md:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[85] flex w-[17rem] flex-col border-r border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01)),#090c10] px-4 py-5 shadow-[0_28px_90px_rgba(0,0,0,0.36)] transition-transform duration-300 md:w-[6.75rem] md:translate-x-0 md:px-3',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2 md:justify-center">
          <div className="flex items-center gap-3 md:flex-col md:gap-2">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <img
                src="/le6jxytl.webp"
                alt="REALMxAI"
                className="h-full w-full object-cover grayscale opacity-85"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="md:hidden">
              <p className="text-xs font-semibold tracking-[0.12em] text-white">REALMxAI</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/60 md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileOpen(false);
                }}
                className={cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all md:justify-center md:px-2',
                  active
                    ? 'bg-white/[0.06] text-realm-cyan shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                    : 'text-white/42 hover:bg-white/[0.03] hover:text-white/72',
                )}
                title={tab.label}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-realm-cyan md:h-8" />
                ) : null}
                <Icon size={18} className="shrink-0" />
                <div className="min-w-0 md:hidden">
                  <p className="text-sm font-medium">{tab.label}</p>
                  <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
                    {tab.shortLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/6 pt-4">
          <button
            type="button"
            onClick={() => {
              onTabChange('settings');
              setMobileOpen(false);
            }}
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all md:justify-center md:px-2',
              activeTab === 'settings'
                ? 'bg-white/[0.06] text-realm-cyan shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                : 'text-white/42 hover:bg-white/[0.03] hover:text-white/72',
            )}
            title={settingsMeta.label}
          >
            {activeTab === 'settings' ? (
              <span className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-realm-cyan md:h-8" />
            ) : null}
            <Settings size={18} className="shrink-0" />
            <div className="min-w-0 md:hidden">
              <p className="text-sm font-medium">{settingsMeta.label}</p>
              <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
                Essentials
              </p>
            </div>
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:pl-[6.75rem]">
        <div className="sticky top-0 z-40 border-b border-white/6 bg-[linear-gradient(180deg,rgba(6,8,11,0.96),rgba(6,8,11,0.82))] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
            <div className="min-w-0 pl-12 md:pl-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/30">
                REALMxAI workspace
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  {activeMeta.title}
                </h1>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
                  {activeMeta.label}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-white/45">
                {activeMeta.description}
              </p>
            </div>

            <div className="hidden shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 md:block">
              <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">
                Active identity
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {userLabel || 'REALMxAI operator'}
              </p>
            </div>
          </div>
        </div>

        <div
          id="workspace-content"
          className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
