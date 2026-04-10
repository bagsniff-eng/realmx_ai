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

const P = {
  HEADLINES_END: 150,
  CLUSTER1_IN: 90,
  REARRANGE1_START: 200,
  REARRANGE1_END: 300,
  REARRANGE2_START: 310,
  REARRANGE2_END: 400,
  WALLETS_IN: 310,
  STMT1_IN: 340,
  STMT1_OUT: 410,
  STMT2_IN: 400,
  STMT2_OUT: 460,
  CARDS_EXIT: 440,
  OUTRO_IN: 460,
};

// ============================================================================
// PALETTE
// ============================================================================
const C = {
  bgLavender: '#E8E0F0',
  bgTurquoise: '#D0F0EE',
  bgMidPink: '#F0E0EC',
  bgPeach: '#F8E8E0',
  textDeep: '#1E1B4B',
  textIndigo: '#4338CA',
  textMuted: '#6B7280',
  accent: '#8B5CF6',
  teal: '#14B8A6',
  green: '#10B981',
  amber: '#F59E0B',
  cardBg: 'rgba(255, 255, 255, 0.60)',
  cardBorder: 'rgba(255, 255, 255, 0.85)',
  cardShadow: '0 16px 48px rgba(30, 27, 75, 0.06)',
};

const FONT_D = '"Fraunces", serif';
const FONT_M = '"IBM Plex Mono", monospace';
const FONT_B = '"Source Sans 3", sans-serif';

// ============================================================================
// SPRING HELPERS
// ============================================================================
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 16, stiffness: 100, mass: 0.8 } });

const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 22, stiffness: 60, mass: 1.4 } });

const spBouncy = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 12, stiffness: 120, mass: 1 } });

// ============================================================================
// ICONS
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
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

// ============================================================================
// AMBIENT ORB — soft drifting background light
// ============================================================================
const AmbientOrb: React.FC<{
  baseX: number; baseY: number; size: number; color: string;
  freqX?: number; freqY?: number; ampX?: number; ampY?: number; op?: number;
}> = ({ baseX, baseY, size, color, freqX = 80, freqY = 100, ampX = 60, ampY = 40, op = 0.2 }) => {
  const frame = useCurrentFrame();
  const x = baseX + Math.sin(frame / freqX) * ampX;
  const y = baseY + Math.cos(frame / freqY) * ampY;
  const s = 1 + Math.sin(frame / 120) * 0.08;
  return (
    <div style={{
      position: 'absolute', left: x - size / 2, top: y - size / 2,
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: op, transform: `scale(${s})`, pointerEvents: 'none',
    }} />
  );
};

// ============================================================================
// GLASS CARD
// ============================================================================
const GlassCard: React.FC<{
  children: React.ReactNode; width?: number; height?: number; style?: React.CSSProperties;
}> = ({ children, width, height, style }) => (
  <div style={{
    background: C.cardBg, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${C.cardBorder}`, borderRadius: '24px', boxShadow: C.cardShadow,
    width, height, padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', ...style,
  }}>
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '24px', pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
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
    <GlassCard width={310} height={175}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Node Status</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.green, boxShadow: `0 0 12px ${C.green}` }} />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 46, fontFamily: FONT_D, fontWeight: 500, color: C.textDeep }}>{uptime.toFixed(2)}%</div>
        <div style={{ fontSize: 15, color: C.textMuted, fontFamily: FONT_B }}>Session Uptime</div>
      </div>
    </GlassCard>
  );
};

const PointsBalanceCard: React.FC = () => {
  const frame = useCurrentFrame();
  const pts = Math.floor(interpolate(frame, [0, DURATION], [12480, 12612], { extrapolateRight: 'clamp' }));
  const bar = interpolate(frame, [0, DURATION], [58, 72], { extrapolateRight: 'clamp' });
  return (
    <GlassCard width={310} height={175}>
      <div style={{ fontSize: 13, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Points Balance</div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: 44, fontFamily: FONT_M, fontWeight: 600, color: C.textDeep }}>{pts.toLocaleString()}</div>
        <div style={{ width: '100%', height: 5, background: 'rgba(0,0,0,0.05)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ width: `${bar}%`, height: '100%', background: `linear-gradient(90deg, ${C.textIndigo}, ${C.accent})`, borderRadius: 3 }} />
        </div>
      </div>
    </GlassCard>
  );
};

const ReferralCodeCard: React.FC = () => (
  <GlassCard width={310} height={115} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
    <div>
      <div style={{ fontSize: 13, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>Referral Code</div>
      <div style={{ fontSize: 19, fontFamily: FONT_M, fontWeight: 500, color: C.textDeep, background: 'rgba(255,255,255,0.55)', padding: '7px 14px', borderRadius: 10 }}>RLMX-8A2F</div>
    </div>
    <div style={{ color: C.textIndigo, background: 'rgba(255,255,255,0.75)', padding: 12, borderRadius: '50%' }}><CopyIcon /></div>
  </GlassCard>
);

const RankCard: React.FC = () => (
  <GlassCard width={155} height={155} style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <StarIcon />
    <div style={{ fontSize: 12, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Rank</div>
    <div style={{ fontSize: 34, fontFamily: FONT_D, fontWeight: 600, color: C.textDeep }}>#15</div>
  </GlassCard>
);

const ActiveReferralsCard: React.FC = () => {
  const frame = useCurrentFrame();
  const count = Math.floor(interpolate(frame, [0, DURATION], [7, 12], { extrapolateRight: 'clamp' }));
  return (
    <GlassCard width={240} height={130}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <UsersIcon />
        <span style={{ fontSize: 13, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Active Referrals</span>
      </div>
      <div style={{ marginTop: 'auto', fontSize: 42, fontFamily: FONT_D, fontWeight: 600, color: C.textDeep }}>{count}</div>
    </GlassCard>
  );
};

const GrowthSummaryCard: React.FC = () => (
  <GlassCard width={260} height={110} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: '0 22px' }}>
    <div style={{ padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 14 }}><TrendUpIcon /></div>
    <div>
      <div style={{ fontSize: 22, fontFamily: FONT_B, fontWeight: 700, color: C.textDeep }}>+25 pts</div>
      <div style={{ fontSize: 14, color: C.textMuted, fontFamily: FONT_B }}>earned today</div>
    </div>
  </GlassCard>
);

const WalletConnectCard: React.FC<{ type: 'wallet' | 'google' }> = ({ type }) => (
  <GlassCard width={260} height={85} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: '0 20px' }}>
    <div style={{ padding: 9, background: 'rgba(255,255,255,0.8)', borderRadius: 14 }}>
      {type === 'wallet' ? <WalletIcon /> : <GoogleIcon />}
    </div>
    <div>
      <div style={{ fontSize: 16, fontFamily: FONT_B, fontWeight: 600, color: C.textDeep }}>{type === 'wallet' ? 'WalletConnect' : 'Google Account'}</div>
      <div style={{ fontSize: 13, color: C.green, fontFamily: FONT_M }}>Connected</div>
    </div>
  </GlassCard>
);

const PrivacyShieldCard: React.FC = () => (
  <GlassCard width={190} height={130} style={{ alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <ShieldIcon size={28} />
    <div style={{ fontSize: 12, fontFamily: FONT_M, color: C.textIndigo, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Privacy</div>
    <div style={{ fontSize: 16, fontFamily: FONT_B, fontWeight: 600, color: C.green }}>Protected</div>
  </GlassCard>
);

// ============================================================================
// WHISPERED TEXT
// ============================================================================
const WhisperedText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    fontFamily: FONT_D, fontWeight: 300, fontSize: 80, color: C.textDeep,
    lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, ...style,
  }}>{children}</div>
);

// ============================================================================
// THREE-POSITION ANIMATED CARD WRAPPER
// ============================================================================
const AnimCard3: React.FC<{
  children: React.ReactNode; frame: number; enterDelay: number;
  pos1: { x: number; y: number };
  pos2?: { x: number; y: number };
  pos3?: { x: number; y: number };
  r1s?: number; r1e?: number;
  r2s?: number; r2e?: number;
  exitFrame?: number;
  hoverAmp?: number; hoverSpd?: number;
}> = ({
  children, frame, enterDelay, pos1, pos2, pos3,
  r1s = P.REARRANGE1_START, r1e = P.REARRANGE1_END,
  r2s = P.REARRANGE2_START, r2e = P.REARRANGE2_END,
  exitFrame = P.CARDS_EXIT, hoverAmp = 8, hoverSpd = 25,
}) => {
  const enter = sp(frame, enterDelay);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 22], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const calcPos = (axis: 'x' | 'y') => {
    const p1 = pos1[axis], p2 = pos2?.[axis], p3 = pos3?.[axis];
    if (p3 !== undefined && p2 !== undefined && frame >= r2s) {
      return interpolate(frame, [r2s, r2e], [p2, p3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
    if (p2 !== undefined) {
      return interpolate(frame, [r1s, r1e], [p1, p2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
    return p1;
  };

  const hover = Math.sin((frame + enterDelay * 3) / hoverSpd) * hoverAmp;

  return (
    <div style={{
      position: 'absolute', left: calcPos('x'), top: calcPos('y') + hover,
      opacity: opacity * exitOp, transform: `scale(${scale})`,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const RealmxPastelV3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Background gradient drift ──
  const bgAngle = interpolate(frame, [0, DURATION], [125, 210]);
  const bgMid = interpolate(frame, [0, DURATION * 0.4, DURATION * 0.7, DURATION], [0, 1, 0.5, 0]);

  // ── Headlines ──
  const headlines = ['Pseudonymous\nsecurity.', 'Fair\nearnings.', 'Privacy\nas capital.', 'Effortless\nrewards.', 'Zero-knowledge\ndesign.'];
  const hDur = 28, hGap = 4;

  // ── Logo watermark ──
  const wmOp = interpolate(frame, [40, 60], [0, 0.07], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // ── Statements ──
  const stmtOp = (inF: number, outF: number) => {
    if (frame < inF) return 0;
    if (frame < inF + 20) return interpolate(frame, [inF, inF + 20], [0, 1]);
    if (frame < outF - 15) return 1;
    if (frame < outF) return interpolate(frame, [outF - 15, outF], [1, 0]);
    return 0;
  };
  const s1Op = stmtOp(P.STMT1_IN, P.STMT1_OUT);
  const s1Y = interpolate(spSoft(frame, P.STMT1_IN, fps), [0, 1], [30, 0]);
  const s2Op = stmtOp(P.STMT2_IN, P.STMT2_OUT);
  const s2Y = interpolate(spSoft(frame, P.STMT2_IN, fps), [0, 1], [30, 0]);

  // ── Outro ──
  const outOp = interpolate(frame, [P.OUTRO_IN, P.OUTRO_IN + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outScale = interpolate(spBouncy(frame, P.OUTRO_IN, fps), [0, 1], [0.9, 1]);
  const ltOp = interpolate(frame, [P.OUTRO_IN + 30, P.OUTRO_IN + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ltY = interpolate(spSoft(frame, P.OUTRO_IN + 30, fps), [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${bgAngle}deg, ${C.bgLavender} 0%, ${bgMid > 0.5 ? C.bgMidPink : C.bgPeach} 45%, ${C.bgTurquoise} 100%)`,
      overflow: 'hidden',
    }}>

      {/* ── Dot grid texture ── */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(30,27,75,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px', opacity: 0.5,
      }} />

      {/* ── Ambient floating orbs ── */}
      <AmbientOrb baseX={300} baseY={250} size={280} color="rgba(196,181,224,0.22)" freqX={90} freqY={120} ampX={80} ampY={50} op={0.25} />
      <AmbientOrb baseX={1400} baseY={600} size={350} color="rgba(160,232,224,0.20)" freqX={110} freqY={80} ampX={100} ampY={60} op={0.2} />
      <AmbientOrb baseX={900} baseY={150} size={200} color="rgba(240,200,220,0.24)" freqX={70} freqY={95} ampX={60} ampY={40} op={0.22} />
      <AmbientOrb baseX={600} baseY={800} size={240} color="rgba(248,216,192,0.20)" freqX={100} freqY={130} ampX={70} ampY={45} op={0.18} />
      <AmbientOrb baseX={1600} baseY={200} size={180} color="rgba(196,181,224,0.18)" freqX={85} freqY={110} ampX={50} ampY={35} op={0.15} />

      {/* ── Logo watermark ── */}
      <div style={{ position: 'absolute', top: 50, right: 60, opacity: wmOp }}>
        <Img src={staticFile('logo.webp')} style={{ width: 80, height: 80, objectFit: 'contain' }} />
      </div>

      {/* ── ROTATING HEADLINES ── */}
      <div style={{ position: 'absolute', top: 140, left: 120 }}>
        {headlines.map((text, i) => {
          const start = i * (hDur + hGap);
          const fadeIn = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fadeOut = interpolate(frame, [start + hDur - 8, start + hDur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const yOff = interpolate(frame, [start, start + hDur], [16, -8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          if (frame < start || frame > start + hDur + hGap) return null;
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

      {/* ── CARD CLUSTER (three-phase choreography) ── */}
      {frame >= P.CLUSTER1_IN && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Core 4 cards: Phase1 (tight cluster) → Phase2 (spread) → Phase3 (compress left) */}
          <AnimCard3 frame={frame} enterDelay={P.CLUSTER1_IN}
            pos1={{ x: 620, y: 200 }} pos2={{ x: 100, y: 150 }} pos3={{ x: 60, y: 100 }}>
            <NodeStatusCard />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.CLUSTER1_IN + 8}
            pos1={{ x: 660, y: 420 }} pos2={{ x: 100, y: 370 }} pos3={{ x: 60, y: 310 }}>
            <PointsBalanceCard />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.CLUSTER1_IN + 16}
            pos1={{ x: 1000, y: 240 }} pos2={{ x: 460, y: 150 }} pos3={{ x: 400, y: 100 }}>
            <ReferralCodeCard />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.CLUSTER1_IN + 22}
            pos1={{ x: 1060, y: 400 }} pos2={{ x: 460, y: 310 }} pos3={{ x: 400, y: 250 }}>
            <RankCard />
          </AnimCard3>

          {/* New cards: appear during rearrange 1, slide during rearrange 2 */}
          <AnimCard3 frame={frame} enterDelay={P.REARRANGE1_START + 12}
            pos1={{ x: 660, y: 310 }} pos2={{ x: 660, y: 310 }} pos3={{ x: 400, y: 440 }}>
            <PrivacyShieldCard />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.REARRANGE1_START + 20}
            pos1={{ x: 880, y: 150 }} pos2={{ x: 880, y: 150 }} pos3={{ x: 60, y: 530 }}>
            <ActiveReferralsCard />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.REARRANGE1_START + 28}
            pos1={{ x: 880, y: 330 }} pos2={{ x: 880, y: 330 }} pos3={{ x: 660, y: 100 }}>
            <GrowthSummaryCard />
          </AnimCard3>
        </div>
      )}

      {/* ── WALLET CARDS (glide in from right during rearrange 2) ── */}
      {frame >= P.WALLETS_IN && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <AnimCard3 frame={frame} enterDelay={P.WALLETS_IN}
            pos1={{ x: 1200, y: 400 }} hoverAmp={6} hoverSpd={30}>
            <WalletConnectCard type="wallet" />
          </AnimCard3>

          <AnimCard3 frame={frame} enterDelay={P.WALLETS_IN + 12}
            pos1={{ x: 1200, y: 520 }} hoverAmp={6} hoverSpd={28}>
            <WalletConnectCard type="google" />
          </AnimCard3>
        </div>
      )}

      {/* ── STATEMENT 1 ── */}
      {s1Op > 0 && (
        <div style={{ position: 'absolute', bottom: 160, right: 120, opacity: s1Op, transform: `translateY(${s1Y}px)`, textAlign: 'right' }}>
          <WhisperedText style={{ fontSize: 52 }}>Your privacy is in<br />growth mode.</WhisperedText>
        </div>
      )}

      {/* ── STATEMENT 2 ── */}
      {s2Op > 0 && (
        <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: s2Op, transform: `translateY(${s2Y}px)` }}>
          <WhisperedText style={{ fontSize: 58, textAlign: 'center' }}>Smart earning,<br />zero complexity.</WhisperedText>
        </div>
      )}

      {/* ── OUTRO ── */}
      {frame >= P.OUTRO_IN && (
        <AbsoluteFill style={{
          alignItems: 'center', justifyContent: 'center', opacity: outOp,
          background: `linear-gradient(${bgAngle}deg, ${C.bgLavender} 0%, ${C.bgTurquoise} 100%)`,
        }}>
          <div style={{ transform: `scale(${outScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 110, height: 110, borderRadius: 28, background: C.textDeep,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 24px 64px rgba(30, 27, 75, 0.18)',
            }}>
              <Img src={staticFile('logo.webp')} style={{ width: '62%', height: '62%', objectFit: 'contain' }} />
            </div>

            <div style={{
              marginTop: 30, fontFamily: FONT_D, fontSize: 36, color: C.textDeep,
              fontWeight: 500, fontStyle: 'italic', opacity: ltOp, transform: `translateY(${ltY}px)`,
            }}>
              Realm<span style={{ color: C.accent, fontStyle: 'normal' }}>X</span>AI
            </div>

            <div style={{
              marginTop: 16, fontFamily: FONT_M, fontSize: 14, color: C.textIndigo,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              opacity: ltOp * 0.7, transform: `translateY(${ltY * 1.2}px)`,
            }}>
              realmxai.com
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
