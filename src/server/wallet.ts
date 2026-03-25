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

// Get wallet balance
router.get('/balance', isAuthenticated, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    res.json({ balance: user?.points || 0 });
  } catch (error: any) {
    logger.error('Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transfer points
router.post('/transfer', isAuthenticated, async (req: any, res: any) => {
  try {
    const fromUserId = req.user.id;
    const { toEmail, toWallet, amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId }
    });

    if (!fromUser || fromUser.points < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const toUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: toEmail || undefined },
          { walletAddress: toWallet || undefined }
        ]
      }
    });

    if (!toUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (toUser.id === fromUserId) {
        return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Transaction to ensure atomicity
    await prisma.$transaction([
      prisma.user.update({
        where: { id: fromUserId },
        data: { points: { decrement: amount } }
      }),
      prisma.user.update({
        where: { id: toUser.id },
        data: { points: { increment: amount } }
      })
    ]);

    res.json({ success: true, newBalance: fromUser.points - amount });
  } catch (error: any) {
    logger.error('Error transferring points:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
