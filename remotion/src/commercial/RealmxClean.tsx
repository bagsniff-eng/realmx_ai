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

const T = {
  H1_IN: 20,        // "Protect privacy."
  H1_GROW: 100,     // "Protect privacy, earn rewards."
  H1_FULL: 180,     // "Protect privacy, earn rewards, invite friends."
  MODULE_IN: 80,
  MODULE_WALLET: 130,
  MODULE_GOOGLE: 170,
  MODULE_POINTS: 210,
  LOGOS_IN: 240,
  BARS_IN: 300,
  SCENE2_IN: 340,
  SCENE3_IN: 420,
  OUTRO_IN: 480,
};

// ============================================================================
// PALETTE — clean white product aesthetic
// ============================================================================
const C = {
  bg: '#FAFAFA',
  bgWarm: '#F5F3F0',
  white: '#FFFFFF',
  textPrimary: '#111111',
  textSecondary: '#555555',
  textMuted: '#999999',
  textLight: '#CCCCCC',
  blue: '#3B82F6',
  blueSoft: 'rgba(59, 130, 246, 0.08)',
  blueBorder: 'rgba(59, 130, 246, 0.2)',
  green: '#10B981',
  greenSoft: 'rgba(16, 185, 129, 0.08)',
  greenBorder: 'rgba(16, 185, 129, 0.2)',
  purple: '#8B5CF6',
  purpleSoft: 'rgba(139, 92, 246, 0.08)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.08)',
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.03)',
  shadowMd: '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',
  shadowLg: '0 4px 12px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
};

const FD = '"Fraunces", serif';
const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';

// Springs
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 20, stiffness: 80, mass: 1.0 } });
const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 28, stiffness: 50, mass: 1.4 } });
const spSnap = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 14, stiffness: 120, mass: 0.6 } });

// ============================================================================
// ICONS (minimal line style)
// ============================================================================
const WalletIcon = ({ size = 22, color = '#F6851B' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const ShieldIcon = ({ size = 20, color = C.blue }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CheckIcon = ({ size = 16, color = C.green }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// MetaMask fox (simplified)
const MetaMaskIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20.5 3L13 8.5l1.4-3.3L20.5 3z" fill="#E17726" />
    <path d="M3.5 3l7.4 5.6-1.3-3.4L3.5 3z" fill="#E27625" />
    <path d="M17.7 16.5l-2 3 4.3 1.2 1.2-4.2-3.5 0z" fill="#E27625" />
    <path d="M2.8 16.5l1.2 4.2 4.3-1.2-2-3-3.5 0z" fill="#E27625" />
  </svg>
);

// WalletConnect logo (simplified)
const WCIcon = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6.6 9.4c2.98-2.92 7.82-2.92 10.8 0l.36.35a.37.37 0 0 1 0 .53l-1.23 1.2a.19.19 0 0 1-.27 0l-.5-.48a5.63 5.63 0 0 0-7.83 0l-.53.52a.19.19 0 0 1-.27 0l-1.23-1.2a.37.37 0 0 1 0-.53l.7-.39z" fill="#3B99FC" />
    <path d="M20.1 12.1l1.1 1.07a.37.37 0 0 1 0 .53l-4.94 4.84a.38.38 0 0 1-.54 0l-3.5-3.44a.1.1 0 0 0-.14 0l-3.5 3.44a.38.38 0 0 1-.54 0L3.1 13.7a.37.37 0 0 1 0-.53l1.1-1.07a.38.38 0 0 1 .54 0l3.5 3.44a.1.1 0 0 0 .14 0l3.5-3.44a.38.38 0 0 1 .54 0l3.5 3.44a.1.1 0 0 0 .14 0l3.5-3.44a.38.38 0 0 1 .54 0z" fill="#3B99FC" />
  </svg>
);

// ============================================================================
// PROGRESSIVE HEADLINE — builds word by word
// ============================================================================
const ProgressiveHeadline: React.FC<{ frame: number }> = ({ frame }) => {
  // Phase 1: "Protect privacy."
  // Phase 2: "Protect privacy, earn rewards."
  // Phase 3: "Protect privacy, earn rewards, invite friends."
  // Phase 4: Scene 2 headline
  // Phase 5: Scene 3 headline

  const segments = [
    { text: 'Protect privacy', inFrame: T.H1_IN, color: C.textPrimary },
    { text: ', earn rewards', inFrame: T.H1_GROW, color: C.blue },
    { text: ', invite friends.', inFrame: T.H1_FULL, color: C.green },
  ];

  const headlineOp = interpolate(frame, [T.SCENE2_IN - 15, T.SCENE2_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Scene 2 headline
  const s2Op = (() => {
    const fadeIn = interpolate(frame, [T.SCENE2_IN, T.SCENE2_IN + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [T.SCENE3_IN - 15, T.SCENE3_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  })();
  const s2Y = interpolate(spSoft(frame, T.SCENE2_IN), [0, 1], [20, 0]);

  // Scene 3 headline
  const s3Op = (() => {
    const fadeIn = interpolate(frame, [T.SCENE3_IN, T.SCENE3_IN + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [T.OUTRO_IN - 15, T.OUTRO_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  })();
  const s3Y = interpolate(spSoft(frame, T.SCENE3_IN), [0, 1], [20, 0]);

  return (
    <div style={{
      position: 'absolute', top: 180, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
    }}>
      {/* Phase 1-3 progressive headline */}
      <div style={{
        fontFamily: FD, fontSize: 52, fontWeight: 400, fontStyle: 'italic',
        letterSpacing: '-0.03em', lineHeight: 1.15, textAlign: 'center',
        opacity: headlineOp,
      }}>
        {segments.map((seg, i) => {
          const segOp = interpolate(sp(frame, seg.inFrame), [0, 1], [0, 1]);
          const segY = interpolate(sp(frame, seg.inFrame), [0, 1], [12, 0]);
          return (
            <span key={i} style={{
              color: seg.color, opacity: segOp,
              display: 'inline-block',
              transform: `translateY(${segY}px)`,
            }}>
              {seg.text}
            </span>
          );
        })}
      </div>

      {/* Scene 2 headline */}
      {s2Op > 0 && (
        <div style={{
          position: 'absolute', top: 0,
          fontFamily: FD, fontSize: 48, fontWeight: 400, fontStyle: 'italic',
          color: C.textPrimary, letterSpacing: '-0.03em', textAlign: 'center',
          opacity: s2Op, transform: `translateY(${s2Y}px)`,
        }}>
          Your node, always <span style={{ color: C.green }}>running</span>.
        </div>
      )}

      {/* Scene 3 headline */}
      {s3Op > 0 && (
        <div style={{
          position: 'absolute', top: 0,
          fontFamily: FD, fontSize: 48, fontWeight: 400, fontStyle: 'italic',
          color: C.textPrimary, letterSpacing: '-0.03em', textAlign: 'center',
          opacity: s3Op, transform: `translateY(${s3Y}px)`,
        }}>
          Built for the <span style={{ color: C.purple }}>privacy</span> era.
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUBTITLE TEXT
// ============================================================================
const SubText: React.FC<{
  text: string; frame: number; inFrame: number; outFrame: number; y?: number;
}> = ({ text, frame, inFrame, outFrame, y = 260 }) => {
  const op = (() => {
    const fadeIn = interpolate(frame, [inFrame, inFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [outFrame - 12, outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  })();
  if (op <= 0) return null;
  const slideY = interpolate(frame, [inFrame, inFrame + 18], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', top: y, left: 0, right: 0, textAlign: 'center',
      fontFamily: FB, fontSize: 18, color: C.textSecondary, letterSpacing: '0.01em',
      opacity: op, transform: `translateY(${slideY}px)`,
    }}>
      {text}
    </div>
  );
};

// ============================================================================
// START NODE MODULE — central product card
// ============================================================================
const StartNodeModule: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = sp(frame, T.MODULE_IN);
  const scale = interpolate(enter, [0, 1], [0.95, 1]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const fadeOut = interpolate(frame, [T.SCENE2_IN - 15, T.SCENE2_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Wallet connect state
  const walletOp = interpolate(sp(frame, T.MODULE_WALLET), [0, 1], [0, 1]);
  // Google state
  const googleOp = interpolate(sp(frame, T.MODULE_GOOGLE), [0, 1], [0, 1]);
  // Points counter
  const pointsOp = interpolate(sp(frame, T.MODULE_POINTS), [0, 1], [0, 1]);
  const pointsVal = Math.floor(interpolate(frame, [T.MODULE_POINTS, T.MODULE_POINTS + 80], [0, 142], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  // Connect button pulse
  const pulse = frame >= T.MODULE_IN + 15 && frame < T.MODULE_WALLET
    ? 1 + Math.sin(frame * 0.25) * 0.03
    : 1;

  return (
    <div style={{
      position: 'absolute', top: 320, left: '50%',
      transform: `translateX(-50%) scale(${scale})`,
      opacity: opacity * fadeOut,
    }}>
      <div style={{
        width: 520, background: C.white,
        border: `1px solid ${C.border}`, borderRadius: 20,
        boxShadow: C.shadowMd, padding: 28,
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: C.blueSoft, border: `1px solid ${C.blueBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldIcon size={20} color={C.blue} />
          </div>
          <div>
            <div style={{ fontFamily: FB, fontSize: 17, fontWeight: 700, color: C.textPrimary }}>Start Your Node</div>
            <div style={{ fontFamily: FM, fontSize: 12, color: C.textMuted }}>RealmxAI Privacy Engine</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: C.borderLight }} />

        {/* Connect Wallet Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: walletOp > 0.5 ? C.greenSoft : C.bgWarm,
            border: `1px solid ${walletOp > 0.5 ? C.greenBorder : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.4 + walletOp * 0.6,
          }}>
            {walletOp > 0.5 ? <CheckIcon size={16} /> : <WalletIcon size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Connect Wallet</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: walletOp > 0.5 ? C.green : C.textMuted }}>
              {walletOp > 0.5 ? 'Connected' : 'Required'}
            </div>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 8,
            background: walletOp > 0.5 ? C.greenSoft : C.blue,
            color: walletOp > 0.5 ? C.green : '#fff',
            fontFamily: FB, fontSize: 12, fontWeight: 600,
            transform: `scale(${pulse})`,
            border: walletOp > 0.5 ? `1px solid ${C.greenBorder}` : 'none',
          }}>
            {walletOp > 0.5 ? '✓ Done' : 'Connect'}
          </div>
        </div>

        {/* Google Account Row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          opacity: 0.35 + googleOp * 0.65,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: googleOp > 0.5 ? C.greenSoft : C.bgWarm,
            border: `1px solid ${googleOp > 0.5 ? C.greenBorder : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {googleOp > 0.5 ? <CheckIcon size={16} /> : <GoogleIcon size={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Google Account</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: googleOp > 0.5 ? C.green : C.textMuted }}>
              {googleOp > 0.5 ? 'Verified' : 'Optional'}
            </div>
          </div>
          <div style={{
            padding: '6px 16px', borderRadius: 8,
            background: googleOp > 0.5 ? C.greenSoft : C.bgWarm,
            color: googleOp > 0.5 ? C.green : C.textMuted,
            fontFamily: FB, fontSize: 12, fontWeight: 600,
            border: `1px solid ${googleOp > 0.5 ? C.greenBorder : C.border}`,
          }}>
            {googleOp > 0.5 ? '✓ Done' : 'Link'}
          </div>
        </div>

        {/* Points Counter */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', borderRadius: 12,
          background: C.blueSoft, border: `1px solid ${C.blueBorder}`,
          opacity: pointsOp,
          transform: `translateY(${interpolate(pointsOp, [0, 1], [8, 0])}px)`,
        }}>
          <span style={{ fontFamily: FM, fontSize: 12, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Points Earned
          </span>
          <span style={{ fontFamily: FM, fontSize: 22, fontWeight: 700, color: C.blue }}>
            {pointsVal}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// INTEGRATION LOGOS ROW
// ============================================================================
const LogoRow: React.FC<{ frame: number }> = ({ frame }) => {
  const fadeIn = interpolate(frame, [T.LOGOS_IN, T.LOGOS_IN + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [T.SCENE2_IN - 15, T.SCENE2_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (fadeIn <= 0 && fadeOut <= 0) return null;

  const logos = [
    { icon: <WCIcon size={24} />, name: 'WalletConnect', delay: 0 },
    { icon: <MetaMaskIcon size={24} />, name: 'MetaMask', delay: 8 },
    { icon: <GoogleIcon size={22} />, name: 'Google', delay: 16 },
  ];

  return (
    <div style={{
      position: 'absolute', top: 700, left: 0, right: 0,
      display: 'flex', justifyContent: 'center', gap: 40,
      opacity: fadeIn * fadeOut,
    }}>
      {logos.map((logo, i) => {
        const logoEn = sp(frame, T.LOGOS_IN + logo.delay);
        const logoY = interpolate(logoEn, [0, 1], [15, 0]);
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            opacity: logoEn, transform: `translateY(${logoY}px)`,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: C.white, border: `1px solid ${C.border}`,
              boxShadow: C.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logo.icon}
            </div>
            <span style={{ fontFamily: FM, fontSize: 11, color: C.textMuted }}>{logo.name}</span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// PROGRESS / EARNING INDICATOR BARS
// ============================================================================
const IndicatorBar: React.FC<{
  label: string; value: string; pct: number; color: string;
  frame: number; enterDelay: number; exitFrame: number;
}> = ({ label, value, pct, color, frame, enterDelay, exitFrame }) => {
  const enter = sp(frame, enterDelay);
  const fadeOut = interpolate(frame, [exitFrame - 12, exitFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const barW = interpolate(enter, [0, 1], [0, pct]);
  const slideY = interpolate(enter, [0, 1], [10, 0]);

  return (
    <div style={{
      width: 460, opacity: enter * fadeOut,
      transform: `translateY(${slideY}px)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{label}</span>
        <span style={{ fontFamily: FM, fontSize: 13, fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{
        width: '100%', height: 6, borderRadius: 3,
        background: C.borderLight,
      }}>
        <div style={{
          width: `${barW}%`, height: '100%', borderRadius: 3,
          background: color, boxShadow: `0 0 8px ${color}30`,
          transition: 'width 0.2s ease',
        }} />
      </div>
    </div>
  );
};

const IndicatorBars: React.FC<{ frame: number }> = ({ frame }) => {
  const bars1 = [
    { label: 'Session Time', value: '4h 32m', pct: 65, color: C.blue },
    { label: 'Points Earned', value: '142 pts', pct: 78, color: C.green },
    { label: 'Referrals Accepted', value: '3 / 5', pct: 60, color: C.purple },
  ];

  const bars2 = [
    { label: 'Network Uptime', value: '99.8%', pct: 99, color: C.green },
    { label: 'Privacy Score', value: 'A+', pct: 95, color: C.blue },
    { label: 'Epoch Progress', value: '65%', pct: 65, color: C.amber },
  ];

  const bars3 = [
    { label: 'Community Rank', value: '#15 / 4.2K', pct: 85, color: C.purple },
    { label: 'Daily Streak', value: '12 days', pct: 40, color: C.amber },
    { label: 'Referral Bonus', value: '+250 pts', pct: 72, color: C.green },
  ];

  const showBars1 = frame >= T.BARS_IN && frame < T.SCENE2_IN;
  const showBars2 = frame >= T.SCENE2_IN && frame < T.SCENE3_IN;
  const showBars3 = frame >= T.SCENE3_IN && frame < T.OUTRO_IN;

  return (
    <div style={{
      position: 'absolute', top: 400, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {showBars1 && bars1.map((b, i) => (
        <IndicatorBar key={`b1-${i}`} {...b} frame={frame} enterDelay={T.BARS_IN + i * 12} exitFrame={T.SCENE2_IN} />
      ))}
      {showBars2 && bars2.map((b, i) => (
        <IndicatorBar key={`b2-${i}`} {...b} frame={frame} enterDelay={T.SCENE2_IN + 10 + i * 12} exitFrame={T.SCENE3_IN} />
      ))}
      {showBars3 && bars3.map((b, i) => (
        <IndicatorBar key={`b3-${i}`} {...b} frame={frame} enterDelay={T.SCENE3_IN + 10 + i * 12} exitFrame={T.OUTRO_IN} />
      ))}
    </div>
  );
};

// ============================================================================
// SCENE 2 — NODE STATUS MODULE
// ============================================================================
const NodeModule: React.FC<{ frame: number }> = ({ frame }) => {
  const enterStart = T.SCENE2_IN + 5;
  const enter = sp(frame, enterStart);
  const fadeOut = interpolate(frame, [T.SCENE3_IN - 15, T.SCENE3_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = enter * fadeOut;
  if (op <= 0) return null;

  const scale = interpolate(enter, [0, 1], [0.96, 1]);
  const pulse = 1 + Math.sin(frame * 0.12) * 0.008;
  const sessionTime = Math.floor(interpolate(frame, [enterStart, enterStart + 200], [0, 272], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const hrs = Math.floor(sessionTime / 60);
  const mins = sessionTime % 60;

  return (
    <div style={{
      position: 'absolute', top: 310, left: '50%',
      transform: `translateX(-50%) scale(${scale * pulse})`,
      opacity: op,
    }}>
      <div style={{
        width: 420, background: C.white,
        border: `1px solid ${C.border}`, borderRadius: 20,
        boxShadow: C.shadowMd, padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        {/* Status indicator */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: C.greenSoft, border: `2px solid ${C.green}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${C.green}15`,
        }}>
          <div style={{ fontFamily: FM, fontSize: 16, fontWeight: 700, color: C.green }}>ON</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: FB, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>Node Active</div>
          <div style={{ fontFamily: FM, fontSize: 13, color: C.textMuted, marginTop: 4 }}>Session: {hrs}h {mins.toString().padStart(2, '0')}m</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          {[
            { label: 'Uptime', value: '99.8%', color: C.green },
            { label: 'Epoch', value: '65%', color: C.blue },
            { label: 'Rank', value: '#15', color: C.purple },
          ].map((stat, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              borderRadius: 10, background: `${stat.color}08`,
              border: `1px solid ${stat.color}15`,
            }}>
              <div style={{ fontFamily: FM, fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontFamily: FM, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 3 — ECOSYSTEM COMPATIBILITY CARDS
// ============================================================================
const EcoCards: React.FC<{ frame: number }> = ({ frame }) => {
  const enterStart = T.SCENE3_IN + 5;
  const fadeOut = interpolate(frame, [T.OUTRO_IN - 15, T.OUTRO_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (fadeOut <= 0 && frame > T.OUTRO_IN) return null;

  const features = [
    { icon: <ShieldIcon size={22} color={C.blue} />, title: 'Zero-Knowledge', sub: 'Privacy by design', color: C.blue },
    { icon: <WalletIcon size={22} color="#F6851B" />, title: 'Multi-Wallet', sub: 'MetaMask, WC, more', color: '#F6851B' },
    { icon: <GoogleIcon size={20} />, title: 'Social Login', sub: 'Google, Apple ID', color: '#4285F4' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 310, left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', gap: 20, opacity: fadeOut,
    }}>
      {features.map((feat, i) => {
        const en = sp(frame, enterStart + i * 12);
        const slideY = interpolate(en, [0, 1], [20, 0]);
        return (
          <div key={i} style={{
            width: 195, background: C.white,
            border: `1px solid ${C.border}`, borderRadius: 16,
            boxShadow: C.shadow, padding: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            textAlign: 'center',
            opacity: en, transform: `translateY(${slideY}px)`,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `${feat.color}10`, border: `1px solid ${feat.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {feat.icon}
            </div>
            <div>
              <div style={{ fontFamily: FB, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>{feat.title}</div>
              <div style={{ fontFamily: FM, fontSize: 11, color: C.textMuted, marginTop: 4 }}>{feat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// BOTTOM CAPTION — cycling statements
// ============================================================================
const BottomCaption: React.FC<{ frame: number }> = ({ frame }) => {
  const captions = [
    { text: 'Privacy-first infrastructure for everyone', inFrame: T.MODULE_IN + 20, outFrame: T.SCENE2_IN },
    { text: 'Always running, always earning', inFrame: T.SCENE2_IN + 15, outFrame: T.SCENE3_IN },
    { text: 'Compatible with your favorite tools', inFrame: T.SCENE3_IN + 15, outFrame: T.OUTRO_IN },
  ];

  return (
    <>
      {captions.map((cap, i) => {
        const op = (() => {
          const fadeIn = interpolate(frame, [cap.inFrame, cap.inFrame + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const fadeOut = interpolate(frame, [cap.outFrame - 12, cap.outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return Math.min(fadeIn, fadeOut);
        })();
        if (op <= 0) return null;
        return (
          <div key={i} style={{
            position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
            fontFamily: FM, fontSize: 13, color: C.textMuted,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            opacity: op,
          }}>
            {cap.text}
          </div>
        );
      })}
    </>
  );
};

// ============================================================================
// CORNER BRAND MARK
// ============================================================================
const BrandMark: React.FC<{ frame: number }> = ({ frame }) => {
  const op = interpolate(frame, [40, 60, T.OUTRO_IN - 10, T.OUTRO_IN], [0, 0.4, 0.4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{
      position: 'absolute', top: 40, left: 60,
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: op,
    }}>
      <Img src={staticFile('logo.webp')} style={{ width: 28, height: 28, objectFit: 'contain' }} />
      <span style={{ fontFamily: FM, fontSize: 12, color: C.textMuted, letterSpacing: '0.1em' }}>REALMXAI</span>
    </div>
  );
};

// ============================================================================
// OUTRO
// ============================================================================
const Outro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < T.OUTRO_IN) return null;

  const lf = frame - T.OUTRO_IN;
  const scale = interpolate(sp(lf, 8, fps), [0, 1], [0.9, 1]);
  const op = interpolate(lf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagOp = interpolate(lf, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(lf, 25, fps), [0, 1], [15, 0]);

  return (
    <AbsoluteFill style={{
      alignItems: 'center', justifyContent: 'center',
      background: C.bg, opacity: op,
    }}>
      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: C.white, border: `1px solid ${C.border}`,
          boxShadow: C.shadowLg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FD, fontSize: 36, fontWeight: 400, fontStyle: 'italic',
          color: C.textPrimary, marginTop: 28, letterSpacing: '-0.02em',
          opacity: tagOp, transform: `translateY(${tagY}px)`,
        }}>
          Realm<span style={{ color: C.blue, fontWeight: 600, fontStyle: 'normal' }}>X</span>AI
        </div>

        <div style={{
          fontFamily: FM, fontSize: 13, color: C.textMuted,
          marginTop: 14, letterSpacing: '0.15em', textTransform: 'uppercase',
          opacity: tagOp * 0.7, transform: `translateY(${tagY * 1.2}px)`,
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
export const RealmxClean: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Subtle warm gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at 50% 40%, rgba(59, 130, 246, 0.02) 0%, transparent 60%)`,
      }} />

      {/* Brand mark */}
      <BrandMark frame={frame} />

      {/* Progressive Headline */}
      <ProgressiveHeadline frame={frame} />

      {/* Subtexts */}
      <SubText text="Connect your identity. Start earning. Join the network." frame={frame} inFrame={T.H1_FULL + 10} outFrame={T.SCENE2_IN} />
      <SubText text="Monitor performance and stay in control." frame={frame} inFrame={T.SCENE2_IN + 10} outFrame={T.SCENE3_IN} />
      <SubText text="Seamless integration with your existing tools." frame={frame} inFrame={T.SCENE3_IN + 10} outFrame={T.OUTRO_IN} />

      {/* Scene 1: Start Node Module + Logos */}
      <StartNodeModule frame={frame} />
      <LogoRow frame={frame} />

      {/* Scene 2: Node Status Module */}
      <NodeModule frame={frame} />

      {/* Scene 3: Ecosystem Compatibility Cards */}
      <EcoCards frame={frame} />

      {/* Indicator Bars (cycle through scenes) */}
      <IndicatorBars frame={frame} />

      {/* Bottom caption */}
      <BottomCaption frame={frame} />

      {/* Outro */}
      <Outro frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
