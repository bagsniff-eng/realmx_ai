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
  COPY1: 20,
  COPY2: 70,
  COPY3: 160,
  COPY4: 280,
  COPY5: 370,
  MAIN_WINDOW: 50,
  WALLET_BOX: 110,
  GOOGLE_BOX: 155,
  START_BTN: 195,
  STATE_LOADING: 220,
  STATE_VERIFYING: 260,
  STATE_MINING: 300,
  SCENE2: 330,
  SCENE3: 410,
  OUTRO: 480,
};

// ============================================================================
// PALETTE — pastel rainbow with white surfaces
// ============================================================================
const C = {
  mint: '#C1F5E0',
  mintDark: '#34D399',
  peach: '#FDDCB5',
  peachDark: '#F59E0B',
  lavender: '#DDD6FE',
  lavenderDark: '#8B5CF6',
  sky: '#BAE6FD',
  skyDark: '#0EA5E9',
  rose: '#FECDD3',
  roseDark: '#F43F5E',
  white: '#FFFFFF',
  surface: '#FAFAFA',
  cardBg: '#FFFFFF',
  cardBorder: '#F0EDF5',
  cardShadow: '0 2px 8px rgba(139,92,246,0.06), 0 12px 40px rgba(139,92,246,0.04)',
  cardShadowLg: '0 4px 16px rgba(139,92,246,0.08), 0 20px 60px rgba(139,92,246,0.06)',
  textPrimary: '#1A1235',
  textSecondary: '#4A4268',
  textMuted: '#8B82A8',
  textLight: '#C4BDD6',
  blue: '#6366F1',
  blueSoft: 'rgba(99,102,241,0.08)',
  blueBorder: 'rgba(99,102,241,0.15)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.08)',
  greenBorder: 'rgba(16,185,129,0.15)',
  border: '#EDE9F6',
  borderLight: '#F5F3FA',
};

const FM = '"IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';
const FD = '"Fraunces", serif';

const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 20, stiffness: 75, mass: 1.1 } });
const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 28, stiffness: 45, mass: 1.5 } });

// ============================================================================
// PASTEL RAINBOW BACKGROUND
// ============================================================================
const PastelBg: React.FC<{ frame: number }> = ({ frame }) => {
  const angle = interpolate(frame, [0, DURATION], [130, 170]);
  const shift = Math.sin(frame / 60) * 5;

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${angle}deg,
        ${C.mint} ${0 + shift}%,
        ${C.sky} ${25 + shift}%,
        ${C.lavender} ${50 + shift}%,
        ${C.peach} ${75 + shift}%,
        ${C.rose} ${100 + shift}%)`,
    }}>
      {/* Soft overlay for depth */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.5) 0%, transparent 55%)',
      }} />
    </AbsoluteFill>
  );
};

// ============================================================================
// EDITORIAL COPY — concise optimistic headline
// ============================================================================
const EditorialCopy: React.FC<{
  text: string; sub?: string; frame: number; inFrame: number; outFrame: number;
  x?: number; y?: number; align?: 'left' | 'center';
}> = ({ text, sub, frame, inFrame, outFrame, x = 100, y = 80, align = 'left' }) => {
  const fadeIn = interpolate(frame, [inFrame, inFrame + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [outFrame - 12, outFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);
  if (op <= 0) return null;
  const slideY = interpolate(fadeIn, [0, 1], [14, 0]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y, textAlign: align,
      opacity: op, transform: `translateY(${slideY}px)`,
    }}>
      <div style={{
        fontFamily: FD, fontSize: 32, fontWeight: 400, fontStyle: 'italic',
        color: C.textPrimary, letterSpacing: '-0.03em', lineHeight: 1.2,
      }}>
        {text}
      </div>
      {sub && (
        <div style={{
          fontFamily: FB, fontSize: 15, color: C.textSecondary, marginTop: 10,
          letterSpacing: '0.01em', opacity: 0.8,
        }}>
          {sub}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APP WINDOW — dashboard in perspective
// ============================================================================
const MainAppWindow: React.FC<{ frame: number }> = ({ frame }) => {
  const enter = sp(frame, T.MAIN_WINDOW);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const slideY = interpolate(enter, [0, 1], [50, 0]);
  const fadeOut = interpolate(frame, [T.SCENE2 - 15, T.SCENE2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hover = Math.sin(frame / 35) * 3;

  // Points counter
  const pts = Math.floor(interpolate(frame, [T.STATE_MINING, T.STATE_MINING + 180], [0, 356], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  // State progression
  const isLoading = frame >= T.STATE_LOADING && frame < T.STATE_VERIFYING;
  const isVerifying = frame >= T.STATE_VERIFYING && frame < T.STATE_MINING;
  const isMining = frame >= T.STATE_MINING;

  const statusText = isMining ? 'Mining' : isVerifying ? 'Verifying...' : isLoading ? 'Loading...' : 'Idle';
  const statusColor = isMining ? C.green : isVerifying ? C.peachDark : isLoading ? C.skyDark : C.textMuted;

  return (
    <div style={{
      position: 'absolute', left: 380, top: 180 + hover,
      opacity: enter * Math.max(0, fadeOut),
      transform: `scale(${scale}) perspective(1200px) rotateY(-3deg) rotateX(1deg) translateY(${slideY}px)`,
      transformOrigin: 'center center',
    }}>
      <div style={{
        width: 640, background: C.cardBg,
        borderRadius: 18, border: `1px solid ${C.cardBorder}`,
        boxShadow: C.cardShadowLg, overflow: 'hidden',
      }}>
        {/* Window chrome */}
        <div style={{
          height: 36, background: C.surface,
          display: 'flex', alignItems: 'center', padding: '0 14px',
          borderBottom: `1px solid ${C.border}`, gap: 7,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FCA5A5' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FDE68A' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#86EFAC' }} />
          <div style={{
            flex: 1, textAlign: 'center', fontFamily: FM, fontSize: 11, color: C.textMuted,
          }}>
            RealmxAI Dashboard
          </div>
          <div style={{ width: 40 }} />
        </div>

        {/* Dashboard content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Img src={staticFile('logo.webp')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span style={{ fontFamily: FB, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>RealmxAI</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 999,
              background: `${statusColor}12`, border: `1px solid ${statusColor}25`,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
              <span style={{ fontFamily: FM, fontSize: 10, color: statusColor, fontWeight: 600 }}>{statusText}</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Points', value: pts.toLocaleString(), color: C.blue },
              { label: 'Rank', value: '#15', color: C.lavenderDark },
              { label: 'Referrals', value: '23', color: C.roseDark },
              { label: 'Uptime', value: '99.8%', color: C.green },
            ].map((stat, i) => (
              <div key={i} style={{
                flex: 1, padding: '10px 8px', borderRadius: 10,
                background: `${stat.color}08`, border: `1px solid ${stat.color}12`,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontFamily: FM, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 9, fontFamily: FM, color: C.textMuted, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Node graph */}
          <div style={{
            background: C.surface, borderRadius: 12,
            border: `1px solid ${C.borderLight}`, padding: 14,
          }}>
            <div style={{ fontFamily: FM, fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
              Node Activity
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
              {Array.from({ length: 24 }, (_, i) => {
                const h = 0.2 + Math.abs(Math.sin((i + frame * 0.02) * 0.5)) * 0.8;
                const active = i >= 20;
                return (
                  <div key={i} style={{
                    flex: 1, height: h * 50, borderRadius: 2,
                    background: active ? C.blue : `${C.blue}25`,
                  }} />
                );
              })}
            </div>
          </div>

          {/* Referral row */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['Sarah K.', 'Marcus T.', 'Jade L.'].map((name, i) => (
              <div key={i} style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px', borderRadius: 8,
                background: C.surface, border: `1px solid ${C.borderLight}`,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: [C.lavenderDark, C.skyDark, C.roseDark][i],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontFamily: FB, fontWeight: 700, color: '#fff',
                }}>{name[0]}</div>
                <span style={{ fontSize: 11, fontFamily: FB, color: C.textSecondary }}>{name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: FM, color: C.green }}>+50</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ASSISTANT BOX — small overlay card
// ============================================================================
const AssistantBox: React.FC<{
  children: React.ReactNode; frame: number; enterDelay: number; exitFrame?: number;
  x: number; y: number; width?: number;
}> = ({ children, frame, enterDelay, exitFrame = T.SCENE2 - 10, x, y, width = 220 }) => {
  const enter = sp(frame, enterDelay);
  const fadeOut = interpolate(frame, [exitFrame - 10, exitFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const slideX = interpolate(enter, [0, 1], [20, 0]);
  const hover = Math.sin((frame + enterDelay * 3) / 25) * 4;

  return (
    <div style={{
      position: 'absolute', left: x, top: y + hover,
      width, background: C.cardBg,
      borderRadius: 14, border: `1px solid ${C.cardBorder}`,
      boxShadow: C.cardShadow, padding: 14,
      opacity: enter * Math.max(0, fadeOut),
      transform: `translateX(${slideX}px) scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
    }}>
      {children}
    </div>
  );
};

// ============================================================================
// SCENE 2 — INTERACTION STATES SHOWCASE
// ============================================================================
const Scene2: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.SCENE2 - 10 || frame > T.SCENE3 + 10) return null;

  const fadeIn = interpolate(frame, [T.SCENE2, T.SCENE2 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [T.SCENE3 - 12, T.SCENE3], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);

  const states = [
    { label: 'Connect', status: 'Wallet linked', icon: '🔗', color: C.skyDark, done: true },
    { label: 'Verify', status: 'Google verified', icon: '✓', color: C.green, done: true },
    { label: 'Activate', status: 'Node started', icon: '⚡', color: C.lavenderDark, done: true },
    { label: 'Mine', status: 'Points accruing', icon: '◆', color: C.blue, done: frame >= T.SCENE2 + 40 },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: op, gap: 24,
    }}>
      {/* Flow steps */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {states.map((s, i) => {
          const stEn = sp(frame, T.SCENE2 + 10 + i * 15);
          const slideY = interpolate(stEn, [0, 1], [20, 0]);
          return (
            <React.Fragment key={i}>
              <div style={{
                width: 160, padding: '16px 14px', borderRadius: 16,
                background: C.cardBg, border: `1px solid ${s.done ? `${s.color}25` : C.cardBorder}`,
                boxShadow: C.cardShadow, textAlign: 'center',
                opacity: stEn, transform: `translateY(${slideY}px)`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, margin: '0 auto',
                  background: s.done ? `${s.color}12` : C.surface,
                  border: `1px solid ${s.done ? `${s.color}25` : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: FB, fontSize: 14, fontWeight: 600, color: C.textPrimary, marginTop: 10 }}>{s.label}</div>
                <div style={{ fontFamily: FM, fontSize: 10, color: s.done ? s.color : C.textMuted, marginTop: 4 }}>{s.status}</div>
              </div>
              {i < states.length - 1 && (
                <div style={{
                  width: 24, height: 1, background: C.border,
                  opacity: stEn,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Live metrics bar */}
      <div style={{
        display: 'flex', gap: 24, padding: '14px 28px',
        background: C.cardBg, borderRadius: 14,
        border: `1px solid ${C.cardBorder}`, boxShadow: C.cardShadow,
        opacity: interpolate(sp(frame, T.SCENE2 + 60), [0, 1], [0, 1]),
      }}>
        {[
          { label: 'Session', value: '4h 32m', color: C.blue },
          { label: 'Points', value: '+247', color: C.green },
          { label: 'Network', value: '4.2K nodes', color: C.lavenderDark },
        ].map((m, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontFamily: FM, fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontFamily: FM, fontSize: 10, color: C.textMuted, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SCENE 3 — PRODUCT SURFACES GRID
// ============================================================================
const Scene3: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.SCENE3 - 10 || frame > T.OUTRO + 10) return null;

  const fadeIn = interpolate(frame, [T.SCENE3, T.SCENE3 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [T.OUTRO - 12, T.OUTRO], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const op = Math.min(fadeIn, fadeOut);

  const cards = [
    {
      title: 'Privacy Score', content: (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 36, fontFamily: FM, fontWeight: 700, color: C.blue }}>A+</div>
          <div style={{ fontSize: 11, fontFamily: FM, color: C.textMuted, marginTop: 2 }}>Top 5% of users</div>
        </div>
      ),
    },
    {
      title: 'Earnings Today', content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Session rewards', val: '+108 pts', c: C.blue },
            { label: 'Referral bonus', val: '+150 pts', c: C.green },
            { label: 'Daily streak', val: '+25 pts', c: C.peachDark },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: FB }}>
              <span style={{ color: C.textSecondary }}>{e.label}</span>
              <span style={{ fontFamily: FM, fontWeight: 600, color: e.c }}>{e.val}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Network Map', content: (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', padding: '4px 0' }}>
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: '50%',
              background: i < 12 ? `${C.blue}${30 + i * 5}` : `${C.green}40`,
              border: i === 0 ? `2px solid ${C.blue}` : 'none',
            }} />
          ))}
        </div>
      ),
    },
    {
      title: 'Quick Actions', content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Invite Friend', 'Claim Bonus', 'View Stats'].map((action, i) => (
            <div key={i} style={{
              padding: '7px 10px', borderRadius: 8,
              background: i === 0 ? C.blue : C.surface,
              color: i === 0 ? '#fff' : C.textSecondary,
              fontFamily: FB, fontSize: 12, fontWeight: 600,
              border: i === 0 ? 'none' : `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              {action}
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 16, opacity: op,
    }}>
      {cards.map((card, i) => {
        const en = sp(frame, T.SCENE3 + 8 + i * 12);
        const slideY = interpolate(en, [0, 1], [25, 0]);
        const hover = Math.sin((frame + i * 40) / 30) * 4;
        return (
          <div key={i} style={{
            width: 210, padding: 16, borderRadius: 16,
            background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            boxShadow: C.cardShadow,
            opacity: en, transform: `translateY(${slideY + hover}px)`,
          }}>
            <div style={{
              fontFamily: FM, fontSize: 9, color: C.textMuted,
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10,
            }}>
              {card.title}
            </div>
            {card.content}
          </div>
        );
      })}
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
  const tagOp = interpolate(lf, [28, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(lf, 28, fps), [0, 1], [16, 0]);

  return (
    <AbsoluteFill style={{
      alignItems: 'center', justifyContent: 'center', opacity: op,
    }}>
      <PastelBg frame={frame} />

      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5 }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: C.cardBg, border: `1px solid ${C.cardBorder}`,
          boxShadow: C.cardShadowLg,
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
export const RealmxEditorial: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Pastel rainbow background */}
      <PastelBg frame={frame} />

      {/* ── EDITORIAL COPY ── */}
      <EditorialCopy text="Your privacy companion." frame={frame} inFrame={T.COPY1} outFrame={T.COPY1 + 80} x={100} y={80} />
      <EditorialCopy text="Mining points effortlessly." sub="Connect once. Earn continuously." frame={frame} inFrame={T.COPY2} outFrame={T.COPY2 + 80} x={100} y={80} />
      <EditorialCopy text="Intelligence through action." sub="Connecting, mining, rewarding." frame={frame} inFrame={T.COPY3} outFrame={T.COPY3 + 80} x={100} y={80} />
      <EditorialCopy text="Every interaction, rewarded." frame={frame} inFrame={T.COPY4} outFrame={T.COPY4 + 60} x={100} y={80} />
      <EditorialCopy text="Privacy meets productivity." sub="The modern node experience." frame={frame} inFrame={T.COPY5} outFrame={T.COPY5 + 60} x={100} y={80} />

      {/* ── SCENE 1: MAIN WINDOW + ASSISTANT BOXES ── */}
      <MainAppWindow frame={frame} />

      {/* Wallet connect prompt */}
      <AssistantBox frame={frame} enterDelay={T.WALLET_BOX} x={160} y={260} width={210}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F6851B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          </svg>
          <span style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>Connect Wallet</span>
        </div>
        <div style={{
          padding: '6px 0', borderRadius: 8, background: C.blue,
          textAlign: 'center', fontFamily: FB, fontSize: 11, fontWeight: 600, color: '#fff',
        }}>
          Connect →
        </div>
      </AssistantBox>

      {/* Google auth confirmation */}
      <AssistantBox frame={frame} enterDelay={T.GOOGLE_BOX} x={1080} y={230} width={200}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: C.greenSoft, border: `1px solid ${C.greenBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 10, color: C.green }}>✓</span>
          </div>
          <div>
            <div style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: C.textPrimary }}>Google Verified</div>
            <div style={{ fontFamily: FM, fontSize: 9, color: C.green }}>Identity confirmed</div>
          </div>
        </div>
      </AssistantBox>

      {/* Start Mining button */}
      <AssistantBox frame={frame} enterDelay={T.START_BTN} x={1060} y={500} width={200}>
        <div style={{
          padding: '10px 0', borderRadius: 10,
          background: `linear-gradient(135deg, ${C.blue}, ${C.lavenderDark})`,
          textAlign: 'center', fontFamily: FB, fontSize: 13, fontWeight: 700, color: '#fff',
          boxShadow: `0 4px 16px ${C.blue}30`,
        }}>
          Start Mining ⚡
        </div>
        <div style={{
          fontFamily: FM, fontSize: 9, color: C.textMuted, textAlign: 'center', marginTop: 6,
        }}>
          Begin earning points instantly
        </div>
      </AssistantBox>

      {/* ── SCENE 2: INTERACTION STATES ── */}
      <Scene2 frame={frame} />

      {/* ── SCENE 3: PRODUCT SURFACES ── */}
      <Scene3 frame={frame} />

      {/* ── OUTRO ── */}
      <Outro frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
