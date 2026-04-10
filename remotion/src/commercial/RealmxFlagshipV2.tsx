import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
  Sequence,
} from 'remotion';

// ============================================================================
// TIMING (600 frames @ 30fps = 20s)
// ============================================================================
const DURATION = 600;
const T = {
  FORGE_START: 0,
  FORGE_END: 140,
  DIVE_START: 120,
  DIVE_END: 310,
  SCULPTURE_START: 270,
  SCULPTURE_END: 360,
  ORBIT_START: 330,
  ORBIT_END: 480,
  MONUMENT_START: 460,
  MONUMENT_END: 600,
};

// ============================================================================
// PALETTE
// ============================================================================
const C = {
  bg: '#05030A',
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139, 92, 246, 0.55)',
  purpleDim: 'rgba(139, 92, 246, 0.15)',
  violet: '#6D28D9',
  violetGlow: 'rgba(109, 40, 217, 0.4)',
  teal: '#14B8A6',
  tealGlow: 'rgba(20, 184, 166, 0.45)',
  green: '#10B981',
  amber: '#F59E0B',
  panelBg: 'rgba(10, 8, 18, 0.78)',
  panelBorder: 'rgba(139, 92, 246, 0.22)',
  panelGlow: '0 0 30px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
  textMuted: 'rgba(167, 139, 250, 0.6)',
};

const FD = '"Fraunces", serif';
const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';

// ============================================================================
// SPRINGS
// ============================================================================
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 14, stiffness: 90, mass: 0.8 } });

const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 20, stiffness: 60, mass: 1.2 } });

// ============================================================================
// ICONS
// ============================================================================
const ShieldIcon = ({ s = 24, c = C.purple }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12.08c0-.85-.08-1.68-.22-2.48H12v4.69h5.69a5.4 5.4 0 0 1-2.35 3.55v2.94h3.8C21.36 18.73 22 15.65 22 12.08z" />
    <path d="M12 22c2.81 0 5.18-.93 6.9-2.52l-3.8-2.94c-.94.63-2.14 1.01-3.1 1.01-2.4 0-4.43-1.62-5.16-3.8H2.9v3.04C4.64 20.25 8.04 22 12 22z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TrendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

// ============================================================================
// FLOATING PANEL — dark glass with neon edge
// ============================================================================
const FPanel: React.FC<{
  x: number; y: number; z: number;
  rY?: number; rX?: number;
  w?: number; h?: number;
  children: React.ReactNode;
  frame: number; delay?: number;
  glowColor?: string;
}> = ({ x, y, z, rY = 0, rX = 0, w = 300, h = 180, children, frame, delay = 0, glowColor = C.purpleGlow }) => {
  const enter = sp(frame, delay);
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2,
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rY}deg) rotateX(${rX}deg) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
      opacity: interpolate(enter, [0, 1], [0, 1]),
      background: C.panelBg, border: `1px solid ${C.panelBorder}`, borderRadius: 16,
      boxShadow: `0 0 30px ${glowColor}, inset 0 0 20px rgba(139, 92, 246, 0.06)`,
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      padding: 20, display: 'flex', flexDirection: 'column',
      transformStyle: 'preserve-3d',
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%)' }} />
      {children}
    </div>
  );
};

// ============================================================================
// MINI PROGRESS BAR
// ============================================================================
const NeonBar: React.FC<{ pct: number; color?: string }> = ({ pct, color = C.purple }) => (
  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 8 }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 8px ${color}` }} />
  </div>
);

// ============================================================================
// ACT 1 — THE FORGE (Abstract energy sculpture)
// ============================================================================
const Act1Forge: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(sp(frame, 10), [0, 1], [0, 1.15]);
  const rot = frame * 1.2;
  const pulse = 1 + Math.sin(frame / 8) * 0.12;
  const fadeOut = interpolate(frame, [T.FORGE_END - 25, T.FORGE_END], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoOp = interpolate(frame, [55, 85], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const energyOp = interpolate(frame, [55, 85], [1, 0.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Outer ring particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 + rot * 0.02;
    const r = 220 + Math.sin(frame / 10 + i) * 30;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, size: 3 + Math.sin(frame / 6 + i * 2) * 2 };
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      {/* Outer glow */}
      <div style={{ position: 'absolute', width: 800, height: 800,
        background: `radial-gradient(circle, ${C.purpleGlow} 0%, ${C.violetGlow} 30%, transparent 60%)`,
        opacity: scale * 0.7, transform: `scale(${pulse})`, pointerEvents: 'none' }} />

      {/* Spinning rings */}
      <div style={{ position: 'absolute', width: 500, height: 500,
        transform: `scale(${scale * pulse}) rotate(${rot}deg)`, opacity: energyOp, filter: 'blur(4px)' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke={C.purple} strokeWidth="1.5" strokeDasharray="8 16" opacity="0.8" />
          <circle cx="50" cy="50" r="36" fill="none" stroke={C.teal} strokeWidth="1" strokeDasharray="4 12"
            transform={`rotate(${-rot * 2} 50 50)`} opacity="0.6" />
          <circle cx="50" cy="50" r="28" fill="none" stroke={C.violet} strokeWidth="3" opacity="0.4" />
          <circle cx="50" cy="50" r="20" fill="none" stroke={C.purple} strokeWidth="0.8" strokeDasharray="2 8"
            transform={`rotate(${rot * 3} 50 50)`} opacity="0.5" />
        </svg>
      </div>

      {/* Orbiting particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', width: p.size, height: p.size, borderRadius: '50%',
          background: i % 2 === 0 ? C.purple : C.teal,
          boxShadow: `0 0 12px ${i % 2 === 0 ? C.purple : C.teal}`,
          transform: `translate(${p.x}px, ${p.y}px)`, opacity: scale * 0.8,
        }} />
      ))}

      {/* Logo emerging */}
      <div style={{ position: 'absolute', transform: `scale(${scale * pulse})`, opacity: logoOp,
        boxShadow: `0 0 120px ${C.purpleGlow}`, borderRadius: '50%' }}>
        <Img src={staticFile('logo.webp')} style={{ width: 140, height: 140, objectFit: 'contain' }} />
      </div>

      {/* Brand whisper */}
      <div style={{ position: 'absolute', top: '70%', fontFamily: FM, fontSize: 14,
        color: C.textSecondary, letterSpacing: '0.25em', textTransform: 'uppercase',
        opacity: interpolate(frame, [80, 100], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        initializing privacy engine
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 2 — NETWORK DIVE (Dense dashboard universe)
// ============================================================================
const Act2Dive: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - T.DIVE_START;
  const visible = frame >= T.DIVE_START - 20 && frame <= T.DIVE_END + 10;
  if (!visible) return null;

  const dur = T.DIVE_END - T.DIVE_START;
  const zDolly = interpolate(lf, [0, dur], [-3500, 1500]);
  const camRY = Math.sin(lf / 28) * 8;
  const camRX = Math.cos(lf / 36) * 4;
  const masterOp = interpolate(lf, [0, 15, dur - 15, dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ perspective: 1200, overflow: 'hidden', opacity: masterOp }}>
      <div style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d',
        transform: `translateZ(${zDolly}px) rotateY(${camRY}deg) rotateX(${camRX}deg)` }}>

        {/* Connection lines */}
        <svg style={{ position: 'absolute', width: '300vw', height: '300vh', top: '-100vh', left: '-100vw', transform: 'translateZ(-2000px)' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i}
              x1={`${30 + i * 15}%`} y1={`${20 + i * 12}%`}
              x2={`${60 + i * 8}%`} y2={`${50 + i * 10}%`}
              stroke={i % 2 === 0 ? C.purple : C.teal} strokeWidth={1.5}
              strokeDasharray="15 30" opacity={0.2}
              style={{ filter: `blur(${i % 2}px)` }} />
          ))}
        </svg>

        {/* Layer 1: Far panels (z = -2000 to -1500) */}
        <FPanel frame={lf} delay={5} x={0} y={-80} z={-2000} w={420} h={200}>
          <div style={{ fontSize: 13, fontFamily: FM, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Network Status</div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 52, fontFamily: FD, color: C.textPrimary }}>
              1,500 <span style={{ fontSize: 22, fontFamily: FB, color: C.teal }}>Active Sessions</span>
            </div>
          </div>
        </FPanel>

        <FPanel frame={lf} delay={12} x={-550} y={200} z={-1800} rY={18} w={300} h={160}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LockIcon />
            <span style={{ fontSize: 13, fontFamily: FM, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Security Score</span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 40, fontFamily: FM, fontWeight: 700, color: C.green }}>98.7%</div>
            <NeonBar pct={98.7} color={C.green} />
          </div>
        </FPanel>

        <FPanel frame={lf} delay={18} x={600} y={-200} z={-1700} rY={-20} w={280} h={180}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UsersIcon />
            <span style={{ fontSize: 13, fontFamily: FM, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Referral Network</span>
          </div>
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 36, fontFamily: FD, color: C.textPrimary }}>2,847</div>
            <div style={{ fontSize: 14, fontFamily: FB, color: C.teal }}>+142 this week</div>
          </div>
        </FPanel>

        {/* Layer 2: Mid panels (z = -1200 to -800) */}
        <FPanel frame={lf} delay={25} x={-400} y={-300} z={-1200} rY={15} rX={5} w={320} h={200}>
          <ShieldIcon s={20} />
          <div style={{ fontSize: 13, fontFamily: FM, color: C.textSecondary, marginTop: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>Privacy Routing</div>
          <div style={{ fontSize: 28, fontFamily: FB, color: C.textPrimary, marginTop: 8, fontWeight: 600 }}>Zero-Knowledge</div>
          <NeonBar pct={78} />
        </FPanel>

        <FPanel frame={lf} delay={30} x={500} y={100} z={-1000} rY={-25} w={260} h={150}>
          <div style={{ fontSize: 13, fontFamily: FM, color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Encrypted Shards</div>
          <div style={{ fontSize: 38, fontFamily: FM, color: C.textPrimary, marginTop: 'auto' }}>
            {Math.floor(interpolate(lf, [0, 120], [4280, 5124])).toLocaleString()}
          </div>
        </FPanel>

        <FPanel frame={lf} delay={35} x={-200} y={250} z={-900} rY={10} w={240} h={130} glowColor={C.tealGlow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendIcon />
            <span style={{ fontSize: 13, fontFamily: FM, color: C.teal, textTransform: 'uppercase', letterSpacing: '1px' }}>Growth</span>
          </div>
          <div style={{ fontSize: 28, fontFamily: FB, fontWeight: 700, color: C.textPrimary, marginTop: 'auto' }}>+847 pts</div>
          <div style={{ fontSize: 12, fontFamily: FB, color: C.teal }}>earned today</div>
        </FPanel>

        {/* Layer 3: Near panels (z = -500 to -200) — stacked cards */}
        <FPanel frame={lf} delay={40} x={300} y={-350} z={-500} rX={8} w={280} h={120}>
          <div style={{ fontSize: 12, fontFamily: FM, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Uptime</div>
          <div style={{ fontSize: 32, fontFamily: FD, color: C.green, marginTop: 'auto' }}>99.999%</div>
        </FPanel>

        {/* Stacked card pair */}
        <FPanel frame={lf} delay={42} x={-600} y={-100} z={-400} rY={20} w={200} h={100}>
          <div style={{ fontSize: 11, fontFamily: FM, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Rank</div>
          <div style={{ fontSize: 28, fontFamily: FD, fontWeight: 600, color: C.textPrimary, marginTop: 'auto' }}>#15</div>
        </FPanel>
        <FPanel frame={lf} delay={44} x={-570} y={-60} z={-350} rY={20} w={200} h={100}>
          <div style={{ fontSize: 11, fontFamily: FM, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Points Balance</div>
          <div style={{ fontSize: 24, fontFamily: FM, fontWeight: 600, color: C.purple, marginTop: 'auto' }}>12,612</div>
        </FPanel>

        {/* Mini logo watermark floating in space */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', marginLeft: 200, marginTop: -400,
          transform: 'translateZ(-1400px)', opacity: 0.08,
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: 60, height: 60, objectFit: 'contain' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 2.5 — ABSTRACT SCULPTURE (Blockchain node form)
// ============================================================================
const ActSculpture: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - T.SCULPTURE_START;
  const visible = frame >= T.SCULPTURE_START && frame <= T.SCULPTURE_END;
  if (!visible) return null;

  const dur = T.SCULPTURE_END - T.SCULPTURE_START;
  const op = interpolate(lf, [0, 20, dur - 20, dur], [0, 0.9, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rot = lf * 0.8;
  const pulse = 1 + Math.sin(lf / 10) * 0.06;

  // Hexagonal node structure
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(a) * 120, y: Math.sin(a) * 120 };
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: op }}>
      <div style={{ position: 'absolute', width: 500, height: 500,
        background: `radial-gradient(circle, ${C.violetGlow} 0%, transparent 50%)`,
        transform: `scale(${pulse})`, pointerEvents: 'none' }} />

      <div style={{ transform: `rotate(${rot}deg) scale(${pulse})` }}>
        <svg width="300" height="300" viewBox="-150 -150 300 300">
          {/* Hex outline */}
          <polygon points={hexPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke={C.purple} strokeWidth="1.5" opacity="0.6" />
          {/* Inner hex */}
          <polygon points={hexPoints.map(p => `${p.x * 0.6},${p.y * 0.6}`).join(' ')}
            fill="none" stroke={C.teal} strokeWidth="1" opacity="0.4" />
          {/* Node dots */}
          {hexPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill={i % 2 === 0 ? C.purple : C.teal}
              opacity={0.8}>
            </circle>
          ))}
          {/* Center shield */}
          <circle cx="0" cy="0" r="24" fill={`${C.purple}22`} stroke={C.purple} strokeWidth="1.5" />
        </svg>
      </div>

      <div style={{ position: 'absolute', bottom: '22%', fontFamily: FM, fontSize: 13,
        color: C.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase',
        opacity: interpolate(lf, [15, 30], [0, 0.7], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        shielded blockchain node
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 3 — ORBIT (Camera orbits wallet & auth icons)
// ============================================================================
const Act3Orbit: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - T.ORBIT_START;
  const visible = frame >= T.ORBIT_START - 15 && frame <= T.ORBIT_END;
  if (!visible) return null;

  const dur = T.ORBIT_END - T.ORBIT_START;
  const orbitAngle = interpolate(lf, [0, dur], [-70, 70]);
  const camZ = interpolate(lf, [0, dur], [-900, -550]);
  const introOp = interpolate(lf, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const outroOp = interpolate(lf, [dur - 20, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ perspective: 1000, opacity: Math.min(introOp, outroOp) }}>
      <div style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d',
        transform: `translateZ(${camZ}px) rotateX(-8deg) rotateY(${orbitAngle}deg)` }}>

        {/* Central glowing node */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100,
          background: `radial-gradient(circle, ${C.purpleGlow}, transparent 70%)`,
          transform: `rotateY(${-orbitAngle}deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: C.bg,
            border: `2px solid ${C.purple}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 50px ${C.purple}, 0 0 100px ${C.purpleGlow}`,
          }}>
            <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Orbiting panels */}
        <FPanel frame={lf} delay={8} x={420} y={-80} z={250} rY={-40} w={260} h={130}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WalletIcon />
            <span style={{ fontFamily: FB, fontSize: 17, color: C.textPrimary, fontWeight: 600 }}>WalletConnect</span>
          </div>
          <div style={{ marginTop: 'auto', fontFamily: FM, fontSize: 12, color: C.teal }}>0x8A2B...9F1A Verified</div>
        </FPanel>

        <FPanel frame={lf} delay={16} x={-420} y={120} z={-200} rY={40} w={260} h={130}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GoogleIcon />
            <span style={{ fontFamily: FB, fontSize: 17, color: C.textPrimary, fontWeight: 600 }}>Google Auth</span>
          </div>
          <div style={{ marginTop: 'auto', fontFamily: FM, fontSize: 12, color: C.green }}>Secure · 2FA Active</div>
        </FPanel>

        <FPanel frame={lf} delay={24} x={-100} y={-320} z={100} rX={15} w={220} h={100} glowColor={C.tealGlow}>
          <div style={{ fontSize: 12, fontFamily: FM, color: C.teal, textTransform: 'uppercase', letterSpacing: '1px' }}>Referral Code</div>
          <div style={{ fontSize: 20, fontFamily: FM, fontWeight: 600, color: C.textPrimary, marginTop: 'auto' }}>RLMX-8A2F</div>
        </FPanel>

        <FPanel frame={lf} delay={30} x={200} y={280} z={-100} rX={-10} w={200} h={90}>
          <div style={{ fontSize: 11, fontFamily: FM, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Active Referrals</div>
          <div style={{ fontSize: 28, fontFamily: FD, fontWeight: 600, color: C.textPrimary, marginTop: 'auto' }}>23</div>
        </FPanel>

        {/* Connection beams */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'translateZ(0)', overflow: 'visible' }}>
          <line x1="50%" y1="50%" x2="calc(50% + 420px)" y2="calc(50% - 80px)" stroke={C.purple} strokeWidth={2} opacity={0.35} strokeDasharray="8 12">
            <animate attributeName="stroke-dashoffset" values="40;0" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="50%" y1="50%" x2="calc(50% - 420px)" y2="calc(50% + 120px)" stroke={C.teal} strokeWidth={2} opacity={0.35} strokeDasharray="8 12">
            <animate attributeName="stroke-dashoffset" values="0;40" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="50%" y1="50%" x2="calc(50% - 100px)" y2="calc(50% - 320px)" stroke={C.teal} strokeWidth={1.5} opacity={0.25} strokeDasharray="6 10">
            <animate attributeName="stroke-dashoffset" values="32;0" dur="1.8s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 4 — MONUMENT (Final brand resolve)
// ============================================================================
const Act4Monument: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - T.MONUMENT_START;
  if (frame < T.MONUMENT_START) return null;

  const scale = interpolate(sp(lf, 5), [0, 1], [0.8, 1]);
  const textOp = interpolate(lf, [25, 40], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(spSoft(lf, 25), [0, 1], [20, 0]);
  const tagOp = interpolate(lf, [45, 60], [0, 1], { extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(lf, 45), [0, 1], [15, 0]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Volumetric beam */}
      <div style={{
        position: 'absolute', top: '-15%', left: '50%', width: 1000, height: 1000, marginLeft: -500,
        background: `conic-gradient(from ${lf * 0.5}deg at 50% 50%, transparent 100deg, ${C.purpleGlow} 170deg, transparent 240deg)`,
        opacity: interpolate(lf, [0, 30], [0, 0.35], { extrapolateRight: 'clamp' }),
        filter: 'blur(50px)',
      }} />

      {/* Secondary radial bloom */}
      <div style={{
        position: 'absolute', width: 600, height: 600,
        background: `radial-gradient(circle, ${C.purpleGlow} 0%, transparent 60%)`,
        opacity: 0.3, transform: `scale(${1 + Math.sin(lf / 10) * 0.08})`,
      }} />

      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
        <div style={{
          width: 160, height: 160, borderRadius: 36,
          background: C.panelBg, border: '1.5px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 30px 100px ${C.purpleGlow}`,
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FD, fontSize: 48, color: C.textPrimary, marginTop: 40,
          letterSpacing: '-0.02em', fontStyle: 'italic', opacity: textOp,
          transform: `translateY(${textY}px)`,
        }}>
          The Privacy Engine.
        </div>

        <div style={{
          fontFamily: FM, fontSize: 15, color: C.textSecondary, marginTop: 18,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          opacity: tagOp * 0.7, transform: `translateY(${tagY}px)`,
        }}>
          realmxai.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const RealmxFlagshipV2: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Global dot grid */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.5,
      }} />

      {/* All acts render based on frame — overlapping for seamless transitions */}
      <Sequence from={T.FORGE_START} durationInFrames={T.FORGE_END + 30}>
        <Act1Forge frame={frame} />
      </Sequence>

      <Sequence from={0} durationInFrames={DURATION}>
        <Act2Dive frame={frame} />
        <ActSculpture frame={frame} />
        <Act3Orbit frame={frame} />
        <Act4Monument frame={frame} />
      </Sequence>

      {/* Cinematic vignette */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Top/bottom letterbox bars for cinematic feel */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
    </AbsoluteFill>
  );
};
