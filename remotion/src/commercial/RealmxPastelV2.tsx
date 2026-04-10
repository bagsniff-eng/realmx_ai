import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// TIMING (540 frames @ 30fps = 18s)
// ============================================================================
const FPS = 30;
const DURATION = 540;

// Phase boundaries (continuous — no hard cuts)
const P = {
  HEADLINES_IN: 0,
  HEADLINES_OUT: 120,       // 0–4s: rotating whisper headlines
  CLUSTER_A_IN: 80,         // overlap! cards start arriving before headlines fully vanish
  CLUSTER_A_SETTLE: 180,
  REARRANGE_START: 240,     // 8s: cards begin sliding to new positions
  REARRANGE_SETTLE: 320,
  WALLETS_IN: 280,          // wallet cards glide in during rearrangement
  STATEMENT_IN: 330,        // 11s: embedded gradient copy
  STATEMENT_OUT: 420,
  OUTRO_IN: 400,            // 13.3s
  END: 540,
};

// ============================================================================
// PALETTE
// ============================================================================
const C = {
  bgLavender: '#E8E0F0',
  bgTurquoise: '#D0F0EE',
  bgMidPink: '#F0E0EC',
  textDeep: '#1E1B4B',
  textIndigo: '#4338CA',
  textMuted: '#6B7280',
  accent: '#8B5CF6',
  teal: '#14B8A6',
  green: '#10B981',
  amber: '#F59E0B',
  cardBg: 'rgba(255, 255, 255, 0.62)',
  cardBorder: 'rgba(255, 255, 255, 0.85)',
  cardShadow: '0 16px 48px rgba(30, 27, 75, 0.06)',
};

const FONT_DISPLAY = '"Fraunces", serif';
const FONT_MONO = '"IBM Plex Mono", monospace';
const FONT_BODY = '"Source Sans 3", sans-serif';

// ============================================================================
// SPRING HELPERS
// ============================================================================
const sp = (frame: number, delay: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 16, stiffness: 100, mass: 0.8 } });

const spSoft = (frame: number, delay: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 20, stiffness: 70, mass: 1.2 } });

const spBouncy = (frame: number, delay: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 12, stiffness: 120, mass: 1 } });

// Linear glide between a → b driven by frame window
const glide = (frame: number, startF: number, endF: number, from: number, to: number) =>
  interpolate(frame, [startF, endF], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// ============================================================================
// ICONS (inline SVGs for clean rendering)
// ============================================================================
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ShieldIcon = ({ size = 20, color = C.accent }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12.08c0-.85-.08-1.68-.22-2.48H12v4.69h5.69a5.4 5.4 0 0 1-2.35 3.55v2.94h3.8C21.36 18.73 22 15.65 22 12.08z" />
    <path d="M12 22c2.81 0 5.18-.93 6.9-2.52l-3.8-2.94c-.94.63-2.14 1.01-3.1 1.01-2.4 0-4.43-1.62-5.16-3.8H2.9v3.04C4.64 20.25 8.04 22 12 22z" />
    <path d="M6.84 13.75a6.04 6.04 0 0 1 0-3.5V7.21H2.9a10.05 10.05 0 0 0 0 9.58l3.94-3.04z" />
    <path d="M12 5.38c1.53 0 2.91.53 3.99 1.55l2.99-2.99C17.17 2.16 14.8 1 12 1 8.04 1 4.64 2.75 2.9 6.25l3.94 3.04C7.57 7 9.6 5.38 12 5.38z" />
  </svg>
);

const StarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

// ============================================================================
// GLASS CARD
// ============================================================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width, height, style }) => (
  <div style={{
    background: C.cardBg,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '24px',
    boxShadow: C.cardShadow,
    width, height,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }}>
    {/* Gentle highlight sweep */}
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '24px', pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
    }} />
    {children}
  </div>
);

// ============================================================================
// DASHBOARD CARDS
// ============================================================================

const NodeStatusCard: React.FC = () => {
  const frame = useCurrentFrame();
  const uptime = interpolate(frame, [0, DURATION], [99.82, 99.99]);
  return (
    <GlassCard width={310} height={175} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          Node Status
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.green, boxShadow: `0 0 12px ${C.green}` }} />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 46, fontFamily: FONT_DISPLAY, fontWeight: 500, color: C.textDeep }}>{uptime.toFixed(2)}%</div>
        <div style={{ fontSize: 15, color: C.textMuted, fontFamily: FONT_BODY }}>Session Uptime</div>
      </div>
    </GlassCard>
  );
};

const PointsBalanceCard: React.FC = () => {
  const frame = useCurrentFrame();
  const pts = Math.floor(interpolate(frame, [0, DURATION], [12480, 12612], { extrapolateRight: 'clamp' }));
  const bar = interpolate(frame, [0, DURATION], [58, 72], { extrapolateRight: 'clamp' });
  return (
    <GlassCard width={310} height={175} style={{ position: 'relative' }}>
      <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
        Points Balance
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 44, fontFamily: FONT_MONO, fontWeight: 600, color: C.textDeep }}>
          {pts.toLocaleString()}
        </div>
        <div style={{ width: '100%', height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${bar}%`, height: '100%', background: `linear-gradient(90deg, ${C.textIndigo}, ${C.accent})`, borderRadius: 3 }} />
        </div>
      </div>
    </GlassCard>
  );
};

const ReferralCodeCard: React.FC = () => (
  <GlassCard width={310} height={115} style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
    <div>
      <div style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>
        Referral Code
      </div>
      <div style={{
        fontSize: 19, fontFamily: FONT_MONO, fontWeight: 500, color: C.textDeep,
        background: 'rgba(255,255,255,0.55)', padding: '7px 14px', borderRadius: 10,
      }}>
        RLMX-8A2F
      </div>
    </div>
    <div style={{ color: C.textIndigo, background: 'rgba(255,255,255,0.75)', padding: 12, borderRadius: '50%' }}>
      <CopyIcon />
    </div>
  </GlassCard>
);

const RankCard: React.FC = () => (
  <GlassCard width={155} height={155} style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <StarIcon />
    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1px' }}>
      Global Rank
    </div>
    <div style={{ fontSize: 34, fontFamily: FONT_DISPLAY, fontWeight: 600, color: C.textDeep }}>#15</div>
  </GlassCard>
);

const ActiveReferralsCard: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.floor(interpolate(frame, [0, DURATION], [7, 12], { extrapolateRight: 'clamp' }));
  return (
    <GlassCard width={240} height={130} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <UsersIcon />
        <span style={{ fontSize: 13, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          Active Referrals
        </span>
      </div>
      <div style={{ marginTop: 'auto', fontSize: 42, fontFamily: FONT_DISPLAY, fontWeight: 600, color: C.textDeep }}>
        {count}
      </div>
    </GlassCard>
  );
};

const GrowthSummaryCard: React.FC = () => (
  <GlassCard width={260} height={110} style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 14 }}>
      <TrendUpIcon />
    </div>
    <div>
      <div style={{ fontSize: 22, fontFamily: FONT_BODY, fontWeight: 700, color: C.textDeep }}>+25 pts</div>
      <div style={{ fontSize: 14, color: C.textMuted, fontFamily: FONT_BODY }}>earned today</div>
    </div>
  </GlassCard>
);

const WalletConnectCard: React.FC<{ type: 'wallet' | 'google' }> = ({ type }) => (
  <GlassCard width={260} height={85} style={{ position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 14, padding: '0 20px' }}>
    <div style={{ padding: 9, background: 'rgba(255,255,255,0.8)', borderRadius: 14 }}>
      {type === 'wallet' ? <WalletIcon /> : <GoogleIcon />}
    </div>
    <div>
      <div style={{ fontSize: 16, fontFamily: FONT_BODY, fontWeight: 600, color: C.textDeep }}>
        {type === 'wallet' ? 'WalletConnect' : 'Google Account'}
      </div>
      <div style={{ fontSize: 13, color: C.green, fontFamily: FONT_MONO }}>Connected</div>
    </div>
  </GlassCard>
);

const PrivacyShieldCard: React.FC = () => (
  <GlassCard width={190} height={130} style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <ShieldIcon size={28} />
    <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
      Privacy
    </div>
    <div style={{ fontSize: 16, fontFamily: FONT_BODY, fontWeight: 600, color: C.green }}>Protected</div>
  </GlassCard>
);

// ============================================================================
// WHISPERED HEADLINE
// ============================================================================
const WhisperedText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    fontFamily: FONT_DISPLAY,
    fontWeight: 300,
    fontSize: 80,
    color: C.textDeep,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    margin: 0,
    ...style,
  }}>
    {children}
  </div>
);

// ============================================================================
// ANIMATED CARD WRAPPER — positions a card with spring entrance + continuous glide
// ============================================================================
const AnimCard: React.FC<{
  children: React.ReactNode;
  frame: number;
  enterDelay: number;
  // Position at two keyframes for sliding rearrangement
  pos1: { x: number; y: number };
  pos2?: { x: number; y: number };
  rearrangeStart?: number;
  rearrangeEnd?: number;
  exitFrame?: number;
  hoverAmp?: number;
  hoverSpeed?: number;
}> = ({
  children, frame, enterDelay,
  pos1, pos2, rearrangeStart = P.REARRANGE_START, rearrangeEnd = P.REARRANGE_SETTLE,
  exitFrame = P.OUTRO_IN + 20,
  hoverAmp = 8, hoverSpeed = 25,
}) => {
  const enter = sp(frame, enterDelay);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  // Exit
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Position interpolation (sliding rearrangement)
  const target = pos2 || pos1;
  const posX = pos2
    ? interpolate(frame, [rearrangeStart, rearrangeEnd], [pos1.x, target.x], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : pos1.x;
  const posY = pos2
    ? interpolate(frame, [rearrangeStart, rearrangeEnd], [pos1.y, target.y], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : pos1.y;

  // Gentle hover
  const hover = Math.sin((frame + enterDelay * 3) / hoverSpeed) * hoverAmp;

  return (
    <div style={{
      position: 'absolute',
      left: posX,
      top: posY + hover,
      opacity: opacity * exitOp,
      transform: `scale(${scale})`,
      transition: 'none',
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const RealmxPastelV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Background gradient that drifts through lavender → pink → turquoise ──
  const bgAngle = interpolate(frame, [0, DURATION], [130, 200]);
  const bgMid = interpolate(frame, [0, DURATION / 2, DURATION], [0, 1, 0]);

  // ── HEADLINES (rotate through 5 phrases) ──
  const headlines = [
    'Pseudonymous\nsecurity.',
    'Fair\nearnings.',
    'Privacy\nas capital.',
    'Effortless\nrewards.',
    'Zero-knowledge\ndesign.',
  ];
  const headlineDuration = 28; // frames per headline
  const headlineGap = 4;      // fade gap

  // ── LOGO WATERMARK (subtle, upper-right) ──
  const watermarkOpacity = interpolate(frame, [40, 60], [0, 0.08], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ── CLUSTER A entrance ──
  const clusterAVisible = frame >= P.CLUSTER_A_IN;

  // ── WALLETS entrance ──
  const walletsVisible = frame >= P.WALLETS_IN;

  // ── STATEMENT text ──
  const stmtTexts = [
    'Your privacy is in\ngrowth mode.',
    'Smart earning,\nzero complexity.',
  ];
  const stmtIndex = frame < (P.STATEMENT_IN + P.STATEMENT_OUT) / 2 ? 0 : 1;
  const stmtOp = (() => {
    if (frame < P.STATEMENT_IN) return 0;
    if (frame < P.STATEMENT_IN + 20) return interpolate(frame, [P.STATEMENT_IN, P.STATEMENT_IN + 20], [0, 1]);
    if (frame < P.STATEMENT_OUT - 20) return 1;
    if (frame < P.STATEMENT_OUT) return interpolate(frame, [P.STATEMENT_OUT - 20, P.STATEMENT_OUT], [1, 0]);
    return 0;
  })();
  const stmtY = interpolate(spSoft(frame, P.STATEMENT_IN, fps), [0, 1], [30, 0]);

  // ── OUTRO ──
  const outroOp = interpolate(frame, [P.OUTRO_IN, P.OUTRO_IN + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroScale = interpolate(spBouncy(frame, P.OUTRO_IN, fps), [0, 1], [0.9, 1]);
  const logoTextOp = interpolate(frame, [P.OUTRO_IN + 30, P.OUTRO_IN + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoTextY = interpolate(spSoft(frame, P.OUTRO_IN + 30, fps), [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${bgAngle}deg, ${C.bgLavender} 0%, ${bgMid > 0.5 ? C.bgMidPink : C.bgLavender} 40%, ${C.bgTurquoise} 100%)`,
      overflow: 'hidden',
    }}>

      {/* ── Subtle dot grid texture ── */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(30,27,75,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.6,
      }} />

      {/* ── Logo watermark, upper-right ── */}
      <div style={{
        position: 'absolute', top: 50, right: 60,
        opacity: watermarkOpacity,
      }}>
        <Img src={staticFile('logo.webp')} style={{ width: 80, height: 80, objectFit: 'contain' }} />
      </div>

      {/* ── ROTATING HEADLINES (upper-left) ── */}
      <div style={{ position: 'absolute', top: 140, left: 120 }}>
        {headlines.map((text, i) => {
          const start = i * (headlineDuration + headlineGap);
          const fadeIn = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fadeOut = interpolate(frame, [start + headlineDuration - 8, start + headlineDuration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const yOff = interpolate(frame, [start, start + headlineDuration], [16, -8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const visible = frame >= start && frame <= start + headlineDuration + headlineGap;
          if (!visible) return null;
          return (
            <div key={i} style={{ position: 'absolute', opacity: Math.min(fadeIn, fadeOut), transform: `translateY(${yOff}px)` }}>
              <WhisperedText>
                {text.split('\n').map((line, j) => (
                  <React.Fragment key={j}>{line}{j === 0 && <br />}</React.Fragment>
                ))}
              </WhisperedText>
            </div>
          );
        })}
      </div>

      {/* ── CLUSTER A: Main Dashboard Cards ── */}
      {clusterAVisible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Node Status — starts center-ish, slides left */}
          <AnimCard frame={frame} enterDelay={P.CLUSTER_A_IN}
            pos1={{ x: 560, y: 200 }} pos2={{ x: 100, y: 160 }}>
            <NodeStatusCard />
          </AnimCard>

          {/* Points Balance — starts below Node, slides center-left */}
          <AnimCard frame={frame} enterDelay={P.CLUSTER_A_IN + 8}
            pos1={{ x: 600, y: 420 }} pos2={{ x: 100, y: 380 }}>
            <PointsBalanceCard />
          </AnimCard>

          {/* Referral Code — starts right of center, slides up-right */}
          <AnimCard frame={frame} enterDelay={P.CLUSTER_A_IN + 16}
            pos1={{ x: 940, y: 260 }} pos2={{ x: 460, y: 160 }}>
            <ReferralCodeCard />
          </AnimCard>

          {/* Rank — starts far right, slides to center */}
          <AnimCard frame={frame} enterDelay={P.CLUSTER_A_IN + 22}
            pos1={{ x: 1320, y: 220 }} pos2={{ x: 460, y: 310 }}>
            <RankCard />
          </AnimCard>

          {/* Privacy Shield — appears during rearrangement */}
          <AnimCard frame={frame} enterDelay={P.REARRANGE_START + 10}
            pos1={{ x: 650, y: 310 }}>
            <PrivacyShieldCard />
          </AnimCard>

          {/* Active Referrals — appears during rearrangement */}
          <AnimCard frame={frame} enterDelay={P.REARRANGE_START + 18}
            pos1={{ x: 870, y: 160 }}>
            <ActiveReferralsCard />
          </AnimCard>

          {/* Growth Summary — appears during rearrangement, below referrals */}
          <AnimCard frame={frame} enterDelay={P.REARRANGE_START + 25}
            pos1={{ x: 870, y: 340 }}>
            <GrowthSummaryCard />
          </AnimCard>
        </div>
      )}

      {/* ── WALLET CARDS (glide in from right during rearrangement) ── */}
      {walletsVisible && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <AnimCard frame={frame} enterDelay={P.WALLETS_IN}
            pos1={{ x: 1200, y: 520 }} pos2={{ x: 1200, y: 520 }}
            hoverAmp={6} hoverSpeed={30}>
            <WalletConnectCard type="wallet" />
          </AnimCard>

          <AnimCard frame={frame} enterDelay={P.WALLETS_IN + 10}
            pos1={{ x: 1200, y: 630 }} pos2={{ x: 1200, y: 630 }}
            hoverAmp={6} hoverSpeed={28}>
            <WalletConnectCard type="google" />
          </AnimCard>
        </div>
      )}

      {/* ── EMBEDDED GRADIENT STATEMENTS ── */}
      {stmtOp > 0 && (
        <div style={{
          position: 'absolute', bottom: 120, left: 120,
          opacity: stmtOp,
          transform: `translateY(${stmtY}px)`,
        }}>
          <WhisperedText style={{ fontSize: 56 }}>
            {stmtTexts[stmtIndex].split('\n').map((line, j) => (
              <React.Fragment key={j}>{line}{j === 0 && <br />}</React.Fragment>
            ))}
          </WhisperedText>
        </div>
      )}

      {/* ── OUTRO (Logo + tagline) ── */}
      {frame >= P.OUTRO_IN && (
        <AbsoluteFill style={{
          alignItems: 'center', justifyContent: 'center',
          opacity: outroOp,
          background: `linear-gradient(${bgAngle}deg, ${C.bgLavender} 0%, ${C.bgTurquoise} 100%)`,
        }}>
          <div style={{
            transform: `scale(${outroScale})`,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{
              width: 110, height: 110, borderRadius: 28,
              background: C.textDeep,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 24px 64px rgba(30, 27, 75, 0.18)',
            }}>
              <Img src={staticFile('logo.webp')} style={{ width: '62%', height: '62%', objectFit: 'contain' }} />
            </div>

            <div style={{
              marginTop: 30,
              fontFamily: FONT_DISPLAY, fontSize: 36, color: C.textDeep,
              fontWeight: 500, fontStyle: 'italic',
              opacity: logoTextOp,
              transform: `translateY(${logoTextY}px)`,
            }}>
              Realm<span style={{ color: C.accent, fontStyle: 'normal' }}>X</span>AI
            </div>

            <div style={{
              marginTop: 16,
              fontFamily: FONT_MONO, fontSize: 14, color: C.textIndigo,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              opacity: logoTextOp * 0.7,
              transform: `translateY(${logoTextY * 1.2}px)`,
            }}>
              realmxai.com
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
