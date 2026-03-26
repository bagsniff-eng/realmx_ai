import { Router } from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

// Hardcoded task definitions (no DB, just completion is tracked)
const TASK_DEFINITIONS = [
  // --- One-time social tasks ---
  { id: 'follow_x', type: 'one-time', title: 'Follow REALMxAI on X', description: 'Follow our official X (Twitter) account and stay updated.', reward: 10, link: 'https://twitter.com/realmxai', icon: 'Twitter' },
  { id: 'join_discord', type: 'one-time', title: 'Join our Discord', description: 'Join the REALMxAI Discord community server.', reward: 10, link: 'https://discord.gg/realmxai', icon: 'Discord' },
  { id: 'join_telegram', type: 'one-time', title: 'Join Telegram Channel', description: 'Join the official REALMxAI Telegram announcement channel.', reward: 10, link: 'https://t.me/REALMxAI', icon: 'MessageCircle' },
  { id: 'retweet_launch', type: 'one-time', title: 'Retweet Launch Post', description: 'Retweet the official REALMxAI launch announcement.', reward: 15, link: 'https://twitter.com/realmxai', icon: 'Twitter' },
  { id: 'signup_reward', type: 'one-time', title: 'Node Registration', description: 'Complete your node registration (you\'ve already done this!)', reward: 25, icon: 'ShieldCheck' },
  // --- One-time milestone tasks ---
  { id: 'complete_profile', type: 'one-time', title: 'Complete Your Profile', description: 'Set a display name and profile image to earn bonus points.', reward: 15, icon: 'User' },
  { id: 'first_referral', type: 'one-time', title: 'Refer Your First Friend', description: 'Share your referral code and get 1 person to join REALMxAI.', reward: 20, icon: 'Users' },
  { id: 'connect_wallet', type: 'one-time', title: 'Connect Web3 Wallet', description: 'Link a Web3 wallet to your account via SIWE authentication.', reward: 15, icon: 'Wallet' },
  { id: 'first_mine_session', type: 'one-time', title: 'First Mining Session', description: 'Complete your first full 6-hour mining session.', reward: 30, icon: 'Pickaxe' },
  // --- Daily tasks ---
  { id: 'daily_checkin', type: 'daily', title: 'Daily Check-In', description: 'Visit the dashboard daily to earn check-in rewards.', reward: 2, icon: 'Calendar' },
  { id: 'daily_mine', type: 'daily', title: 'Run a Mining Session', description: 'Start a mining session today to contribute to the network.', reward: 5, icon: 'Pickaxe' },
  { id: 'daily_share', type: 'daily', title: 'Share on Social Media', description: 'Share your mining stats or referral link on any social platform.', reward: 3, icon: 'Share2' },
];

// GET /api/tasks — returns all tasks with completion status for current user (or public if unauthenticated)
router.get('/', async (req: any, res: any) => {
  try {
    if (!req.isAuthenticated()) {
      return res.json(TASK_DEFINITIONS.map(task => ({ ...task, completed: false })));
    }

    const userId = req.user.id;
    const completions = await prisma.taskCompletion.findMany({
      where: { userId }
    });
    const completedIds = new Set(completions.map((c: any) => c.taskId));

    const tasks = TASK_DEFINITIONS.map(task => ({
      ...task,
      completed: completedIds.has(task.id),
    }));

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

    const task = TASK_DEFINITIONS.find((t: any) => t.id === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (taskId === 'follow_x' || taskId === 'retweet_launch') {
       if (!user.twitterId) return res.status(400).json({ message: 'Please connect your X (Twitter) account first' });
    }
    if (taskId === 'join_discord') {
       if (!user.discordId) return res.status(400).json({ message: 'Please connect your Discord account first' });
    }

    // Check if already completed (all tasks are one-time for now, daily re-enables each day)
    const existing = await prisma.taskCompletion.findFirst({
      where: { userId, taskId }
    });

    if (existing) {
      // For daily tasks, check if it was completed today
      if (task.type === 'daily') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (existing.completedAt >= today) {
          return res.status(400).json({ message: 'Daily task already completed today' });
        }
        // Allow re-completion by deleting old record
        await prisma.taskCompletion.delete({ where: { id: existing.id } });
      } else {
        return res.status(400).json({ message: 'Task already completed' });
      }
    }

    // Create completion record and award points atomically
    await prisma.$transaction([
      prisma.taskCompletion.create({
        data: { userId, taskId }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: task.reward } }
      })
    ]);

    res.json({ success: true, reward: task.reward });
  } catch (error: any) {
    logger.error('Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
