import { prisma } from '../src/server/db.js';

export default async function handler(_req: any, res: any) {
  try {
    const [users, sessions] = await Promise.all([
      prisma.user.count(),
      prisma.session.count(),
    ]);

    res.status(200).json({ ok: true, users, sessions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    res.status(500).json({ ok: false, message, stack });
  }
}
