export const SESSION_DURATION = 6 * 3600;
export const MINING_RATE_PER_HOUR = 10;
export const MINING_RATE_PER_SEC = MINING_RATE_PER_HOUR / 3600;
export const PENDING_REFERRAL_CODE_KEY = 'realmx_pending_referral_code';
export const MINING_SESSION_STORAGE_KEY = 'realmx_mining_session';

export type MiningSession = {
  startedAt: number;
  active: boolean;
};

export function buildReferralLink(code: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

export function getPendingReferralCode() {
  if (typeof window === 'undefined') {
    return null;
  }

  const urlCode = new URLSearchParams(window.location.search).get('ref');
  if (urlCode?.trim()) {
    return urlCode.trim().toUpperCase();
  }

  const storedCode = window.localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
  return storedCode?.trim() ? storedCode.trim().toUpperCase() : null;
}

export function persistPendingReferralCode(code: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!code) {
    window.localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_REFERRAL_CODE_KEY, code.trim().toUpperCase());
}

export function clearReferralCodeFromUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has('ref')) {
    return;
  }

  url.searchParams.delete('ref');
  window.history.replaceState({}, '', url.toString());
}

function getMiningSession(): MiningSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(MINING_SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMiningSession(session: MiningSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(MINING_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearMiningSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(MINING_SESSION_STORAGE_KEY);
}

export function getSessionElapsed() {
  const session = getMiningSession();
  if (!session || !session.active) {
    return 0;
  }

  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.min(elapsed, SESSION_DURATION);
}

export function isSessionActive() {
  const session = getMiningSession();
  if (!session || !session.active) {
    return false;
  }

  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  return elapsed < SESSION_DURATION;
}
