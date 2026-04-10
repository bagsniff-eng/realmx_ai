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
  AVATARS_IN: 10,
  PILLS_IN: 30,
  CARDS_IN: 60,
  HEADLINE1_IN: 20,
  HEADLINE1_OUT: 130,
  HEADLINE2_IN: 140,
  HEADLINE2_OUT: 260,
  HEADLINE3_IN: 270,
  HEADLINE3_OUT: 370,
  CHARTS_IN: 160,
  RINGS_IN: 100,
  ANALYTICS_IN: 200,
  REARRANGE1: 180,
  REARRANGE2: 300,
  STMT_IN: 380,
  STMT_OUT: 440,
  OUTRO_IN: 450,
};

// ============================================================================
// PALETTE — bright sky-blue SaaS aesthetic
// ============================================================================
const C = {
  bgTop: '#E3F2FD',
  bgBottom: '#BBDEFB',
  bgMid: '#D6ECFB',
  cardBg: 'rgba(255, 255, 255, 0.88)',
  cardBorder: 'rgba(255, 255, 255, 0.95)',
  cardShadow: '0 8px 32px rgba(21, 101, 192, 0.08)',
  cardShadowHover: '0 12px 40px rgba(21, 101, 192, 0.12)',
  blue: '#2196F3',
  blueDeep: '#1565C0',
  blueSoft: 'rgba(33, 150, 243, 0.15)',
  blueGlow: 'rgba(33, 150, 243, 0.25)',
  textDark: '#0D2137',
  textMid: '#37576E',
  textMuted: '#7BA0B8',
  green: '#4CAF50',
  greenSoft: 'rgba(76, 175, 80, 0.12)',
  teal: '#00BCD4',
  amber: '#FF9800',
  purple: '#7C4DFF',
  purpleSoft: 'rgba(124, 77, 255, 0.12)',
  pink: '#E91E63',
  white: '#FFFFFF',
};

const FONT_D = '"Fraunces", serif';
const FONT_M = '"IBM Plex Mono", monospace';
const FONT_B = '"Source Sans 3", sans-serif';

// ============================================================================
// SPRINGS
// ============================================================================
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 16, stiffness: 100, mass: 0.8 } });

const spBouncy = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 10, stiffness: 140, mass: 0.7 } });

const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 22, stiffness: 60, mass: 1.2 } });

// ============================================================================
// ICONS (inline SVG)
// ============================================================================
const PlusIcon = ({ size = 14, color = C.blue }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ShieldIcon = ({ size = 18, color = C.blue }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const TrendUpIcon = ({ size = 16, color = C.green }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

const UsersIcon = ({ size = 16, color = C.blue }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const StarIcon = ({ size = 16, color = C.amber }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// ============================================================================
// AVATAR — circular user avatar with initials
// ============================================================================
const AVATAR_COLORS = ['#2196F3', '#00BCD4', '#7C4DFF', '#4CAF50', '#FF9800', '#E91E63', '#1565C0', '#009688', '#FF5722', '#3F51B5'];
const AVATAR_INITIALS = ['AK', 'JM', 'SR', 'LP', 'DW', 'NK', 'BT', 'RG', 'MC', 'VH', 'QZ', 'EF'];

const Avatar: React.FC<{
  index: number; size?: number; x: number; y: number;
  frame: number; enterDelay: number;
  freqX?: number; freqY?: number; ampX?: number; ampY?: number;
  exitFrame?: number;
}> = ({ index, size = 48, x, y, frame, enterDelay, freqX = 60, freqY = 80, ampX = 20, ampY = 15, exitFrame = P.OUTRO_IN - 20 }) => {
  const enter = spBouncy(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 25], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const driftX = Math.sin((frame + index * 37) / freqX) * ampX;
  const driftY = Math.cos((frame + index * 23) / freqY) * ampY;
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = AVATAR_INITIALS[index % AVATAR_INITIALS.length];

  return (
    <div style={{
      position: 'absolute', left: x + driftX, top: y + driftY,
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 16px ${color}44, 0 2px 8px rgba(0,0,0,0.06)`,
      border: '2.5px solid rgba(255,255,255,0.9)',
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.3, 1])})`,
    }}>
      <span style={{ fontFamily: FONT_B, fontSize: size * 0.36, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>{initials}</span>
    </div>
  );
};

// ============================================================================
// REFERRAL PILL — rounded chip with "+" icon
// ============================================================================
const ReferralPill: React.FC<{
  text: string; x: number; y: number;
  frame: number; enterDelay: number;
  color?: string; exitFrame?: number;
}> = ({ text, x, y, frame, enterDelay, color = C.blue, exitFrame = P.OUTRO_IN - 15 }) => {
  const enter = sp(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const driftY = Math.sin((frame + enterDelay * 5) / 50) * 10;
  const driftX = Math.cos((frame + enterDelay * 3) / 70) * 8;

  return (
    <div style={{
      position: 'absolute', left: x + driftX, top: y + driftY,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 999,
      background: C.white, border: `1.5px solid ${color}30`,
      boxShadow: `0 4px 16px ${color}18`,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])}) translateY(${interpolate(enter, [0, 1], [10, 0])}px)`,
    }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PlusIcon size={12} color={color} />
      </div>
      <span style={{ fontFamily: FONT_B, fontSize: 13, fontWeight: 600, color: C.textDark }}>{text}</span>
    </div>
  );
};

// ============================================================================
// PROGRESS RING — animated SVG circular progress
// ============================================================================
const ProgressRing: React.FC<{
  x: number; y: number; size?: number;
  progress: number; label: string; value: string;
  color?: string; frame: number; enterDelay: number;
  exitFrame?: number;
}> = ({ x, y, size = 90, progress, label, value, color = C.blue, frame, enterDelay, exitFrame = P.OUTRO_IN - 10 }) => {
  const enter = sp(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const driftY = Math.sin((frame + enterDelay * 4) / 55) * 12;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const animatedProgress = interpolate(enter, [0, 1], [0, progress]);
  const dashOffset = circ * (1 - animatedProgress);

  return (
    <div style={{
      position: 'absolute', left: x, top: y + driftY,
      width: size, height: size + 36,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.6, 1])})`,
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(33,150,243,0.1)" strokeWidth="5" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dashOffset} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_M, fontSize: 16, fontWeight: 700, color: C.textDark,
        }}>{value}</div>
      </div>
      <span style={{ fontFamily: FONT_B, fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
    </div>
  );
};

// ============================================================================
// GLASS CARD — soft white card with shadow
// ============================================================================
const GlassCard: React.FC<{
  children: React.ReactNode; width?: number; height?: number; style?: React.CSSProperties;
}> = ({ children, width, height, style }) => (
  <div style={{
    background: C.cardBg, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.cardBorder}`, borderRadius: 20, boxShadow: C.cardShadow,
    width, height, padding: 18, display: 'flex', flexDirection: 'column', position: 'relative', ...style,
  }}>
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
    }} />
    {children}
  </div>
);

// ============================================================================
// DASHBOARD CARDS
// ============================================================================
const NodeStatusMini: React.FC<{ frame: number }> = ({ frame }) => (
  <GlassCard width={200} height={100}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontFamily: FONT_M, color: C.blue, textTransform: 'uppercase', letterSpacing: '1px' }}>Node Status</span>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
    </div>
    <div style={{ marginTop: 'auto' }}>
      <div style={{ fontSize: 28, fontFamily: FONT_D, fontWeight: 600, color: C.textDark }}>Active</div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: FONT_B }}>Session running</div>
    </div>
  </GlassCard>
);

const PointsCardMini: React.FC<{ frame: number }> = ({ frame }) => {
  const pts = Math.floor(interpolate(frame, [0, DURATION], [8420, 8695], { extrapolateRight: 'clamp' }));
  return (
    <GlassCard width={200} height={100}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <StarIcon size={14} />
        <span style={{ fontSize: 11, fontFamily: FONT_M, color: C.amber, textTransform: 'uppercase', letterSpacing: '1px' }}>Points</span>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontFamily: FONT_M, fontWeight: 700, color: C.textDark }}>{pts.toLocaleString()}</span>
        <span style={{ fontSize: 12, fontFamily: FONT_B, color: C.green, fontWeight: 600 }}>+24</span>
      </div>
    </GlassCard>
  );
};

const ReferralCardMini: React.FC = () => (
  <GlassCard width={180} height={90}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <UsersIcon size={14} />
      <span style={{ fontSize: 11, fontFamily: FONT_M, color: C.blue, textTransform: 'uppercase', letterSpacing: '1px' }}>Referrals</span>
    </div>
    <div style={{ marginTop: 'auto', fontSize: 26, fontFamily: FONT_D, fontWeight: 600, color: C.textDark }}>23</div>
  </GlassCard>
);

const RankCardMini: React.FC = () => (
  <GlassCard width={130} height={90} style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
    <span style={{ fontSize: 11, fontFamily: FONT_M, color: C.purple, textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</span>
    <span style={{ fontSize: 30, fontFamily: FONT_D, fontWeight: 700, color: C.textDark }}>#15</span>
  </GlassCard>
);

const PrivacyMini: React.FC = () => (
  <GlassCard width={170} height={80} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '0 14px' }}>
    <div style={{ padding: 8, background: C.blueSoft, borderRadius: 12 }}>
      <ShieldIcon size={18} color={C.blue} />
    </div>
    <div>
      <div style={{ fontSize: 14, fontFamily: FONT_B, fontWeight: 700, color: C.textDark }}>Protected</div>
      <div style={{ fontSize: 11, color: C.green, fontFamily: FONT_M }}>Secure</div>
    </div>
  </GlassCard>
);

const GrowthMini: React.FC = () => (
  <GlassCard width={180} height={80} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '0 14px' }}>
    <div style={{ padding: 8, background: C.greenSoft, borderRadius: 12 }}>
      <TrendUpIcon size={16} />
    </div>
    <div>
      <div style={{ fontSize: 16, fontFamily: FONT_B, fontWeight: 700, color: C.textDark }}>+142 pts</div>
      <div style={{ fontSize: 11, color: C.textMuted, fontFamily: FONT_B }}>this week</div>
    </div>
  </GlassCard>
);

// ============================================================================
// MINI BAR CHART — inline sparkline
// ============================================================================
const MiniBarChart: React.FC<{
  x: number; y: number; frame: number; enterDelay: number; exitFrame?: number;
}> = ({ x, y, frame, enterDelay, exitFrame = P.OUTRO_IN - 10 }) => {
  const enter = sp(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const driftY = Math.sin((frame + enterDelay * 6) / 45) * 10;
  const bars = [0.4, 0.6, 0.35, 0.8, 0.55, 0.9, 0.7];

  return (
    <div style={{
      position: 'absolute', left: x, top: y + driftY,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.5, 1])})`,
    }}>
      <GlassCard width={160} height={100}>
        <span style={{ fontSize: 10, fontFamily: FONT_M, color: C.blue, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
          Points Growth
        </span>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1 }}>
          {bars.map((h, i) => {
            const barH = h * 45 * interpolate(enter, [0, 1], [0, 1]);
            const isLast = i === bars.length - 1;
            return (
              <div key={i} style={{
                flex: 1, height: barH, borderRadius: 3,
                background: isLast ? C.blue : `${C.blue}40`,
                transition: 'height 0.3s',
              }} />
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

// ============================================================================
// ANIMATED CARD WRAPPER — drifting position with optional rearrangement
// ============================================================================
const DriftCard: React.FC<{
  children: React.ReactNode; frame: number; enterDelay: number;
  pos1: { x: number; y: number };
  pos2?: { x: number; y: number };
  pos3?: { x: number; y: number };
  r1?: number; r2?: number;
  exitFrame?: number;
  hoverAmp?: number; hoverSpd?: number;
}> = ({
  children, frame, enterDelay, pos1, pos2, pos3,
  r1 = P.REARRANGE1, r2 = P.REARRANGE2,
  exitFrame = P.OUTRO_IN - 10,
  hoverAmp = 8, hoverSpd = 28,
}) => {
  const enter = sp(frame, enterDelay);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.88, 1]);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 25], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const calcPos = (axis: 'x' | 'y') => {
    const p1 = pos1[axis], p2 = pos2?.[axis], p3 = pos3?.[axis];
    if (p3 !== undefined && p2 !== undefined && frame >= r2) {
      return interpolate(frame, [r2, r2 + 60], [p2, p3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    }
    if (p2 !== undefined && frame >= r1) {
      return interpolate(frame, [r1, r1 + 60], [p1, p2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
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
// HEADLINE TEXT — dynamic editorial collage
// ============================================================================
const HeadlineFragment: React.FC<{
  text: string; frame: number; inFrame: number; outFrame: number;
  x: number; y: number; size?: number; color?: string; rotation?: number;
}> = ({ text, frame, inFrame, outFrame, x, y, size = 64, color = C.textDark, rotation = 0 }) => {
  const fadeIn = interpolate(frame, [inFrame, inFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [outFrame - 12, outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const yOff = interpolate(frame, [inFrame, inFrame + 20], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);
  if (op <= 0) return null;

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: FONT_D, fontSize: size, fontWeight: 400, fontStyle: 'italic',
      color, letterSpacing: '-0.03em', lineHeight: 1.05,
      opacity: op, transform: `translateY(${yOff}px) rotate(${rotation}deg)`,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  );
};

// ============================================================================
// INVITE NOTIFICATION TOAST
// ============================================================================
const InviteToast: React.FC<{
  name: string; x: number; y: number; frame: number; enterDelay: number; exitFrame?: number;
}> = ({ name, x, y, frame, enterDelay, exitFrame = enterDelay + 80 }) => {
  const enter = spBouncy(frame, enterDelay);
  const exitOp = interpolate(frame, [exitFrame, exitFrame + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const driftX = Math.sin((frame + enterDelay) / 40) * 6;
  if (enter <= 0 && frame < enterDelay) return null;

  return (
    <div style={{
      position: 'absolute', left: x + driftX, top: y,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 14,
      background: C.white, border: `1px solid ${C.blue}20`,
      boxShadow: `0 6px 20px ${C.blue}12`,
      opacity: enter * exitOp,
      transform: `scale(${interpolate(enter, [0, 1], [0.8, 1])}) translateX(${interpolate(enter, [0, 1], [20, 0])}px)`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: C.blue,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontFamily: FONT_B, fontWeight: 700, color: '#fff',
      }}>{name[0]}</div>
      <div>
        <div style={{ fontSize: 13, fontFamily: FONT_B, fontWeight: 600, color: C.textDark }}>{name} joined!</div>
        <div style={{ fontSize: 11, fontFamily: FONT_M, color: C.green }}>+50 pts earned</div>
      </div>
    </div>
  );
};

// ============================================================================
// SOFT AMBIENT ORB
// ============================================================================
const SoftOrb: React.FC<{
  baseX: number; baseY: number; size: number; color: string;
  freqX?: number; freqY?: number; ampX?: number; ampY?: number; op?: number;
}> = ({ baseX, baseY, size, color, freqX = 90, freqY = 110, ampX = 50, ampY = 35, op = 0.15 }) => {
  const frame = useCurrentFrame();
  const x = baseX + Math.sin(frame / freqX) * ampX;
  const y = baseY + Math.cos(frame / freqY) * ampY;
  const s = 1 + Math.sin(frame / 100) * 0.06;
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
// MAIN COMPOSITION
// ============================================================================
export const RealmxCommunity: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient drift
  const bgAngle = interpolate(frame, [0, DURATION], [135, 195]);

  // Outro
  const outOp = interpolate(frame, [P.OUTRO_IN, P.OUTRO_IN + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outScale = interpolate(spBouncy(frame, P.OUTRO_IN, fps), [0, 1], [0.85, 1]);
  const tagOp = interpolate(frame, [P.OUTRO_IN + 30, P.OUTRO_IN + 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(frame, P.OUTRO_IN + 30, fps), [0, 1], [20, 0]);

  // Statement
  const stmtOp = (() => {
    if (frame < P.STMT_IN) return 0;
    if (frame < P.STMT_IN + 18) return interpolate(frame, [P.STMT_IN, P.STMT_IN + 18], [0, 1]);
    if (frame < P.STMT_OUT - 15) return 1;
    if (frame < P.STMT_OUT) return interpolate(frame, [P.STMT_OUT - 15, P.STMT_OUT], [1, 0]);
    return 0;
  })();
  const stmtY = interpolate(spSoft(frame, P.STMT_IN, fps), [0, 1], [25, 0]);

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${bgAngle}deg, ${C.bgTop} 0%, ${C.bgMid} 45%, ${C.bgBottom} 100%)`,
      overflow: 'hidden',
    }}>

      {/* ── Dot grid ── */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(33,150,243,0.04) 1px, transparent 1px)',
        backgroundSize: '28px 28px', opacity: 0.6,
      }} />

      {/* ── Ambient orbs ── */}
      <SoftOrb baseX={250} baseY={200} size={300} color="rgba(33,150,243,0.12)" freqX={100} freqY={130} ampX={70} ampY={45} op={0.2} />
      <SoftOrb baseX={1400} baseY={500} size={280} color="rgba(0,188,212,0.10)" freqX={80} freqY={110} ampX={60} ampY={40} op={0.15} />
      <SoftOrb baseX={900} baseY={100} size={220} color="rgba(124,77,255,0.08)" freqX={95} freqY={120} ampX={55} ampY={35} op={0.12} />
      <SoftOrb baseX={500} baseY={750} size={260} color="rgba(76,175,80,0.08)" freqX={75} freqY={100} ampX={65} ampY={40} op={0.1} />
      <SoftOrb baseX={1600} baseY={250} size={200} color="rgba(255,152,0,0.08)" freqX={110} freqY={90} ampX={50} ampY={30} op={0.1} />

      {/* ── Logo watermark ── */}
      <div style={{
        position: 'absolute', top: 36, right: 48,
        opacity: interpolate(frame, [30, 50], [0, 0.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        <Img src={staticFile('logo.webp')} style={{ width: 60, height: 60, objectFit: 'contain' }} />
      </div>

      {/* ── AVATARS (community) ── */}
      <Avatar index={0} x={120} y={80} size={44} frame={frame} enterDelay={P.AVATARS_IN} freqX={65} freqY={85} ampX={18} ampY={12} />
      <Avatar index={1} x={1650} y={140} size={38} frame={frame} enterDelay={P.AVATARS_IN + 5} freqX={55} freqY={75} ampX={15} ampY={18} />
      <Avatar index={2} x={400} y={680} size={42} frame={frame} enterDelay={P.AVATARS_IN + 10} freqX={70} freqY={90} ampX={22} ampY={14} />
      <Avatar index={3} x={1500} y={620} size={36} frame={frame} enterDelay={P.AVATARS_IN + 15} freqX={60} freqY={80} ampX={16} ampY={20} />
      <Avatar index={4} x={850} y={50} size={40} frame={frame} enterDelay={P.AVATARS_IN + 20} freqX={75} freqY={100} ampX={20} ampY={12} />
      <Avatar index={5} x={50} y={500} size={34} frame={frame} enterDelay={P.AVATARS_IN + 25} freqX={80} freqY={95} ampX={14} ampY={16} />
      <Avatar index={6} x={1750} y={430} size={36} frame={frame} enterDelay={P.AVATARS_IN + 30} freqX={65} freqY={85} ampX={18} ampY={15} />
      <Avatar index={7} x={680} y={800} size={32} frame={frame} enterDelay={P.AVATARS_IN + 35} freqX={70} freqY={100} ampX={12} ampY={10} />
      <Avatar index={8} x={1200} y={60} size={30} frame={frame} enterDelay={P.AVATARS_IN + 40} freqX={85} freqY={75} ampX={16} ampY={14} />
      <Avatar index={9} x={300} y={380} size={28} frame={frame} enterDelay={P.AVATARS_IN + 50} freqX={60} freqY={110} ampX={10} ampY={8} />

      {/* ── REFERRAL PILLS ── */}
      <ReferralPill text="Invite" x={200} y={200} frame={frame} enterDelay={P.PILLS_IN} color={C.blue} />
      <ReferralPill text="Share" x={1400} y={300} frame={frame} enterDelay={P.PILLS_IN + 12} color={C.teal} />
      <ReferralPill text="+1 Referral" x={1100} y={700} frame={frame} enterDelay={P.PILLS_IN + 22} color={C.purple} />
      <ReferralPill text="Earn" x={600} y={150} frame={frame} enterDelay={P.PILLS_IN + 32} color={C.green} />
      <ReferralPill text="Connect" x={1600} y={700} frame={frame} enterDelay={P.PILLS_IN + 40} color={C.blue} />

      {/* ── PROGRESS RINGS ── */}
      <ProgressRing x={60} y={250} progress={0.78} label="Uptime" value="99.8%"
        color={C.green} frame={frame} enterDelay={P.RINGS_IN} />
      <ProgressRing x={1720} y={220} size={80} progress={0.65} label="Epoch" value="65%"
        color={C.blue} frame={frame} enterDelay={P.RINGS_IN + 15} />
      <ProgressRing x={1100} y={50} size={70} progress={0.92} label="Shield" value="92%"
        color={C.purple} frame={frame} enterDelay={P.RINGS_IN + 30} />

      {/* ── DASHBOARD CARDS (3-phase drift) ── */}
      {frame >= P.CARDS_IN && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <DriftCard frame={frame} enterDelay={P.CARDS_IN}
            pos1={{ x: 580, y: 280 }} pos2={{ x: 100, y: 220 }} pos3={{ x: 60, y: 160 }}>
            <NodeStatusMini frame={frame} />
          </DriftCard>

          <DriftCard frame={frame} enterDelay={P.CARDS_IN + 10}
            pos1={{ x: 620, y: 440 }} pos2={{ x: 100, y: 380 }} pos3={{ x: 60, y: 320 }}>
            <PointsCardMini frame={frame} />
          </DriftCard>

          <DriftCard frame={frame} enterDelay={P.CARDS_IN + 20}
            pos1={{ x: 980, y: 320 }} pos2={{ x: 360, y: 220 }} pos3={{ x: 300, y: 160 }}>
            <ReferralCardMini />
          </DriftCard>

          <DriftCard frame={frame} enterDelay={P.CARDS_IN + 28}
            pos1={{ x: 1020, y: 460 }} pos2={{ x: 360, y: 380 }} pos3={{ x: 300, y: 310 }}>
            <RankCardMini />
          </DriftCard>

          <DriftCard frame={frame} enterDelay={P.REARRANGE1 + 10}
            pos1={{ x: 800, y: 380 }} pos2={{ x: 800, y: 380 }} pos3={{ x: 500, y: 440 }}>
            <PrivacyMini />
          </DriftCard>

          <DriftCard frame={frame} enterDelay={P.REARRANGE1 + 20}
            pos1={{ x: 800, y: 220 }} pos2={{ x: 800, y: 220 }} pos3={{ x: 500, y: 160 }}>
            <GrowthMini />
          </DriftCard>
        </div>
      )}

      {/* ── MINI BAR CHARTS ── */}
      <MiniBarChart x={1400} y={440} frame={frame} enterDelay={P.CHARTS_IN} />
      <MiniBarChart x={60} y={600} frame={frame} enterDelay={P.CHARTS_IN + 30} />

      {/* ── INVITE NOTIFICATIONS (social proof toasts) ── */}
      <InviteToast name="Sarah" x={1350} y={160} frame={frame} enterDelay={120} exitFrame={200} />
      <InviteToast name="Marcus" x={1300} y={240} frame={frame} enterDelay={210} exitFrame={290} />
      <InviteToast name="Priya" x={1380} y={180} frame={frame} enterDelay={300} exitFrame={380} />

      {/* ── HEADLINE FRAGMENTS (editorial collage) ── */}
      <HeadlineFragment text="Join the node." frame={frame}
        inFrame={P.HEADLINE1_IN} outFrame={P.HEADLINE1_OUT}
        x={250} y={380} size={72} />
      <HeadlineFragment text="Earn together." frame={frame}
        inFrame={P.HEADLINE2_IN} outFrame={P.HEADLINE2_OUT}
        x={350} y={420} size={68} color={C.blueDeep} />
      <HeadlineFragment text="Protect privacy." frame={frame}
        inFrame={P.HEADLINE3_IN} outFrame={P.HEADLINE3_OUT}
        x={280} y={400} size={70} />

      {/* ── Sub-headline fragments ── */}
      <HeadlineFragment text="community-powered" frame={frame}
        inFrame={P.HEADLINE1_IN + 20} outFrame={P.HEADLINE1_OUT}
        x={270} y={460} size={22} color={C.textMuted} rotation={0} />
      <HeadlineFragment text="privacy as capital" frame={frame}
        inFrame={P.HEADLINE2_IN + 20} outFrame={P.HEADLINE2_OUT}
        x={370} y={500} size={22} color={C.textMuted} />
      <HeadlineFragment text="zero-knowledge design" frame={frame}
        inFrame={P.HEADLINE3_IN + 20} outFrame={P.HEADLINE3_OUT}
        x={300} y={480} size={22} color={C.textMuted} />

      {/* ── STATEMENT OVERLAY ── */}
      {stmtOp > 0 && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: stmtOp, transform: `translateY(${stmtY}px)`,
        }}>
          <div style={{
            fontFamily: FONT_D, fontSize: 56, fontWeight: 400, fontStyle: 'italic',
            color: C.textDark, textAlign: 'center', lineHeight: 1.15, letterSpacing: '-0.02em',
          }}>
            Your network is<br />your net worth.
          </div>
        </div>
      )}

      {/* ── OUTRO ── */}
      {frame >= P.OUTRO_IN && (
        <AbsoluteFill style={{
          alignItems: 'center', justifyContent: 'center', opacity: outOp,
          background: `linear-gradient(${bgAngle}deg, ${C.bgTop} 0%, ${C.bgBottom} 100%)`,
        }}>
          {/* Background dot grid */}
          <AbsoluteFill style={{
            backgroundImage: 'radial-gradient(circle, rgba(33,150,243,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px', opacity: 0.5,
          }} />

          <div style={{ transform: `scale(${outScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 26,
              background: C.blueDeep, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 20px 60px ${C.blueGlow}`,
            }}>
              <Img src={staticFile('logo.webp')} style={{ width: '62%', height: '62%', objectFit: 'contain' }} />
            </div>

            <div style={{
              marginTop: 28, fontFamily: FONT_D, fontSize: 34, fontWeight: 500, fontStyle: 'italic',
              color: C.textDark, opacity: tagOp, transform: `translateY(${tagY}px)`,
            }}>
              Realm<span style={{ color: C.blue, fontStyle: 'normal' }}>X</span>AI
            </div>

            <div style={{
              marginTop: 14, fontFamily: FONT_M, fontSize: 13, color: C.blue,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              opacity: tagOp * 0.8, transform: `translateY(${tagY * 1.2}px)`,
            }}>
              realmxai.com
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
