import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { prisma } from './db.js';
import { generateNonce, SiweMessage } from 'siwe';
import crypto from 'crypto';
import { readEnv } from './env.js';

// Generate short, human-readable referral code like "REALM-A3X7K2"
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REALM-${code}`;
}

// Generate unique username like "node_a3x7f2"
function generateUsername(): string {
  const hex = crypto.randomBytes(4).toString('hex'); // 8 hex chars
  return `node_${hex}`;
}

// Helper to create user with proper defaults
async function createUserWithDefaults(data: Record<string, any>) {
  // Try up to 3 times in case of referral/username collision
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.user.create({
        data: {
          ...data,
          username: generateUsername(),
          referralCode: generateReferralCode(),
        }
      });
    } catch (e: any) {
      if (e.code === 'P2002' && attempt < 2) continue; // unique constraint, retry
      throw e;
    }
  }
  throw new Error('Failed to generate unique user identifiers');
}

async function linkProviderToCurrentUser(req: any, providerData: Record<string, any>) {
  const currentUser = req.user as any;
  if (!currentUser?.id) return null;
  return prisma.user.update({
    where: { id: currentUser.id },
    data: providerData,
  });
}

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

function encodeBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest();
}

async function resolveTwitterUserFromProfile(req: any, profile: { id: string; username?: string }, done: any) {
  try {
    const twitterId = profile.id;
    const currentUser = req.user as any;

    if (currentUser?.id) {
      const existingByTwitterId = await prisma.user.findUnique({ where: { twitterId } });
      if (existingByTwitterId && existingByTwitterId.id !== currentUser.id) {
        return done(new Error('This X account is already linked to another user'));
      }
      const user = await linkProviderToCurrentUser(req, { twitterId, name: currentUser.name || profile.username || undefined });
      return done(null, user);
    }

    let user = await prisma.user.findUnique({ where: { twitterId } });
    if (!user) user = await createUserWithDefaults({ twitterId, name: profile.username || undefined });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}

const APP_URL = readEnv('BACKEND_URL') || readEnv('FRONTEND_URL');
const FRONTEND_URL = readEnv('FRONTEND_URL') || APP_URL || 'http://localhost:3000';
const BACKEND_URL = APP_URL || 'http://localhost:3001';

// Google OAuth Strategy
const GOOGLE_CLIENT_ID = readEnv('GOOGLE_CLIENT_ID') || 'placeholder-client-id';
const GOOGLE_CLIENT_SECRET = readEnv('GOOGLE_CLIENT_SECRET') || 'placeholder-client-secret';

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0].value;
      if (!email) return done(new Error("No email found from Google profile"));
      const currentUser = req.user as any;

      if (currentUser?.id) {
        const existingByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingByEmail && existingByEmail.id !== currentUser.id) {
          return done(new Error('This Google account is already linked to another user'));
        }
        const user = await linkProviderToCurrentUser(req, { email, name: currentUser.name || profile.displayName || undefined });
        return done(null, user);
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) user = await createUserWithDefaults({ email, name: profile.displayName || undefined });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// GitHub OAuth Strategy
const GITHUB_CLIENT_ID = readEnv('GITHUB_CLIENT_ID') || 'placeholder-client-id';
const GITHUB_CLIENT_SECRET = readEnv('GITHUB_CLIENT_SECRET') || 'placeholder-client-secret';

passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/github/callback`,
    passReqToCallback: true,
  },
  async (req: any, accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
      const githubId = profile.id;
      const email = profile.emails?.[0].value;
      const currentUser = req.user as any;

      if (currentUser?.id) {
        const existingByGithubId = await prisma.user.findUnique({ where: { githubId } });
        if (existingByGithubId && existingByGithubId.id !== currentUser.id) {
          return done(new Error('This GitHub account is already linked to another user'));
        }
        if (email) {
          const existingByEmail = await prisma.user.findUnique({ where: { email } });
          if (existingByEmail && existingByEmail.id !== currentUser.id) {
            return done(new Error('This GitHub email is already linked to another user'));
          }
        }
        const user = await linkProviderToCurrentUser(req, {
          githubId,
          email: currentUser.email || email || undefined,
          name: currentUser.name || profile.displayName || undefined,
        });
        return done(null, user);
      }

      let user = await prisma.user.findUnique({ where: { githubId } });
      if (!user && email) user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await createUserWithDefaults({ githubId, email, name: profile.displayName || undefined });
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
const DISCORD_CLIENT_ID = readEnv('DISCORD_CLIENT_ID') || 'placeholder-client-id';
const DISCORD_CLIENT_SECRET = readEnv('DISCORD_CLIENT_SECRET') || 'placeholder-client-secret';

passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/discord/callback`,
    scope: ['identify', 'email'],
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const discordId = profile.id;
      const email = profile.email;
      const currentUser = req.user as any;

      if (currentUser?.id) {
        const existingByDiscordId = await prisma.user.findUnique({ where: { discordId } });
        if (existingByDiscordId && existingByDiscordId.id !== currentUser.id) {
          return done(new Error('This Discord account is already linked to another user'));
        }
        if (email) {
          const existingByEmail = await prisma.user.findUnique({ where: { email } });
          if (existingByEmail && existingByEmail.id !== currentUser.id) {
            return done(new Error('This Discord email is already linked to another user'));
          }
        }
        const user = await linkProviderToCurrentUser(req, {
          discordId,
          email: currentUser.email || email || undefined,
          name: currentUser.name || profile.username || undefined,
        });
        return done(null, user);
      }

      let user = await prisma.user.findUnique({ where: { discordId } });
      if (!user && email) user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        user = await createUserWithDefaults({ discordId, email, name: profile.username || undefined });
      } else if (!user.discordId) {
        user = await prisma.user.update({ where: { id: user.id }, data: { discordId } });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

const TWITTER_CLIENT_ID = readEnv('TWITTER_CLIENT_ID') || 'placeholder-client-id';
const TWITTER_CLIENT_SECRET = readEnv('TWITTER_CLIENT_SECRET') || 'placeholder-client-secret';
const TWITTER_CALLBACK_URL = `${BACKEND_URL}/api/auth/twitter/callback`;
const TWITTER_SCOPES = ['tweet.read', 'users.read'];
const TWITTER_AUTH_URL = 'https://x.com/i/oauth2/authorize';
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWITTER_ME_URL = 'https://api.twitter.com/2/users/me?user.fields=id,username,name';


// Wallet Authentication (SIWE) routes helper
export const authRoutes = (app: any) => {
  const unlinkableProviders = {
    github: { githubId: null },
    discord: { discordId: null },
    twitter: { twitterId: null },
  } as const;

  const setReturnTo = (req: any) => {
    const requested = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/';
    req.session.authReturnTo = requested.startsWith('/') ? requested : '/';
  };

  const resolveReturnTo = (req: any) => {
    const requested = typeof req.session?.authReturnTo === 'string' ? req.session.authReturnTo : '/';
    if (req.session) {
      delete req.session.authReturnTo;
      delete req.session.twitterOAuthState;
      delete req.session.twitterCodeVerifier;
    }
    return `${FRONTEND_URL}${requested}`;
  };

  // Google
  app.get('/api/auth/google', (req: any, _res: any, next: any) => { setReturnTo(req); next(); }, passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/?tab=tasks` }), (req: any, res: any) => res.redirect(resolveReturnTo(req)));

  // GitHub
  app.get('/api/auth/github', (req: any, _res: any, next: any) => { setReturnTo(req); next(); }, passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/api/auth/github/callback', passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/?tab=tasks` }), (req: any, res: any) => res.redirect(resolveReturnTo(req)));

  // Discord
  app.get('/api/auth/discord', (req: any, _res: any, next: any) => { setReturnTo(req); next(); }, passport.authenticate('discord'));
  app.get('/api/auth/discord/callback', passport.authenticate('discord', { failureRedirect: `${FRONTEND_URL}/?tab=tasks` }), (req: any, res: any) => res.redirect(resolveReturnTo(req)));

  // Twitter / X
  app.get('/api/auth/twitter', (req: any, res: any) => {
    setReturnTo(req);

    const state = encodeBase64Url(crypto.randomBytes(24));
    const codeVerifier = encodeBase64Url(crypto.randomBytes(48));
    const codeChallenge = encodeBase64Url(sha256(codeVerifier));

    req.session.twitterOAuthState = state;
    req.session.twitterCodeVerifier = codeVerifier;

    const authUrl = new URL(TWITTER_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', TWITTER_CALLBACK_URL);
    authUrl.searchParams.set('scope', TWITTER_SCOPES.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    res.redirect(authUrl.toString());
  });

  app.get('/api/auth/twitter/callback', async (req: any, res: any, next: any) => {
    const fail = () => res.redirect(`${FRONTEND_URL}/?tab=tasks`);
    const { code, state } = req.query as { code?: string; state?: string };

    if (!code || !state) {
      return fail();
    }

    if (state !== req.session?.twitterOAuthState || !req.session?.twitterCodeVerifier) {
      return fail();
    }

    try {
      const body = new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_CALLBACK_URL,
        code_verifier: req.session.twitterCodeVerifier,
      });

      const tokenResponse = await fetch(TWITTER_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: body.toString(),
      });

      const tokenData = await tokenResponse.json().catch(() => ({}));
      if (!tokenResponse.ok || !tokenData?.access_token) {
        return fail();
      }

      const profileResponse = await fetch(TWITTER_ME_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      const profileData = await profileResponse.json().catch(() => ({}));
      if (!profileResponse.ok || !profileData?.data?.id) {
        return fail();
      }

      await resolveTwitterUserFromProfile(req, {
        id: profileData.data.id,
        username: profileData.data.username || profileData.data.name,
      }, (err: any, user: any) => {
        if (err || !user) {
          return next(err || new Error('Failed to resolve X user'));
        }

        req.login(user, (loginErr: any) => {
          if (loginErr) {
            return next(loginErr);
          }
          return res.redirect(resolveReturnTo(req));
        });
      });
    } catch (error) {
      return fail();
    }
  });

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
      if (!user) user = await createUserWithDefaults({ walletAddress: message.address });
      
      req.session.siwe = message;
      req.session.nonce = null;
      if (message.expirationTime) {
        const expirationDate = new Date(message.expirationTime);
        if (!Number.isNaN(expirationDate.getTime())) {
          req.session.cookie.expires = expirationDate;
        }
      }

      req.login(user, (err: any) => {
        if (err) return res.status(500).json({ error: err.message });

        req.session.save((saveErr: any) => {
          if (saveErr) {
            return res.status(500).json({ error: saveErr.message || 'Failed to persist login session' });
          }

          res.status(200).json({ success: true, user: { id: user!.id, username: user!.username } });
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

  app.post('/api/auth/unlink/:provider', async (req: any, res: any) => {
    const currentUser = req.user as any;
    if (!currentUser?.id) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    const provider = req.params.provider as keyof typeof unlinkableProviders;
    const update = unlinkableProviders[provider];

    if (!update) {
      return res.status(400).json({ error: 'Unsupported provider unlink request' });
    }

    try {
      const user = await prisma.user.update({
        where: { id: currentUser.id },
        data: update,
      });

      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to refresh session after unlink' });
        }

        return res.status(200).json(user);
      });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to unlink provider' });
    }
  });

  const logoutHandler = (req: any, res: any) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }

      req.session?.destroy(() => {
        res.clearCookie('connect.sid');

        if (req.method === 'POST') {
          return res.status(200).json({ success: true });
        }

        return res.redirect('/');
      });
    });
  };

  app.get('/api/auth/logout', logoutHandler);
  app.post('/api/auth/logout', logoutHandler);
};

export default passport;
