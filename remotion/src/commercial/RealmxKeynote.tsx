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
  PEDESTAL_START: 0,
  PEDESTAL_END: 140,
  COUNTERS_START: 100,
  COUNTERS_END: 240,
  NETWORK_START: 200,
  NETWORK_END: 360,
  PROOF_START: 320,
  PROOF_END: 470,
  ORBIT_START: 380,
  ORBIT_END: 500,
  MONUMENT_START: 480,
  MONUMENT_END: 600,
};

// ============================================================================
// PALETTE — dark keynote
// ============================================================================
const C = {
  bg: '#030208',
  bgPanel: '#0A0816',
  spotlight: 'rgba(255, 248, 240, 0.08)',
  spotlightCore: 'rgba(255, 248, 240, 0.25)',
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139, 92, 246, 0.5)',
  purpleDim: 'rgba(139, 92, 246, 0.12)',
  violet: '#6D28D9',
  violetGlow: 'rgba(109, 40, 217, 0.35)',
  teal: '#14B8A6',
  tealGlow: 'rgba(20, 184, 166, 0.35)',
  tealDim: 'rgba(20, 184, 166, 0.12)',
  green: '#10B981',
  amber: '#F59E0B',
  white: '#F0ECE4',
  whiteDim: 'rgba(240, 236, 228, 0.6)',
  whiteFaint: 'rgba(240, 236, 228, 0.15)',
  panelBg: 'rgba(10, 8, 22, 0.85)',
  panelBorder: 'rgba(139, 92, 246, 0.18)',
  panelGlow: '0 0 40px rgba(139, 92, 246, 0.08)',
  beamPurple: 'rgba(139, 92, 246, 0.3)',
  beamTeal: 'rgba(20, 184, 166, 0.25)',
};

const FD = '"Fraunces", serif';
const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';

// ============================================================================
// SPRINGS
// ============================================================================
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 18, stiffness: 80, mass: 1 } });

const spSlow = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 26, stiffness: 40, mass: 1.5 } });

const spSnap = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 12, stiffness: 120, mass: 0.6 } });

// ============================================================================
// ICONS
// ============================================================================
const ShieldIcon = ({ s = 28, c = C.purple }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12.08c0-.85-.08-1.68-.22-2.48H12v4.69h5.69a5.4 5.4 0 0 1-2.35 3.55v2.94h3.8C21.36 18.73 22 15.65 22 12.08z" />
    <path d="M12 22c2.81 0 5.18-.93 6.9-2.52l-3.8-2.94c-.94.63-2.14 1.01-3.1 1.01-2.4 0-4.43-1.62-5.16-3.8H2.9v3.04C4.64 20.25 8.04 22 12 22z" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = ({ c = C.purple }: { c?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

// ============================================================================
// ACT 1 — PEDESTAL REVEAL
// ============================================================================
const Act1Pedestal: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = frame <= T.PEDESTAL_END + 20;
  if (!visible) return null;

  const spotlightOp = interpolate(frame, [10, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoScale = interpolate(sp(frame, 30), [0, 1], [0.6, 1]);
  const logoOp = interpolate(sp(frame, 30), [0, 1], [0, 1]);
  const waveOp = interpolate(frame, [50, 80], [0, 0.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [T.PEDESTAL_END - 10, T.PEDESTAL_END + 20], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin(frame / 10) * 0.04;
  const wavePhase = frame * 0.03;

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Spotlight cone from above */}
      <div style={{
        position: 'absolute', left: '50%', top: '-10%',
        width: 600, height: 800, marginLeft: -300,
        background: `linear-gradient(180deg, ${C.spotlightCore} 0%, ${C.spotlight} 30%, transparent 80%)`,
        opacity: spotlightOp * 0.7, filter: 'blur(30px)',
        clipPath: 'polygon(35% 0%, 65% 0%, 80% 100%, 20% 100%)',
      }} />

      {/* Pedestal surface */}
      <div style={{
        position: 'absolute', left: '50%', top: '62%',
        width: 400, height: 8, marginLeft: -200,
        background: `linear-gradient(90deg, transparent, ${C.whiteFaint}, transparent)`,
        opacity: spotlightOp, borderRadius: 4,
      }} />

      {/* Pedestal glow reflection */}
      <div style={{
        position: 'absolute', left: '50%', top: '63%',
        width: 300, height: 60, marginLeft: -150,
        background: `radial-gradient(ellipse, ${C.purpleDim} 0%, transparent 70%)`,
        opacity: spotlightOp * 0.6,
      }} />

      {/* Hero logo on pedestal */}
      <div style={{
        position: 'absolute', left: '50%', top: '38%',
        transform: `translate(-50%, -50%) scale(${logoScale * pulse})`,
        opacity: logoOp, display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Outer shield glow */}
        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.purpleGlow} 0%, ${C.violetGlow} 40%, transparent 70%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 80px ${C.purpleGlow}, 0 0 160px ${C.violetGlow}`,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: 24,
            background: C.panelBg, border: `1.5px solid rgba(255,255,255,0.1)`,
            backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 20px 80px ${C.purpleGlow}`,
          }}>
            <Img src={staticFile('logo.webp')} style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Faint blockchain wave lines */}
      <svg style={{
        position: 'absolute', left: '50%', top: '38%',
        width: 600, height: 200, marginLeft: -300, marginTop: -100,
        opacity: waveOp, pointerEvents: 'none',
      }}>
        {[0, 1, 2].map(i => {
          const yBase = 100 + (i - 1) * 40;
          const amp = 15 + i * 5;
          const d = Array.from({ length: 60 }, (_, j) => {
            const x = j * 10;
            const y = yBase + Math.sin(x * 0.02 + wavePhase + i * 1.5) * amp;
            return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ');
          return (
            <path key={i} d={d} fill="none"
              stroke={i % 2 === 0 ? C.purple : C.teal}
              strokeWidth={0.8} opacity={0.5}
              strokeDasharray="6 12" />
          );
        })}
      </svg>

      {/* Brand whisper */}
      <div style={{
        position: 'absolute', left: '50%', top: '72%',
        transform: 'translateX(-50%)',
        fontFamily: FM, fontSize: 13, color: C.whiteDim,
        letterSpacing: '0.3em', textTransform: 'uppercase',
        opacity: interpolate(frame, [70, 95], [0, 0.5], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        privacy infrastructure
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 2 — COUNTER REVEALS
// ============================================================================
const CounterReveal: React.FC<{
  value: string; suffix: string; label: string;
  x: number; y: number; frame: number; enterDelay: number;
}> = ({ value, suffix, label, x, y, frame, enterDelay }) => {
  const enter = spSlow(frame, enterDelay);
  const slideY = interpolate(enter, [0, 1], [40, 0]);
  const fadeOut = interpolate(frame, [T.COUNTERS_END - 15, T.COUNTERS_END + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Flourish line under counter
  const flourishW = interpolate(enter, [0, 1], [0, 120]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      opacity: enter * fadeOut, transform: `translateY(${slideY}px)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontFamily: FD, fontSize: 72, fontWeight: 300, fontStyle: 'italic',
          color: C.white, letterSpacing: '-0.04em',
        }}>
          {value}
        </span>
        <span style={{
          fontFamily: FM, fontSize: 20, color: C.purple,
          letterSpacing: '0.05em',
        }}>
          {suffix}
        </span>
      </div>
      <div style={{
        fontFamily: FM, fontSize: 13, color: C.whiteDim,
        textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 8,
      }}>
        {label}
      </div>
      {/* Flourish line */}
      <div style={{
        width: flourishW, height: 1, marginTop: 16,
        background: `linear-gradient(90deg, transparent, ${C.purple}, transparent)`,
      }} />
    </div>
  );
};

const Act2Counters: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = frame >= T.COUNTERS_START - 20 && frame <= T.COUNTERS_END + 20;
  if (!visible) return null;

  const lf = frame - T.COUNTERS_START;

  return (
    <AbsoluteFill>
      <CounterReveal value="4" suffix="K" label="Active Nodes" x={240} y={350} frame={lf} enterDelay={10} />
      <CounterReveal value="14" suffix="M" label="Points Earned" x={760} y={350} frame={lf} enterDelay={30} />
      <CounterReveal value="100" suffix="K" label="Referrals" x={1320} y={350} frame={lf} enterDelay={50} />

      {/* Connecting beam between counters */}
      <svg style={{
        position: 'absolute', width: '100%', height: '100%',
        top: 0, left: 0, pointerEvents: 'none',
      }}>
        <line x1="370" y1="440" x2="880" y2="440"
          stroke={C.purple} strokeWidth="0.5" opacity={interpolate(lf, [40, 60], [0, 0.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          strokeDasharray="4 8" />
        <line x1="920" y1="440" x2="1440" y2="440"
          stroke={C.purple} strokeWidth="0.5" opacity={interpolate(lf, [60, 80], [0, 0.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
          strokeDasharray="4 8" />
      </svg>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 3 — NETWORK GLOBE / RADIAL ORBIT
// ============================================================================
const Act3Network: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = frame >= T.NETWORK_START - 15 && frame <= T.NETWORK_END + 10;
  if (!visible) return null;

  const lf = frame - T.NETWORK_START;
  const dur = T.NETWORK_END - T.NETWORK_START;
  const masterOp = interpolate(lf, [0, 25, dur - 20, dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const globeRot = lf * 0.4;
  const globeScale = interpolate(sp(lf, 10), [0, 1], [0.7, 1]);

  // Generate node positions on a circle
  const nodeCount = 12;
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 + globeRot * 0.005;
    const r = 180 + Math.sin(lf * 0.02 + i) * 20;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * 0.55, // Elliptical for perspective
      active: i % 3 === 0 || (lf > 60 && i % 2 === 0),
      pulse: Math.sin(lf * 0.1 + i * 2) * 0.5 + 0.5,
    };
  });

  return (
    <AbsoluteFill style={{ opacity: masterOp }}>
      {/* Globe container */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${globeScale})`,
      }}>
        {/* Globe outline rings */}
        <svg width="500" height="500" viewBox="-250 -250 500 500" style={{ position: 'absolute', left: -250, top: -250 }}>
          {/* Outer ring */}
          <ellipse cx="0" cy="0" rx="220" ry="120" fill="none" stroke={C.purple} strokeWidth="0.6" opacity="0.25" strokeDasharray="8 12" />
          <ellipse cx="0" cy="0" rx="220" ry="120" fill="none" stroke={C.purple} strokeWidth="0.6" opacity="0.15"
            transform={`rotate(${60 + globeRot * 0.2})`} strokeDasharray="6 16" />
          <ellipse cx="0" cy="0" rx="220" ry="120" fill="none" stroke={C.teal} strokeWidth="0.5" opacity="0.12"
            transform={`rotate(${-30 + globeRot * 0.15})`} strokeDasharray="4 14" />

          {/* Meridian lines */}
          <ellipse cx="0" cy="0" rx="60" ry="180" fill="none" stroke={C.whiteFaint} strokeWidth="0.4" opacity="0.2"
            transform={`rotate(${globeRot * 0.3})`} />
          <ellipse cx="0" cy="0" rx="120" ry="180" fill="none" stroke={C.whiteFaint} strokeWidth="0.4" opacity="0.15"
            transform={`rotate(${globeRot * 0.2})`} />

          {/* Connection lines from nodes to center */}
          {nodes.map((node, i) => (
            <line key={`line-${i}`} x1="0" y1="0" x2={node.x} y2={node.y}
              stroke={node.active ? C.purple : C.whiteFaint} strokeWidth={node.active ? 0.8 : 0.3}
              opacity={node.active ? 0.4 : 0.1} strokeDasharray="3 6" />
          ))}

          {/* Node dots */}
          {nodes.map((node, i) => (
            <g key={`node-${i}`}>
              {node.active && (
                <circle cx={node.x} cy={node.y} r={8 + node.pulse * 4}
                  fill="none" stroke={C.purple} strokeWidth="0.5" opacity={node.pulse * 0.3} />
              )}
              <circle cx={node.x} cy={node.y} r={node.active ? 4 : 2.5}
                fill={node.active ? C.purple : C.whiteFaint}
                opacity={node.active ? 0.8 + node.pulse * 0.2 : 0.3} />
            </g>
          ))}

          {/* Center core */}
          <circle cx="0" cy="0" r="20" fill={`${C.purple}15`} stroke={C.purple} strokeWidth="1" opacity="0.5" />
          <circle cx="0" cy="0" r="6" fill={C.purple} opacity="0.8" />
        </svg>

        {/* Central logo in globe */}
        <div style={{
          position: 'absolute', left: -20, top: -20,
          width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.6 }} />
        </div>
      </div>

      {/* Typography overlays */}
      <div style={{
        position: 'absolute', left: 120, bottom: 140,
        fontFamily: FD, fontSize: 38, fontStyle: 'italic', fontWeight: 300,
        color: C.white, letterSpacing: '-0.02em', lineHeight: 1.15,
        opacity: interpolate(lf, [40, 65, dur - 30, dur - 10], [0, 0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        transform: `translateY(${interpolate(lf, [40, 65], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
      }}>
        Enhanced privacy<br />infrastructure.
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 4 — PROOF PANELS (dark-mode UI proofs)
// ============================================================================
const DarkPanel: React.FC<{
  children: React.ReactNode; width?: number; height?: number; style?: React.CSSProperties;
}> = ({ children, width = 340, height = 200, style }) => (
  <div style={{
    width, height, background: C.panelBg,
    border: `1px solid ${C.panelBorder}`, borderRadius: 16,
    boxShadow: C.panelGlow, backdropFilter: 'blur(12px)',
    padding: 20, display: 'flex', flexDirection: 'column',
    position: 'relative', ...style,
  }}>
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
    }} />
    {children}
  </div>
);

const NeonBar: React.FC<{ pct: number; color?: string }> = ({ pct, color = C.purple }) => (
  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, marginTop: 6 }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}` }} />
  </div>
);

const Act4Proof: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = frame >= T.PROOF_START - 15 && frame <= T.PROOF_END + 15;
  if (!visible) return null;

  const lf = frame - T.PROOF_START;
  const dur = T.PROOF_END - T.PROOF_START;
  const masterOp = interpolate(lf, [0, 20, dur - 20, dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Camera-like slow drift
  const driftX = Math.sin(lf / 40) * 15;
  const driftY = Math.cos(lf / 50) * 8;

  // Mining session timeline bars
  const timelineBars = [0.2, 0.5, 0.8, 0.6, 0.9, 0.7, 1.0, 0.85, 0.3, 0.65, 0.95, 0.75];

  return (
    <AbsoluteFill style={{ opacity: masterOp, transform: `translate(${driftX}px, ${driftY}px)` }}>

      {/* Panel 1: Transaction Flow Chart */}
      <div style={{
        position: 'absolute', left: 120, top: 180,
        opacity: interpolate(sp(lf, 10), [0, 1], [0, 1]),
        transform: `translateY(${interpolate(sp(lf, 10), [0, 1], [20, 0])}px)`,
      }}>
        <DarkPanel width={380} height={240}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <LockIcon />
            <span style={{ fontSize: 12, fontFamily: FM, color: C.whiteDim, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
              Anonymised Flows
            </span>
          </div>
          {/* Sparkline chart */}
          <svg width="100%" height="120" viewBox="0 0 340 120" style={{ marginTop: 'auto' }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.purple} stopOpacity="0.3" />
                <stop offset="100%" stopColor={C.purple} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0, 1, 2, 3].map(i => (
              <line key={i} x1="0" y1={i * 30 + 15} x2="340" y2={i * 30 + 15}
                stroke={C.whiteFaint} strokeWidth="0.3" />
            ))}
            {/* Area fill */}
            <path d={`M 0 105 ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
              const x = i * 42.5;
              const animated = interpolate(sp(lf, 20 + i * 3), [0, 1], [105, 105 - [30, 55, 40, 70, 50, 80, 60, 75, 45][i]]);
              return `L ${x} ${animated}`;
            }).join(' ')} L 340 105 Z`} fill="url(#chartGrad)" />
            {/* Line */}
            <path d={`M ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
              const x = i * 42.5;
              const animated = interpolate(sp(lf, 20 + i * 3), [0, 1], [105, 105 - [30, 55, 40, 70, 50, 80, 60, 75, 45][i]]);
              return `${i === 0 ? 'M' : 'L'} ${x} ${animated}`;
            }).join(' ')}`} fill="none" stroke={C.purple} strokeWidth="1.5" />
            {/* Dots on line */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
              const x = i * 42.5;
              const animated = interpolate(sp(lf, 20 + i * 3), [0, 1], [105, 105 - [30, 55, 40, 70, 50, 80, 60, 75, 45][i]]);
              return <circle key={i} cx={x} cy={animated} r="2.5" fill={C.purple} opacity={sp(lf, 20 + i * 3)} />;
            })}
          </svg>
        </DarkPanel>
      </div>

      {/* Panel 2: Mining Session Timeline */}
      <div style={{
        position: 'absolute', left: 560, top: 140,
        opacity: interpolate(sp(lf, 25), [0, 1], [0, 1]),
        transform: `translateY(${interpolate(sp(lf, 25), [0, 1], [20, 0])}px)`,
      }}>
        <DarkPanel width={340} height={200}>
          <span style={{ fontSize: 12, fontFamily: FM, color: C.teal, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Mining Session
          </span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 'auto', height: 100 }}>
            {timelineBars.map((h, i) => {
              const barH = h * 80 * interpolate(sp(lf, 30 + i * 2), [0, 1], [0, 1]);
              return (
                <div key={i} style={{
                  flex: 1, height: barH, borderRadius: 2,
                  background: h >= 0.8 ? C.teal : `${C.teal}50`,
                  boxShadow: h >= 0.8 ? `0 0 6px ${C.tealGlow}` : 'none',
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, fontFamily: FM, color: C.whiteDim }}>00:00</span>
            <span style={{ fontSize: 10, fontFamily: FM, color: C.teal }}>NOW</span>
          </div>
        </DarkPanel>
      </div>

      {/* Panel 3: Wallet & Google Connect */}
      <div style={{
        position: 'absolute', left: 960, top: 200,
        opacity: interpolate(sp(lf, 40), [0, 1], [0, 1]),
        transform: `translateY(${interpolate(sp(lf, 40), [0, 1], [20, 0])}px)`,
      }}>
        <DarkPanel width={320} height={210}>
          <span style={{ fontSize: 12, fontFamily: FM, color: C.whiteDim, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
            Identity Layer
          </span>

          {/* Wallet row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 16,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.panelBorder}`,
          }}>
            <WalletIcon />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontFamily: FB, fontWeight: 600, color: C.white }}>WalletConnect</div>
              <div style={{ fontSize: 11, fontFamily: FM, color: C.green }}>Connected</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
          </div>

          {/* Google row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.panelBorder}`,
          }}>
            <GoogleIcon />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontFamily: FB, fontWeight: 600, color: C.white }}>Google Account</div>
              <div style={{ fontSize: 11, fontFamily: FM, color: C.green }}>Verified</div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
          </div>
        </DarkPanel>
      </div>

      {/* Laser beam connecting panels to center */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, pointerEvents: 'none' }}>
        <line x1="500" y1="300" x2="560" y2="240" stroke={C.purple} strokeWidth="0.5" opacity="0.2" strokeDasharray="4 8">
          <animate attributeName="stroke-dashoffset" values="24;0" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="900" y1="340" x2="960" y2="300" stroke={C.teal} strokeWidth="0.5" opacity="0.15" strokeDasharray="4 8">
          <animate attributeName="stroke-dashoffset" values="0;24" dur="2.5s" repeatCount="indefinite" />
        </line>
      </svg>

      {/* Statement */}
      <div style={{
        position: 'absolute', right: 120, bottom: 120,
        fontFamily: FD, fontSize: 32, fontStyle: 'italic', fontWeight: 300,
        color: C.white, textAlign: 'right', lineHeight: 1.15, letterSpacing: '-0.02em',
        opacity: interpolate(lf, [50, 75, dur - 25, dur], [0, 0.7, 0.7, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        transform: `translateY(${interpolate(lf, [50, 75], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
      }}>
        Earn while<br />you protect.
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 5 — RADIAL ORBIT (users connecting to core)
// ============================================================================
const Act5Orbit: React.FC<{ frame: number }> = ({ frame }) => {
  const visible = frame >= T.ORBIT_START - 10 && frame <= T.ORBIT_END + 10;
  if (!visible) return null;

  const lf = frame - T.ORBIT_START;
  const dur = T.ORBIT_END - T.ORBIT_START;
  const masterOp = interpolate(lf, [0, 20, dur - 20, dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const orbitAngle = lf * 0.6;

  // Orbital user nodes
  const orbiters = [
    { r: 240, speed: 1, color: C.purple, label: 'Node A' },
    { r: 240, speed: 1, color: C.teal, label: 'Node B', offset: Math.PI * 0.67 },
    { r: 240, speed: 1, color: C.amber, label: 'Node C', offset: Math.PI * 1.33 },
    { r: 160, speed: -0.7, color: C.purple, label: 'Ref 1', offset: 0 },
    { r: 160, speed: -0.7, color: C.green, label: 'Ref 2', offset: Math.PI },
    { r: 320, speed: 0.4, color: C.purple, label: 'User', offset: Math.PI * 0.5 },
    { r: 320, speed: 0.4, color: C.teal, label: 'User', offset: Math.PI * 1.5 },
  ];

  return (
    <AbsoluteFill style={{ opacity: masterOp }}>
      <div style={{
        position: 'absolute', left: '50%', top: '48%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width="750" height="750" viewBox="-375 -375 750 750">
          {/* Orbit rings */}
          <circle cx="0" cy="0" r="160" fill="none" stroke={C.whiteFaint} strokeWidth="0.4" strokeDasharray="4 8" />
          <circle cx="0" cy="0" r="240" fill="none" stroke={C.whiteFaint} strokeWidth="0.5" strokeDasharray="6 10" />
          <circle cx="0" cy="0" r="320" fill="none" stroke={C.whiteFaint} strokeWidth="0.3" strokeDasharray="3 12" />

          {/* Connection lines + nodes */}
          {orbiters.map((o, i) => {
            const angle = (orbitAngle * o.speed * 0.01) + (o.offset || 0);
            const x = Math.cos(angle) * o.r;
            const y = Math.sin(angle) * o.r * 0.65;
            const nodeOp = interpolate(sp(lf, 10 + i * 5), [0, 1], [0, 1]);
            return (
              <g key={i} opacity={nodeOp}>
                <line x1="0" y1="0" x2={x} y2={y}
                  stroke={o.color} strokeWidth="0.6" opacity="0.25" strokeDasharray="4 6">
                  <animate attributeName="stroke-dashoffset" values="20;0" dur="2s" repeatCount="indefinite" />
                </line>
                <circle cx={x} cy={y} r={12 + Math.sin(lf * 0.08 + i) * 3}
                  fill="none" stroke={o.color} strokeWidth="0.5" opacity="0.2" />
                <circle cx={x} cy={y} r="6" fill={C.bgPanel} stroke={o.color} strokeWidth="1.2" />
                <g transform={`translate(${x}, ${y})`}>
                  <UserIcon c={o.color} />
                </g>
              </g>
            );
          })}

          {/* Center core */}
          <circle cx="0" cy="0" r="35" fill={`${C.purple}12`} stroke={C.purple} strokeWidth="1" opacity="0.4" />
          <circle cx="0" cy="0" r="18" fill={C.bgPanel} stroke={C.purple} strokeWidth="1.5" />
        </svg>

        {/* Center logo */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.7 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// ACT 6 — MONUMENT (final brand resolve)
// ============================================================================
const Act6Monument: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.MONUMENT_START) return null;

  const lf = frame - T.MONUMENT_START;
  const scale = interpolate(sp(lf, 8), [0, 1], [0.8, 1]);
  const textOp = interpolate(lf, [30, 50], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const textY = interpolate(spSlow(lf, 30), [0, 1], [20, 0]);
  const tagOp = interpolate(lf, [50, 70], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const tagY = interpolate(spSlow(lf, 50), [0, 1], [15, 0]);
  const beamPulse = 1 + Math.sin(lf / 12) * 0.08;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Volumetric beam */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%',
        width: 800, height: 800, marginLeft: -400,
        background: `conic-gradient(from ${lf * 0.4}deg at 50% 50%, transparent 110deg, ${C.purpleGlow} 175deg, transparent 240deg)`,
        opacity: interpolate(lf, [0, 30], [0, 0.3], { extrapolateRight: 'clamp' }),
        filter: 'blur(50px)', transform: `scale(${beamPulse})`,
      }} />

      {/* Radial bloom */}
      <div style={{
        position: 'absolute', width: 500, height: 500,
        background: `radial-gradient(circle, ${C.purpleGlow} 0%, transparent 60%)`,
        opacity: 0.25, transform: `scale(${beamPulse})`,
      }} />

      {/* Logo container */}
      <div style={{
        transform: `scale(${scale})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10,
      }}>
        <div style={{
          width: 140, height: 140, borderRadius: 32,
          background: C.panelBg, border: '1.5px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 30px 100px ${C.purpleGlow}`,
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FD, fontSize: 44, fontStyle: 'italic', fontWeight: 300,
          color: C.white, marginTop: 36, letterSpacing: '-0.03em',
          opacity: textOp, transform: `translateY(${textY}px)`,
        }}>
          The Privacy Engine.
        </div>

        <div style={{
          fontFamily: FM, fontSize: 14, color: C.whiteDim,
          marginTop: 18, letterSpacing: '0.2em', textTransform: 'uppercase',
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
export const RealmxKeynote: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Subtle dot grid */}
      <AbsoluteFill style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.012) 1px, transparent 1px)',
        backgroundSize: '48px 48px', opacity: 0.4,
      }} />

      {/* All acts — overlapping transitions managed internally */}
      <Sequence from={T.PEDESTAL_START} durationInFrames={T.PEDESTAL_END + 30}>
        <Act1Pedestal frame={frame} />
      </Sequence>

      <Sequence from={0} durationInFrames={DURATION}>
        <Act2Counters frame={frame} />
        <Act3Network frame={frame} />
        <Act4Proof frame={frame} />
        <Act5Orbit frame={frame} />
        <Act6Monument frame={frame} />
      </Sequence>

      {/* Cinematic vignette */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.75) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Letterbox bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 36,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
      }} />
    </AbsoluteFill>
  );
};
