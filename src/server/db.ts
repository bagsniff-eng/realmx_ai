import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables');
}

export const prisma = new PrismaClient();
