import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { prisma } from './db.js';
import { readEnv } from './env.js';
import passport, { authRoutes } from './auth.js';
import { logger, morganMiddleware } from './logger.js';

import referralRoutes from './referral.js';
import userRoutes from './users.js';
import tasksRoutes from './tasks.js';
import miningRoutes from './mining.js';
import walletRoutes from './wallet.js';


dotenv.config();

const app = express();
const isVercel = process.env.VERCEL === '1';
const server = isVercel ? null : http.createServer(app);
const io = server
  ? new Server(server, {
      cors: {
        origin: readEnv('FRONTEND_URL') || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    })
  : null;

// Required for secure cookies behind Vercel's proxy.
app.set('trust proxy', 1);

// Logging Middleware
app.use(morganMiddleware);

// Basic Security Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true
}));



// Body parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/api/', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Vary', 'Cookie');
  next();
});

// Rate Limiting — generous for SPA with many parallel API calls
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// App Session
app.use(session({
  secret: readEnv('SESSION_SECRET') || 'supersecret-session-key',
  resave: false,
  saveUninitialized: false,
  store: new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000,  // ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  ),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount auth logic
authRoutes(app);

// Setup routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Routes
app.use('/api/referral', referralRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/wallet', walletRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error('Unhandled server error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Socket.io basics
if (io) {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
}

const PORT = process.env.PORT || 3001;
if (!isVercel && server) {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
