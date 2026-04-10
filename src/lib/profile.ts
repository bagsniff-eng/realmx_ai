import type { SessionUser } from './session';

export function getConnectedIdentityCount(user: SessionUser | Record<string, any>) {
  return [
    user?.email || user?.walletAddress,
    user?.githubId,
    user?.discordId,
    user?.twitterId,
  ].filter(Boolean).length;
}

export function getProfileChecks(user: SessionUser | Record<string, any>) {
  return [
    !!user?.name,
    !!user?.username,
    !!user?.avatarUrl,
    !!(user?.email || user?.walletAddress),
    getConnectedIdentityCount(user) >= 2,
  ];
}

export function getProfileSetupItems(user: SessionUser | Record<string, any>) {
  return [
    { label: 'Display name', complete: !!user?.name },
    { label: 'Username', complete: !!user?.username },
    { label: 'Profile photo', complete: !!user?.avatarUrl },
    { label: 'Primary sign-in', complete: !!(user?.email || user?.walletAddress) },
    { label: 'Backup identity', complete: getConnectedIdentityCount(user) >= 2 },
  ];
}
