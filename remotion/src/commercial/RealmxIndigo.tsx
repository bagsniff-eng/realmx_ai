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
// TIMING (600 frames @ 30fps = 20s)
// ============================================================================
const DURATION = 600;

const T = {
  // Act 1: Dark suspense fragments
  FRAG1: 20,
  FRAG2: 55,
  FRAG3: 90,
  // Act 2: Node session card
  CARD_IN: 120,
  CARDS_FAN: 175,
  CARDS_STACK: 240,
  // Act 3: Light violet environment with cubes
  LIGHT_IN: 290,
  CUBES_IN: 310,
  FORMATION: 360,
  // Act 4: Dark/light blend regrouping
  REGROUP: 420,
  BRAND_ANCHOR: 460,
  // Outro
  OUTRO: 540,
};

// ============================================================================
// PALETTE
// ============================================================================
const C = {
  // Dark mode
  darkBg: '#0D0B1A',
  darkIndigo: '#1A1440',
  darkViolet: '#2D1B69',
  indigo: '#4338CA',
  violet: '#7C3AED',
  violetSoft: '#A78BFA',
  violetGlow: 'rgba(124, 58, 237, 0.25)',
  indigoBg: 'rgba(67, 56, 202, 0.08)',
  // Light mode
  lightBg: '#F0EEFF',
  lightCard: '#FFFFFF',
  lightViolet: '#EDE9FE',
  lightIndigo: '#E0E7FF',
  // Accents
  cyan: '#06B6D4',
  cyanSoft: 'rgba(6, 182, 212, 0.15)',
  emerald: '#10B981',
  emeraldSoft: 'rgba(16, 185, 129, 0.12)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245, 158, 11, 0.1)',
  rose: '#F43F5E',
  // Text
  textWhite: '#F5F3FF',
  textLight: '#C4B5FD',
  textMuted: '#7C7299',
  textDark: '#1E1B4B',
  textMid: '#4C1D95',
  // Surface
  surface: 'rgba(255,255,255,0.06)',
  surfaceBorder: 'rgba(255,255,255,0.08)',
  cardShadowDark: '0 8px 40px rgba(0,0,0,0.4)',
  cardShadowLight: '0 4px 24px rgba(124,58,237,0.08)',
};

const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';
const FD = '"Fraunces", serif';

const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 18, stiffness: 80, mass: 1 } });
const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 26, stiffness: 50, mass: 1.4 } });
const spSnap = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 12, stiffness: 130, mass: 0.5 } });

// ============================================================================
// BACKGROUND — transitions dark → light → blend
// ============================================================================
const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const lightProgress = interpolate(frame, [T.LIGHT_IN - 20, T.LIGHT_IN + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const darkReturn = interpolate(frame, [T.REGROUP - 20, T.REGROUP + 20], [0, 0.55], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const outroFade = interpolate(frame, [T.OUTRO - 10, T.OUTRO + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const orbX = 50 + Math.sin(frame / 50) * 15;
  const orbY = 45 + Math.cos(frame / 65) * 10;

  return (
    <AbsoluteFill>
      {/* Dark base */}
      <AbsoluteFill style={{ background: C.darkBg, opacity: 1 - lightProgress + darkReturn }} />
      {/* Dark gradient */}
      <AbsoluteFill style={{
        background: `radial-gradient(ellipse at ${orbX}% ${orbY}%, ${C.darkViolet} 0%, ${C.darkIndigo} 40%, ${C.darkBg} 80%)`,
        opacity: (1 - lightProgress + darkReturn) * 0.6,
      }} />
      {/* Light environment */}
      <AbsoluteFill style={{
        background: `linear-gradient(160deg, ${C.lightBg} 0%, ${C.lightViolet} 40%, ${C.lightIndigo} 100%)`,
        opacity: lightProgress * (1 - darkReturn),
      }} />
      {/* Outro dark */}
      <AbsoluteFill style={{ background: C.darkBg, opacity: outroFade }} />
    </AbsoluteFill>
  );
};

// ============================================================================
// SUSPENSE FRAGMENTS — large spaced text
// ============================================================================
const Fragment: React.FC<{
  text: string; frame: number; inFrame: number; outFrame: number;
  x: number; y: number; size?: number;
}> = ({ text, frame, inFrame, outFrame, x, y, size = 38 }) => {
  const fadeIn = interpolate(frame, [inFrame, inFrame + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [outFrame - 12, outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);
  if (op <= 0) return null;
  const slideY = interpolate(fadeIn, [0, 1], [20, 0]);
  const blur = interpolate(fadeIn, [0, 0.4], [4, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: FD, fontSize: size, fontWeight: 300, fontStyle: 'italic',
      color: C.textWhite, letterSpacing: '-0.03em',
      opacity: op, filter: `blur(${blur}px)`,
      transform: `translateY(${slideY}px)`,
    }}>
      {text}
    </div>
  );
};

// ============================================================================
// PRODUCT CARD — dark mode style
// ============================================================================
const DarkCard: React.FC<{
  children: React.ReactNode; width?: number; height?: number;
  frame: number; enterDelay: number; exitFrame?: number;
  x: number; y: number; rotation?: number; scale?: number;
}> = ({ children, width = 280, height, frame, enterDelay, exitFrame = T.LIGHT_IN + 10, x, y, rotation = 0, scale: s = 1 }) => {
  const enter = sp(frame, enterDelay);
  const fadeOut = interpolate(frame, [exitFrame - 10, exitFrame + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hover = Math.sin((frame + enterDelay * 3) / 30) * 5;
  const slideY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      width, height,
      background: 'rgba(26, 20, 64, 0.85)',
      backdropFilter: 'blur(12px)',
      border: `1px solid ${C.surfaceBorder}`,
      borderRadius: 18, boxShadow: C.cardShadowDark,
      padding: 18, display: 'flex', flexDirection: 'column',
      opacity: enter * Math.max(0, fadeOut),
      transform: `rotate(${rotation}deg) scale(${s * interpolate(enter, [0, 1], [0.9, 1])}) translateY(${slideY}px)`,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// LIGHT CARD — light mode style
// ============================================================================
const LightCard: React.FC<{
  children: React.ReactNode; width?: number;
  frame: number; enterDelay: number; exitFrame?: number;
  x: number; y: number; rotation?: number; scale?: number;
}> = ({ children, width = 260, frame, enterDelay, exitFrame = T.OUTRO, x, y, rotation = 0, scale: s = 1 }) => {
  const enter = sp(frame, enterDelay);
  const fadeOut = interpolate(frame, [exitFrame - 12, exitFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hover = Math.sin((frame + enterDelay * 2) / 28) * 4;
  const slideY = interpolate(enter, [0, 1], [25, 0]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      width,
      background: C.lightCard,
      border: '1px solid rgba(124,58,237,0.1)',
      borderRadius: 16, boxShadow: C.cardShadowLight,
      padding: 16, display: 'flex', flexDirection: 'column',
      opacity: enter * Math.max(0, fadeOut),
      transform: `rotate(${rotation}deg) scale(${s * interpolate(enter, [0, 1], [0.92, 1])}) translateY(${slideY}px)`,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// ABSTRACT CUBES
// ============================================================================
const AbstractCube: React.FC<{
  x: number; y: number; size: number; color: string;
  frame: number; enterDelay: number; exitFrame?: number;
  rotSpeed?: number;
}> = ({ x, y, size, color, frame, enterDelay, exitFrame = T.OUTRO, rotSpeed = 60 }) => {
  const enter = sp(frame, enterDelay);
  const fadeOut = interpolate(frame, [exitFrame - 15, exitFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rot = (frame / rotSpeed) * 45;
  const hover = Math.sin((frame + enterDelay) / 35) * 8;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      width: size, height: size,
      opacity: enter * Math.max(0, fadeOut) * 0.6,
      transform: `rotate(${rot}deg) scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: size * 0.15,
        background: `linear-gradient(135deg, ${color}30, ${color}10)`,
        border: `1px solid ${color}25`,
        boxShadow: `0 0 30px ${color}15`,
      }} />
    </div>
  );
};

// ============================================================================
// NODE SESSION CARD CONTENT
// ============================================================================
const NodeSessionContent: React.FC<{ dark?: boolean; frame: number }> = ({ dark = true, frame }) => {
  const pts = Math.floor(interpolate(frame, [T.CARD_IN, T.CARD_IN + 200], [0, 356], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const tc = dark ? C.textWhite : C.textDark;
  const tm = dark ? C.textLight : C.textMid;
  const td = dark ? C.textMuted : '#8B8B9E';
  const accentBg = dark ? C.surface : 'rgba(124,58,237,0.06)';

  return (
    <>
      <div style={{ fontSize: 9, fontFamily: FM, color: td, textTransform: 'uppercase', letterSpacing: '1px' }}>Node Session</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: '#fff', fontFamily: FB, fontWeight: 700,
        }}>R</div>
        <div>
          <div style={{ fontSize: 14, fontFamily: FB, fontWeight: 600, color: tc }}>0x7a…3f2e</div>
          <div style={{ fontSize: 10, fontFamily: FM, color: C.emerald }}>● Active</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <div style={{ flex: 1, padding: '8px 6px', borderRadius: 8, background: accentBg, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontFamily: FM, fontWeight: 700, color: C.violet }}>{pts}</div>
          <div style={{ fontSize: 8, fontFamily: FM, color: td }}>Points</div>
        </div>
        <div style={{ flex: 1, padding: '8px 6px', borderRadius: 8, background: accentBg, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontFamily: FM, fontWeight: 700, color: C.emerald }}>#15</div>
          <div style={{ fontSize: 8, fontFamily: FM, color: td }}>Rank</div>
        </div>
      </div>
    </>
  );
};

// ============================================================================
// REFERRAL CARD CONTENT
// ============================================================================
const ReferralContent: React.FC<{ dark?: boolean }> = ({ dark = true }) => {
  const tc = dark ? C.textWhite : C.textDark;
  const td = dark ? C.textMuted : '#8B8B9E';

  return (
    <>
      <div style={{ fontSize: 9, fontFamily: FM, color: dark ? C.rose : C.rose, textTransform: 'uppercase', letterSpacing: '1px' }}>Referral Rewards</div>
      {['Sarah K. → +50 pts', 'Marcus T. → +50 pts', 'Jade L. → +50 pts'].map((ref, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginTop: i === 0 ? 10 : 6,
          padding: '6px 8px', borderRadius: 8,
          background: dark ? C.surface : 'rgba(244,63,94,0.05)',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: [C.rose, C.cyan, C.violet][i],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontFamily: FB, fontWeight: 700, color: '#fff',
          }}>{ref[0]}</div>
          <span style={{ fontSize: 11, fontFamily: FB, color: tc }}>{ref}</span>
        </div>
      ))}
    </>
  );
};

// ============================================================================
// POINTS HISTORY CONTENT
// ============================================================================
const PointsHistoryContent: React.FC<{ dark?: boolean }> = ({ dark = true }) => {
  const tc = dark ? C.textWhite : C.textDark;
  const td = dark ? C.textMuted : '#8B8B9E';

  return (
    <>
      <div style={{ fontSize: 9, fontFamily: FM, color: dark ? C.amber : C.amber, textTransform: 'uppercase', letterSpacing: '1px' }}>Points History</div>
      {[
        { time: '2m ago', amt: '+12', label: 'Session reward' },
        { time: '15m ago', amt: '+50', label: 'Referral bonus' },
        { time: '1h ago', amt: '+8', label: 'Epoch completion' },
        { time: '3h ago', amt: '+25', label: 'Daily streak' },
      ].map((entry, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: i === 0 ? 10 : 5,
          paddingBottom: 5, borderBottom: i < 3 ? `1px solid ${dark ? C.surfaceBorder : 'rgba(0,0,0,0.04)'}` : 'none',
        }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: FB, color: tc }}>{entry.label}</div>
            <div style={{ fontSize: 9, fontFamily: FM, color: td }}>{entry.time}</div>
          </div>
          <span style={{ fontSize: 13, fontFamily: FM, fontWeight: 700, color: C.emerald }}>{entry.amt}</span>
        </div>
      ))}
    </>
  );
};

// ============================================================================
// NETWORK HEALTH CONTENT
// ============================================================================
const NetworkHealthContent: React.FC<{ dark?: boolean; frame: number }> = ({ dark = true, frame }) => {
  const td = dark ? C.textMuted : '#8B8B9E';

  return (
    <>
      <div style={{ fontSize: 9, fontFamily: FM, color: dark ? C.cyan : C.cyan, textTransform: 'uppercase', letterSpacing: '1px' }}>Network Health</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', position: 'relative',
          background: `conic-gradient(${C.emerald} 0% 75%, ${dark ? C.surface : 'rgba(0,0,0,0.06)'} 75% 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: dark ? C.darkIndigo : C.lightCard,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontFamily: FM, fontWeight: 700, color: C.emerald,
          }}>99.8%</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {[
          { label: 'Nodes', value: '4.2K', color: C.violet },
          { label: 'Epoch', value: '65%', color: C.cyan },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', padding: '6px 4px', borderRadius: 8,
            background: dark ? C.surface : `${stat.color}08`,
          }}>
            <div style={{ fontSize: 14, fontFamily: FM, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 8, fontFamily: FM, color: td }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// ============================================================================
// BRAND ANCHOR — central logo element
// ============================================================================
const BrandAnchor: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < T.BRAND_ANCHOR - 10) return null;
  const enter = sp(frame, T.BRAND_ANCHOR, fps);
  const fadeOut = interpolate(frame, [T.OUTRO - 15, T.OUTRO], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  const pulse = 1 + Math.sin(frame * 0.08) * 0.01;
  const glow = 15 + Math.sin(frame * 0.1) * 5;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: `translate(-50%, -50%) scale(${scale * pulse})`,
      opacity: enter * Math.max(0, fadeOut),
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        width: 90, height: 90, borderRadius: 22,
        background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
        boxShadow: `0 0 ${glow}px ${C.violetGlow}, 0 8px 40px rgba(0,0,0,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
      </div>
      <div style={{
        marginTop: 18, fontFamily: FD, fontSize: 28, fontWeight: 400, fontStyle: 'italic',
        color: C.textWhite, letterSpacing: '-0.02em',
      }}>
        Realm<span style={{ color: C.violetSoft, fontWeight: 600, fontStyle: 'normal' }}>X</span>AI
      </div>
    </div>
  );
};

// ============================================================================
// OUTRO
// ============================================================================
const Outro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < T.OUTRO) return null;
  const lf = frame - T.OUTRO;
  const op = interpolate(lf, [0, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(sp(lf, 8, fps), [0, 1], [0.88, 1]);
  const tagOp = interpolate(lf, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(lf, 30, fps), [0, 1], [18, 0]);

  return (
    <AbsoluteFill style={{
      background: C.darkBg, alignItems: 'center', justifyContent: 'center',
      opacity: op,
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        background: `radial-gradient(circle at 50% 50%, ${C.darkViolet} 0%, transparent 50%)`,
        opacity: 0.5,
      }} />
      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
        <div style={{
          width: 110, height: 110, borderRadius: 28,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
          boxShadow: `0 0 40px ${C.violetGlow}, 0 16px 60px rgba(0,0,0,0.4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FD, fontSize: 40, fontWeight: 400, fontStyle: 'italic',
          color: C.textWhite, marginTop: 30, letterSpacing: '-0.02em',
          opacity: tagOp, transform: `translateY(${tagY}px)`,
        }}>
          Realm<span style={{ color: C.violetSoft, fontWeight: 600, fontStyle: 'normal' }}>X</span>AI
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
export const RealmxIndigo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Animated background */}
      <Background frame={frame} />

      {/* ── ACT 1: DARK SUSPENSE FRAGMENTS ── */}
      <Fragment text="Decentralised privacy." frame={frame} inFrame={T.FRAG1} outFrame={T.FRAG1 + 55} x={250} y={350} size={42} />
      <Fragment text="Earn as you secure." frame={frame} inFrame={T.FRAG2} outFrame={T.FRAG2 + 55} x={950} y={480} size={38} />
      <Fragment text="Built for the future." frame={frame} inFrame={T.FRAG3} outFrame={T.FRAG3 + 50} x={550} y={300} size={44} />

      {/* ── ACT 2: DARK CARDS — Node + Referral + Points + Network ── */}
      <DarkCard frame={frame} enterDelay={T.CARD_IN} x={780} y={280} width={280} exitFrame={T.LIGHT_IN + 10}>
        <NodeSessionContent dark frame={frame} />
      </DarkCard>

      <DarkCard frame={frame} enterDelay={T.CARDS_FAN} x={380} y={180} width={260} rotation={-4} scale={0.9} exitFrame={T.LIGHT_IN + 15}>
        <ReferralContent dark />
      </DarkCard>

      <DarkCard frame={frame} enterDelay={T.CARDS_FAN + 15} x={1200} y={220} width={260} rotation={3} scale={0.88} exitFrame={T.LIGHT_IN + 20}>
        <PointsHistoryContent dark />
      </DarkCard>

      <DarkCard frame={frame} enterDelay={T.CARDS_STACK} x={580} y={500} width={240} rotation={-2} scale={0.85} exitFrame={T.LIGHT_IN + 12}>
        <NetworkHealthContent dark frame={frame} />
      </DarkCard>

      {/* ── ACT 3: LIGHT VIOLET ENVIRONMENT ── */}
      {/* Abstract cubes */}
      <AbstractCube x={120} y={150} size={80} color={C.violet} frame={frame} enterDelay={T.CUBES_IN} rotSpeed={80} />
      <AbstractCube x={1650} y={200} size={60} color={C.indigo} frame={frame} enterDelay={T.CUBES_IN + 10} rotSpeed={65} />
      <AbstractCube x={300} y={700} size={50} color={C.cyan} frame={frame} enterDelay={T.CUBES_IN + 20} rotSpeed={90} />
      <AbstractCube x={1500} y={650} size={70} color={C.violet} frame={frame} enterDelay={T.CUBES_IN + 15} rotSpeed={55} />
      <AbstractCube x={900} y={100} size={45} color={C.emerald} frame={frame} enterDelay={T.CUBES_IN + 25} rotSpeed={100} />
      <AbstractCube x={750} y={800} size={55} color={C.indigo} frame={frame} enterDelay={T.CUBES_IN + 30} rotSpeed={70} />

      {/* Light mode cards in formation */}
      <LightCard frame={frame} enterDelay={T.FORMATION} x={160} y={200} width={280} rotation={-2} exitFrame={T.OUTRO}>
        <NodeSessionContent dark={false} frame={frame} />
      </LightCard>

      <LightCard frame={frame} enterDelay={T.FORMATION + 12} x={500} y={140} width={260} rotation={1} exitFrame={T.OUTRO}>
        <ReferralContent dark={false} />
      </LightCard>

      <LightCard frame={frame} enterDelay={T.FORMATION + 24} x={1100} y={180} width={260} rotation={-1} exitFrame={T.OUTRO}>
        <PointsHistoryContent dark={false} />
      </LightCard>

      <LightCard frame={frame} enterDelay={T.FORMATION + 18} x={820} y={280} width={240} rotation={2} scale={0.95} exitFrame={T.OUTRO}>
        <NetworkHealthContent dark={false} frame={frame} />
      </LightCard>

      <LightCard frame={frame} enterDelay={T.FORMATION + 30} x={1430} y={300} width={240} rotation={-3} scale={0.9} exitFrame={T.OUTRO}>
        <>
          <div style={{ fontSize: 9, fontFamily: FM, color: C.violet, textTransform: 'uppercase', letterSpacing: '1px' }}>Privacy Score</div>
          <div style={{
            marginTop: 10, padding: '14px 0', borderRadius: 10,
            background: 'rgba(124,58,237,0.05)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, fontFamily: FM, fontWeight: 700, color: C.indigo }}>A+</div>
            <div style={{ fontSize: 10, fontFamily: FM, color: C.textMid, marginTop: 2 }}>Top 5%</div>
          </div>
        </>
      </LightCard>

      {/* ── ACT 4: REGROUP — dark cards return alongside light ── */}
      {frame >= T.REGROUP && (
        <>
          <DarkCard frame={frame} enterDelay={T.REGROUP} x={100} y={520} width={240} rotation={-6} scale={0.8} exitFrame={T.OUTRO}>
            <NodeSessionContent dark frame={frame} />
          </DarkCard>

          <DarkCard frame={frame} enterDelay={T.REGROUP + 15} x={1540} y={440} width={220} rotation={5} scale={0.78} exitFrame={T.OUTRO}>
            <>
              <div style={{ fontSize: 9, fontFamily: FM, color: C.amber, textTransform: 'uppercase', letterSpacing: '1px' }}>Streak</div>
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 32, fontFamily: FM, fontWeight: 700, color: C.amber }}>12</div>
                <div style={{ fontSize: 10, fontFamily: FM, color: C.textMuted }}>days consecutive</div>
              </div>
            </>
          </DarkCard>
        </>
      )}

      {/* Brand Anchor */}
      <BrandAnchor frame={frame} fps={fps} />

      {/* Outro */}
      <Outro frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
