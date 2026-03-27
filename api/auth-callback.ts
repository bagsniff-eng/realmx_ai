import { handleApiRequest } from './_handle.js';

const CALLBACK_PREFIXES: Record<string, string> = {
  google: '/api/auth/google/callback',
  github: '/api/auth/github/callback',
  discord: '/api/auth/discord/callback',
  twitter: '/api/auth/twitter/callback',
};

export default function handler(req: any, res: any) {
  const provider = typeof req.query?.provider === 'string' ? req.query.provider : '';
  const prefix = CALLBACK_PREFIXES[provider];

  if (!prefix) {
    return res.status(400).json({ error: 'Unknown auth callback provider' });
  }

  return handleApiRequest(prefix, req, res);
}
