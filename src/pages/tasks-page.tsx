import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Trophy, Zap } from 'lucide-react';
import { motion } from 'motion/react';

import { FeedbackBanner } from '@/components/app/feedback-banner';
import { TASKS_FALLBACK, TASK_CATEGORY_ORDER, sortTasksForDisplay } from '@/lib/tasks';
import { cn } from '@/lib/utils';

type TasksPageProps = {
  onNavigate: (tab: 'profile' | 'referrals' | 'mining') => void;
};

const categoryLabels: Record<string, string> = {
  connect: 'Connect',
  milestone: 'Milestones',
  community: 'Community',
  daily: 'Daily',
};

export default function TasksPage({ onNavigate }: TasksPageProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTasks = async () => {
    try {
      const [taskRes, userRes] = await Promise.all([
        fetch('/api/tasks', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);

      if (taskRes.ok) {
        const data = await taskRes.json();
        const nextTasks = Array.isArray(data) && data.length > 0 ? data : [...TASKS_FALLBACK];
        setTasks(sortTasksForDisplay(nextTasks));
      } else {
        setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
      }

      if (userRes.ok) {
        setUser(await userRes.json());
      } else if (userRes.status === 401) {
        setUser(null);
      }
    } catch {
      setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
      setFeedback({ type: 'error', text: 'Task API failed, so fallback tasks are being shown.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completeTask = async (task: any) => {
    const res = await fetch('/api/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id }),
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Unable to complete task');
    }

    window.dispatchEvent(new Event('balance-updated'));
    const referralBonus = data.referralBonus ? ` and +${Number(data.referralBonus).toFixed(2)} referral bonus` : '';
    setFeedback({
      type: 'success',
      text: `${task.title} completed. +${Number(data.reward || task.reward).toFixed(2)} REALM credited${referralBonus}.`,
    });
    await fetchTasks();
  };

  const handleTask = async (task: any) => {
    if (task.completed || processingTaskId) {
      return;
    }

    setFeedback(null);
    setProcessingTaskId(task.id);

    try {
      if (task.actionType === 'oauth' && task.actionHref) {
        const returnTo = encodeURIComponent('/?tab=tasks');
        window.location.href = `${task.actionHref}?returnTo=${returnTo}`;
        return;
      }

      if (task.actionType === 'wallet') {
        onNavigate('profile');
        setFeedback({ type: 'error', text: 'Open profile and connect your wallet from the identity section.' });
        return;
      }

      if (!task.eligible && task.blockedReason) {
        throw new Error(task.blockedReason);
      }

      if (task.actionHref) {
        window.open(task.actionHref, '_blank', 'noopener,noreferrer');
      }

      await completeTask(task);
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Task execution failed.' });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const openRequirement = (task: any) => {
    if (task.id === 'complete_profile' || task.id === 'connect_wallet') {
      onNavigate('profile');
      return;
    }

    if (task.id === 'first_referral') {
      onNavigate('referrals');
      return;
    }

    if (task.id === 'first_mine_session' || task.id === 'daily_mine') {
      onNavigate('mining');
    }
  };

  const completed = tasks.filter((task) => task.completed).length;
  const totalReward = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.reward, 0);
  const readyToClaim = tasks.filter((task) => !task.completed && task.eligible).length;
  const visibleTasks = sortTasksForDisplay(
    tasks.filter((task) => activeFilter === 'all' || task.category === activeFilter),
  );

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'connect', label: 'Connect' },
    { id: 'community', label: 'Community' },
    { id: 'daily', label: 'Daily' },
    { id: 'milestone', label: 'Milestones' },
  ];

  const groupedTasks = visibleTasks.reduce((groups: Record<string, any[]>, task: any) => {
    const key = task.category || 'other';
    groups[key] = groups[key] || [];
    groups[key].push(task);
    return groups;
  }, {});

  const visibleGroups = activeFilter === 'all'
    ? TASK_CATEGORY_ORDER.filter((category) => groupedTasks[category]?.length)
    : [activeFilter].filter((category) => groupedTasks[category]?.length);

  return (
    <div className="space-y-6 lg:space-y-8">
      {feedback ? <FeedbackBanner tone={feedback.type} message={feedback.text} title="Task update" /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Ready to claim', value: loading ? '...' : `${readyToClaim}`, icon: Zap, accent: true },
          { label: 'Completed', value: loading ? '...' : `${completed}`, icon: ShieldCheck },
          { label: 'Rewards earned', value: loading ? '...' : `${totalReward}`, icon: Trophy },
          { label: 'Signed in as', value: user ? (user.name || user.username || user.email || 'Active node') : 'Guest', icon: Activity, text: true },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className="glass-panel rounded-[28px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{card.label}</p>
                  <p className={cn(
                    'mt-4 text-3xl font-semibold tracking-[-0.03em] text-white',
                    card.accent ? 'text-realm-cyan' : '',
                    card.text ? 'text-lg tracking-normal' : '',
                  )}>
                    {card.value}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/55">
                  <Icon size={18} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="glass-panel rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/35">Task control room</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Rewards only show up when the real requirement is satisfied.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/48">
              Connect accounts, execute external actions, and claim points with blocked-state guidance instead of guesswork.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors',
                  activeFilter === filter.id
                    ? 'border-realm-cyan/30 bg-realm-cyan/10 text-realm-cyan'
                    : 'border-white/8 bg-white/[0.02] text-white/45 hover:border-white/15 hover:text-white/75',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {loading ? (
            <div className="glass-panel flex h-56 items-center justify-center rounded-[32px]">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-cyan border-t-transparent" />
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="glass-panel rounded-[32px] p-10 text-center">
              <Activity size={42} className="mx-auto text-white/15" />
              <p className="mt-4 text-sm text-white/45">No tasks match this filter.</p>
            </div>
          ) : (
            visibleGroups.map((groupKey) => (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-mono uppercase tracking-[0.28em] text-white/40">{categoryLabels[groupKey] || groupKey}</h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">
                    {groupedTasks[groupKey].length} task{groupedTasks[groupKey].length === 1 ? '' : 's'}
                  </span>
                </div>

                {groupedTasks[groupKey].map((task: any, index: number) => (
                  <motion.article
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      'glass-panel rounded-[30px] p-5 sm:p-6',
                      task.completed ? 'border-realm-cyan/15 bg-realm-cyan/[0.03]' : 'hover:border-white/12',
                    )}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
                              {task.category}
                            </span>
                            <span
                              className={cn(
                                'rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em]',
                                task.completed
                                  ? 'border-realm-cyan/20 bg-realm-cyan/10 text-realm-cyan'
                                  : task.eligible
                                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                    : 'border-white/8 bg-white/[0.03] text-white/45',
                              )}
                            >
                              {task.completed ? 'Completed' : task.eligible ? 'Ready' : 'Blocked'}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/28">
                              {task.type === 'daily' ? 'Daily' : 'One-time'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold tracking-tight text-white">{task.title}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{task.description}</p>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-realm-cyan/15 bg-realm-cyan/[0.04] px-4 py-3 text-left lg:min-w-[130px] lg:text-right">
                          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Reward</p>
                          <p className="mt-2 font-luciana text-2xl text-realm-cyan">+{task.reward}</p>
                        </div>
                      </div>

                      {!task.completed && task.blockedReason ? (
                        <div className="rounded-[24px] border border-amber-300/10 bg-amber-300/[0.05] px-4 py-3 text-sm leading-6 text-amber-100/82">
                          {task.blockedReason}
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <div className="text-xs font-mono uppercase tracking-[0.18em] text-white/30">
                          {task.completed ? 'Reward synchronized' : task.eligible ? 'Execution available now' : 'Resolve prerequisite first'}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {!task.completed &&
                          !task.eligible &&
                          ['complete_profile', 'connect_wallet', 'first_referral', 'first_mine_session', 'daily_mine'].includes(task.id) ? (
                            <button
                              type="button"
                              onClick={() => openRequirement(task)}
                              className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white"
                            >
                              Open requirement
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleTask(task)}
                            disabled={task.completed || processingTaskId === task.id}
                            className={cn(
                              'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-xs font-bold transition-all',
                              task.completed
                                ? 'cursor-default border border-realm-cyan/20 bg-realm-cyan/5 text-realm-cyan'
                                : 'bg-white text-realm-black hover:bg-realm-cyan disabled:opacity-70',
                            )}
                          >
                            {task.completed ? 'Completed' : processingTaskId === task.id ? 'Working...' : task.primaryAction || 'Execute'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            ))
          )}
        </div>

        <aside className="space-y-5">
          <article className="glass-panel rounded-[32px] p-6 sm:p-8">
            <h3 className="font-munich text-3xl text-white">mission progress</h3>
            <div className="mt-8 flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/8">
                <div className="absolute inset-3 rounded-full border border-realm-cyan/20" />
                <div className="text-center">
                  <p className="font-luciana text-4xl text-white">{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</p>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/35">Completion</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-white/6 pt-6">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-white/40">
                <span>Claimable now</span>
                <span className="text-realm-cyan">{readyToClaim}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-white/40">
                <span>Community tasks</span>
                <span>{tasks.filter((task) => task.category === 'community').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-white/40">
                <span>Daily tasks</span>
                <span>{tasks.filter((task) => task.category === 'daily').length}</span>
              </div>
            </div>
          </article>

          <article className="glass-panel rounded-[32px] border-realm-cyan/20 bg-gradient-to-br from-realm-cyan/[0.09] to-transparent p-6 sm:p-8">
            <Zap size={18} className="text-realm-cyan" />
            <h4 className="mt-4 text-lg font-semibold text-white">How execution works</h4>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Connect tasks launch the correct OAuth flow, community tasks open the external destination and then claim, and blocked tasks explain exactly what is missing.
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
