import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';

/* ═══════════════════════════════════════════
   Design Tokens
   ═══════════════════════════════════════════ */

const ACCENT = {
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139,92,246,0.55)',
  teal: '#14B8A6',
  tealGlow: 'rgba(20,184,166,0.45)',
};

const LIGHT = {
  bg: '#F8F7F2',
  ink: '#18181B',
  muted: '#78766F',
  line: '#E8E6E0',
};

const DARK = {
  bg: '#06070A',
  surface: '#111318',
  ink: '#F0EDE8',
  muted: 'rgba(240,237,232,0.5)',
  line: 'rgba(255,255,255,0.10)',
};

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Source Sans 3", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
};

/* ═══════════════════════════════════════════
   Scene Durations (frames @ 30 fps)
   ═══════════════════════════════════════════ */

const SCENE = {
  intro: 102,       // 3.4 s
  darkReveal: 120,  // 4.0 s
  benefits: 126,    // 4.2 s
  dashboard: 102,   // 3.4 s
  close: 90,        // 3.0 s
};

const TOTAL = Object.values(SCENE).reduce((a, b) => a + b, 0); // 540 = 18 s

/* ═══════════════════════════════════════════
   Shared helpers
   ═══════════════════════════════════════════ */

const sp = (frame: number, delay = 0) =>
  spring({ fps: 30, frame: Math.max(0, frame - delay), config: { damping: 16, stiffness: 120, mass: 0.8 } });

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ═══════════════════════════════════════════
   SVG Icons
   ═══════════════════════════════════════════ */

const ShieldIcon: React.FC<{size?: number}> = ({size = 88}) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <path
      d="M40 8L64 20V40C64 54 53 62 40 68C27 62 16 54 16 40V20L40 8Z"
      stroke={ACCENT.purple} strokeWidth="2.5" fill={`${ACCENT.purple}12`}
    />
    <path d="M29 40L36 47L52 31" stroke={ACCENT.purple} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CoinsIcon: React.FC<{size?: number}> = ({size = 88}) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="52" rx="22" ry="9" stroke={ACCENT.purple} strokeWidth="2" fill={`${ACCENT.purple}08`} />
    <ellipse cx="40" cy="42" rx="22" ry="9" stroke={ACCENT.purple} strokeWidth="2" fill={`${ACCENT.purple}10`} />
    <ellipse cx="40" cy="32" rx="22" ry="9" stroke={ACCENT.purple} strokeWidth="2" fill={`${ACCENT.purple}18`} />
    <line x1="18" y1="32" x2="18" y2="52" stroke={ACCENT.purple} strokeWidth="2" />
    <line x1="62" y1="32" x2="62" y2="52" stroke={ACCENT.purple} strokeWidth="2" />
    <text x="40" y="38" textAnchor="middle" fill={ACCENT.purple} fontSize="14" fontWeight="700" fontFamily={fonts.mono}>$</text>
  </svg>
);

const LinkIcon: React.FC<{size?: number}> = ({size = 88}) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <circle cx="24" cy="40" r="10" stroke={ACCENT.teal} strokeWidth="2" fill={`${ACCENT.teal}12`} />
    <circle cx="58" cy="24" r="8" stroke={ACCENT.teal} strokeWidth="2" fill={`${ACCENT.teal}12`} />
    <circle cx="58" cy="56" r="8" stroke={ACCENT.teal} strokeWidth="2" fill={`${ACCENT.teal}12`} />
    <line x1="34" y1="36" x2="50" y2="28" stroke={ACCENT.teal} strokeWidth="2" />
    <line x1="34" y1="44" x2="50" y2="52" stroke={ACCENT.teal} strokeWidth="2" />
  </svg>
);

/* ═══════════════════════════════════════════
   SCENE 1 — Editorial Intro  (white canvas,
   annotation text, word-by-word underlines)
   ═══════════════════════════════════════════ */

const EditorialIntro: React.FC = () => {
  const frame = useCurrentFrame();

  const hexRot = interpolate(frame, [0, SCENE.intro], [0, 10]);
  const hexScale = interpolate(frame, [0, SCENE.intro], [0.96, 1.03]);

  const words: { text: string; delay: number }[] = [
    { text: 'pseudonymous.', delay: 14 },
    { text: 'secure.', delay: 30 },
    { text: 'fair.', delay: 46 },
  ];

  const bodyOpacity = interpolate(frame, [58, 74], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bodyY = interpolate(frame, [58, 74], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: LIGHT.bg }}>
      {/* Subtle dot grid */}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.035) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Abstract hexagon, cropped at edge */}
      <div
        style={{
          position: 'absolute',
          right: -180,
          top: '50%',
          transform: `translateY(-50%) rotate(${hexRot}deg) scale(${hexScale})`,
          opacity: 0.055,
        }}
      >
        <svg width="960" height="960" viewBox="0 0 100 100">
          <polygon points="50,2 95,26 95,74 50,98 5,74 5,26" fill="none" stroke={ACCENT.purple} strokeWidth="0.4" />
          <polygon points="50,10 87,28 87,72 50,90 13,72 13,28" fill="none" stroke={ACCENT.purple} strokeWidth="0.25" />
        </svg>
      </div>

      {/* Corner brand */}
      <div
        style={{
          position: 'absolute', left: 54, top: 44,
          display: 'flex', alignItems: 'center', gap: 12,
          opacity: interpolate(frame, [0, 20], [0, 0.45], { extrapolateRight: 'clamp' }),
        }}
      >
        <Img src={staticFile('logo.webp')} style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.7 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 13, color: LIGHT.muted, letterSpacing: '0.08em' }}>realm xai</span>
      </div>

      {/* Annotation text block */}
      <div style={{ position: 'absolute', left: 164, top: '40%', display: 'flex', flexDirection: 'column', gap: 26 }}>
        {/* Annotation marker */}
        <div
          style={{
            fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: LIGHT.muted,
            opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          ↳ core principles
        </div>

        {/* Words with underlines */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'baseline' }}>
          {words.map(({ text, delay }, i) => {
            const enter = sp(frame, delay);
            const ulProgress = interpolate(frame, [delay + 14, delay + 26], [0, 1], {
              extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
            });
            return (
              <span
                key={i}
                style={{
                  fontFamily: fonts.display, fontSize: 62, fontStyle: 'italic',
                  color: LIGHT.ink, letterSpacing: '-0.04em',
                  opacity: enter,
                  transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
                  display: 'inline-block', position: 'relative',
                }}
              >
                {text}
                <span
                  style={{
                    position: 'absolute', bottom: -3, left: 0,
                    width: `${ulProgress * 100}%`, height: 3,
                    background: ACCENT.purple, borderRadius: 2,
                    boxShadow: `0 0 10px ${ACCENT.purpleGlow}`,
                  }}
                />
              </span>
            );
          })}
        </div>

        {/* Secondary body */}
        <div
          style={{
            fontFamily: fonts.body, fontSize: 24, lineHeight: 1.5,
            color: LIGHT.muted, maxWidth: 580,
            opacity: bodyOpacity,
            transform: `translateY(${bodyY}px)`,
          }}
        >
          A node platform built on the principle that privacy and participation can coexist.
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 2 — Dark Brand Reveal  (sliding bar,
   wallet icons, pulsating medallion)
   ═══════════════════════════════════════════ */

const DarkBrandReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const barX = interpolate(frame, [2, 30], [-1920, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const medallionScale = sp(frame, 20);
  const pulse = 1 + Math.sin(frame / 8) * 0.03;

  const providers = [
    { name: 'MetaMask', color: '#E8831D', letter: 'M' },
    { name: 'WalletConnect', color: '#3B99FC', letter: 'W' },
    { name: 'Google', color: '#EA4335', letter: 'G' },
    { name: 'Phantom', color: '#AB9FF2', letter: 'P' },
  ];

  const avatars = [
    { dx: -130, dy: -100, color: '#FF6B6B', s: 32 },
    { dx: 140, dy: -80, color: '#4ECDC4', s: 28 },
    { dx: -110, dy: 100, color: '#45B7D1', s: 30 },
    { dx: 160, dy: 90, color: '#F7DC6F', s: 26 },
    { dx: -160, dy: 10, color: '#BB8FCE', s: 34 },
    { dx: 80, dy: -130, color: '#96CEB4', s: 24 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: DARK.bg }}>
      {/* Gradient orbs */}
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(circle at 40% 35%, rgba(139,92,246,0.12), transparent 30%)`,
            `radial-gradient(circle at 65% 60%, rgba(20,184,166,0.08), transparent 28%)`,
          ].join(','),
        }}
      />

      {/* Subtle grid */}
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          opacity: 0.5,
        }}
      />

      {/* Central medallion */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '38%',
          transform: `translate(-50%,-50%) scale(${medallionScale * pulse})`,
          opacity: medallionScale,
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute', inset: -60,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT.purpleGlow}, transparent 60%)`,
            opacity: 0.5 + Math.sin(frame / 8) * 0.15,
          }}
        />
        {/* Ring */}
        <div
          style={{
            width: 120, height: 120, borderRadius: '50%',
            border: `2px solid ${DARK.line}`,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 0 40px ${ACCENT.purpleGlow}`,
          }}
        >
          <Img src={staticFile('logo.webp')} style={{ width: '68%', height: '68%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Clustered avatars */}
      {avatars.map(({ dx, dy, color, s }, i) => {
        const aEnter = sp(frame, 28 + i * 5);
        const drift = Math.sin((frame + i * 20) / 16) * 6;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${dx}px)`,
              top: `calc(38% + ${dy + drift}px)`,
              width: s, height: s, borderRadius: '50%',
              background: color, opacity: aEnter * 0.7,
              transform: `translate(-50%,-50%) scale(${aEnter})`,
              border: `2px solid ${DARK.bg}`,
            }}
          />
        );
      })}

      {/* Sliding bar with provider icons */}
      <div
        style={{
          position: 'absolute', left: 0, top: '64%',
          width: '100%', height: 78,
          transform: `translateX(${barX}px)`,
        }}
      >
        <div
          style={{
            width: '100%', height: '100%',
            background: 'rgba(255,255,255,0.04)',
            borderTop: `1.5px solid ${ACCENT.purple}44`,
            borderBottom: `1px solid ${DARK.line}`,
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64,
            boxShadow: `0 -2px 30px ${ACCENT.purpleGlow}`,
          }}
        >
          {providers.map((p, i) => {
            const pEnter = sp(frame, 24 + i * 7);
            return (
              <div
                key={p.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  opacity: pEnter,
                  transform: `translateY(${interpolate(pEnter, [0, 1], [8, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${p.color}22`, border: `1px solid ${p.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: fonts.mono, fontSize: 16, fontWeight: 700, color: p.color,
                  }}
                >
                  {p.letter}
                </div>
                <span style={{ fontFamily: fonts.body, fontSize: 16, color: DARK.ink, opacity: 0.7 }}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          position: 'absolute', left: 60, right: 60, bottom: 60, height: 2,
          background: `linear-gradient(90deg, transparent, ${ACCENT.purple}, ${ACCENT.teal}, transparent)`,
          opacity: interpolate(frame, [40, 60], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      />
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 3 — Benefit Proofs  (three headline
   cards with icons on light background)
   ═══════════════════════════════════════════ */

const benefits = [
  {
    Icon: ShieldIcon,
    title: 'Enhanced Privacy',
    body: 'Your data stays yours. Private execution keeps identity and activity confidential by default.',
    delay: 0,
  },
  {
    Icon: CoinsIcon,
    title: 'Earn Points',
    body: 'Secure the chain and earn rewards. Active sessions mine points toward the token generation event.',
    delay: 28,
  },
  {
    Icon: LinkIcon,
    title: 'Fair Referrals',
    body: 'No loopholes. Transparent attribution ensures every referral is verified and rewarded equally.',
    delay: 56,
  },
];

const BenefitProofs: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: LIGHT.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(139,92,246,0.04), transparent 50%),
                        radial-gradient(circle at 70% 70%, rgba(20,184,166,0.03), transparent 40%)`,
        }}
      />

      {/* Section tag */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 62, textAlign: 'center',
          fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: LIGHT.muted,
          opacity: sp(frame, 0),
        }}
      >
        ● what you get
      </div>

      {/* Three benefit columns */}
      <div
        style={{
          position: 'absolute', left: 100, right: 100, top: 140, bottom: 80,
          display: 'flex', gap: 48, alignItems: 'flex-start',
        }}
      >
        {benefits.map(({ Icon, title, body, delay }, i) => {
          const enter = sp(frame, delay);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 20, padding: '40px 24px',
                borderRadius: 28,
                border: `1px solid ${LIGHT.line}`,
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [32, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 100, height: 100, borderRadius: 24,
                  background: 'rgba(139,92,246,0.06)', border: `1px solid ${LIGHT.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={56} />
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: 36, color: LIGHT.ink, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                {title}
              </div>
              <div style={{ fontFamily: fonts.body, fontSize: 20, lineHeight: 1.5, color: LIGHT.muted, maxWidth: 380 }}>
                {body}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 4 — Dashboard Proof  (perspective-
   tilted panel, ticking stats, green dots)
   ═══════════════════════════════════════════ */

const rows = [
  { handle: 'node_alpha', dur: '2h 14m', pts: 1247, gain: 312, refs: 12 },
  { handle: 'relay_sigma', dur: '1h 48m', pts: 892, gain: 187, refs: 8 },
  { handle: 'vk_privacy', dur: '3h 02m', pts: 2105, gain: 445, refs: 23 },
  { handle: 'chain_watcher', dur: '0h 52m', pts: 418, gain: 96, refs: 5 },
  { handle: 'zk_pioneer', dur: '4h 31m', pts: 3247, gain: 589, refs: 31 },
];

const DashboardProof: React.FC = () => {
  const frame = useCurrentFrame();
  const panelEnter = sp(frame, 6);

  return (
    <AbsoluteFill style={{ backgroundColor: '#F4F3EE' }}>
      <AbsoluteFill
        style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.03), transparent 50%)' }}
      />

      {/* Section tag */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center',
          fontFamily: fonts.mono, fontSize: 13, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: LIGHT.muted,
          opacity: sp(frame, 0),
        }}
      >
        ● live dashboard
      </div>

      {/* Perspective panel */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '54%',
          transform: `translate(-50%,-50%) perspective(1400px) rotateX(6deg) rotateY(-5deg) scale(${interpolate(panelEnter, [0, 1], [0.92, 1])})`,
          width: 1200, borderRadius: 24,
          border: `1px solid ${LIGHT.line}`,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 32px 100px rgba(16,18,24,0.12), 0 6px 20px rgba(16,18,24,0.06)',
          backdropFilter: 'blur(12px)',
          overflow: 'hidden',
          opacity: panelEnter,
        }}
      >
        {/* Title bar */}
        <div
          style={{
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: `1px solid ${LIGHT.line}`,
          }}
        >
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c }} />
          ))}
          <span style={{ marginLeft: 12, fontFamily: fonts.mono, fontSize: 13, color: LIGHT.muted, letterSpacing: '0.06em' }}>
            REALMxAI Dashboard — Active Sessions
          </span>
        </div>

        {/* Header row */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 1fr 0.8fr 0.6fr',
            padding: '12px 24px', borderBottom: `1px solid ${LIGHT.line}`,
            fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: LIGHT.muted,
          }}
        >
          <span>Session</span><span>Duration</span><span>Points</span><span>Referrals</span><span>Status</span>
        </div>

        {/* Data rows */}
        {rows.map((row, i) => {
          const rowEnter = sp(frame, 14 + i * 8);
          const tickedPts = row.pts + Math.floor(
            interpolate(frame, [20, SCENE.dashboard], [0, row.gain], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          );
          const greenPulse = 0.6 + Math.sin((frame + i * 10) / 6) * 0.4;

          return (
            <div
              key={row.handle}
              style={{
                display: 'grid', gridTemplateColumns: '1.4fr 0.9fr 1fr 0.8fr 0.6fr',
                padding: '16px 24px',
                borderBottom: `1px solid ${LIGHT.line}`,
                opacity: rowEnter,
                transform: `translateX(${interpolate(rowEnter, [0, 1], [20, 0])}px)`,
              }}
            >
              <span style={{ fontFamily: fonts.mono, fontSize: 17, color: LIGHT.ink, fontWeight: 600 }}>{row.handle}</span>
              <span style={{ fontFamily: fonts.body, fontSize: 17, color: LIGHT.muted }}>{row.dur}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 17, color: ACCENT.purple, fontWeight: 700 }}>
                {tickedPts.toLocaleString()}
              </span>
              <span style={{ fontFamily: fonts.body, fontSize: 17, color: LIGHT.ink }}>{row.refs}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 999, background: '#22C55E',
                    boxShadow: `0 0 8px rgba(34,197,94,${greenPulse})`,
                  }}
                />
                <span style={{ fontFamily: fonts.body, fontSize: 14, color: '#22C55E' }}>Active</span>
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 5 — Logo Close  (glowing emblem,
   tagline, dark background)
   ═══════════════════════════════════════════ */

const LogoClose: React.FC = () => {
  const frame = useCurrentFrame();

  const logoEnter = sp(frame, 6);
  const tagEnter = interpolate(frame, [34, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const urlEnter = interpolate(frame, [50, 64], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glowPulse = 1 + Math.sin(frame / 10) * 0.12;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK.bg }}>
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '44%',
          width: 600, height: 600,
          transform: `translate(-50%,-50%) scale(${glowPulse})`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT.purpleGlow}, rgba(139,92,246,0.08) 40%, transparent 65%)`,
          opacity: logoEnter * 0.6,
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '44%',
          transform: `translate(-50%,-50%) scale(${interpolate(logoEnter, [0, 1], [0.7, 1])})`,
          opacity: logoEnter,
        }}
      >
        <div
          style={{
            width: 140, height: 140, borderRadius: 32,
            border: `1.5px solid rgba(255,255,255,0.12)`,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 24px 80px ${ACCENT.purpleGlow}`,
          }}
        >
          <Img src={staticFile('logo.webp')} style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Brand name */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(44% + 100px)',
          textAlign: 'center', opacity: logoEnter,
          fontFamily: fonts.mono, fontSize: 32, fontWeight: 700,
          color: DARK.ink, letterSpacing: '-0.04em',
        }}
      >
        Realm<span style={{ color: ACCENT.purple }}>X</span>AI
      </div>

      {/* Tagline */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(44% + 155px)',
          textAlign: 'center',
          fontFamily: fonts.display, fontSize: 28, fontStyle: 'italic',
          color: DARK.muted, letterSpacing: '-0.02em',
          opacity: tagEnter,
          transform: `translateY(${interpolate(tagEnter, [0, 1], [8, 0])}px)`,
        }}
      >
        Join the privacy revolution.
      </div>

      {/* URL */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 60,
          textAlign: 'center',
          fontFamily: fonts.mono, fontSize: 15, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: DARK.muted,
          opacity: urlEnter * 0.5,
        }}
      >
        realmxai.com
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   Export — Main Composition
   ═══════════════════════════════════════════ */

export const RealmxFilm: React.FC = () => {
  const off = {
    intro: 0,
    dark: SCENE.intro,
    bene: SCENE.intro + SCENE.darkReveal,
    dash: SCENE.intro + SCENE.darkReveal + SCENE.benefits,
    close: SCENE.intro + SCENE.darkReveal + SCENE.benefits + SCENE.dashboard,
  };

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Sequence from={off.intro} durationInFrames={SCENE.intro}><EditorialIntro /></Sequence>
      <Sequence from={off.dark} durationInFrames={SCENE.darkReveal}><DarkBrandReveal /></Sequence>
      <Sequence from={off.bene} durationInFrames={SCENE.benefits}><BenefitProofs /></Sequence>
      <Sequence from={off.dash} durationInFrames={SCENE.dashboard}><DashboardProof /></Sequence>
      <Sequence from={off.close} durationInFrames={SCENE.close}><LogoClose /></Sequence>
    </AbsoluteFill>
  );
};
