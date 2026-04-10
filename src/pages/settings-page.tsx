import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, TimerReset } from 'lucide-react';
import { motion } from 'motion/react';

import { FeedbackBanner } from '@/components/app/feedback-banner';
import {
  DEFAULT_APP_PREFERENCES,
  formatRefreshInterval,
  getProfileVisibilityLabel,
  loadAppPreferences,
  saveAppPreferences,
  type AppPreferences,
} from '@/lib/app-preferences';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences());
  const [toastMessage, setToastMessage] = useState('');

  const updatePreferences = (updater: (current: AppPreferences) => AppPreferences) => {
    setPreferences((current) => updater(current));
  };

  const notify = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3200);
  };

  const trustNotes = useMemo(
    () => [
      preferences.notifications.securityAlerts
        ? 'Security notices stay on, so account state changes remain visible.'
        : 'Security notices are muted, so identity changes can be easier to miss.',
      preferences.workspace.hidePointBalance
        ? 'Point balances are masked in shared workspace surfaces.'
        : 'Point balances remain visible for faster operator scanning.',
      preferences.privacy.profileVisibility === 'private'
        ? 'Profile discovery is locked to direct access only.'
        : preferences.privacy.profileVisibility === 'network'
          ? 'Profile details are limited to a trusted-network view.'
          : 'Profile presentation is configured for public visibility.',
    ],
    [preferences],
  );

  const summaryCards = [
    {
      label: 'Refresh cadence',
      value: formatRefreshInterval(preferences.workspace.refreshIntervalMs),
      detail: 'How often the workspace refreshes while open.',
      icon: TimerReset,
    },
    {
      label: 'Profile exposure',
      value: getProfileVisibilityLabel(preferences.privacy.profileVisibility),
      detail: 'How much identity detail the workspace reveals.',
      icon: Lock,
    },
    {
      label: 'Balance visibility',
      value: preferences.workspace.hidePointBalance ? 'Masked' : 'Visible',
      detail: 'Applies to shared UI surfaces such as the workspace shell.',
      icon: preferences.workspace.hidePointBalance ? EyeOff : Eye,
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {toastMessage ? (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <FeedbackBanner title="Settings saved" tone="success" message={toastMessage} />
        </motion.div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{card.label}</p>
                  <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">{card.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/42">{card.detail}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/55">
                  <Icon size={18} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <article className="glass-panel rounded-[32px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Workspace essentials</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">What the shell should expose</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                Browser local
              </span>
            </div>

            <div className="mt-8 space-y-6">
              <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">Auto refresh cadence</p>
                  <p className="mt-1 text-xs font-mono text-white/40">Choose how frequently dashboard data refreshes while the workspace stays open.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[15000, 60000, 180000].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updatePreferences((current) => ({
                        ...current,
                        workspace: { ...current.workspace, refreshIntervalMs: value },
                      }))}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-semibold transition-colors',
                        preferences.workspace.refreshIntervalMs === value
                          ? 'border-realm-cyan bg-realm-cyan text-realm-black'
                          : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white',
                      )}
                    >
                      {value === 15000 ? 'Fast 15s' : value === 60000 ? 'Balanced 1m' : 'Light 3m'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="pr-6">
                  <p className="font-medium text-white">Hide point balances on shared screens</p>
                  <p className="mt-1 text-xs font-mono text-white/40">Mask balances in the shell and other shared surfaces on this browser.</p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePreferences((current) => ({
                    ...current,
                    workspace: { ...current.workspace, hidePointBalance: !current.workspace.hidePointBalance },
                  }))}
                  className={cn(
                    'h-6 w-12 rounded-full p-1 transition-colors duration-300',
                    preferences.workspace.hidePointBalance ? 'bg-realm-cyan' : 'bg-white/10',
                  )}
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full bg-white transition-transform duration-300',
                      preferences.workspace.hidePointBalance ? 'translate-x-6' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Alerts and privacy</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Keep the signal, mute the clutter</h2>
              </div>
              <ShieldCheck size={18} className="text-realm-cyan" />
            </div>

            <div className="mt-8 space-y-5">
              {[
                {
                  key: 'rewardAlerts',
                  title: 'Reward and payout alerts',
                  description: 'Surface credited balances, mining sync events, and successful claims.',
                },
                {
                  key: 'taskAlerts',
                  title: 'Task unlock reminders',
                  description: 'Highlight when profile or social actions become eligible.',
                },
                {
                  key: 'securityAlerts',
                  title: 'Identity and security notices',
                  description: 'Warn when recovery posture is weak or too few providers are linked.',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-b-0 last:pb-0">
                  <div className="pr-6">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs font-mono text-white/40">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePreferences((current) => ({
                      ...current,
                      notifications: {
                        ...current.notifications,
                        [item.key]: !current.notifications[item.key as keyof AppPreferences['notifications']],
                      },
                    }))}
                    className={cn(
                      'h-6 w-12 rounded-full p-1 transition-colors duration-300',
                      preferences.notifications[item.key as keyof AppPreferences['notifications']] ? 'bg-realm-cyan' : 'bg-white/10',
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full bg-white transition-transform duration-300',
                        preferences.notifications[item.key as keyof AppPreferences['notifications']] ? 'translate-x-6' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              ))}

              <div className="grid gap-4 pt-2 md:grid-cols-3">
                {[
                  { value: 'private', title: 'Private', detail: 'Only expose core account data inside direct profile access.' },
                  { value: 'network', title: 'Trusted network', detail: 'Allow moderate workspace visibility without exposing everything.' },
                  { value: 'public', title: 'Public', detail: 'Make the profile presentation more open and promotional.' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updatePreferences((current) => ({
                      ...current,
                      privacy: {
                        ...current.privacy,
                        profileVisibility: option.value as AppPreferences['privacy']['profileVisibility'],
                      },
                    }))}
                    className={cn(
                      'rounded-[24px] border p-4 text-left transition-colors',
                      preferences.privacy.profileVisibility === option.value
                        ? 'border-realm-cyan bg-realm-cyan/10'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25',
                    )}
                  >
                    <p className="font-semibold text-white">{option.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">{option.detail}</p>
                  </button>
                ))}
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-6">
          <article className="glass-panel rounded-[32px] p-6 sm:p-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Privacy defaults</p>
            <div className="mt-6 space-y-5">
              {[
                {
                  key: 'maskWalletAddress',
                  title: 'Mask wallet address by default',
                  description: 'Shorten wallet display outside dedicated transfer flows.',
                },
                {
                  key: 'showReferralCode',
                  title: 'Show referral code in profile',
                  description: 'Keep the referral code visible when you actively use the invite system.',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-b-0 last:pb-0">
                  <div className="pr-6">
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs font-mono text-white/40">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePreferences((current) => ({
                      ...current,
                      privacy: {
                        ...current.privacy,
                        [item.key]: !current.privacy[item.key as keyof Pick<AppPreferences['privacy'], 'maskWalletAddress' | 'showReferralCode'>],
                      },
                    }))}
                    className={cn(
                      'h-6 w-12 rounded-full p-1 transition-colors duration-300',
                      preferences.privacy[item.key as keyof Pick<AppPreferences['privacy'], 'maskWalletAddress' | 'showReferralCode'>] ? 'bg-realm-cyan' : 'bg-white/10',
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full bg-white transition-transform duration-300',
                        preferences.privacy[item.key as keyof Pick<AppPreferences['privacy'], 'maskWalletAddress' | 'showReferralCode'>] ? 'translate-x-6' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </article>

          <details className="glass-panel rounded-[32px] p-6 sm:p-8">
            <summary className="cursor-pointer list-none">
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Why these settings matter</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Minimal explanation, only when you need it</h3>
              <p className="mt-2 text-sm text-white/42">Expand this only if you want the trust and privacy reasoning behind the current choices.</p>
            </summary>

            <div className="mt-6 space-y-3">
              {trustNotes.map((note) => (
                <div key={note} className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4 text-sm leading-6 text-white/62">
                  {note}
                </div>
              ))}
            </div>
          </details>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                saveAppPreferences(preferences);
                notify('Preferences saved and applied to this browser workspace.');
              }}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-realm-black transition-colors hover:bg-realm-cyan"
            >
              Save settings
            </button>
            <button
              type="button"
              onClick={() => {
                setPreferences(DEFAULT_APP_PREFERENCES);
                saveAppPreferences(DEFAULT_APP_PREFERENCES);
                notify('Preferences reset to the trusted defaults.');
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/72 transition-colors hover:border-white/18 hover:text-white"
            >
              Reset to defaults
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}
