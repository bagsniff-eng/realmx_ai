import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from './db.js';
import { logger } from './logger.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

// GET /api/referral — returns the user's referral code + list of referred users
router.get('/', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: {
            id: true,
            email: true,
            walletAddress: true,
            name: true,
            points: true,
            createdAt: true,
          }
        },
        rewardsEarned: true,
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const referrals = user.referrals.map((r: any) => ({
      name: r.name || r.email?.split('@')[0] || r.walletAddress?.slice(0, 10) || 'Anonymous',
      address: r.walletAddress || r.email || r.id.slice(0, 12),
      event: 'Node Activated',
      status: 'active',
      time: new Date(r.createdAt).toLocaleDateString(),
      rewardEarned: user.rewardsEarned
        .filter((rw: any) => rw.refereeId === r.id)
        .reduce((sum: number, rw: any) => sum + rw.amount, 0),
    }));

    res.json({
      code: user.referralCode,
      referrals,
      totalRewards: user.rewardsEarned.reduce((s: number, r: any) => s + r.amount, 0),
    });
  } catch (err: any) {
    logger.error('Error fetching referrals:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/referral — apply a referral code
router.post('/',
  body('code').isString().isLength({ min: 4 }).withMessage('Invalid referral code format'),
  body('userId').optional().isUUID().withMessage('Invalid user id format'),
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, userId } = req.body;

    try {
      const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!referrer) {
        return res.status(404).json({ error: 'Referral code not found' });
      }

      if (userId) {
        if (referrer.id === userId) {
          return res.status(400).json({ error: 'Cannot refer yourself' });
        }
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (currentUser?.referredById) {
          return res.status(400).json({ error: 'Already referred by someone' });
        }

        // Link user + create reward in a transaction
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { referredById: referrer.id }
          }),
          prisma.referralReward.create({
            data: {
              referrerId: referrer.id,
              refereeId: userId,
              amount: 10
            }
          }),
          // Also credit the referrer's points
          prisma.user.update({
            where: { id: referrer.id },
            data: { points: { increment: 10 } }
          })
        ]);
      }

      res.status(200).json({ success: true, referrerId: referrer.id });
    } catch (err: any) {
      logger.error('Error applying referral:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

export default router;
