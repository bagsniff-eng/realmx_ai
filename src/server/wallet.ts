import { Router } from 'express';
import { prisma } from './db.js';
import { logger } from './logger.js';

const router = Router();

const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
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

// Get wallet balance (public — returns 0 if not authenticated)
router.get('/balance-public', async (req: any, res: any) => {
  if (req.isAuthenticated()) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      return res.json({ balance: user?.points || 0 });
    } catch (e) {}
  }
  res.json({ balance: 0 });
});

const normalizeRecipientUsername = (value: string) => value.trim().replace(/^@+/, '').toLowerCase();

// Transfer points — username only
router.post('/transfer', isAuthenticated, async (req: any, res: any) => {
  try {
    const fromUserId = req.user.id;
    const { recipient, amount } = req.body;
    const normalizedRecipient = typeof recipient === 'string' ? normalizeRecipientUsername(recipient) : '';

    if (!normalizedRecipient) {
      return res.status(400).json({ message: 'Recipient username is required' });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedRecipient)) {
      return res.status(400).json({ message: 'Recipient must be a valid username' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: 'Transfer limit exceeded (max 10,000)' });
    }

    const fromUser = await prisma.user.findUnique({
      where: { id: fromUserId }
    });

    if (!fromUser || fromUser.points < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Find recipient by username, case-insensitive.
    const toUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: normalizedRecipient,
          mode: 'insensitive',
        }
      }
    });

    if (!toUser) {
      return res.status(404).json({ message: 'Recipient username not found.' });
    }

    if (toUser.id === fromUserId) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    // Atomic transaction
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

    res.json({ 
      success: true, 
      newBalance: fromUser.points - amount,
      recipientName: toUser.name || toUser.username
    });
  } catch (error: any) {
    logger.error('Error transferring points:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
