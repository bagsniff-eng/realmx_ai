import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as TwitterStrategy } from 'passport-twitter-oauth2';
import { prisma } from './db.js';
import { generateNonce, SiweMessage } from 'siwe';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Google OAuth Strategy
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'placeholder-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'placeholder-client-secret';

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) return done(new Error("No email found from Google profile"));
      
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) user = await prisma.user.create({ data: { email } });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// GitHub OAuth Strategy
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'placeholder-client-id';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'placeholder-client-secret';

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  },
  async (accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
      const githubId = profile.id;
      const email = profile.emails?.[0].value;
      
      let user = await prisma.user.findUnique({ where: { githubId } });
      if (!user && email) user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({ data: { githubId, email } });
      } else if (!user.githubId) {
        user = await prisma.user.update({ where: { id: user.id }, data: { githubId } });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Discord OAuth Strategy
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'placeholder-client-id';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'placeholder-client-secret';

passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: "/api/auth/discord/callback",
    scope: ['identify', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const discordId = profile.id;
      const email = profile.email;
      
      let user = await prisma.user.findUnique({ where: { discordId } });
      if (!user && email) user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await prisma.user.create({ data: { discordId, email } });
      } else if (!user.discordId) {
        user = await prisma.user.update({ where: { id: user.id }, data: { discordId } });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Twitter OAuth2 Strategy
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || 'placeholder-client-id';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || 'placeholder-client-secret';

passport.use(new TwitterStrategy({
    clientID: TWITTER_CLIENT_ID,
    clientSecret: TWITTER_CLIENT_SECRET,
    callbackURL: "/api/auth/twitter/callback",
    clientType: "confidential"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const twitterId = profile.id;
      
      let user = await prisma.user.findUnique({ where: { twitterId } });
      // Twitter might not provide email depending on permissions, so just match by twitterId primarily.
      if (!user) user = await prisma.user.create({ data: { twitterId } });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));


// Wallet Authentication (SIWE) routes helper
export const authRoutes = (app: any) => {
  // Google
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/` }), (req: any, res: any) => res.redirect(`${FRONTEND_URL}/`));

  // GitHub
  app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/api/auth/github/callback', passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/` }), (req: any, res: any) => res.redirect(`${FRONTEND_URL}/`));

  // Discord
  app.get('/api/auth/discord', passport.authenticate('discord'));
  app.get('/api/auth/discord/callback', passport.authenticate('discord', { failureRedirect: `${FRONTEND_URL}/` }), (req: any, res: any) => res.redirect(`${FRONTEND_URL}/`));

  // Twitter
  app.get('/api/auth/twitter', passport.authenticate('twitter', { scope: ['tweet.read', 'users.read'] }));
  app.get('/api/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: `${FRONTEND_URL}/` }), (req: any, res: any) => res.redirect(`${FRONTEND_URL}/`));

  app.get('/api/auth/nonce', async (req: any, res: any) => {
    req.session.nonce = generateNonce();
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(req.session.nonce);
  });

  app.post('/api/auth/verify', async (req: any, res: any) => {
    try {
      if (!req.body.message) return res.status(422).json({ message: 'Expected prepareMessage object as body.' });

      const SIWEObject = new SiweMessage(req.body.message);
      const { data: message } = await SIWEObject.verify({ signature: req.body.signature, nonce: req.session.nonce });

      let user = await prisma.user.findUnique({ where: { walletAddress: message.address } });
      if (!user) user = await prisma.user.create({ data: { walletAddress: message.address } });
      
      req.session.siwe = message;
      req.session.cookie.expires = new Date(message.expirationTime!);
      req.session.save(() => {
        req.login(user, (err: any) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(200).send(true);
        });
      });
    } catch (e: any) {
      req.session.siwe = null;
      req.session.nonce = null;
      console.error(e);
      res.status(500).json({ message: String(e) });
    }
  });

  app.get('/api/auth/me', (req: any, res: any) => {
    if (!req.user) {
      return res.status(401).json({ message: 'You are not authenticated' });
    }
    res.status(200).json(req.user);
  });

  app.get('/api/auth/logout', (req: any, res: any) => {
    req.logout((err) => {
      res.redirect('/');
    });
  });
};

export default passport;
