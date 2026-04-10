import { useEffect, useState } from 'react';
import { Activity, ArrowRight, ChartColumn, ShieldCheck, Wallet, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { FeedbackBanner } from '@/components/app/feedback-banner';
import { MINING_RATE_PER_HOUR, MINING_RATE_PER_SEC, SESSION_DURATION } from '@/lib/mining';
import { getConnectedIdentityCount, getProfileSetupItems } from '@/lib/profile';
import { TASKS_FALLBACK, sortTasksForDisplay } from '@/lib/tasks';
import { cn } from '@/lib/utils';

type DashboardPageProps = {
  miningActive: boolean;
  sessionSecs: number;
  onToggleMining: () => void;
  onNavigate: (tab: 'wallet' | 'tasks' | 'profile' | 'mining' | 'referrals') => void;
  workspaceFeedback?: { type: 'success' | 'error' | 'info'; text: string } | null;
};

type NetworkStats = {
  totalUsers: number;
  activeSessions: number;
  totalPointsMined: number;
};

export default function DashboardPage({
  miningActive,
  sessionSecs,
  onToggleMining,
  onNavigate,
  workspaceFeedback,
}: DashboardPageProps) {
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalUsers: 0,
    activeSessions: 0,
    totalPointsMined: 0,
  });
  const [points, setPoints] = useState(0);
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | 'ALL'>('24H');
  const [chartData, setChartData] = useState<{ t: string; v: number }[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch('/api/wallet/balance-public', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPoints(data.balance);
        }
      } catch {}
    };

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/users/stats');
        if (res.ok) {
          setNetworkStats(await res.json());
        }
      } catch {}
    };

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setUser(await res.json());
        } else if (res.status === 401) {
          setUser(null);
        }
      } catch {}
    };

    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const nextTasks = Array.isArray(data) && data.length > 0 ? data : [...TASKS_FALLBACK];
          setTasks(sortTasksForDisplay(nextTasks));
        } else {
          setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
        }
      } catch {
        setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
      }
    };

    fetchPoints();
    fetchStats();
    fetchUser();
    fetchTasks();

    const timer = window.setInterval(fetchStats, 60_000);
    window.addEventListener('balance-updated', fetchPoints);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('balance-updated', fetchPoints);
    };
  }, []);

  useEffect(() => {
    const periodMap = { '24H': '24h', '7D': '7d', ALL: '30d' } as const;

    const fetchChart = async () => {
      try {
        const res = await fetch(`/api/mining/earnings?period=${periodMap[timeframe]}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setChartData(data.map((entry: any) => ({ t: entry.date.slice(5), v: entry.earned })));
        }
      } catch {
        setChartData([]);
      }
    };

    fetchChart();
  }, [timeframe]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const pendingRewards = sessionSecs * MINING_RATE_PER_SEC;
  const remainingSecs = Math.max(0, SESSION_DURATION - sessionSecs);
  const sessionCompletion = Math.min(100, Math.round((sessionSecs / SESSION_DURATION) * 100));
  const connectedAccounts = getConnectedIdentityCount(user);
  const profileSetupItems = getProfileSetupItems(user);
  const completedProfileChecks = profileSetupItems.filter((item) => item.complete).length;
  const profileCheckTotal = profileSetupItems.length;
  const readyTasks = tasks.filter((task) => !task.completed && task.eligible);
  const blockedTasks = tasks.filter((task) => !task.completed && !task.eligible);
  const projectedDaily = MINING_RATE_PER_HOUR * 24;
  const claimableSoon = readyTasks.slice(0, 4);
  const operatorLabel =
    user?.username
      ? `@${user.username}`
      : user?.name
        ? user.name
        : user?.email
          ? user.email.split('@')[0]
          : user?.walletAddress
            ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
            : 'Operator';

  const readinessRows = [
    {
      label: 'Profile setup',
      value: `${completedProfileChecks}/${profileCheckTotal}`,
      tone: completedProfileChecks === profileCheckTotal ? 'success' : 'info',
      detail:
        completedProfileChecks === profileCheckTotal
          ? 'Ready for claims and recovery.'
          : 'Complete the remaining identity steps.',
    },
    {
      label: 'Linked identities',
      value: `${connectedAccounts}/4`,
      tone: connectedAccounts >= 2 ? 'success' : 'error',
      detail:
        connectedAccounts >= 2
          ? 'Recovery posture is healthier.'
          : 'Add another identity for safer access recovery.',
    },
    {
      label: 'Ready missions',
      value: `${readyTasks.length}`,
      tone: readyTasks.length > 0 ? 'success' : 'info',
      detail:
        readyTasks.length > 0
          ? 'There are rewards ready to execute now.'
          : 'No instant claims are waiting right now.',
    },
  ] as const;

  const summaryCards = [
    { label: 'Wallet balance', value: points.toFixed(2), suffix: 'REALM', icon: Wallet },
    { label: 'Projected daily', value: projectedDaily.toFixed(0), suffix: 'REALM', icon: Zap },
    { label: 'Active sessions', value: networkStats.activeSessions.toLocaleString(), suffix: 'live', icon: Activity },
    { label: 'Tracked users', value: networkStats.totalUsers.toLocaleString(), suffix: 'nodes', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      {workspaceFeedback ? (
        <FeedbackBanner tone={workspaceFeedback.type} message={workspaceFeedback.text} title="Workspace update" />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">{card.value}</p>
                  <p className="mt-2 text-xs font-mono uppercase tracking-[0.18em] text-realm-cyan/80">{card.suffix}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/55">
                  <Icon size={18} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
        <article className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Session control</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                {miningActive ? 'Mining is live and earning.' : 'Your node is idle right now.'}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/48">
                {miningActive
                  ? `Session ${sessionCompletion}% complete with ${pendingRewards.toFixed(2)} REALM buffered so far.`
                  : 'Start a 6-hour session when you want the node contributing again.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                  {operatorLabel}
                </span>
                <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                  {miningActive ? 'Active session' : 'Standby'}
                </span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 lg:min-w-[250px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Current session</p>
              <p className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white">{formatDuration(sessionSecs)}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
                <div className="h-full rounded-full bg-realm-cyan transition-all duration-500" style={{ width: `${sessionCompletion}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-white/35">
                <span>{sessionCompletion}% complete</span>
                <span>{formatDuration(remainingSecs)} left</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Pending payout</p>
              <p className="mt-3 text-2xl font-semibold text-white">{pendingRewards.toFixed(2)}</p>
              <p className="mt-1 text-xs text-white/35">REALM in the current session</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Mining rate</p>
              <p className="mt-3 text-2xl font-semibold text-realm-cyan">{MINING_RATE_PER_HOUR}</p>
              <p className="mt-1 text-xs text-white/35">REALM per hour</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Reward window</p>
              <p className="mt-3 text-2xl font-semibold text-white">{remainingSecs > 0 ? formatDuration(remainingSecs) : 'Closed'}</p>
              <p className="mt-1 text-xs text-white/35">Remaining time in this run</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onToggleMining}
              className={cn(
                'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                miningActive
                  ? 'border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15'
                  : 'bg-white text-realm-black hover:bg-realm-cyan',
              )}
            >
              {miningActive ? 'Stop current session' : 'Start a 6-hour session'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('wallet')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/72 hover:border-white/18 hover:text-white"
            >
              Open wallet <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="glass-panel rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Priority queue</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">What to do next</h2>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-right">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">Ready now</p>
                <p className="mt-2 text-2xl font-semibold text-white">{readyTasks.length}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {(claimableSoon.length > 0 ? claimableSoon : blockedTasks.slice(0, 3)).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    if (task.category === 'connect' || task.id === 'complete_profile' || task.id === 'connect_wallet') {
                      onNavigate('profile');
                      return;
                    }
                    if (task.id === 'first_referral') {
                      onNavigate('referrals');
                      return;
                    }
                    if (task.id === 'first_mine_session' || task.id === 'daily_mine') {
                      onNavigate('mining');
                      return;
                    }
                    onNavigate('tasks');
                  }}
                  className="w-full rounded-[24px] border border-white/8 bg-white/[0.02] p-4 text-left transition-colors hover:border-realm-cyan/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{task.title}</p>
                      <p className="mt-2 text-xs leading-5 text-white/45">
                        {task.eligible ? `+${task.reward} REALM ready to claim.` : task.blockedReason || 'Needs another step before it becomes available.'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="mt-1 shrink-0 text-white/30" />
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="mt-5 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/72 hover:border-white/18 hover:text-white"
            >
              Open task control room
            </button>
          </article>

          <article className="glass-panel rounded-[32px] p-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Readiness</p>
            <div className="mt-5 space-y-3">
              {readinessRows.map((row) => (
                <div key={row.label} className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">{row.label}</p>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]',
                        row.tone === 'success'
                          ? 'bg-realm-cyan/10 text-realm-cyan'
                          : row.tone === 'error'
                            ? 'bg-red-400/10 text-red-200'
                            : 'bg-white/5 text-white/45',
                      )}
                    >
                      {row.value}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/40">{row.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Reward insight</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Network and payout trend</h2>
            </div>
            <div className="flex gap-2">
              {(['24H', '7D', 'ALL'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTimeframe(option)}
                  className={cn(
                    'rounded-full border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors',
                    timeframe === option
                      ? 'border-realm-cyan/30 bg-realm-cyan/10 text-realm-cyan'
                      : 'border-white/8 bg-white/[0.02] text-white/42 hover:text-white/72',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [{ t: 'Now', v: 0 }]}>
                <CartesianGrid strokeDasharray="3 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Area type="monotone" dataKey="v" stroke="#8be9dd" fill="#8be9dd" fillOpacity={0.12} strokeWidth={1.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Points tracked</p>
              <p className="mt-3 text-xl font-semibold text-white">{networkStats.totalPointsMined.toFixed(1)}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Active miners</p>
              <p className="mt-3 text-xl font-semibold text-white">{networkStats.activeSessions.toLocaleString()}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Chart mode</p>
              <p className="mt-3 text-xl font-semibold text-realm-cyan">{timeframe}</p>
            </div>
          </div>
        </article>

        <article className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/60">
              <ChartColumn size={18} />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">Activity pulse</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Minimal operator feed</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              miningActive
                ? `Mining session live with ${pendingRewards.toFixed(2)} REALM pending.`
                : 'Node is idle. Restart a session whenever you want to resume contribution.',
              completedProfileChecks === profileCheckTotal
                ? 'Profile setup is complete and ready for reward flows.'
                : `${profileCheckTotal - completedProfileChecks} profile steps still need attention.`,
              readyTasks.length > 0
                ? `${readyTasks.length} missions are ready to execute now.`
                : 'No instant missions are unlocked right now.',
            ].map((line) => (
              <div key={line} className="rounded-[24px] border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/58">
                {line}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/72 hover:border-white/18 hover:text-white"
            >
              Review profile
            </button>
            <button
              type="button"
              onClick={() => onNavigate('mining')}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/72 hover:border-white/18 hover:text-white"
            >
              Open mining
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
