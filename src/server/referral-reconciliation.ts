import { prisma } from './db.js';
import { normalizePoints } from './rewards.js';
import { REFERRAL_REWARD_RATE, REFERRAL_SIGNUP_BONUS } from './referral-constants.js';

const TASK_REWARD_BY_ID: Record<string, number> = {
  connect_google: 10,
  connect_x: 10,
  connect_discord: 10,
  connect_wallet: 15,
  follow_x: 10,
  join_discord: 10,
  join_telegram: 10,
  retweet_launch: 15,
  signup_reward: 25,
  complete_profile: 15,
  first_referral: 20,
  first_mine_session: 30,
  daily_checkin: 2,
  daily_mine: 5,
  daily_share: 3,
};

const EPSILON = 0.0001;

export type ReferralReconciliationOptions = {
  dryRun?: boolean;
  referrerId?: string;
  refereeId?: string;
};

export type ReferralReconciliationRow = {
  referrerId: string;
  refereeId: string;
  referrerLabel: string;
  refereeLabel: string;
  existingTotal: number;
  expectedTotal: number;
  delta: number;
  taskRewardBonus: number;
  miningRewardBonus: number;
  status: 'ok' | 'credited' | 'overpaid';
};

export type ReferralReconciliationSummary = {
  scannedPairs: number;
  creditedPairs: number;
  overpaidPairs: number;
  totalCredited: number;
  rows: ReferralReconciliationRow[];
};

function getUserLabel(user: {
  id: string;
  username: string | null;
  email: string | null;
  walletAddress: string | null;
  name: string | null;
}) {
  return (
    user.name ||
    user.username ||
    user.email ||
    user.walletAddress ||
    `user:${user.id.slice(0, 8)}`
  );
}

function getTaskReferralBonus(taskIds: string[]) {
  return normalizePoints(
    taskIds.reduce((sum, taskId) => {
      const reward = TASK_REWARD_BY_ID[taskId] || 0;
      return sum + normalizePoints(reward * REFERRAL_REWARD_RATE);
    }, 0),
  );
}

function getMiningReferralBonus(pointsEarnedValues: number[]) {
  return normalizePoints(
    pointsEarnedValues.reduce(
      (sum, pointsEarned) => sum + normalizePoints(pointsEarned * REFERRAL_REWARD_RATE),
      0,
    ),
  );
}

export async function reconcileReferralRewards(
  options: ReferralReconciliationOptions = {},
): Promise<ReferralReconciliationSummary> {
  const referredUsers = await prisma.user.findMany({
    where: {
      id: options.refereeId || undefined,
      referredById: options.referrerId ?? { not: null },
      email: { not: null },
    },
    select: {
      id: true,
      username: true,
      email: true,
      walletAddress: true,
      name: true,
      referredById: true,
      referredBy: {
        select: {
          id: true,
          username: true,
          email: true,
          walletAddress: true,
          name: true,
        },
      },
      tasksCompleted: {
        select: {
          taskId: true,
        },
      },
      miningSessions: {
        select: {
          pointsEarned: true,
        },
      },
    },
  });

  const rewardTotals = await prisma.referralReward.groupBy({
    by: ['referrerId', 'refereeId'],
    where: {
      referrerId: options.referrerId || undefined,
      refereeId: options.refereeId || undefined,
    },
    _sum: {
      amount: true,
    },
  });

  const rewardTotalByPair = new Map(
    rewardTotals.map((row) => [
      `${row.referrerId}:${row.refereeId}`,
      normalizePoints(row._sum.amount || 0),
    ]),
  );

  const rows: ReferralReconciliationRow[] = [];
  let creditedPairs = 0;
  let overpaidPairs = 0;
  let totalCredited = 0;

  for (const referee of referredUsers) {
    if (!referee.referredById || !referee.referredBy) {
      continue;
    }

    const referrer = referee.referredBy;
    const key = `${referrer.id}:${referee.id}`;
    const existingTotal = rewardTotalByPair.get(key) || 0;
    const taskRewardBonus = getTaskReferralBonus(
      referee.tasksCompleted.map((completion) => completion.taskId),
    );
    const miningRewardBonus = getMiningReferralBonus(
      referee.miningSessions.map((session) => session.pointsEarned),
    );
    const expectedTotal = normalizePoints(
      REFERRAL_SIGNUP_BONUS + taskRewardBonus + miningRewardBonus,
    );
    const rawDelta = normalizePoints(expectedTotal - existingTotal);

    let delta = 0;
    let status: ReferralReconciliationRow['status'] = 'ok';

    if (rawDelta > EPSILON) {
      delta = rawDelta;
      status = options.dryRun ? 'credited' : 'credited';

      if (!options.dryRun) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: referrer.id },
            data: { points: { increment: delta } },
          });

          await tx.referralReward.create({
            data: {
              referrerId: referrer.id,
              refereeId: referee.id,
              amount: delta,
            },
          });
        });
      }

      creditedPairs += 1;
      totalCredited = normalizePoints(totalCredited + delta);
    } else if (rawDelta < -EPSILON) {
      delta = rawDelta;
      status = 'overpaid';
      overpaidPairs += 1;
    }

    rows.push({
      referrerId: referrer.id,
      refereeId: referee.id,
      referrerLabel: getUserLabel(referrer),
      refereeLabel: getUserLabel(referee),
      existingTotal,
      expectedTotal,
      delta,
      taskRewardBonus,
      miningRewardBonus,
      status,
    });
  }

  return {
    scannedPairs: rows.length,
    creditedPairs,
    overpaidPairs,
    totalCredited,
    rows,
  };
}
