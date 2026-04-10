import { useEffect, useState } from 'react';

export const UI_REFRESH_INTERVAL = 60_000;
export const APP_PREFERENCES_KEY = 'realmx_preferences_v2';
export const APP_PREFERENCES_EVENT = 'realmx-preferences-updated';

export type AppPreferences = {
  workspace: {
    refreshIntervalMs: number;
    hidePointBalance: boolean;
  };
  notifications: {
    rewardAlerts: boolean;
    taskAlerts: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    maskWalletAddress: boolean;
    showReferralCode: boolean;
    profileVisibility: 'private' | 'network' | 'public';
  };
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  workspace: {
    refreshIntervalMs: UI_REFRESH_INTERVAL,
    hidePointBalance: false,
  },
  notifications: {
    rewardAlerts: true,
    taskAlerts: true,
    securityAlerts: true,
  },
  privacy: {
    maskWalletAddress: true,
    showReferralCode: true,
    profileVisibility: 'network',
  },
};

export function loadAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(APP_PREFERENCES_KEY);
    if (!raw) {
      return DEFAULT_APP_PREFERENCES;
    }

    const parsed = JSON.parse(raw);
    return {
      workspace: {
        refreshIntervalMs:
          Number(parsed?.workspace?.refreshIntervalMs) || DEFAULT_APP_PREFERENCES.workspace.refreshIntervalMs,
        hidePointBalance: Boolean(parsed?.workspace?.hidePointBalance),
      },
      notifications: {
        rewardAlerts: parsed?.notifications?.rewardAlerts !== false,
        taskAlerts: parsed?.notifications?.taskAlerts !== false,
        securityAlerts: parsed?.notifications?.securityAlerts !== false,
      },
      privacy: {
        maskWalletAddress: parsed?.privacy?.maskWalletAddress !== false,
        showReferralCode: parsed?.privacy?.showReferralCode !== false,
        profileVisibility: ['private', 'network', 'public'].includes(parsed?.privacy?.profileVisibility)
          ? parsed.privacy.profileVisibility
          : DEFAULT_APP_PREFERENCES.privacy.profileVisibility,
      },
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function saveAppPreferences(preferences: AppPreferences) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(APP_PREFERENCES_EVENT));
}

export function useAppPreferences() {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences());

  useEffect(() => {
    const syncPreferences = () => setPreferences(loadAppPreferences());
    window.addEventListener(APP_PREFERENCES_EVENT, syncPreferences);
    window.addEventListener('storage', syncPreferences);

    return () => {
      window.removeEventListener(APP_PREFERENCES_EVENT, syncPreferences);
      window.removeEventListener('storage', syncPreferences);
    };
  }, []);

  return preferences;
}

export function formatRefreshInterval(intervalMs: number) {
  const seconds = Math.round(intervalMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.round(seconds / 60)}m`;
}

export function maskWalletAddress(address?: string, enabled = true) {
  if (!address) {
    return '';
  }

  if (!enabled) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getProfileVisibilityLabel(visibility: AppPreferences['privacy']['profileVisibility']) {
  if (visibility === 'private') {
    return 'Private';
  }

  if (visibility === 'public') {
    return 'Public';
  }

  return 'Trusted network';
}
