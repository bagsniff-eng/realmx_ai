import { Router } from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';
import { creditUserPoints } from './rewards.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

type TaskType = 'one-time' | 'daily';
type TaskCategory = 'connect' | 'community' | 'milestone' | 'daily';

type TaskDefinition = {
  id: string;
  type: TaskType;
  category: TaskCategory;
  title: string;
  description: string;
  reward: number;
  link?: string;
  actionType?: 'oauth' | 'external' | 'claim' | 'wallet';
  provider?: 'google' | 'twitter' | 'discord';
  cta?: string;
};

const TASK_DEFINITIONS: TaskDefinition[] = [
  { id: 'connect_google', type: 'one-time', category: 'connect', title: 'Connect Google', description: 'Attach your Google account so your dashboard identity is recoverable across devices.', reward: 10, actionType: 'oauth', provider: 'google', cta: 'Connect Google' },
  { id: 'connect_x', type: 'one-time', category: 'connect', title: 'Connect X', description: 'Link your X account so social tasks can be executed from your REALMxAI profile.', reward: 10, actionType: 'oauth', provider: 'twitter', cta: 'Connect X' },
  { id: 'connect_discord', type: 'one-time', category: 'connect', title: 'Connect Discord', description: 'Attach Discord to unlock community participation tasks and identity sync.', reward: 10, actionType: 'oauth', provider: 'discord', cta: 'Connect Discord' },
  { id: 'connect_wallet', type: 'one-time', category: 'connect', title: 'Connect Web3 Wallet', description: 'Link a wallet through SIWE authentication to secure ownership of your node.', reward: 15, actionType: 'wallet', cta: 'Open Wallet Connect' },
  { id: 'follow_x', type: 'one-time', category: 'community', title: 'Follow REALMxAI on X', description: 'Open the official X profile and follow the project for launch updates.', reward: 10, link: 'https://twitter.com/realmxai', actionType: 'external', cta: 'Open X' },
  { id: 'join_discord', type: 'one-time', category: 'community', title: 'Join Discord', description: 'Open the REALMxAI Discord invite and join the community server.', reward: 10, link: 'https://discord.gg/realmxai', actionType: 'external', cta: 'Join Discord' },
  { id: 'join_telegram', type: 'one-time', category: 'community', title: 'Join Telegram', description: 'Open the official Telegram channel and join the announcement feed.', reward: 10, link: 'https://t.me/REALMxAI', actionType: 'external', cta: 'Join Telegram' },
  { id: 'retweet_launch', type: 'one-time', category: 'community', title: 'Retweet Launch Post', description: 'Open the official X profile and repost the launch thread from your connected account.', reward: 15, link: 'https://twitter.com/realmxai', actionType: 'external', cta: 'Open Launch Post' },
  { id: 'signup_reward', type: 'one-time', category: 'milestone', title: 'Node Registration', description: 'Claim your account setup reward after signing in to the dashboard.', reward: 25, actionType: 'claim', cta: 'Claim Reward' },
  { id: 'complete_profile', type: 'one-time', category: 'milestone', title: 'Complete Your Profile', description: 'Add a display name and profile image to make your node identity complete.', reward: 15, actionType: 'claim', cta: 'Claim Reward' },
  { id: 'first_referral', type: 'one-time', category: 'milestone', title: 'Refer Your First Friend', description: 'Share your referral link and onboard one new user to the network.', reward: 20, actionType: 'claim', cta: 'Claim Reward' },
  { id: 'first_mine_session', type: 'one-time', category: 'milestone', title: 'First Mining Session', description: 'Complete your first mining session and sync the earned points.', reward: 30, actionType: 'claim', cta: 'Claim Reward' },
  { id: 'daily_checkin', type: 'daily', category: 'daily', title: 'Daily Check-In', description: 'Open the dashboard once per day to collect your check-in reward.', reward: 2, actionType: 'claim', cta: 'Check In' },
  { id: 'daily_mine', type: 'daily', category: 'daily', title: 'Run a Mining Session', description: 'Start or continue mining today, then claim the daily mining bonus.', reward: 5, actionType: 'claim', cta: 'Claim Daily Bonus' },
  { id: 'daily_share', type: 'daily', category: 'daily', title: 'Share on Social Media', description: 'Share your dashboard or referral link on social media today.', reward: 3, link: 'https://twitter.com/intent/tweet?text=Running%20my%20REALMxAI%20node%20today.%20Join%20me.', actionType: 'external', cta: 'Share Now' },
];

function getOauthPath(provider: TaskDefinition['provider']) {
  if (!provider) return null;
  return `/api/auth/${provider}`;
}

function getCompletionMap(completions: Array<{ taskId: string; completedAt: Date }>) {
  return new Map(completions.map((completion) => [completion.taskId, completion.completedAt]));
}

function isCompletedToday(date: Date | undefined) {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

function getTaskState(task: TaskDefinition, user: any, completionAt?: Date, stats?: { referralCount: number; minedToday: boolean; hasMinedOnce: boolean }) {
  const completed = task.type === 'daily' ? isCompletedToday(completionAt) : !!completionAt;
  let eligible = false;
  let blockedReason: string | null = null;
  let actionHref = task.link ?? null;
  let primaryAction = task.cta ?? 'Open Task';

  switch (task.id) {
    case 'connect_google':
      eligible = !!user?.email;
      actionHref = eligible ? null : getOauthPath('google');
      primaryAction = eligible ? 'Claim Reward' : 'Connect Google';
      break;
    case 'connect_x':
      eligible = !!user?.twitterId;
      actionHref = eligible ? null : getOauthPath('twitter');
      primaryAction = eligible ? 'Claim Reward' : 'Connect X';
      break;
    case 'connect_discord':
      eligible = !!user?.discordId;
      actionHref = eligible ? null : getOauthPath('discord');
      primaryAction = eligible ? 'Claim Reward' : 'Connect Discord';
      break;
    case 'connect_wallet':
      eligible = !!user?.walletAddress;
      primaryAction = eligible ? 'Claim Reward' : 'Open Wallet Connect';
      break;
    case 'follow_x':
    case 'retweet_launch':
      eligible = !!user?.twitterId;
      if (!eligible) {
        blockedReason = 'Connect X first to unlock this social task.';
        actionHref = getOauthPath('twitter');
        primaryAction = 'Connect X';
      }
      break;
    case 'join_discord':
      eligible = !!user?.discordId;
      if (!eligible) {
        blockedReason = 'Connect Discord first, then join the server.';
        actionHref = getOauthPath('discord');
        primaryAction = 'Connect Discord';
      }
      break;
    case 'join_telegram':
      eligible = true;
      break;
    case 'signup_reward':
      eligible = !!user;
      break;
    case 'complete_profile':
      eligible = !!(user?.name && user?.avatarUrl);
      if (!eligible) blockedReason = 'Add both a display name and a profile photo to claim this task.';
      break;
    case 'first_referral':
      eligible = (stats?.referralCount ?? 0) > 0;
      if (!eligible) blockedReason = 'Invite at least one user through your referral link.';
      break;
    case 'first_mine_session':
      eligible = !!stats?.hasMinedOnce;
      if (!eligible) blockedReason = 'Finish a mining session first, then claim this milestone.';
      break;
    case 'daily_checkin':
      eligible = !!user;
      break;
    case 'daily_mine':
      eligible = !!stats?.minedToday;
      if (!eligible) blockedReason = 'Start mining today before claiming this daily reward.';
      break;
    case 'daily_share':
      eligible = true;
      break;
    default:
      eligible = true;
  }

  return {
    ...task,
    completed,
    eligible,
    blockedReason,
    actionHref,
    primaryAction,
  };
}

router.get('/', async (req: any, res: any) => {
  try {
    if (!req.isAuthenticated()) {
      return res.json(
        TASK_DEFINITIONS.map((task) => ({
          ...task,
          completed: false,
          eligible: false,
          blockedReason: 'Sign in to execute and claim tasks.',
          actionHref: task.actionType === 'oauth' ? getOauthPath(task.provider) : task.link ?? null,
          primaryAction: task.cta ?? 'Open Task',
        })),
      );
    }

    const userId = req.user.id;
    const [completions, referralCount, minedTodayCount, minedSessionCount] = await Promise.all([
      prisma.taskCompletion.findMany({
        where: { userId },
      }),
      prisma.user.count({
        where: {
          referredById: userId,
          email: { not: null },
        },
      }),
      prisma.miningSession.count({
        where: {
          userId,
          startedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.miningSession.count({
        where: {
          userId,
          OR: [
            { pointsEarned: { gt: 0 } },
            { endedAt: { not: null } },
          ],
        },
      }),
    ]);

    const completionMap = getCompletionMap(completions as Array<{ taskId: string; completedAt: Date }>);
    const tasks = TASK_DEFINITIONS.map((task) =>
      getTaskState(task, req.user, completionMap.get(task.id), {
        referralCount,
        minedToday: minedTodayCount > 0,
        hasMinedOnce: minedSessionCount > 0,
      }),
    );

    res.json(tasks);
  } catch (error: any) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/complete', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.body;

    const task = TASK_DEFINITIONS.find((entry) => entry.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const [user, existing, referralCount, minedTodayCount, minedSessionCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.taskCompletion.findFirst({ where: { userId, taskId } }),
      prisma.user.count({
        where: {
          referredById: userId,
          email: { not: null },
        },
      }),
      prisma.miningSession.count({
        where: {
          userId,
          startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.miningSession.count({
        where: {
          userId,
          OR: [
            { pointsEarned: { gt: 0 } },
            { endedAt: { not: null } },
          ],
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const taskState = getTaskState(task, user, existing?.completedAt, {
      referralCount,
      minedToday: minedTodayCount > 0,
      hasMinedOnce: minedSessionCount > 0,
    });

    if (!taskState.eligible) {
      return res.status(400).json({ message: taskState.blockedReason || 'Task requirements are not met yet' });
    }

    if (existing) {
      if (task.type === 'daily') {
        if (isCompletedToday(existing.completedAt)) {
          return res.status(400).json({ message: 'Daily task already completed today' });
        }
        await prisma.taskCompletion.delete({ where: { id: existing.id } });
      } else {
        return res.status(400).json({ message: 'Task already completed' });
      }
    }

    await prisma.taskCompletion.create({
      data: { userId, taskId },
    });

    const rewardResult = await creditUserPoints(userId, task.reward);

    res.json({
      success: true,
      reward: rewardResult.credited,
      referralBonus: rewardResult.referralBonus,
      newBalance: rewardResult.newBalance,
    });
  } catch (error: any) {
    logger.error('Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
