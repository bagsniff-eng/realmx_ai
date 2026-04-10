export type SessionUser = {
  id?: string;
  email?: string;
  walletAddress?: string;
  githubId?: string;
  discordId?: string;
  twitterId?: string;
  referralCode?: string;
  name?: string;
  avatarUrl?: string;
  username?: string;
} | null;

export function getDefaultAuthReturnTo() {
  if (typeof window === 'undefined') {
    return '/?tab=dashboard';
  }

  return `${window.location.pathname}${window.location.search || '?tab=dashboard'}`;
}

export async function resolveCurrentSessionUser(): Promise<SessionUser> {
  const attempts = [0, 250, 750];

  for (const delay of attempts) {
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        return await res.json();
      }

      if (res.status === 401) {
        return null;
      }
    } catch {
      // Retry transient auth bootstrap failures before treating the session as missing.
    }
  }

  return null;
}
