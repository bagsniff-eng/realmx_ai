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

// Start mining session
router.post('/start', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    // Check for active session
    const active = await prisma.miningSession.findFirst({
        where: { userId, isActive: true }
    });

    if (active) {
        return res.status(400).json({ message: 'Session already active' });
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

// Hourly sync to distribute points
router.post('/sync', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { sessionSeconds } = req.body;

    const active = await prisma.miningSession.findFirst({
      where: { userId, isActive: true }
    });

    if (!active) {
        return res.status(400).json({ message: 'No active session' });
    }

    // Rate: 10 REALM / hour = 1/360 REALM per second
    const earned = (sessionSeconds / 3600) * 10;
    
    // Check if session has ended (6 hours)
    const elapsedSeconds = Math.floor((Date.now() - active.startedAt.getTime()) / 1000);
    const isEnding = elapsedSeconds >= SESSION_DURATION;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: earned } }
      }),
      prisma.miningSession.update({
        where: { id: active.id },
        data: { 
          pointsEarned: { increment: earned },
          isActive: !isEnding,
          endedAt: isEnding ? new Date() : null
        }
      })
    ]);

    res.json({ success: true, earned, sessionEnded: isEnding });
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

export default router;
