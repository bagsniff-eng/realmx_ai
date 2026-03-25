import React, { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
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
  Zap,
  ArrowUpRight,
  Search
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

// ---- Shared Mining Session Logic ----
const SESSION_DURATION = 6 * 3600; // 6 hours in seconds
const MINING_RATE_PER_HOUR = 10;
const MINING_RATE_PER_SEC = MINING_RATE_PER_HOUR / 3600;

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
    <aside className="fixed left-0 top-0 h-screen w-60 bg-realm-black border-r border-realm-border flex flex-col z-50">
      <div className="flex items-center gap-3 h-20 px-6 border-b border-realm-border">
        <div className="w-8 h-8 bg-realm-surface border border-realm-border rounded flex items-center justify-center overflow-hidden">
          <img 
            src="/ChatGPT Image Mar 15, 2026, 09_59_46 AM.webp" 
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
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto pb-6 border-t border-realm-border pt-4">
        <SidebarItem icon={Settings} label="SETTINGS" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </aside>
  );
};

const TopBar = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [user, setUser] = useState<{ email?: string; walletAddress?: string; githubId?: string; discordId?: string; twitterId?: string; } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) { }
    };
    fetchUser();
  }, []);

  const isIdentityConnected = !!(user?.email || user?.walletAddress);

  return (
    <header className="fixed top-0 right-0 left-60 h-20 border-b border-realm-border bg-realm-black/80 backdrop-blur-sm z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-realm-text-secondary text-[10px] font-mono tracking-widest uppercase">
          <div className="w-1.5 h-1.5 bg-realm-cyan rounded-full opacity-80" />
          <span>System Status: Nominal</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-realm-surface border border-realm-border rounded-md">
          <Wallet size={14} className="text-realm-text-secondary" />
          <span className="text-xs font-mono font-medium text-realm-text-primary">Points: <span id="pointsval">230.45</span> REALM-P</span>
        </div>
        
        <button className="p-2 text-realm-text-secondary hover:text-realm-text-primary transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1 h-1 bg-realm-cyan rounded-full" />
        </button>

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
              <ConnectButton />
            </div>

            {/* Google */}
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-realm-border">
              {user?.email ? (
                <div className="bg-white/5 p-3 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-white/40 font-mono uppercase mb-0.5">Google</p>
                    <span className="text-xs text-realm-text-primary break-all">{user.email}</span>
                  </div>
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/logout`} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors shrink-0">Sign Out</a>
                </div>
              ) : (
                <a 
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`}
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
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/twitter`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
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
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/github`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
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
                <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/discord`} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors">
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
          }} className="absolute top-4 right-4 text-realm-text-secondary hover:text-white">âœ•</button>
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
           onClick={() => {
             const val = (document.getElementById('ref-input') as HTMLInputElement).value;
             if (val.trim() === 'ABUSED-CODE-000' || val.trim() === 'BADCODE') {
               const err = document.getElementById('ref-error');
               if (err) err.style.display = 'block';
             } else {
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

const Dashboard = ({ miningActive, sessionSecs, onToggleMining }: { miningActive: boolean; sessionSecs: number; onToggleMining: () => void }) => {
  const [usersOnline, setUsersOnline] = useState(12435);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/wallet/balance`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setPoints(data.balance);
        }
      } catch (e) {}
    };
    fetchPoints();
    const t = setInterval(() => {
      setUsersOnline(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const fTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Real-time pending rewards calculation (for display only)
  const pendingRewards = sessionSecs * MINING_RATE_PER_SEC;

  return (
    <div className="space-y-12">
      {/* Hero Section - Munich font for main title */}
      <section className="p-8 rounded-lg bg-realm-surface border border-realm-border">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-[10px] font-mono text-realm-text-secondary tracking-[0.25em] uppercase mb-3">INFRASTRUCTURE LAYER v4.0</p>
          <h1 className="font-serif italic text-5xl text-white mb-5 leading-none tracking-tight">
            System <span className="text-realm-cyan">Execution</span>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-realm-cyan status-pulse" />
              <span className="text-[10px] font-mono text-realm-text-secondary uppercase tracking-widest">NODE 0x82f...e10 — ACTIVE</span>
            </div>
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">SYNC 99.9%</span>
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
                   <p className="text-xs text-white/40">Tap to contribute to the REALM network</p>
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
               <span className="text-white/30 uppercase">Weekly Yield</span>
               <span className="text-realm-cyan">+12.4%</span>
             </div>
             <button className="w-full py-2.5 border border-realm-border rounded-md text-[10px] font-mono font-bold text-realm-text-secondary uppercase tracking-widest hover:border-white/15 hover:text-realm-text-primary transition-colors">
                Manage Wallet
             </button>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <div className="col-span-12 glass-panel p-8">
           <div className="flex justify-between items-end mb-8">
             <div>
               <h3 className="font-bold text-xl mb-1">Network Analytics</h3>
               <p className="text-xs text-white/30">Your contribution to the global privacy layer</p>
             </div>
             <div className="flex gap-2">
               {['24H', '7D', 'ALL'].map(t => (
                 <button key={t} className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-white/40 hover:text-white transition-all">
                   {t}
                 </button>
               ))}
             </div>
           </div>
           
           <div className="h-[240px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                 { t: '00', v: 40 }, { t: '04', v: 30 }, { t: '08', v: 65 }, { t: '12', v: 45 }, { t: '16', v: 90 }, { t: '20', v: 55 }, { t: '24', v: 70 }
               ]}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="t" hide />
                  <YAxis hide />
                  <Area type="monotone" dataKey="v" stroke="#2FE6D2" fillOpacity={0} fill="transparent" strokeWidth={1.5} />
               </AreaChart>
             </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-4 gap-8 mt-8 pt-8 border-t border-white/5">
             {[
               { label: 'Active Peers', value: '1,244' },
               { label: 'Blocks Verified', value: '124,103' },
               { label: 'Network Latency', value: '24ms' },
               { label: 'Uptime', value: '99.9%' },
             ].map(s => (
               <div key={s.label}>
                 <p className="text-[10px] text-white/30 font-mono uppercase mb-1">{s.label}</p>
                 <p className="text-sm font-bold text-white/80">{s.value}</p>
               </div>
             ))}
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/tasks`, { credentials: 'include' });
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/tasks/complete`, {
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
        <p className="text-white/40 font-mono text-[10px] tracking-[0.3em] uppercase">Contribution layer & reward distribution system</p>
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
               <p className="text-white/40 font-mono text-xs">No objectives found for your node signature.</p>
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
            <h3 className="font-munich text-3xl text-white mb-8 lowercase">evolution <span className="text-realm-cyan">progress</span></h3>
            
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

const ReferralsPage = () => {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('REALM-ALPHA-??');

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/referrals`, { credentials: 'include' });
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
        <h1 className="text-serif text-6xl font-medium mb-4">Network <span className="text-realm-cyan">Growth</span></h1>
        <p className="text-white/50 font-mono text-sm tracking-wide">Expand the REALMxAI infrastructure and earn lifetime rewards.</p>
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
          <h3 className="text-serif text-2xl mb-8">Your Referral Link</h3>
          <div className="space-y-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between group">
              <code className="text-sm font-mono text-white/60">realm.ai/join/{referralCode}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`realm.ai/join/${referralCode}`);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }}
                className="text-xs font-mono text-realm-cyan hover:underline"
              >
                {copied ? 'âœ“ Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 font-mono uppercase mb-1">Referral Code</p>
                <code className="text-xl font-medium tracking-widest">{referralCode}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }}
                className="px-6 py-2 bg-white text-realm-black rounded-lg text-xs font-bold hover:bg-realm-cyan transition-all"
              >
                {copied ? 'âœ“ Copied' : 'Share Code'}
              </button>
            </div>
          </div>

          <div className="mt-8 p-6 bg-realm-cyan/5 border border-realm-cyan/10 rounded-2xl">
            <h4 className="font-medium mb-2">How it works</h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Earn 10% of all rewards generated by nodes you refer. Rewards are credited instantly to your balance as long as their node remains active.
            </p>
          </div>
        </div>

        <div className="col-span-5 glass-panel p-8">
          <h3 className="text-serif text-2xl mb-6">Your Referred Nodes</h3>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-realm-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
              <Users size={32} className="text-white/20" />
              <p className="text-sm text-white/40">No referrals yet.</p>
              <p className="text-xs text-white/25 font-mono">Share your link to earn rewards when friends join.</p>
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
          <button className="w-full py-3 mt-8 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">
            View All Referrals
          </button>
        </div>
      </div>
    </div>
  );
};

const MiningPage = ({ miningActive, sessionSecs, onToggleMining }: { miningActive: boolean; sessionSecs: number; onToggleMining: () => void }) => {
  const [todayPoints, setTodayPoints] = useState(0);
  const [weekPoints, setWeekPoints] = useState(84.20);
  const [totalPoints, setTotalPoints] = useState(230.45);
  const [events, setEvents] = useState([
    { event: 'Mining session started', time: 'just now', amount: null as string | null },
  ]);

  const fTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!miningActive) return;
    const timer = setInterval(() => {
      if (sessionSecs % 60 === 0 && sessionSecs > 0) {
        const earned = parseFloat((Math.random() * 0.02 + 0.01).toFixed(3));
        setTodayPoints(p => parseFloat((p + earned).toFixed(3)));
        setWeekPoints(p => parseFloat((p + earned).toFixed(3)));
        setTotalPoints(p => parseFloat((p + earned).toFixed(3)));
        setEvents(ev => [
          { event: `Reward credited: Network Relay`, time: `${Math.floor(sessionSecs/60)}m into session`, amount: `+${earned} REALM-P` },
          ...ev.slice(0, 4)
        ]);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [miningActive, sessionSecs]);

  const rate = 0.84;
  const sessionPct = Math.min(100, (sessionSecs / SESSION_DURATION) * 100);
  const timeRemaining = SESSION_DURATION - sessionSecs;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-serif text-6xl font-medium mb-4">Mining <span className="text-realm-cyan">Yield</span></h1>
        <p className="text-white/50 font-mono text-sm tracking-wide">Real-time resource monetization and reward tracking.</p>
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
            <h3 className="text-serif text-2xl mb-6">Yield Summary</h3>
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
          <button className="w-full py-2.5 border border-realm-border rounded-md text-[10px] font-mono font-bold text-realm-text-secondary uppercase tracking-widest hover:border-white/15 hover:text-realm-text-primary transition-colors mt-8">
            View Detailed History
          </button>
        </div>

        <div className="col-span-12 glass-panel p-8">
          <h3 className="text-serif text-2xl mb-6">Recent Mining Events</h3>
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
        ...prev.map(l => ({ ...l, time: l.time === 'just now' ? '1m ago' : l.time.includes('m ago') ? `${parseInt(l.time) + 1}m ago` : l.time })).slice(0, 7)
      ]);
    }, 5000);
    return () => clearInterval(timer);
  }, [blockHeight]);

  const handleRestart = () => {
    setRestarting(true);
    setLogs(prev => [{ event: 'Module restart initiated by user', time: 'just now', type: 'system' }, ...prev.slice(0, 7)]);
    setTimeout(() => {
      setRestarting(false);
      setLogs(prev => [{ event: 'Module restarted successfully', time: 'just now', type: 'system' }, ...prev.slice(0, 7)]);
    }, 3000);
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-serif text-6xl font-medium mb-4">Node <span className="text-realm-cyan">Operations</span></h1>
        <p className="text-white/50 font-mono text-sm tracking-wide">Live infrastructure control and validation layer.</p>
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
          <h3 className="text-serif text-2xl mb-6">Live Performance</h3>
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
              <button className="px-4 py-2 text-xs font-mono border border-white/10 rounded-lg hover:bg-white/5">View Logs</button>
              <button
                onClick={handleRestart}
                disabled={restarting}
                className={cn("px-4 py-2 text-xs font-mono rounded-lg font-bold transition-all", restarting ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/20 cursor-not-allowed" : "bg-realm-cyan text-realm-black hover:brightness-110")}
              >
                {restarting ? 'Restarting...' : 'Restart Module'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-12 glass-panel p-8">
          <h3 className="text-serif text-2xl mb-6">Live Node Activity <span className="text-xs font-mono text-realm-cyan ml-2 animate-pulse">● LIVE</span></h3>
          <div className="space-y-3">
            {logs.map((log, i) => (
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
    </div>
  );
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLeaderboard = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/leaderboard`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
        setLastUpdated(new Date());
      }
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    const timer = setInterval(fetchLeaderboard, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-serif text-6xl font-medium mb-4">Global <span className="text-realm-cyan">Nodes</span></h1>
            <p className="text-white/50 font-mono text-sm tracking-wide">Top contributors to the REALMxAI privacy network.</p>
          </div>
          <div className="flex items-center gap-3 pb-4">
            <span className="text-[10px] text-white/30 font-mono">Updated {lastUpdated.toLocaleTimeString()}</span>
            <button
              onClick={fetchLeaderboard}
              className="px-3 py-1.5 text-[10px] font-mono border border-realm-border rounded hover:border-realm-cyan hover:text-realm-cyan transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="glass-panel overflow-hidden border-white/5">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-realm-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-center p-8">
            <Trophy size={36} className="text-white/20" />
            <p className="text-sm text-white/40">No leaderboard data yet.</p>
            <p className="text-xs text-white/25 font-mono">As users connect and mine, their scores will appear here in real time.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-8 py-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">Rank</th>
                <th className="px-8 py-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">Node Name</th>
                <th className="px-8 py-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">Points</th>
                <th className="px-8 py-6 text-[10px] font-mono text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-mono text-white/40 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item: any, i: number) => (
                <motion.tr 
                  key={item.name || item.address || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/2 transition-colors group"
                >
                  <td className="px-8 py-6 font-mono text-sm">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border",
                      i === 0 ? "border-realm-cyan text-realm-cyan bg-realm-cyan/10" : "border-white/10 text-white/40"
                    )}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-medium">{item.name || item.address?.slice(0,10)+'...' || 'Anonymous'}</td>
                  <td className="px-8 py-6 font-mono text-realm-cyan">{(item.points || item.totalPoints || 0).toFixed(2)}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", item.status === 'Active' || item.isOnline ? "bg-realm-cyan shadow-[0_0_8px_#3DF2E0]" : "bg-white/20")} />
                      <span className="text-xs text-white/60">{item.status || (item.isOnline ? 'Active' : 'Offline')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-xs font-mono text-white/40 hover:text-realm-cyan transition-colors flex items-center gap-1 ml-auto">
                      View Profile <ChevronRight size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const SettingsPage = () => (
  <div className="max-w-4xl mx-auto space-y-10">
    <section>
      <h1 className="text-serif text-6xl font-medium mb-4">System <span className="text-realm-cyan">Settings</span></h1>
      <p className="text-white/50 font-mono text-sm tracking-wide">Configure your node environment and preferences.</p>
    </section>

    <div className="space-y-6">
      {[
        { 
          category: 'Node Configuration', 
          items: [
            { label: 'Auto-start on boot', desc: 'Launch node automatically when system starts', active: true },
            { label: 'Background execution', desc: 'Keep node running when dashboard is closed', active: true },
            { label: 'Resource allocation', desc: 'Limit CPU usage to 50%', active: false },
          ]
        },
        { 
          category: 'Privacy & Security', 
          items: [
            { label: 'Encrypted logs', desc: 'All local logs are stored with AES-256 encryption', active: true },
            { label: 'Stealth mode', desc: 'Hide node presence from local network discovery', active: false },
            { label: 'Automatic updates', desc: 'Keep node software updated to latest version', active: true },
          ]
        },
        { 
          category: 'Notifications', 
          items: [
            { label: 'Payout alerts', desc: 'Notify when rewards are credited to balance', active: true },
            { label: 'Network status', desc: 'Alert if node loses connection to peers', active: true },
          ]
        }
      ].map(group => (
        <div key={group.category} className="glass-panel p-8">
          <h3 className="text-serif text-2xl mb-6">{group.category}</h3>
          <div className="space-y-6">
            {group.items.map(item => (
              <div key={item.label} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                <div className="space-y-1">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-white/40 font-mono">{item.desc}</p>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer",
                  item.active ? "bg-realm-cyan" : "bg-white/10"
                )}>
                  <div className={cn(
                    "w-4 h-4 bg-white rounded-full transition-transform duration-300",
                    item.active ? "translate-x-6" : "translate-x-0"
                  )} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    
    <div className="flex justify-end gap-4 pt-6">
      <button className="px-8 py-3 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-all">Discard Changes</button>
      <button className="px-8 py-3 bg-realm-cyan text-realm-black rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(61,242,224,0.3)] transition-all">Save Configuration</button>
    </div>
  </div>
);

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const balRes = await fetch(`${API_URL}/api/wallet/balance`, { credentials: 'include' });
      const histRes = await fetch(`${API_URL}/api/mining/history`, { credentials: 'include' });
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
  }, []);

  const handleTransfer = async () => {
    if (!recipient || !transferAmount) return;
    setTransferring(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/wallet/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: recipient.includes('@') ? recipient : undefined,
          toWallet: !recipient.includes('@') ? recipient : undefined,
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
      } else {
        setMessage(data.message || 'Transfer failed');
      }
    } catch (e) {
      setMessage('Error during transfer');
    }
    setTransferring(false);
  };

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-serif text-6xl font-medium mb-4">
          Digital <span className="text-realm-cyan">Vault</span>
        </h1>
        <p className="text-white/40 font-mono text-xs tracking-[0.2em] uppercase">Private Asset Management & Peer Transfer Protocol</p>
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
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Activity size={18} className="text-realm-cyan" />
              Recent History
            </h4>
            <div className="space-y-6">
              {history.length === 0 ? (
                <p className="text-xs text-white/20 font-mono">No recent activity detected.</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-4 last:border-0 hover:border-realm-cyan/20 transition-all">
                    <div className="space-y-1">
                      <p className="text-white/60">Node Reward</p>
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
            <h3 className="text-3xl font-bold mb-2">Execute Transfer</h3>
            <p className="text-sm text-white/40 mb-10">Relay assets between network nodes using the internal privacy protocol.</p>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] ml-1">Recipient Identity</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-realm-cyan transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter email or wallet address"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:border-realm-cyan outline-none transition-all"
                  />
                </div>
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
                   <p className="text-[10px] text-white/60 font-mono uppercase tracking-widest">Secured Transaction</p>
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
                onClick={handleTransfer}
                disabled={transferring}
                className="w-full py-5 bg-white text-realm-black rounded-2xl text-sm font-bold hover:bg-realm-cyan hover:shadow-[0_0_30px_rgba(61,242,224,0.3)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Initialise Relay Sequence <ArrowUpRight size={18} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const Profile = () => {
  const [user, setUser] = useState<{ email?: string; walletAddress?: string; name?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) { }
    };
    fetchUser();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10">
      <div className="flex items-end gap-8">
        <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-realm-cyan/20 to-transparent border border-realm-cyan/30 p-1">
          <div className="w-full h-full rounded-[22px] overflow-hidden bg-realm-surface flex items-center justify-center">
            {user?.email ? (
              <span className="text-4xl font-bold text-realm-cyan">{user.email[0].toUpperCase()}</span>
            ) : (
              <User size={48} className="text-white/20" />
            )}
          </div>
        </div>
        <div className="flex-1 pb-4">
          <h1 className="text-serif text-5xl mb-2 italic">
            {user?.name || user?.email?.split('@')[0] || user?.walletAddress?.slice(0, 12) || 'Anonymous Node'}
          </h1>
          <p className="text-white/40 font-mono text-sm">
            {user?.email ? `${user.email} • ` : ''}
            {user?.walletAddress ? `${user.walletAddress.slice(0,8)}...${user.walletAddress.slice(-4)} • ` : ''}
            Verified Node Operator
          </p>
        </div>
        <button className="mb-4 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Global Rank', value: '#–' },
          { label: 'Uptime', value: '–' },
          { label: 'Trust Score', value: user ? '72/100' : '–' },
        ].map(stat => (
          <div key={stat.label} className="glass-panel p-8 text-center">
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mb-2">{stat.label}</p>
            <p className="text-3xl font-medium">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Connected Accounts */}
      <div className="glass-panel p-10 space-y-6">
        <h3 className="text-serif text-3xl">Connected Accounts</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium">Google Account</p>
                <p className="text-xs text-white/40 font-mono">{user?.email || 'Not connected'}</p>
              </div>
            </div>
            {user?.email ? (
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/logout`} className="px-4 py-1.5 text-xs font-bold text-red-400 border border-red-400/20 rounded-lg hover:bg-red-400/10 transition-colors">Disconnect</a>
            ) : (
              <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/google`} className="px-4 py-1.5 text-xs font-bold bg-white text-realm-black rounded-lg hover:bg-realm-cyan transition-colors">Connect</a>
            )}
          </div>

          <div className="flex justify-between items-center py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium">X (Twitter)</p>
                <p className="text-xs text-white/40 font-mono">Not connected</p>
              </div>
            </div>
            <a href="https://twitter.com/REALMxAI" target="_blank" rel="noreferrer" className="px-4 py-1.5 text-xs font-bold border border-white/10 rounded-lg hover:border-realm-cyan hover:text-realm-cyan transition-colors">Follow & Connect</a>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-white/40 font-mono">Not connected</p>
              </div>
            </div>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="px-4 py-1.5 text-xs font-bold border border-white/10 rounded-lg hover:border-realm-cyan hover:text-realm-cyan transition-colors">Connect</a>
          </div>

          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </div>
              <div>
                <p className="text-sm font-medium">Telegram</p>
                <p className="text-xs text-white/40 font-mono">Not connected</p>
              </div>
            </div>
            <a href="https://t.me/REALMxAI" target="_blank" rel="noreferrer" className="px-4 py-1.5 text-xs font-bold border border-white/10 rounded-lg hover:border-realm-cyan hover:text-realm-cyan transition-colors">Join Community</a>
          </div>
        </div>
      </div>

      <div className="glass-panel p-10 space-y-8">
        <h3 className="text-serif text-3xl">Account Security</h3>
        <div className="space-y-6">
          {[
            { label: 'Two-Factor Authentication', status: 'Enabled', active: true },
            { label: 'Hardware Key', status: 'Not Configured', active: false },
            { label: 'Session Lockdown', status: 'Enabled', active: true },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-white/40 font-mono">{item.status}</p>
              </div>
              <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors duration-300",
                item.active ? "bg-realm-cyan" : "bg-white/10"
              )}>
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform duration-300",
                  item.active ? "translate-x-6" : "translate-x-0"
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // ---- Shared Mining Session State ----
  const [miningActive, setMiningActive] = useState<boolean>(() => isSessionActive());
  const [sessionSecs, setSessionSecs] = useState<number>(() => getSessionElapsed());

  useEffect(() => {
    if (!miningActive) return;
    const timer = setInterval(() => {
      setSessionSecs(prev => {
        const next = prev + 1;
        
        // Hourly distribution check
        if (next % 3600 === 0 && next > 0) {
          const syncMining = async () => {
             const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
             await fetch(`${API_URL}/api/mining/sync`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ sessionSeconds: 3600 }),
               credentials: 'include'
             });
          };
          syncMining();
        }

        if (next >= SESSION_DURATION) {
          // Session expired
          setMiningActive(false);
          saveMiningSession({ startedAt: Date.now() - SESSION_DURATION * 1000, active: false });
          
          // Final sync
          const finalSync = async () => {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            await fetch(`${API_URL}/api/mining/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionSeconds: next % 3600 }),
              credentials: 'include'
            });
          };
          finalSync();

          return SESSION_DURATION;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [miningActive]);

  const handleToggleMining = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    if (miningActive) {
      // Stop: always update state immediately
      setMiningActive(false);
      const remainingSecs = sessionSecs;
      setSessionSecs(0);
      saveMiningSession({ startedAt: Date.now(), active: false });
      // Best-effort sync to backend (won't break if not logged in)
      fetch(`${API_URL}/api/mining/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionSeconds: remainingSecs % 3600 }),
        credentials: 'include'
      }).catch(() => {});
    } else {
      // Start: always update state immediately
      const now = Date.now();
      setMiningActive(true);
      setSessionSecs(0);
      saveMiningSession({ startedAt: now, active: true });
      // Best-effort notify backend (won't break if not logged in)
      fetch(`${API_URL}/api/mining/start`, {
        method: 'POST',
        credentials: 'include'
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-realm-black selection:bg-realm-cyan selection:text-realm-black overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-distortion opacity-20" />
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <TopBar onNavigate={(t) => setActiveTab(t)} />

      <main className="pl-64 pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'dashboard' && <Dashboard miningActive={miningActive} sessionSecs={sessionSecs} onToggleMining={handleToggleMining} />}
              {activeTab === 'leaderboard' && <Leaderboard />}
              {activeTab === 'node' && <NodePage />}
              {activeTab === 'mining' && <MiningPage miningActive={miningActive} sessionSecs={sessionSecs} onToggleMining={handleToggleMining} />}
              {activeTab === 'wallet' && <WalletPage />}
              {activeTab === 'tasks' && <TasksPage />}
              {activeTab === 'referrals' && <ReferralsPage />}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

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
