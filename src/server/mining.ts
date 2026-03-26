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

const SESSION_DURATION = 6 * 3600; // 6 hours
const MINING_RATE_PER_HOUR = 10;

// Start mining session
router.post('/start', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    // End any existing active session first
    const active = await prisma.miningSession.findFirst({
        where: { userId, isActive: true }
    });

    if (active) {
      // Close stale session
      await prisma.miningSession.update({
        where: { id: active.id },
        data: { isActive: false, endedAt: new Date() }
      });
    }

    const session = await prisma.miningSession.create({
      data: {
        userId,
        isActive: true,
      }
    });

    res.json(session);
  } catch (error: any) {
    logger.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync points to distribute — called periodically and on stop
router.post('/sync', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { sessionSeconds, stopMining } = req.body;

    const active = await prisma.miningSession.findFirst({
      where: { userId, isActive: true }
    });

    if (!active) {
      // No active session — if stopMining is true, just return success
      if (stopMining) return res.json({ success: true, earned: 0, sessionEnded: true });
      return res.status(400).json({ message: 'No active session' });
    }

    // Calculate new earnings based on total session seconds reported
    const totalEarned = Math.min(
      (sessionSeconds / 3600) * MINING_RATE_PER_HOUR,
      (SESSION_DURATION / 3600) * MINING_RATE_PER_HOUR // cap at max session reward (60 REALM)
    );
    const newlyEarned = Math.max(0, totalEarned - active.pointsEarned);
    
    // Check if session has ended (6 hours or user stopped)
    const isEnding = stopMining || sessionSeconds >= SESSION_DURATION;

    if (newlyEarned > 0 || isEnding) {
      await prisma.$transaction([
        // Credit points to user balance
        prisma.user.update({
          where: { id: userId },
          data: { points: { increment: newlyEarned } }
        }),
        // Update mining session record
        prisma.miningSession.update({
          where: { id: active.id },
          data: { 
            pointsEarned: totalEarned,
            isActive: !isEnding,
            endedAt: isEnding ? new Date() : null
          }
        })
      ]);
    }

    // Fetch updated user balance
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });

    res.json({ 
      success: true, 
      earned: newlyEarned, 
      totalSessionEarned: totalEarned,
      newBalance: updatedUser?.points || 0,
      sessionEnded: isEnding 
    });
  } catch (error: any) {
    logger.error('Error syncing points:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get session history
router.get('/history', isAuthenticated, async (req: any, res: any) => {
    try {
        const userId = req.user.id;
        const sessions = await prisma.miningSession.findMany({
            where: { userId },
            orderBy: { startedAt: 'desc' },
            take: 10
        });
        res.json(sessions);
    } catch (error: any) {
        logger.error('Error fetching history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get earnings chart data — returns daily point earnings for the user
router.get('/earnings', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { period } = req.query; // '24h', '7d', '30d'

    let daysBack = 7;
    if (period === '24h') daysBack = 1;
    else if (period === '30d') daysBack = 30;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const sessions = await prisma.miningSession.findMany({
      where: {
        userId,
        startedAt: { gte: since }
      },
      orderBy: { startedAt: 'asc' }
    });

    // Aggregate by day
    const dailyMap: Record<string, number> = {};
    sessions.forEach((s: any) => {
      const day = s.startedAt.toISOString().split('T')[0];
      dailyMap[day] = (dailyMap[day] || 0) + s.pointsEarned;
    });

    // Fill gaps with 0
    const data: { date: string; earned: number }[] = [];
    const cursor = new Date(since);
    while (cursor <= new Date()) {
      const key = cursor.toISOString().split('T')[0];
      data.push({ date: key, earned: dailyMap[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json(data);
  } catch (error: any) {
    logger.error('Error fetching earnings:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
