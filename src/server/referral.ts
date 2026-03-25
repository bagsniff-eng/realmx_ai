import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from './db.js';

const router = Router();

router.post('/', 
  body('code').isUUID().withMessage('Invalid referral code format'),
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
        // Link user
        await prisma.user.update({
          where: { id: userId },
          data: { referredById: referrer.id }
        });
        
        // Add a reward
        await prisma.referralReward.create({
          data: {
            referrerId: referrer.id,
            refereeId: userId,
            amount: 10
          }
        });
      }

      res.status(200).json({ success: true, referrerId: referrer.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
