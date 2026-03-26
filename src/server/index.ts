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
import passport, { authRoutes } from './auth.js';
import { logger, morganMiddleware } from './logger.js';

import referralRoutes from './referral.js';
import userRoutes from './users.js';
import tasksRoutes from './tasks.js';
import miningRoutes from './mining.js';
import walletRoutes from './wallet.js';


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

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
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

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
  secret: process.env.SESSION_SECRET || 'supersecret-session-key',
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
  cookie: { secure: process.env.NODE_ENV === 'production' }
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

// Socket.io basics
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export default app;
