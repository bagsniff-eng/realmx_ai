import { Router } from 'express';
import { prisma } from './db.js';

const router = Router();

// Standard REST endpoints for User mapping (used by the TestSprite tests for seeding)
router.post('/', async (req, res) => {
  try {
    const { email, walletAddress } = req.body;
    
    const user = await prisma.user.create({
      data: {
        email: email || undefined,
        walletAddress: walletAddress || undefined,
      }
    });

    // Test requires a return matching { userId, referralCode }
    res.status(201).json({ userId: user.id, referralCode: user.referralCode });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete user' });
  }
});

export default router;
