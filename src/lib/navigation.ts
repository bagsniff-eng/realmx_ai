import type { LucideIcon } from 'lucide-react';
import {
  CheckSquare,
  Cpu,
  LayoutDashboard,
  Pickaxe,
  Settings,
  Trophy,
  User,
  Users,
  Wallet,
} from 'lucide-react';

export const APP_TAB_ORDER = [
  'dashboard',
  'leaderboard',
  'node',
  'mining',
  'wallet',
  'tasks',
  'referrals',
  'profile',
  'settings',
] as const;

export type AppTabId = (typeof APP_TAB_ORDER)[number];

export type AppTabMeta = {
  id: AppTabId;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  icon: LucideIcon;
  pinnedToFooter?: boolean;
};

export const APP_TABS: AppTabMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Home',
    title: 'Node dashboard',
    description: 'Core session control, reward pace, and action readiness at a glance.',
    icon: LayoutDashboard,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    shortLabel: 'Ranks',
    title: 'Network leaderboard',
    description: 'Top contributors with clean ranking, status, and points.',
    icon: Trophy,
  },
  {
    id: 'node',
    label: 'Node',
    shortLabel: 'Node',
    title: 'Node status',
    description: 'Peer health, runtime state, and live network activity.',
    icon: Cpu,
  },
  {
    id: 'mining',
    label: 'Mining',
    shortLabel: 'Mining',
    title: 'Mining overview',
    description: 'Session timing, payout timing, and historical mining output.',
    icon: Pickaxe,
  },
  {
    id: 'wallet',
    label: 'Wallet',
    shortLabel: 'Wallet',
    title: 'Wallet overview',
    description: 'Balances, payout history, and private transfers.',
    icon: Wallet,
  },
  {
    id: 'tasks',
    label: 'Tasks',
    shortLabel: 'Tasks',
    title: 'Task control room',
    description: 'Eligibility-driven missions with clear claim and blocked states.',
    icon: CheckSquare,
  },
  {
    id: 'referrals',
    label: 'Referrals',
    shortLabel: 'Referrals',
    title: 'Referral network',
    description: 'Invite trusted people, share links, and track referred activity.',
    icon: Users,
  },
  {
    id: 'profile',
    label: 'Profile',
    shortLabel: 'Profile',
    title: 'Profile identity',
    description: 'Linked accounts, recovery posture, and profile presentation.',
    icon: User,
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    title: 'Workspace settings',
    description: 'Essential workspace, privacy, and alert preferences.',
    icon: Settings,
    pinnedToFooter: true,
  },
];

const APP_TAB_LOOKUP = new Map<AppTabId, AppTabMeta>(
  APP_TABS.map((tab) => [tab.id, tab]),
);

export function normalizeTab(value: string | null | undefined): AppTabId {
  return APP_TAB_LOOKUP.has(value as AppTabId) ? (value as AppTabId) : 'dashboard';
}

export function getTabMeta(tab: string | null | undefined): AppTabMeta {
  return APP_TAB_LOOKUP.get(normalizeTab(tab)) ?? APP_TABS[0];
}
