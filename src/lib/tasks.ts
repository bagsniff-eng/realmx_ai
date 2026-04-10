export type TaskCategory = 'connect' | 'milestone' | 'community' | 'daily';
export type TaskType = 'one-time' | 'daily';
export type TaskActionType = 'oauth' | 'wallet' | 'external' | 'claim';

export type AppTask = {
  id: string;
  type: TaskType;
  category: TaskCategory;
  title: string;
  description: string;
  reward: number;
  actionType: TaskActionType;
  primaryAction: string;
  actionHref?: string;
  completed: boolean;
  eligible: boolean;
  blockedReason: string | null;
};

export const TASKS_FALLBACK: readonly AppTask[] = [
  {
    id: 'connect_google',
    type: 'one-time',
    category: 'connect',
    title: 'Connect Google',
    description: 'Attach your Google account so your dashboard identity is recoverable across devices.',
    reward: 10,
    actionType: 'oauth',
    actionHref: '/api/auth/google',
    primaryAction: 'Connect Google',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'connect_x',
    type: 'one-time',
    category: 'connect',
    title: 'Connect X',
    description: 'Link your X account so social tasks can be executed from your REALMxAI profile.',
    reward: 10,
    actionType: 'oauth',
    actionHref: '/api/auth/twitter',
    primaryAction: 'Connect X',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'connect_discord',
    type: 'one-time',
    category: 'connect',
    title: 'Connect Discord',
    description: 'Attach Discord to unlock community participation tasks and identity sync.',
    reward: 10,
    actionType: 'oauth',
    actionHref: '/api/auth/discord',
    primaryAction: 'Connect Discord',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'connect_wallet',
    type: 'one-time',
    category: 'connect',
    title: 'Connect Web3 Wallet',
    description: 'Link a wallet through SIWE authentication to secure ownership of your node.',
    reward: 15,
    actionType: 'wallet',
    primaryAction: 'Open Wallet Connect',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'follow_x',
    type: 'one-time',
    category: 'community',
    title: 'Follow REALMxAI on X',
    description: 'Open the official X profile and follow the project for launch updates.',
    reward: 10,
    actionType: 'external',
    actionHref: 'https://twitter.com/realmxai',
    primaryAction: 'Open X',
    completed: false,
    eligible: false,
    blockedReason: 'Connect X first to unlock this social task.',
  },
  {
    id: 'join_discord',
    type: 'one-time',
    category: 'community',
    title: 'Join Discord',
    description: 'Open the REALMxAI Discord invite and join the community server.',
    reward: 10,
    actionType: 'external',
    actionHref: 'https://discord.gg/realmxai',
    primaryAction: 'Join Discord',
    completed: false,
    eligible: false,
    blockedReason: 'Connect Discord first, then join the server.',
  },
  {
    id: 'join_telegram',
    type: 'one-time',
    category: 'community',
    title: 'Join Telegram',
    description: 'Open the official Telegram channel and join the announcement feed.',
    reward: 10,
    actionType: 'external',
    actionHref: 'https://t.me/REALMxAI',
    primaryAction: 'Join Telegram',
    completed: false,
    eligible: true,
    blockedReason: null,
  },
  {
    id: 'retweet_launch',
    type: 'one-time',
    category: 'community',
    title: 'Retweet Launch Post',
    description: 'Open the official X profile and repost the launch thread from your connected account.',
    reward: 15,
    actionType: 'external',
    actionHref: 'https://twitter.com/realmxai',
    primaryAction: 'Open Launch Post',
    completed: false,
    eligible: false,
    blockedReason: 'Connect X first to unlock this social task.',
  },
  {
    id: 'signup_reward',
    type: 'one-time',
    category: 'milestone',
    title: 'Node Registration',
    description: 'Claim your account setup reward after signing in to the dashboard.',
    reward: 25,
    actionType: 'claim',
    primaryAction: 'Claim Reward',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'complete_profile',
    type: 'one-time',
    category: 'milestone',
    title: 'Complete Your Profile',
    description: 'Add a display name and profile image to make your node identity complete.',
    reward: 15,
    actionType: 'claim',
    primaryAction: 'Claim Reward',
    completed: false,
    eligible: false,
    blockedReason: 'Add both a display name and a profile photo to claim this task.',
  },
  {
    id: 'first_referral',
    type: 'one-time',
    category: 'milestone',
    title: 'Refer Your First Friend',
    description: 'Share your referral link and onboard one new user to the network.',
    reward: 20,
    actionType: 'claim',
    primaryAction: 'Claim Reward',
    completed: false,
    eligible: false,
    blockedReason: 'Invite at least one user through your referral link.',
  },
  {
    id: 'first_mine_session',
    type: 'one-time',
    category: 'milestone',
    title: 'First Mining Session',
    description: 'Complete your first mining session and sync the earned points.',
    reward: 30,
    actionType: 'claim',
    primaryAction: 'Claim Reward',
    completed: false,
    eligible: false,
    blockedReason: 'Finish a mining session first, then claim this milestone.',
  },
  {
    id: 'daily_checkin',
    type: 'daily',
    category: 'daily',
    title: 'Daily Check-In',
    description: 'Open the dashboard once per day to collect your check-in reward.',
    reward: 2,
    actionType: 'claim',
    primaryAction: 'Check In',
    completed: false,
    eligible: false,
    blockedReason: 'Sign in to execute and claim tasks.',
  },
  {
    id: 'daily_mine',
    type: 'daily',
    category: 'daily',
    title: 'Run a Mining Session',
    description: 'Start or continue mining today, then claim the daily mining bonus.',
    reward: 5,
    actionType: 'claim',
    primaryAction: 'Claim Daily Bonus',
    completed: false,
    eligible: false,
    blockedReason: 'Start mining today before claiming this daily reward.',
  },
  {
    id: 'daily_share',
    type: 'daily',
    category: 'daily',
    title: 'Share on Social Media',
    description: 'Share your dashboard or referral link on social media today.',
    reward: 3,
    actionType: 'external',
    actionHref: 'https://twitter.com/intent/tweet?text=Running%20my%20REALMxAI%20node%20today.%20Join%20me.',
    primaryAction: 'Share Now',
    completed: false,
    eligible: true,
    blockedReason: null,
  },
] as const;

export const TASK_CATEGORY_ORDER: readonly TaskCategory[] = [
  'connect',
  'milestone',
  'community',
  'daily',
];

function getTaskPriority(task: Pick<AppTask, 'completed' | 'eligible' | 'category'>) {
  if (task.completed) return 3;
  if (task.eligible) return 0;
  if (task.category === 'connect' || task.category === 'milestone') return 1;
  return 2;
}

export function sortTasksForDisplay<T extends Pick<AppTask, 'id' | 'title' | 'category' | 'completed' | 'eligible'>>(
  tasks: T[],
) {
  return [...tasks].sort((left, right) => {
    const categoryDelta =
      TASK_CATEGORY_ORDER.indexOf(left.category as TaskCategory) -
      TASK_CATEGORY_ORDER.indexOf(right.category as TaskCategory);

    if (categoryDelta !== 0) {
      return categoryDelta;
    }

    const priorityDelta = getTaskPriority(left) - getTaskPriority(right);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return String(left.title || left.id).localeCompare(String(right.title || right.id));
  });
}
