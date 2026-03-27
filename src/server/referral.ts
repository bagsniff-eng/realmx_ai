import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from './db.js';
import { logger } from './logger.js';
import { REFERRAL_SIGNUP_BONUS } from './referral-constants.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REALM-${code}`;
}

async function ensureReferralCode(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (existing?.referralCode?.startsWith('REALM-')) {
    return existing.referralCode;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: generateReferralCode() },
        select: { referralCode: true },
      });
      return updated.referralCode;
    } catch (error: any) {
      if (error.code !== 'P2002' || attempt === 4) throw error;
    }
  }

  throw new Error('Failed to generate unique referral code');
}

router.get('/', isAuthenticated, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const referralCode = await ensureReferralCode(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          where: {
            email: { not: null },
          },
          select: {
            id: true,
            email: true,
            walletAddress: true,
            name: true,
            username: true,
            points: true,
            createdAt: true,
            miningSessions: {
              select: {
                pointsEarned: true,
                isActive: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        rewardsEarned: {
          where: {
            referee: {
              email: { not: null },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const rewardsByReferee = new Map<string, number>();
    for (const reward of user.rewardsEarned) {
      rewardsByReferee.set(
        reward.refereeId,
        (rewardsByReferee.get(reward.refereeId) || 0) + reward.amount,
      );
    }

    const referrals = user.referrals.map((referral: any) => {
      const totalMined = referral.miningSessions.reduce(
        (sum: number, session: any) => sum + session.pointsEarned,
        0,
      );
      const isActive = referral.miningSessions.some((session: any) => session.isActive);

      return {
        id: referral.id,
        name: referral.name || referral.username || referral.email?.split('@')[0] || referral.walletAddress?.slice(0, 10) || 'Anonymous',
        address: referral.walletAddress || referral.email || referral.username || referral.id.slice(0, 12),
        event: 'Referral linked',
        status: isActive ? 'active' : 'inactive',
        time: new Date(referral.createdAt).toLocaleDateString(),
        rewardEarned: rewardsByReferee.get(referral.id) || 0,
        referredUserPoints: referral.points,
        totalMined,
      };
    });

    res.json({
      code: referralCode,
      referrals,
      totalRewards: user.rewardsEarned.reduce((sum: number, reward: any) => sum + reward.amount, 0),
    });
  } catch (err: any) {
    logger.error('Error fetching referrals:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/',
  body('code').isString().isLength({ min: 4 }).withMessage('Invalid referral code format'),
  body('userId').optional().isUUID().withMessage('Invalid user id format'),
  async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const code = String(req.body.code).trim().toUpperCase();
    const targetUserId = req.user?.id || req.body.userId;

    if (!targetUserId) {
      return res.status(401).json({ error: 'Sign in before applying a referral code' });
    }

    try {
      const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!referrer) {
        return res.status(404).json({ error: 'Referral code not found' });
      }

      if (referrer.id === targetUserId) {
        return res.status(400).json({ error: 'Cannot refer yourself' });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, referredById: true, email: true },
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!currentUser.email) {
        return res.status(400).json({ error: 'Referral codes can only be applied to email-connected accounts' });
      }

      if (currentUser.referredById) {
        return res.status(400).json({ error: 'Already referred by someone' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: targetUserId },
          data: { referredById: referrer.id },
        });

        await tx.referralReward.create({
          data: {
            referrerId: referrer.id,
            refereeId: targetUserId,
            amount: REFERRAL_SIGNUP_BONUS,
          },
        });

        await tx.user.update({
          where: { id: referrer.id },
          data: { points: { increment: REFERRAL_SIGNUP_BONUS } },
        });
      });

      res.status(200).json({ success: true, referrerId: referrer.id });
    } catch (err: any) {
      logger.error('Error applying referral:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
