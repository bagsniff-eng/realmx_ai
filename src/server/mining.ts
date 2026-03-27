import { Router } from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';
import { creditUserPoints, normalizePoints } from './rewards.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
};

const SESSION_DURATION = 6 * 3600;
const MINING_RATE_PER_HOUR = 10;

router.get('/status', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const active = await prisma.miningSession.findFirst({
      where: { userId, isActive: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!active) {
      return res.json({
        active: false,
        sessionSeconds: 0,
        pointsEarned: 0,
        startedAt: null,
        sessionDuration: SESSION_DURATION,
        miningRatePerHour: MINING_RATE_PER_HOUR,
      });
    }

    const elapsedSeconds = Math.max(
      0,
      Math.min(SESSION_DURATION, Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000)),
    );

    const totalEarned = normalizePoints((elapsedSeconds / 3600) * MINING_RATE_PER_HOUR);
    const sessionEnded = elapsedSeconds >= SESSION_DURATION;

    if (sessionEnded) {
      const newlyEarned = normalizePoints(Math.max(0, totalEarned - normalizePoints(active.pointsEarned)));

      if (newlyEarned > 0) {
        await creditUserPoints(userId, newlyEarned);
      }

      const endedSession = await prisma.miningSession.update({
        where: { id: active.id },
        data: {
          pointsEarned: totalEarned,
          isActive: false,
          endedAt: new Date(),
        },
      });

      return res.json({
        active: false,
        sessionSeconds: SESSION_DURATION,
        pointsEarned: endedSession.pointsEarned,
        startedAt: endedSession.startedAt,
        sessionDuration: SESSION_DURATION,
        miningRatePerHour: MINING_RATE_PER_HOUR,
      });
    }

    res.json({
      active: true,
      sessionSeconds: elapsedSeconds,
      pointsEarned: totalEarned,
      startedAt: active.startedAt,
      sessionDuration: SESSION_DURATION,
      miningRatePerHour: MINING_RATE_PER_HOUR,
    });
  } catch (error: any) {
    logger.error('Error fetching mining status:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/start', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const active = await prisma.miningSession.findFirst({
      where: { userId, isActive: true },
    });

    if (active) {
      await prisma.miningSession.update({
        where: { id: active.id },
        data: { isActive: false, endedAt: new Date() },
      });
    }

    const session = await prisma.miningSession.create({
      data: {
        userId,
        isActive: true,
      },
    });

    res.json(session);
  } catch (error: any) {
    logger.error('Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const reportedSessionSeconds = Number(req.body?.sessionSeconds);
    const stopMining = Boolean(req.body?.stopMining);

    const active = await prisma.miningSession.findFirst({
      where: { userId, isActive: true },
    });

    if (!active) {
      if (stopMining) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { points: true },
        });
        return res.json({
          success: true,
          earned: 0,
          referralBonus: 0,
          totalSessionEarned: 0,
          newBalance: user?.points || 0,
          elapsedSeconds: 0,
          sessionEnded: true,
        });
      }

      return res.status(400).json({ message: 'No active session' });
    }

    const elapsedSeconds = Math.max(
      0,
      Math.min(
        SESSION_DURATION,
        Number.isFinite(reportedSessionSeconds)
          ? Math.floor(reportedSessionSeconds)
          : Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000),
      ),
    );

    const totalEarned = normalizePoints((elapsedSeconds / 3600) * MINING_RATE_PER_HOUR);
    const previouslyCredited = normalizePoints(active.pointsEarned);
    const newlyEarned = normalizePoints(Math.max(0, totalEarned - previouslyCredited));
    const isEnding = stopMining || elapsedSeconds >= SESSION_DURATION;

    let rewardResult = {
      credited: 0,
      referralBonus: 0,
      newBalance: req.user.points || 0,
    };

    if (newlyEarned > 0) {
      rewardResult = await creditUserPoints(userId, newlyEarned);
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });
      rewardResult.newBalance = user?.points || 0;
    }

    await prisma.miningSession.update({
      where: { id: active.id },
      data: {
        pointsEarned: totalEarned,
        isActive: !isEnding,
        endedAt: isEnding ? new Date() : null,
      },
    });

    res.json({
      success: true,
      earned: rewardResult.credited,
      referralBonus: rewardResult.referralBonus,
      totalSessionEarned: totalEarned,
      newBalance: rewardResult.newBalance,
      elapsedSeconds,
      sessionEnded: isEnding,
    });
  } catch (error: any) {
    logger.error('Error syncing points:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const sessions = await prisma.miningSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    });

    res.json(
      sessions.map((session) => ({
        ...session,
        duration: Math.max(
          0,
          Math.floor(((session.endedAt || new Date()).getTime() - session.startedAt.getTime()) / 1000),
        ),
      })),
    );
  } catch (error: any) {
    logger.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/earnings', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { period } = req.query;

    let daysBack = 7;
    if (period === '24h') daysBack = 1;
    else if (period === '30d') daysBack = 30;

    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const sessions = await prisma.miningSession.findMany({
      where: {
        userId,
        startedAt: { gte: since },
      },
      orderBy: { startedAt: 'asc' },
    });

    const dailyMap: Record<string, number> = {};
    for (const session of sessions) {
      const day = session.startedAt.toISOString().split('T')[0];
      dailyMap[day] = normalizePoints((dailyMap[day] || 0) + session.pointsEarned);
    }

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
