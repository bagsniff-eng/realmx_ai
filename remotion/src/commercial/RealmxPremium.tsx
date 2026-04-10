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

const CREAM = {
  bg: '#F6F4EF',
  card: '#FFFFFF',
  ink: '#1A1918',
  muted: '#8A877F',
  line: '#E4E1D9',
  soft: '#D5D2CA',
};

const NIGHT = {
  bg1: '#0C0A1A',
  bg2: '#1A1040',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.10)',
  ink: '#F0ECE4',
  muted: 'rgba(240,236,228,0.55)',
  glow: 'rgba(124,107,196,0.35)',
};

const ACCENT = '#7C6BC4';
const ACCENT_GLOW = 'rgba(124,107,196,0.5)';
const GREEN = '#34D399';

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Source Sans 3", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
};

/* ═══════════════════════════════════════════
   Scene Durations (frames @ 30fps)
   ═══════════════════════════════════════════ */

const S = {
  open: 72,       // 2.4s  — warm white, glyph + wordmark
  dark1: 96,      // 3.2s  — text assembly + empty panel
  light1: 90,     // 3.0s  — connecting state + aspirational line
  dark2: 90,      // 3.0s  — verified state + aspirational line
  light2: 84,     // 2.8s  — mining state, points ticking
  close: 78,      // 2.6s  — logo glow + tagline
};

const TOTAL = Object.values(S).reduce((a, b) => a + b, 0); // 510 = 17s

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

const sp = (frame: number, delay = 0) =>
  spring({ fps: 30, frame: Math.max(0, frame - delay), config: { damping: 18, stiffness: 100, mass: 1 } });

const fade = (frame: number, inStart: number, inEnd: number, outStart?: number, outEnd?: number) => {
  let o = interpolate(frame, [inStart, inEnd], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (outStart !== undefined && outEnd !== undefined) {
    o *= interpolate(frame, [outStart, outEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }
  return o;
};

/* ═══════════════════════════════════════════
   Word-by-Word Assembly
   ═══════════════════════════════════════════ */

const WordAssembly: React.FC<{
  text: string;
  frame: number;
  stagger?: number;
  delay?: number;
  dark?: boolean;
  size?: number;
}> = ({ text, frame, stagger = 5, delay = 0, dark = false, size = 54 }) => {
  const words = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 14px' }}>
      {words.map((word, i) => {
        const d = delay + i * stagger;
        const enter = sp(frame, d);
        return (
          <span
            key={i}
            style={{
              fontFamily: fonts.display,
              fontSize: size,
              fontStyle: 'italic',
              color: dark ? NIGHT.ink : CREAM.ink,
              letterSpacing: '-0.04em',
              lineHeight: 1.15,
              opacity: enter,
              transform: `translateY(${interpolate(enter, [0, 1], [14, 0])}px)`,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Aspirational Line  (centred, luxurious)
   ═══════════════════════════════════════════ */

const AspirationalLine: React.FC<{
  text: string;
  frame: number;
  delay?: number;
  dark?: boolean;
}> = ({ text, frame, delay = 0, dark = false }) => {
  const o = fade(frame, delay, delay + 16);
  const y = interpolate(frame, [delay, delay + 16], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        fontFamily: fonts.display,
        fontSize: 32,
        fontStyle: 'italic',
        color: dark ? NIGHT.muted : CREAM.muted,
        letterSpacing: '-0.02em',
        textAlign: 'center',
        opacity: o,
        transform: `translateY(${y}px)`,
      }}
    >
      {text}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Start Node Panel  (the hero module)
   ═══════════════════════════════════════════ */

type PanelState = 'empty' | 'connecting' | 'verified' | 'mining';

const StartNodePanel: React.FC<{
  state: PanelState;
  frame: number;
  dark?: boolean;
  delay?: number;
}> = ({ state, frame, dark = false, delay = 0 }) => {
  const enter = sp(frame, delay);
  const lf = Math.max(0, frame - delay); // local frame after entry

  const bg = dark ? NIGHT.card : CREAM.card;
  const border = dark ? NIGHT.cardBorder : CREAM.line;
  const ink = dark ? NIGHT.ink : CREAM.ink;
  const muted = dark ? NIGHT.muted : CREAM.muted;
  const shadow = dark
    ? `0 32px 80px rgba(0,0,0,0.5), 0 0 60px ${NIGHT.glow}`
    : '0 20px 60px rgba(26,25,24,0.08), 0 2px 8px rgba(26,25,24,0.04)';

  return (
    <div
      style={{
        width: 420,
        borderRadius: 24,
        border: `1px solid ${border}`,
        background: bg,
        backdropFilter: 'blur(16px)',
        boxShadow: shadow,
        overflow: 'hidden',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px) scale(${interpolate(enter, [0, 1], [0.97, 1])})`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Img
            src={staticFile('logo.webp')}
            style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.8 }}
          />
          <span style={{ fontFamily: fonts.mono, fontSize: 14, fontWeight: 600, color: ink, letterSpacing: '-0.02em' }}>
            Start Node
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: 999, background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Wallet row */}
        <PanelRow
          label="Wallet"
          icon="W"
          iconColor="#E8831D"
          state={state === 'empty' ? 'idle' : state === 'connecting' ? 'loading' : 'done'}
          statusText={state === 'empty' ? 'Connect wallet' : state === 'connecting' ? 'Connecting…' : 'Connected'}
          dark={dark}
          frame={lf}
        />

        {/* Google row */}
        <PanelRow
          label="Google"
          icon="G"
          iconColor="#4285F4"
          state={state === 'empty' ? 'idle' : state === 'connecting' ? 'idle' : 'done'}
          statusText={state === 'empty' ? 'Sign in' : state === 'connecting' ? 'Sign in' : 'Verified'}
          dark={dark}
          frame={lf}
        />

        {/* Divider */}
        <div style={{ height: 1, background: border, margin: '4px 0' }} />

        {/* Status / action area */}
        <StatusArea state={state} dark={dark} frame={lf} />
      </div>
    </div>
  );
};

/* ─── Panel Row ─── */

const PanelRow: React.FC<{
  label: string;
  icon: string;
  iconColor: string;
  state: 'idle' | 'loading' | 'done';
  statusText: string;
  dark: boolean;
  frame: number;
}> = ({ label, icon, iconColor, state, statusText, dark, frame }) => {
  const ink = dark ? NIGHT.ink : CREAM.ink;
  const muted = dark ? NIGHT.muted : CREAM.muted;
  const border = dark ? NIGHT.cardBorder : CREAM.line;
  const spinAngle = state === 'loading' ? (frame * 8) % 360 : 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        border: `1px solid ${border}`,
        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
      }}
    >
      {/* Icon tile */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${iconColor}18`,
          border: `1px solid ${iconColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.mono,
          fontSize: 14,
          fontWeight: 700,
          color: iconColor,
        }}
      >
        {icon}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: ink }}>{label}</div>
        <div style={{ fontFamily: fonts.body, fontSize: 12, color: muted }}>{statusText}</div>
      </div>

      {/* Status indicator */}
      {state === 'done' && (
        <svg width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="9" fill={`${GREEN}20`} stroke={GREEN} strokeWidth="1.5" />
          <path d="M6 10l3 3 5-5" stroke={GREEN} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {state === 'loading' && (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: `2px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
            borderTopColor: ACCENT,
            transform: `rotate(${spinAngle}deg)`,
          }}
        />
      )}
      {state === 'idle' && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          }}
        />
      )}
    </div>
  );
};

/* ─── Status Area (bottom of panel) ─── */

const StatusArea: React.FC<{
  state: PanelState;
  dark: boolean;
  frame: number;
}> = ({ state, dark, frame }) => {
  const ink = dark ? NIGHT.ink : CREAM.ink;
  const muted = dark ? NIGHT.muted : CREAM.muted;

  if (state === 'empty') {
    return (
      <div
        style={{
          padding: '14px 0 4px',
          textAlign: 'center',
          fontFamily: fonts.body,
          fontSize: 14,
          color: muted,
        }}
      >
        Connect a wallet to begin
      </div>
    );
  }

  if (state === 'connecting') {
    return (
      <div style={{ padding: '14px 0 4px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            background: `${ACCENT}18`,
            border: `1px solid ${ACCENT}30`,
            fontFamily: fonts.mono,
            fontSize: 13,
            color: ACCENT,
            letterSpacing: '0.04em',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: '2px solid transparent',
              borderTopColor: ACCENT,
              borderRightColor: ACCENT,
              transform: `rotate(${(frame * 8) % 360}deg)`,
            }}
          />
          Awaiting signature…
        </div>
      </div>
    );
  }

  if (state === 'verified') {
    return (
      <div style={{ padding: '10px 0 4px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            background: `${GREEN}14`,
            border: `1px solid ${GREEN}30`,
            fontFamily: fonts.mono,
            fontSize: 13,
            color: GREEN,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20">
            <path d="M6 10l3 3 5-5" stroke={GREEN} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
          Identity verified
        </div>
      </div>
    );
  }

  // mining
  const pts = Math.floor(interpolate(frame, [0, 80], [0, 847], { extrapolateRight: 'clamp' }));
  const pulse = 0.6 + Math.sin(frame / 5) * 0.4;

  return (
    <div style={{ padding: '8px 0 4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.14em', color: muted }}>
          Mining active
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: GREEN,
              boxShadow: `0 0 8px rgba(52,211,153,${pulse})`,
            }}
          />
          <span style={{ fontFamily: fonts.mono, fontSize: 12, color: GREEN }}>LIVE</span>
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: fonts.display, fontSize: 36, color: ink, letterSpacing: '-0.04em' }}>
          {pts.toLocaleString()}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 13, color: muted }}>pts earned</span>
      </div>
      {/* Progress bar */}
      <div
        style={{
          marginTop: 10,
          height: 5,
          borderRadius: 999,
          background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${interpolate(frame, [0, 80], [0, 100], { extrapolateRight: 'clamp' })}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${ACCENT}, ${GREEN})`,
          }}
        />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Corner Glyph + Wordmark
   ═══════════════════════════════════════════ */

const TopBrand: React.FC<{ dark?: boolean; frame: number }> = ({ dark = false, frame }) => {
  const o = fade(frame, 0, 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 44,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        opacity: o,
        zIndex: 10,
      }}
    >
      <Img
        src={staticFile('logo.webp')}
        style={{ width: 28, height: 28, objectFit: 'contain', opacity: dark ? 0.7 : 0.6 }}
      />
      <span
        style={{
          fontFamily: fonts.display,
          fontSize: 20,
          fontStyle: 'italic',
          color: dark ? NIGHT.muted : CREAM.muted,
          letterSpacing: '-0.02em',
        }}
      >
        RealmxAI
      </span>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Backgrounds
   ═══════════════════════════════════════════ */

const CreamBg: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 50% 40%, #FDFCF8, ${CREAM.bg} 60%)`,
    }}
  />
);

const NightBg: React.FC<{ frame: number }> = ({ frame }) => {
  const shift = frame * 0.002;
  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(circle at ${50 + Math.sin(shift) * 4}% ${42 + Math.cos(shift) * 3}%, rgba(124,107,196,0.18), transparent 36%),
          linear-gradient(160deg, ${NIGHT.bg1} 0%, ${NIGHT.bg2} 100%)
        `,
      }}
    />
  );
};

/* ═══════════════════════════════════════════
   SCENE 1 — Warm Open
   ═══════════════════════════════════════════ */

const WarmOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const exitO = fade(frame, 0, 1, S.open - 14, S.open);

  return (
    <AbsoluteFill style={{ opacity: exitO }}>
      <CreamBg />
      <TopBrand frame={frame} />

      {/* Centred wordmark reveal */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <div style={{ opacity: sp(frame, 10), transform: `scale(${interpolate(sp(frame, 10), [0, 1], [0.9, 1])})` }}>
          <Img src={staticFile('logo.webp')} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 42,
            fontStyle: 'italic',
            color: CREAM.ink,
            letterSpacing: '-0.04em',
            opacity: sp(frame, 20),
            transform: `translateY(${interpolate(sp(frame, 20), [0, 1], [8, 0])}px)`,
          }}
        >
          Realm<span style={{ color: ACCENT }}>X</span>AI
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            color: CREAM.muted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: sp(frame, 32),
          }}
        >
          the privacy layer
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 2 — Dark: Text Assembly + Empty Panel
   ═══════════════════════════════════════════ */

const DarkTextPanel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <NightBg frame={frame} />
      <TopBrand dark frame={frame} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
        }}
      >
        {/* Word-by-word text */}
        <div style={{ maxWidth: 700 }}>
          <WordAssembly text="Your privacy matters more than ever." frame={frame} delay={6} dark />
        </div>

        {/* Empty panel */}
        <StartNodePanel state="empty" frame={frame} dark delay={30} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 3 — Light: Connecting + Aspirational
   ═══════════════════════════════════════════ */

const LightConnecting: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <CreamBg />
      <TopBrand frame={frame} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <StartNodePanel state="connecting" frame={frame} delay={8} />
        <AspirationalLine text="Secure your chain." frame={frame} delay={32} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 4 — Dark: Verified + Aspirational
   ═══════════════════════════════════════════ */

const DarkVerified: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <NightBg frame={frame} />
      <TopBrand dark frame={frame} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <StartNodePanel state="verified" frame={frame} dark delay={8} />
        <AspirationalLine text="Earn while protecting." frame={frame} delay={34} dark />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 5 — Light: Mining (points ticking)
   ═══════════════════════════════════════════ */

const LightMining: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <CreamBg />
      <TopBrand frame={frame} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
        }}
      >
        <StartNodePanel state="mining" frame={frame} delay={6} />
        <AspirationalLine text="Points accrue. Trust compounds." frame={frame} delay={28} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   SCENE 6 — Dark Close (logo glow + tagline)
   ═══════════════════════════════════════════ */

const DarkClose: React.FC = () => {
  const frame = useCurrentFrame();
  const logoEnter = sp(frame, 8);
  const glowPulse = 1 + Math.sin(frame / 10) * 0.1;
  const tagO = fade(frame, 30, 46);

  return (
    <AbsoluteFill>
      <NightBg frame={frame} />

      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '46%',
          width: 500,
          height: 500,
          transform: `translate(-50%,-50%) scale(${glowPulse})`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${ACCENT_GLOW}, transparent 58%)`,
          opacity: logoEnter * 0.55,
        }}
      />

      {/* Logo + text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            opacity: logoEnter,
            transform: `scale(${interpolate(logoEnter, [0, 1], [0.8, 1])})`,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 26,
              border: `1px solid rgba(255,255,255,0.1)`,
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(14px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 20px 60px ${ACCENT_GLOW}`,
            }}
          >
            <Img src={staticFile('logo.webp')} style={{ width: '66%', height: '66%', objectFit: 'contain' }} />
          </div>
        </div>

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 30,
            fontStyle: 'italic',
            color: NIGHT.ink,
            letterSpacing: '-0.03em',
            opacity: logoEnter,
          }}
        >
          Realm<span style={{ color: ACCENT }}>X</span>AI
        </div>

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            fontStyle: 'italic',
            color: NIGHT.muted,
            opacity: tagO,
            transform: `translateY(${interpolate(tagO, [0, 1], [6, 0])}px)`,
            marginTop: 6,
          }}
        >
          Join the privacy revolution.
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 48,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 13,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: NIGHT.muted,
          opacity: tagO * 0.4,
        }}
      >
        realmxai.com
      </div>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   Crossfade Wrapper
   ═══════════════════════════════════════════ */

const CrossfadeScene: React.FC<{
  duration: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
}> = ({ duration, fadeIn = 12, fadeOut = 12, children }) => {
  const frame = useCurrentFrame();
  const inO = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const outO = fadeOut > 0 ? interpolate(frame, [duration - fadeOut, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  return <AbsoluteFill style={{ opacity: Math.min(inO, outO) }}>{children}</AbsoluteFill>;
};

/* ═══════════════════════════════════════════
   Export — Main Composition
   ═══════════════════════════════════════════ */

export const RealmxPremium: React.FC = () => {
  const off = {
    open: 0,
    dark1: S.open,
    light1: S.open + S.dark1,
    dark2: S.open + S.dark1 + S.light1,
    light2: S.open + S.dark1 + S.light1 + S.dark2,
    close: S.open + S.dark1 + S.light1 + S.dark2 + S.light2,
  };

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Sequence from={off.open} durationInFrames={S.open}>
        <CrossfadeScene duration={S.open} fadeIn={0} fadeOut={14}>
          <WarmOpen />
        </CrossfadeScene>
      </Sequence>

      <Sequence from={off.dark1} durationInFrames={S.dark1}>
        <CrossfadeScene duration={S.dark1}>
          <DarkTextPanel />
        </CrossfadeScene>
      </Sequence>

      <Sequence from={off.light1} durationInFrames={S.light1}>
        <CrossfadeScene duration={S.light1}>
          <LightConnecting />
        </CrossfadeScene>
      </Sequence>

      <Sequence from={off.dark2} durationInFrames={S.dark2}>
        <CrossfadeScene duration={S.dark2}>
          <DarkVerified />
        </CrossfadeScene>
      </Sequence>

      <Sequence from={off.light2} durationInFrames={S.light2}>
        <CrossfadeScene duration={S.light2}>
          <LightMining />
        </CrossfadeScene>
      </Sequence>

      <Sequence from={off.close} durationInFrames={S.close}>
        <CrossfadeScene duration={S.close} fadeOut={0}>
          <DarkClose />
        </CrossfadeScene>
      </Sequence>
    </AbsoluteFill>
  );
};
