import dotenv from 'dotenv';
dotenv.config();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { requireEnv } from './env.js';

const adapter = new PrismaPg({ connectionString: requireEnv('DATABASE_URL') });

export const prisma = new PrismaClient({ adapter });
