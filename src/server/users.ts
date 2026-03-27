import { Router } from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

// PUT /api/users/me — update profile (supports base64 avatar)
router.put('/me', isAuthenticated, async (req: any, res: any) => {
  try {
    const { name, avatarUrl, username } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl; // can be base64 data URI
    
    // Username change (validate format)
    if (username !== undefined) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters or underscores' });
      }
      // Check if username is taken
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== req.user.id) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      updateData.username = username;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData
    });

    req.login(updated, (loginErr: any) => {
      if (loginErr) {
        logger.error('Error refreshing session after profile update:', loginErr);
        return res.status(500).json({ error: 'Profile updated but session refresh failed' });
      }

      return res.json(updated);
    });
  } catch (err: any) {
    logger.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/leaderboard — public endpoint
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        email: true,
        walletAddress: true,
        name: true,
        avatarUrl: true,
        points: true,
        createdAt: true,
        miningSessions: {
          where: { isActive: true },
          select: { id: true }
        },
        tasksCompleted: {
          select: { id: true }
        }
      }
    });

    const leaderboard = topUsers.map((u: any, index: number) => {
      const publicId = u.username || `node_${String(u.id).slice(0, 8)}`;

      return {
      rank: index + 1,
      name: u.name || u.username || publicId,
      username: u.username,
      publicId,
      avatarUrl: u.avatarUrl,
      points: u.points,
      totalPoints: u.points,
      tasks: u.tasksCompleted.length,
      isOnline: u.miningSessions.length > 0,
      status: u.miningSessions.length > 0 ? 'Active' : 'Offline',
      joinedAt: u.createdAt,
      };
    });

    res.json(leaderboard);
  } catch (err: any) {
    logger.error('Error fetching leaderboard:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/users/stats — global network stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, activeSessions, totalPoints] = await Promise.all([
      prisma.user.count(),
      prisma.miningSession.count({ where: { isActive: true } }),
      prisma.user.aggregate({ _sum: { points: true } }),
    ]);

    res.json({
      totalUsers,
      activeSessions,
      totalPointsMined: totalPoints._sum.points || 0,
    });
  } catch (err: any) {
    logger.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
