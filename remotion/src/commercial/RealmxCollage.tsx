import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// TIMING (540 frames @ 30fps = 18s)
// ============================================================================
const DURATION = 540;

// ============================================================================
// PALETTE — pastel neon gradients
// ============================================================================
const C = {
  pink: '#FF6B9D',
  pinkSoft: '#FFB4D2',
  pinkBg: 'rgba(255, 107, 157, 0.12)',
  cyan: '#00D4FF',
  cyanSoft: '#7EECFF',
  cyanBg: 'rgba(0, 212, 255, 0.12)',
  violet: '#8B5CF6',
  violetSoft: '#C4B5FD',
  violetBg: 'rgba(139, 92, 246, 0.12)',
  mint: '#34D399',
  mintSoft: '#86EFAC',
  mintBg: 'rgba(52, 211, 153, 0.12)',
  white: '#FFFFFF',
  dark: '#1A1032',
  darkSoft: '#2D1F4E',
  textDark: '#0F0A1A',
  textMid: '#4A3B6B',
  textMuted: '#8B7BAA',
  cardBg: 'rgba(255,255,255,0.92)',
  cardShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
  glass: 'rgba(255,255,255,0.65)',
};

const FD = '"Fraunces", serif';
const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';

// Springs
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 14, stiffness: 110, mass: 0.7 } });
const spSnap = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 10, stiffness: 150, mass: 0.5 } });

// ============================================================================
// SHIMMER GRADIENT BACKGROUND
// ============================================================================
const ShimmerBg: React.FC<{ frame: number }> = ({ frame }) => {
  const hue1 = interpolate(frame, [0, DURATION], [300, 420]);
  const hue2 = interpolate(frame, [0, DURATION], [180, 300]);
  const angle = interpolate(frame, [0, DURATION], [120, 260]);
  const x = 50 + Math.sin(frame / 40) * 15;
  const y = 50 + Math.cos(frame / 55) * 10;

  return (
    <AbsoluteFill style={{
      background: `
        linear-gradient(${angle}deg,
          hsla(${hue1}, 85%, 88%, 1) 0%,
          hsla(${hue1 + 30}, 80%, 92%, 1) 25%,
          hsla(${hue2}, 75%, 90%, 1) 50%,
          hsla(${hue2 + 40}, 80%, 88%, 1) 75%,
          hsla(${hue1 - 20}, 85%, 86%, 1) 100%
        )`,
    }}>
      {/* Secondary radial pulse */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        background: `radial-gradient(circle at ${x}% ${y}%, hsla(${hue2}, 90%, 85%, 0.5) 0%, transparent 50%)`,
      }} />
      {/* Grid overlay */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        opacity: 0.3,
      }} />
    </AbsoluteFill>
  );
};

// ============================================================================
// CHECKERBOARD TRANSITION
// ============================================================================
const Checkerboard: React.FC<{ frame: number; startFrame: number; endFrame: number; color?: string }> = ({
  frame, startFrame, endFrame, color = C.violet,
}) => {
  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (progress <= 0 || progress >= 1) return null;
  const cols = 12; const rows = 8;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols; const row = Math.floor(i / cols);
        const w = 1920 / cols; const h = 1080 / rows;
        const delay = (col + row) * 0.03;
        const cellProgress = interpolate(progress, [delay, delay + 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const fadeOut = interpolate(progress, [0.5 + delay * 0.5, 0.5 + delay * 0.5 + 0.3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const scale = cellProgress * fadeOut;
        if (scale <= 0) return null;
        return (
          <div key={i} style={{
            position: 'absolute', left: col * w, top: row * h,
            width: w, height: h, background: color, opacity: scale * 0.6,
            transform: `scale(${scale})`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

// ============================================================================
// SLIDING TYPOGRAPHY — large words from edges
// ============================================================================
const SlideWord: React.FC<{
  text: string; frame: number; inFrame: number; outFrame: number;
  from: 'left' | 'right' | 'top' | 'bottom';
  y?: number; x?: number; size?: number; color?: string; rotation?: number;
  strokeOnly?: boolean;
}> = ({ text, frame, inFrame, outFrame, from, y = 0, x = 0, size = 140, color = C.textDark, rotation = 0, strokeOnly = false }) => {
  const progress = interpolate(frame, [inFrame, inFrame + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [outFrame - 8, outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(progress, fadeOut);
  if (op <= 0) return null;

  const slideAmt = 400;
  const offsets = {
    left: { tx: interpolate(progress, [0, 1], [-slideAmt, 0]), ty: 0 },
    right: { tx: interpolate(progress, [0, 1], [slideAmt, 0]), ty: 0 },
    top: { tx: 0, ty: interpolate(progress, [0, 1], [-slideAmt, 0]) },
    bottom: { tx: 0, ty: interpolate(progress, [0, 1], [slideAmt, 0]) },
  };

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: FB, fontSize: size, fontWeight: 900,
      color: strokeOnly ? 'transparent' : color,
      WebkitTextStroke: strokeOnly ? `2px ${color}` : 'none',
      letterSpacing: '-0.06em', lineHeight: 0.9, textTransform: 'uppercase',
      opacity: op, whiteSpace: 'nowrap',
      transform: `translate(${offsets[from].tx}px, ${offsets[from].ty}px) rotate(${rotation}deg)`,
    }}>
      {text}
    </div>
  );
};

// ============================================================================
// MESSAGE TICKER — cycling phrases
// ============================================================================
const MESSAGES = [
  'Earn points fast', 'Invite friends seamlessly', 'Protect your data',
  'Run your node', 'Climb the ranks', 'Privacy is power',
  'Share & earn', 'Join the movement', 'Own your identity',
];

const MessageTicker: React.FC<{ frame: number; y: number; speed?: number; dir?: 1 | -1 }> = ({
  frame, y, speed = 2, dir = 1,
}) => {
  const offset = (frame * speed * dir) % (MESSAGES.length * 260);

  return (
    <div style={{
      position: 'absolute', left: 0, top: y, width: '100%', height: 44,
      overflow: 'hidden', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', gap: 20, whiteSpace: 'nowrap',
        transform: `translateX(${-offset}px)`,
      }}>
        {[...MESSAGES, ...MESSAGES, ...MESSAGES].map((msg, i) => (
          <div key={i} style={{
            padding: '8px 20px', borderRadius: 999,
            background: i % 4 === 0 ? C.pinkBg : i % 4 === 1 ? C.cyanBg : i % 4 === 2 ? C.violetBg : C.mintBg,
            border: `1px solid ${i % 4 === 0 ? C.pinkSoft : i % 4 === 1 ? C.cyanSoft : i % 4 === 2 ? C.violetSoft : C.mintSoft}50`,
            fontSize: 13, fontFamily: FM, fontWeight: 600,
            color: i % 4 === 0 ? C.pink : i % 4 === 1 ? '#0098B3' : i % 4 === 2 ? C.violet : '#1A9A6A',
          }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MINI GLASS CARD
// ============================================================================
const MiniCard: React.FC<{
  children: React.ReactNode; width?: number; height?: number;
  accentColor?: string; style?: React.CSSProperties;
}> = ({ children, width = 200, height, accentColor, style }) => (
  <div style={{
    width, height, background: C.cardBg,
    border: `1px solid rgba(255,255,255,0.8)`,
    borderRadius: 16, boxShadow: C.cardShadow,
    padding: 14, display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden', ...style,
  }}>
    {accentColor && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accentColor,
      }} />
    )}
    {children}
  </div>
);

// ============================================================================
// PHONE MOCKUP — simplified device frame
// ============================================================================
const PhoneMockup: React.FC<{
  children: React.ReactNode; frame: number; enterDelay: number;
  x: number; y: number; rotation?: number; scale?: number;
  exitFrame?: number;
}> = ({ children, frame, enterDelay, x, y, rotation = 0, scale: s = 1, exitFrame = 480 }) => {
  const enter = sp(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideY = interpolate(enter, [0, 1], [80, 0]);
  const hover = Math.sin((frame + enterDelay * 3) / 25) * 6;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      width: 220, height: 420,
      borderRadius: 24, background: '#111',
      border: '3px solid rgba(255,255,255,0.2)',
      boxShadow: `0 20px 60px rgba(0,0,0,0.15), 0 0 30px ${C.violet}15`,
      overflow: 'hidden', padding: 4,
      opacity: enter * exitOp,
      transform: `rotate(${rotation}deg) scale(${s * interpolate(enter, [0, 1], [0.85, 1])}) translateY(${slideY}px)`,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 20,
        overflow: 'hidden', background: '#F8F4FF',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          height: 24, background: C.violet,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 4, padding: '0 12px',
        }}>
          <div style={{ width: 50, height: 12, background: '#000', borderRadius: 10 }} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: 8 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PHONE SCREEN CONTENTS
// ============================================================================
const DashboardScreen: React.FC<{ frame: number }> = ({ frame }) => {
  const pts = Math.floor(interpolate(frame, [0, DURATION], [8420, 8980], { extrapolateRight: 'clamp' }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 9, fontFamily: FM, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Dashboard
      </div>
      <div style={{ background: C.violetBg, borderRadius: 10, padding: '10px 8px' }}>
        <div style={{ fontSize: 8, fontFamily: FM, color: C.violet }}>Total Points</div>
        <div style={{ fontSize: 22, fontFamily: FM, fontWeight: 700, color: C.textDark }}>{pts.toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, background: C.mintBg, borderRadius: 8, padding: 6 }}>
          <div style={{ fontSize: 7, fontFamily: FM, color: C.mint }}>Rank</div>
          <div style={{ fontSize: 14, fontFamily: FB, fontWeight: 700, color: C.textDark }}>#15</div>
        </div>
        <div style={{ flex: 1, background: C.pinkBg, borderRadius: 8, padding: 6 }}>
          <div style={{ fontSize: 7, fontFamily: FM, color: C.pink }}>Refs</div>
          <div style={{ fontSize: 14, fontFamily: FB, fontWeight: 700, color: C.textDark }}>23</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.mint }} />
        <span style={{ fontSize: 8, fontFamily: FB, color: C.mint, fontWeight: 600 }}>Node Active</span>
      </div>
      {/* Mini bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 35, marginTop: 4 }}>
        {[0.3, 0.5, 0.4, 0.7, 0.6, 0.9, 0.8, 0.5, 0.7, 0.95].map((h, i) => (
          <div key={i} style={{
            flex: 1, height: h * 35, borderRadius: 2,
            background: i >= 8 ? C.violet : `${C.violet}40`,
          }} />
        ))}
      </div>
    </div>
  );
};

const ReferralScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 9, fontFamily: FM, color: C.pink, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      Invite Friends
    </div>
    {['Sarah K.', 'Marcus T.', 'Priya N.'].map((name, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 8px', borderRadius: 10,
        background: i === 0 ? C.pinkBg : 'rgba(255,255,255,0.5)',
        border: `1px solid ${i === 0 ? C.pinkSoft : 'rgba(0,0,0,0.04)'}50`,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: [C.pink, C.cyan, C.violet][i],
          fontSize: 9, fontFamily: FB, fontWeight: 700, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{name[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontFamily: FB, fontWeight: 600, color: C.textDark }}>{name}</div>
          <div style={{ fontSize: 8, fontFamily: FM, color: C.mint }}>+50 pts</div>
        </div>
      </div>
    ))}
    <div style={{
      padding: '8px 0', borderRadius: 10, background: C.pink,
      textAlign: 'center', fontSize: 10, fontFamily: FB, fontWeight: 700, color: '#fff',
      marginTop: 4,
    }}>
      Send Invite →
    </div>
  </div>
);

const WalletScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 9, fontFamily: FM, color: C.cyan, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      Points Wallet
    </div>
    <div style={{ background: `linear-gradient(135deg, ${C.violet}, ${C.pink})`, borderRadius: 12, padding: 10, color: '#fff' }}>
      <div style={{ fontSize: 8, fontFamily: FM, opacity: 0.8 }}>Balance</div>
      <div style={{ fontSize: 24, fontFamily: FM, fontWeight: 700 }}>8,523</div>
      <div style={{ fontSize: 8, fontFamily: FM, opacity: 0.7, marginTop: 4 }}>≈ $42.60</div>
    </div>
    {[{ label: 'Referral Bonus', amt: '+250', c: C.mint }, { label: 'Session Reward', amt: '+108', c: C.cyan }, { label: 'Daily Bonus', amt: '+50', c: C.violet }].map((tx, i) => (
      <div key={i} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '5px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.6)',
      }}>
        <span style={{ fontSize: 9, fontFamily: FB, color: C.textDark }}>{tx.label}</span>
        <span style={{ fontSize: 10, fontFamily: FM, fontWeight: 700, color: tx.c }}>{tx.amt}</span>
      </div>
    ))}
  </div>
);

const NodeScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 9, fontFamily: FM, color: C.mint, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
      Node Status
    </div>
    <div style={{
      background: C.mintBg, borderRadius: 12, padding: 10,
      display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.mint}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, fontFamily: FM, fontWeight: 700, color: C.mint }}>ON</div>
      </div>
      <div style={{ fontSize: 12, fontFamily: FB, fontWeight: 700, color: C.textDark }}>Running</div>
      <div style={{ fontSize: 8, fontFamily: FM, color: C.textMuted }}>Uptime: 99.8%</div>
    </div>
    <div style={{ display: 'flex', gap: 4 }}>
      <div style={{ flex: 1, background: C.cyanBg, borderRadius: 8, padding: 6, textAlign: 'center' }}>
        <div style={{ fontSize: 7, fontFamily: FM, color: '#0098B3' }}>Session</div>
        <div style={{ fontSize: 12, fontFamily: FM, fontWeight: 700, color: C.textDark }}>4:32h</div>
      </div>
      <div style={{ flex: 1, background: C.violetBg, borderRadius: 8, padding: 6, textAlign: 'center' }}>
        <div style={{ fontSize: 7, fontFamily: FM, color: C.violet }}>Epoch</div>
        <div style={{ fontSize: 12, fontFamily: FM, fontWeight: 700, color: C.textDark }}>65%</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// POINTS RECEIPT
// ============================================================================
const PointsReceipt: React.FC<{
  frame: number; enterDelay: number; x: number; y: number; rotation?: number;
  exitFrame?: number;
}> = ({ frame, enterDelay, x, y, rotation = 0, exitFrame = 480 }) => {
  const enter = spSnap(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hover = Math.sin((frame + enterDelay * 5) / 30) * 5;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      opacity: enter * exitOp,
      transform: `rotate(${rotation}deg) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
    }}>
      <MiniCard width={145} accentColor={C.mint}>
        <div style={{ fontSize: 8, fontFamily: FM, color: C.mint, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Receipt
        </div>
        <div style={{ fontSize: 20, fontFamily: FM, fontWeight: 700, color: C.textDark, marginTop: 4 }}>+142</div>
        <div style={{ fontSize: 9, fontFamily: FB, color: C.textMuted }}>points earned</div>
        <div style={{ width: '100%', height: 1, background: 'rgba(0,0,0,0.06)', margin: '6px 0' }} />
        <div style={{ fontSize: 8, fontFamily: FM, color: C.textMuted }}>Session #1247</div>
      </MiniCard>
    </div>
  );
};

// ============================================================================
// RANKING STRIP
// ============================================================================
const RankStrip: React.FC<{
  frame: number; enterDelay: number; x: number; y: number; exitFrame?: number;
}> = ({ frame, enterDelay, x, y, exitFrame = 480 }) => {
  const enter = sp(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const drift = Math.sin((frame + enterDelay) / 35) * 8;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + drift,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.85, 1])})`,
    }}>
      <MiniCard width={220} accentColor={C.violet} style={{ padding: 10 }}>
        <div style={{ fontSize: 8, fontFamily: FM, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
          Rankings
        </div>
        {['CryptoKing', 'PrivacyFan', 'NodeMaster'].map((name, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none',
          }}>
            <span style={{ fontSize: 11, fontFamily: FM, fontWeight: 700, color: C.violet, width: 16 }}>#{i + 1}</span>
            <span style={{ fontSize: 10, fontFamily: FB, color: C.textDark, flex: 1 }}>{name}</span>
            <span style={{ fontSize: 9, fontFamily: FM, color: C.mint }}>{[12400, 11800, 10230][i]}pts</span>
          </div>
        ))}
      </MiniCard>
    </div>
  );
};

// ============================================================================
// NEW REFERRAL ANNOUNCEMENT
// ============================================================================
const RefAnnounce: React.FC<{
  name: string; frame: number; enterDelay: number; x: number; y: number; exitFrame?: number;
}> = ({ name, frame, enterDelay, x, y, exitFrame = enterDelay + 70 }) => {
  const enter = spSnap(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (enter <= 0 && frame < enterDelay) return null;

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 14px', borderRadius: 14,
      background: C.cardBg, border: `1px solid ${C.pinkSoft}60`,
      boxShadow: `0 6px 20px ${C.pink}15`,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])}) translateX(${interpolate(enter, [0, 1], [30, 0])}px)`,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: C.pink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontFamily: FB, fontWeight: 700, color: '#fff',
      }}>{name[0]}</div>
      <div>
        <div style={{ fontSize: 11, fontFamily: FB, fontWeight: 600, color: C.textDark }}>🎉 {name} joined!</div>
        <div style={{ fontSize: 9, fontFamily: FM, color: C.mint }}>+50 bonus pts</div>
      </div>
    </div>
  );
};

// ============================================================================
// VERTICAL CASCADE MODULE
// ============================================================================
const CascadeModule: React.FC<{
  frame: number; x: number; startFrame: number;
}> = ({ frame, x, startFrame }) => {
  const lf = frame - startFrame;
  if (lf < 0) return null;
  const speed = 1.8;
  const modules = [
    { label: 'Wallet Connect', icon: '🔗', color: C.cyan },
    { label: 'Google Verify', icon: '✓', color: C.mint },
    { label: 'Node Activate', icon: '⚡', color: C.violet },
    { label: 'Referral Link', icon: '🔄', color: C.pink },
    { label: 'Session Start', icon: '▶', color: C.cyan },
    { label: 'Points Claim', icon: '★', color: C.mint },
  ];

  const exitOp = interpolate(frame, [480, 500], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', left: x, top: 0, bottom: 0, width: 160, overflow: 'hidden', opacity: exitOp }}>
      {modules.map((mod, i) => {
        const baseY = -140 + (lf * speed + i * 150) % (modules.length * 150 + 200);
        const yPosition = baseY;
        if (yPosition < -150 || yPosition > 1100) return null;

        return (
          <div key={i} style={{
            position: 'absolute', left: 0, top: yPosition,
            width: 150, padding: '10px 12px', borderRadius: 14,
            background: C.cardBg, border: `1px solid rgba(255,255,255,0.7)`,
            boxShadow: `0 4px 16px ${mod.color}12`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `${mod.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>{mod.icon}</div>
            <div>
              <div style={{ fontSize: 10, fontFamily: FB, fontWeight: 600, color: C.textDark }}>{mod.label}</div>
              <div style={{ width: 60, height: 3, borderRadius: 2, background: `${mod.color}30`, marginTop: 3 }}>
                <div style={{ width: '75%', height: '100%', borderRadius: 2, background: mod.color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// FLOATING ACCENT BLOBS
// ============================================================================
const FloatingBlob: React.FC<{
  x: number; y: number; size: number; color: string; frame: number; speed?: number;
}> = ({ x, y, size, color, frame, speed = 50 }) => {
  const dx = Math.sin(frame / speed) * 30;
  const dy = Math.cos(frame / (speed * 1.3)) * 20;
  return (
    <div style={{
      position: 'absolute', left: x + dx, top: y + dy,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      opacity: 0.25, pointerEvents: 'none', filter: 'blur(10px)',
    }} />
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const RealmxCollage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const outOp = interpolate(frame, [490, 510], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroOp = interpolate(frame, [500, 520], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroScale = interpolate(sp(frame, 500, fps), [0, 1], [0.85, 1]);
  const outroTagOp = interpolate(frame, [520, 540], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {/* SHIMMER BG */}
      <ShimmerBg frame={frame} />

      {/* FLOATING BLOBS */}
      <FloatingBlob x={100} y={200} size={300} color={C.pinkSoft} frame={frame} speed={60} />
      <FloatingBlob x={1500} y={100} size={250} color={C.cyanSoft} frame={frame} speed={70} />
      <FloatingBlob x={800} y={700} size={280} color={C.violetSoft} frame={frame} speed={55} />
      <FloatingBlob x={300} y={800} size={200} color={C.mintSoft} frame={frame} speed={80} />

      {/* ── CONTENT LAYER (fades out before outro) ── */}
      <div style={{ position: 'absolute', inset: 0, opacity: outOp }}>

        {/* MESSAGE TICKERS */}
        <MessageTicker frame={frame} y={20} speed={1.5} dir={1} />
        <MessageTicker frame={frame} y={1020} speed={2} dir={-1} />

        {/* ── SLIDING TYPOGRAPHY ── */}
        {/* Phase 1 */}
        <SlideWord text="PRIVACY" frame={frame} inFrame={8} outFrame={100} from="left" y={160} x={-30} size={160} color={`${C.textDark}12`} strokeOnly />
        <SlideWord text="POINTS" frame={frame} inFrame={20} outFrame={110} from="right" y={300} x={800} size={150} color={`${C.violet}20`} strokeOnly />
        <SlideWord text="REFERRAL" frame={frame} inFrame={35} outFrame={120} from="bottom" y={550} x={-50} size={140} color={`${C.pink}18`} strokeOnly />
        {/* Phase 2 */}
        <SlideWord text="NODES" frame={frame} inFrame={130} outFrame={230} from="right" y={100} x={900} size={180} color={`${C.cyan}15`} strokeOnly />
        <SlideWord text="EARN" frame={frame} inFrame={150} outFrame={250} from="left" y={450} x={-20} size={200} color={`${C.mint}20`} strokeOnly />
        {/* Phase 3 */}
        <SlideWord text="PROTECT" frame={frame} inFrame={260} outFrame={360} from="top" y={200} x={400} size={160} color={`${C.violet}15`} strokeOnly />
        <SlideWord text="SHARE" frame={frame} inFrame={280} outFrame={380} from="right" y={600} x={700} size={170} color={`${C.pink}18`} strokeOnly />
        {/* Phase 4 */}
        <SlideWord text="GROW" frame={frame} inFrame={370} outFrame={470} from="left" y={350} x={-40} size={190} color={`${C.mint}15`} strokeOnly />

        {/* ── PHONE MOCKUPS ── */}
        <PhoneMockup frame={frame} enterDelay={15} x={80} y={180} rotation={-5} scale={0.9}>
          <DashboardScreen frame={frame} />
        </PhoneMockup>

        <PhoneMockup frame={frame} enterDelay={40} x={1600} y={200} rotation={6} scale={0.85}>
          <ReferralScreen />
        </PhoneMockup>

        <PhoneMockup frame={frame} enterDelay={80} x={700} y={100} rotation={-3} scale={0.88}>
          <WalletScreen />
        </PhoneMockup>

        <PhoneMockup frame={frame} enterDelay={120} x={1200} y={250} rotation={4} scale={0.82}>
          <NodeScreen />
        </PhoneMockup>

        {/* ── RECEIPTS ── */}
        <PointsReceipt frame={frame} enterDelay={60} x={350} y={500} rotation={-3} />
        <PointsReceipt frame={frame} enterDelay={200} x={1050} y={600} rotation={4} />

        {/* ── RANK STRIP ── */}
        <RankStrip frame={frame} enterDelay={100} x={380} y={160} />
        <RankStrip frame={frame} enterDelay={250} x={950} y={50} />

        {/* ── REFERRAL ANNOUNCEMENTS (cycling) ── */}
        <RefAnnounce name="Emma" frame={frame} enterDelay={70} x={540} y={650} />
        <RefAnnounce name="Alex" frame={frame} enterDelay={160} x={1350} y={700} />
        <RefAnnounce name="Jade" frame={frame} enterDelay={260} x={600} y={720} />
        <RefAnnounce name="Kai" frame={frame} enterDelay={350} x={1400} y={650} />

        {/* ── VERTICAL CASCADES ── */}
        <CascadeModule frame={frame} x={1780} startFrame={50} />
        <CascadeModule frame={frame} x={-10} startFrame={130} />

        {/* ── SOLID HEADLINE OVERLAYS ── */}
        <SlideWord text="JOIN." frame={frame} inFrame={140} outFrame={200} from="left" y={440} x={480} size={90} color={C.textDark} />
        <SlideWord text="EARN." frame={frame} inFrame={240} outFrame={310} from="right" y={420} x={580} size={90} color={C.violet} />
        <SlideWord text="SHARE." frame={frame} inFrame={340} outFrame={410} from="left" y={440} x={520} size={90} color={C.pink} />
        <SlideWord text="PROTECT." frame={frame} inFrame={410} outFrame={480} from="bottom" y={430} x={380} size={90} color={C.textDark} />
      </div>

      {/* ── CHECKERBOARD TRANSITIONS ── */}
      <Checkerboard frame={frame} startFrame={125} endFrame={145} color={C.violetSoft} />
      <Checkerboard frame={frame} startFrame={255} endFrame={275} color={C.cyanSoft} />
      <Checkerboard frame={frame} startFrame={365} endFrame={385} color={C.pinkSoft} />

      {/* ── OUTRO ── */}
      {frame >= 495 && (
        <AbsoluteFill style={{
          alignItems: 'center', justifyContent: 'center', opacity: outroOp,
        }}>
          <ShimmerBg frame={frame} />

          <div style={{ transform: `scale(${outroScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{
              width: 110, height: 110, borderRadius: 28,
              background: `linear-gradient(135deg, ${C.violet}, ${C.pink})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 20px 60px ${C.violet}40`,
            }}>
              <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
            </div>

            <div style={{
              marginTop: 28, fontFamily: FD, fontSize: 36, fontWeight: 500, fontStyle: 'italic',
              color: C.textDark, opacity: outroTagOp,
            }}>
              Realm<span style={{ color: C.violet, fontStyle: 'normal', fontWeight: 700 }}>X</span>AI
            </div>

            <div style={{
              marginTop: 14, fontFamily: FM, fontSize: 14, color: C.violet,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              opacity: outroTagOp * 0.8,
            }}>
              realmxai.com
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
