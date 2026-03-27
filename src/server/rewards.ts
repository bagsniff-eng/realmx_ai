import { prisma } from './db.js';
import { REFERRAL_REWARD_RATE } from './referral-constants.js';
const POINT_PRECISION = 10000;

function roundPoints(value: number) {
  return Math.round(value * POINT_PRECISION) / POINT_PRECISION;
}

export function normalizePoints(value: number) {
  if (!Number.isFinite(value)) return 0;
  return roundPoints(Math.max(0, value));
}

export async function creditUserPoints(userId: string, amount: number) {
  const normalizedAmount = normalizePoints(amount);
  if (normalizedAmount <= 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return {
      credited: 0,
      referralBonus: 0,
      newBalance: user?.points || 0,
      referrerId: user?.referredById || null,
    };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, referredById: true, points: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: normalizedAmount } },
      select: { points: true },
    });

    let referralBonus = 0;

    if (user.referredById) {
      referralBonus = normalizePoints(normalizedAmount * REFERRAL_REWARD_RATE);
      if (referralBonus > 0) {
        await tx.user.update({
          where: { id: user.referredById },
          data: { points: { increment: referralBonus } },
        });

        await tx.referralReward.create({
          data: {
            referrerId: user.referredById,
            refereeId: userId,
            amount: referralBonus,
          },
        });
      }
    }

    return {
      credited: normalizedAmount,
      referralBonus,
      newBalance: updatedUser.points,
      referrerId: user.referredById,
    };
  });
}
