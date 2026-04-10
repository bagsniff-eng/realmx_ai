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
  WINDOW_IN: 15,
  CMD1_START: 50,       // npx realmxai-node install
  CMD1_END: 140,
  OUTPUT1_START: 145,
  CMD2_START: 190,      // realms start
  CMD2_END: 240,
  OUTPUT2_START: 245,
  RESULT_IN: 280,
  RESULT_OUT: 340,
  STATUS_IN: 330,
  SIDEBAR_IN: 360,
  COUNTER_START: 380,
  STATEMENT_IN: 430,
  OUTRO_IN: 480,
};

// ============================================================================
// PALETTE
// ============================================================================
const C = {
  bg: '#F8F8F8',
  white: '#FFFFFF',
  termBg: '#1E1E2E',
  termBgDark: '#181825',
  termBorder: '#313244',
  termShadow: '0 20px 80px rgba(0,0,0,0.12), 0 8px 30px rgba(0,0,0,0.08)',
  prompt: '#89B4FA',
  promptSign: '#A6E3A1',
  text: '#CDD6F4',
  textDim: '#6C7086',
  textBright: '#F5F5F5',
  green: '#A6E3A1',
  greenBright: '#40C057',
  greenSoft: 'rgba(166, 227, 161, 0.1)',
  blue: '#89B4FA',
  blueSoft: 'rgba(137, 180, 250, 0.1)',
  purple: '#CBA6F7',
  amber: '#F9E2AF',
  red: '#F38BA8',
  pink: '#F5C2E7',
  teal: '#94E2D5',
  surface: '#313244',
  overlay: '#45475A',
  cardBg: '#FFFFFF',
  cardBorder: '#E8E8E8',
  cardShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.04)',
  textDark: '#111111',
  textMid: '#555555',
  textMuted: '#999999',
};

const FM = '"JetBrains Mono", "IBM Plex Mono", monospace';
const FB = '"Source Sans 3", sans-serif';
const FD = '"Fraunces", serif';

// Springs
const sp = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 18, stiffness: 80, mass: 1 } });
const spSoft = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 26, stiffness: 50, mass: 1.4 } });
const spSnap = (f: number, d: number, fps = 30) =>
  spring({ fps, frame: Math.max(0, f - d), config: { damping: 12, stiffness: 130, mass: 0.5 } });

// ============================================================================
// TYPING EFFECT — character by character
// ============================================================================
const typeText = (fullText: string, frame: number, startFrame: number, charsPerFrame = 0.7): string => {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed * charsPerFrame);
  return fullText.slice(0, Math.min(chars, fullText.length));
};

const isTypingDone = (fullText: string, frame: number, startFrame: number, charsPerFrame = 0.7): boolean => {
  const elapsed = Math.max(0, frame - startFrame);
  return Math.floor(elapsed * charsPerFrame) >= fullText.length;
};

// Blinking cursor
const Cursor: React.FC<{ frame: number; visible?: boolean }> = ({ frame, visible = true }) => {
  if (!visible) return null;
  const blink = Math.sin(frame * 0.2) > 0;
  return (
    <span style={{
      display: 'inline-block', width: 9, height: 18,
      background: blink ? C.text : 'transparent',
      marginLeft: 1, verticalAlign: 'middle',
    }} />
  );
};

// ============================================================================
// TERMINAL WINDOW
// ============================================================================
const TerminalWindow: React.FC<{
  frame: number; enterDelay: number;
  width?: number; height?: number;
  rotation?: number; x?: number; y?: number;
  children: React.ReactNode;
  exitFrame?: number;
}> = ({ frame, enterDelay, width = 720, height = 420, rotation = -2, x = 0, y = 0, children, exitFrame = T.STATUS_IN + 10 }) => {
  const enter = sp(frame, enterDelay);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);
  const slideY = interpolate(enter, [0, 1], [40, 0]);
  const fadeOut = interpolate(frame, [exitFrame - 10, exitFrame + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hover = Math.sin(frame / 40) * 3;

  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${x}px)`, top: `calc(44% + ${y}px)`,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg) translateY(${slideY + hover}px)`,
      opacity: enter * Math.max(0, fadeOut),
      width, filter: 'drop-shadow(0 20px 60px rgba(0,0,0,0.12))',
    }}>
      <div style={{
        background: C.termBg, borderRadius: 14,
        border: `1px solid ${C.termBorder}`,
        boxShadow: C.termShadow, overflow: 'hidden',
      }}>
        {/* Title bar */}
        <div style={{
          height: 38, background: C.termBgDark,
          display: 'flex', alignItems: 'center', padding: '0 14px',
          borderBottom: `1px solid ${C.termBorder}`,
          gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.red, opacity: 0.9 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.amber, opacity: 0.9 }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.green, opacity: 0.9 }} />
          </div>
          <div style={{
            flex: 1, textAlign: 'center',
            fontFamily: FM, fontSize: 12, color: C.textDim,
          }}>
            realmxai — Terminal
          </div>
          <div style={{ width: 52 }} /> {/* Spacer for symmetry */}
        </div>

        {/* Terminal body */}
        <div style={{
          padding: '18px 22px', minHeight: height - 38,
          fontFamily: FM, fontSize: 14, lineHeight: 1.8,
          color: C.text,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TERMINAL LINE COMPONENTS
// ============================================================================
const PromptLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
    <span style={{ color: C.promptSign }}>❯</span>
    <span style={{ color: C.textDim, marginLeft: 6, marginRight: 8 }}>~</span>
    {children}
  </div>
);

const OutputLine: React.FC<{
  text: string; color?: string; frame: number; enterDelay: number; icon?: string;
}> = ({ text, color = C.textDim, frame, enterDelay, icon }) => {
  const op = interpolate(frame, [enterDelay, enterDelay + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (op <= 0) return null;
  return (
    <div style={{ opacity: op, color, display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <span>{icon}</span>}
      {text}
    </div>
  );
};

// ============================================================================
// ACT 1 — TYPING PHASE
// ============================================================================
const TypingPhase: React.FC<{ frame: number }> = ({ frame }) => {
  const cmd1 = 'npx realmxai-node install';
  const cmd2 = 'realms start --privacy-mode';
  const typed1 = typeText(cmd1, frame, T.CMD1_START, 0.6);
  const done1 = isTypingDone(cmd1, frame, T.CMD1_START, 0.6);
  const typed2 = typeText(cmd2, frame, T.CMD2_START, 0.7);
  const done2 = isTypingDone(cmd2, frame, T.CMD2_START, 0.7);
  const showCmd2 = frame >= T.CMD2_START - 5;

  return (
    <TerminalWindow frame={frame} enterDelay={T.WINDOW_IN} rotation={-1.5} width={740} height={380}>
      {/* Command 1 */}
      <PromptLine>
        <span>
          <span style={{ color: C.purple }}>{typed1.slice(0, 3)}</span>
          <span style={{ color: C.text }}>{typed1.slice(3)}</span>
        </span>
        {!done1 && <Cursor frame={frame} />}
      </PromptLine>

      {/* Output for cmd1 */}
      <OutputLine text="⠋ Resolving realmxai-node@latest..." color={C.textDim} frame={frame} enterDelay={T.OUTPUT1_START} />
      <OutputLine text="✓ Package resolved (v2.4.1)" color={C.green} frame={frame} enterDelay={T.OUTPUT1_START + 8} icon="✓" />
      <OutputLine text="✓ Dependencies installed" color={C.green} frame={frame} enterDelay={T.OUTPUT1_START + 14} icon="✓" />
      <OutputLine text="✓ Privacy engine initialized" color={C.green} frame={frame} enterDelay={T.OUTPUT1_START + 20} icon="✓" />
      <OutputLine text="✓ Node binary compiled" color={C.green} frame={frame} enterDelay={T.OUTPUT1_START + 26} icon="✓" />

      {/* Blank line */}
      {showCmd2 && <div style={{ height: 10 }} />}

      {/* Command 2 */}
      {showCmd2 && (
        <PromptLine>
          <span>
            <span style={{ color: C.teal }}>{typed2.slice(0, 6)}</span>
            <span style={{ color: C.text }}>{typed2.slice(6)}</span>
          </span>
          {!done2 && frame >= T.CMD2_START && <Cursor frame={frame} />}
        </PromptLine>
      )}

      {/* Output for cmd2 */}
      <OutputLine text="⠋ Connecting to RealmxAI network..." color={C.textDim} frame={frame} enterDelay={T.OUTPUT2_START} />
      <OutputLine text="✓ Wallet detected: 0x7a...3f2e" color={C.green} frame={frame} enterDelay={T.OUTPUT2_START + 8} icon="✓" />
      <OutputLine text="✓ Google identity linked" color={C.green} frame={frame} enterDelay={T.OUTPUT2_START + 14} icon="✓" />
      <OutputLine text="✓ Privacy mode: ENABLED" color={C.green} frame={frame} enterDelay={T.OUTPUT2_START + 20} icon="🔒" />
    </TerminalWindow>
  );
};

// ============================================================================
// ACT 2 — RESULT REVEAL ("NODE INSTALLED")
// ============================================================================
const ResultReveal: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.RESULT_IN - 5 || frame > T.RESULT_OUT + 15) return null;

  const enter = spSnap(frame, T.RESULT_IN);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);
  const fadeOut = interpolate(frame, [T.RESULT_OUT - 8, T.RESULT_OUT + 15], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Underline flourish
  const lineW = interpolate(enter, [0, 1], [0, 320]);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: enter * fadeOut,
      transform: `scale(${scale})`,
    }}>
      <div style={{
        fontFamily: FM, fontSize: 14, color: C.greenBright,
        letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16,
        opacity: interpolate(enter, [0.3, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        ✓ Installation Complete
      </div>

      <div style={{
        fontFamily: FD, fontSize: 72, fontWeight: 400, fontStyle: 'italic',
        color: C.textDark, letterSpacing: '-0.04em', lineHeight: 1,
      }}>
        Node Installed
      </div>

      {/* Flourish line */}
      <div style={{
        width: lineW, height: 2, marginTop: 20,
        background: `linear-gradient(90deg, transparent, ${C.greenBright}, transparent)`,
      }} />

      <div style={{
        fontFamily: FB, fontSize: 18, color: C.textMid, marginTop: 20,
        letterSpacing: '0.02em',
        opacity: interpolate(enter, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        Ready to earn. Ready to protect.
      </div>
    </div>
  );
};

// ============================================================================
// ACT 3 — STATUS SCREEN + SIDEBAR
// ============================================================================
const StatusScreen: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.STATUS_IN - 10) return null;

  const enter = sp(frame, T.STATUS_IN);
  const scale = interpolate(enter, [0, 1], [0.95, 1]);
  const fadeOut = interpolate(frame, [T.OUTRO_IN - 12, T.OUTRO_IN], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = 1 + Math.sin(frame * 0.1) * 0.005;

  // Points counter
  const pts = frame >= T.COUNTER_START
    ? Math.floor(interpolate(frame, [T.COUNTER_START, T.COUNTER_START + 120], [0, 247], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
    : 0;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 24,
      opacity: enter * fadeOut,
    }}>
      {/* Main status terminal */}
      <div style={{
        transform: `scale(${scale * pulse})`,
      }}>
        <div style={{
          width: 520, background: C.termBg,
          borderRadius: 16, border: `1px solid ${C.termBorder}`,
          boxShadow: C.termShadow, overflow: 'hidden',
        }}>
          {/* Title bar */}
          <div style={{
            height: 38, background: C.termBgDark,
            display: 'flex', alignItems: 'center', padding: '0 14px',
            borderBottom: `1px solid ${C.termBorder}`,
            gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 7 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.red, opacity: 0.9 }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.amber, opacity: 0.9 }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.green, opacity: 0.9 }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontFamily: FM, fontSize: 12, color: C.textDim }}>
              realmxai — Status
            </div>
            <div style={{ width: 52 }} />
          </div>

          {/* Status content */}
          <div style={{ padding: '24px 28px', fontFamily: FM, fontSize: 13, lineHeight: 2.0, color: C.text }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: C.green,
                boxShadow: `0 0 8px ${C.green}`,
                animation: 'none',
              }} />
              <span style={{ color: C.green, fontWeight: 600 }}>RealmxAI node running</span>
              <span style={{ color: C.textDim }}>•</span>
              <span style={{ color: C.blue }}>Points accruing</span>
            </div>

            <div style={{ height: 1, background: C.surface, margin: '8px 0 12px' }} />

            <div style={{ color: C.textDim }}>
              <span style={{ color: C.purple }}>network</span>    mainnet-v2
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.purple }}>uptime</span>     <span style={{ color: C.green }}>99.8%</span>
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.purple }}>epoch</span>      <span style={{ color: C.blue }}>65% complete</span>
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.purple }}>privacy</span>    <span style={{ color: C.green }}>ENABLED</span> <span style={{ color: C.textDim }}>🔒</span>
            </div>
            <div style={{ color: C.textDim }}>
              <span style={{ color: C.purple }}>points</span>     <span style={{ color: C.amber, fontWeight: 700 }}>{pts}</span> <span style={{ color: C.textDim }}>earned</span>
            </div>

            <div style={{ height: 1, background: C.surface, margin: '12px 0 8px' }} />

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: C.textDim, fontSize: 12 }}>session</span>
              <div style={{ flex: 1, height: 4, background: C.surface, borderRadius: 2 }}>
                <div style={{
                  width: `${interpolate(frame, [T.STATUS_IN, T.STATUS_IN + 150], [0, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`,
                  height: '100%', borderRadius: 2, background: C.blue,
                  boxShadow: `0 0 6px ${C.blue}50`,
                }} />
              </div>
              <span style={{ color: C.blue, fontSize: 12 }}>72%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar info card */}
      {frame >= T.SIDEBAR_IN && (() => {
        const sideEnter = sp(frame, T.SIDEBAR_IN);
        const sideSlide = interpolate(sideEnter, [0, 1], [25, 0]);
        return (
          <div style={{
            opacity: sideEnter * fadeOut,
            transform: `translateX(${sideSlide}px)`,
          }}>
            <div style={{
              width: 260, background: C.cardBg,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 16, boxShadow: C.cardShadow,
              padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ fontFamily: FM, fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Connection Info
              </div>

              {/* Wallet */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: '#F8F8F8', border: `1px solid ${C.cardBorder}`,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F6851B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <div>
                  <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: C.textDark }}>Wallet</div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: C.greenBright }}>0x7a...3f2e</div>
                </div>
              </div>

              {/* Google */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: '#F8F8F8', border: `1px solid ${C.cardBorder}`,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <div>
                  <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: C.textDark }}>Google</div>
                  <div style={{ fontFamily: FM, fontSize: 10, color: C.greenBright }}>Verified ✓</div>
                </div>
              </div>

              {/* Points counter */}
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: FM, fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Points Earned
                </div>
                <div style={{ fontFamily: FM, fontSize: 28, fontWeight: 700, color: '#3B82F6', marginTop: 4 }}>
                  {pts}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ============================================================================
// STATEMENT OVERLAY
// ============================================================================
const Statement: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < T.STATEMENT_IN || frame > T.OUTRO_IN - 5) return null;
  const op = (() => {
    const fadeIn = interpolate(frame, [T.STATEMENT_IN, T.STATEMENT_IN + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [T.OUTRO_IN - 15, T.OUTRO_IN - 5], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return Math.min(fadeIn, fadeOut);
  })();
  const slideY = interpolate(spSoft(frame, T.STATEMENT_IN), [0, 1], [15, 0]);

  return (
    <div style={{
      position: 'absolute', bottom: 100, left: 0, right: 0,
      textAlign: 'center', opacity: op, transform: `translateY(${slideY}px)`,
    }}>
      <div style={{
        fontFamily: FD, fontSize: 28, fontStyle: 'italic', fontWeight: 300,
        color: C.textDark, letterSpacing: '-0.02em',
      }}>
        One command to privacy.
      </div>
    </div>
  );
};

// ============================================================================
// OUTRO
// ============================================================================
const Outro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < T.OUTRO_IN) return null;
  const lf = frame - T.OUTRO_IN;
  const op = interpolate(lf, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(sp(lf, 5, fps), [0, 1], [0.9, 1]);
  const tagOp = interpolate(lf, [25, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagY = interpolate(spSoft(lf, 25, fps), [0, 1], [15, 0]);

  return (
    <AbsoluteFill style={{
      background: C.bg, alignItems: 'center', justifyContent: 'center',
      opacity: op,
    }}>
      <div style={{ transform: `scale(${scale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 24,
          background: C.termBg, border: `1px solid ${C.termBorder}`,
          boxShadow: '0 16px 60px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FD, fontSize: 34, fontWeight: 400, fontStyle: 'italic',
          color: C.textDark, marginTop: 28, letterSpacing: '-0.02em',
          opacity: tagOp, transform: `translateY(${tagY}px)`,
        }}>
          Realm<span style={{ color: '#3B82F6', fontWeight: 600, fontStyle: 'normal' }}>X</span>AI
        </div>

        <div style={{
          fontFamily: FM, fontSize: 13, color: C.textMuted,
          marginTop: 14, letterSpacing: '0.15em', textTransform: 'uppercase',
          opacity: tagOp * 0.7, transform: `translateY(${tagY * 1.2}px)`,
        }}>
          npx realmxai-node install
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// MAIN COMPOSITION
// ============================================================================
export const RealmxTerminal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Subtle radial warmth */}
      <AbsoluteFill style={{
        background: 'radial-gradient(ellipse at 50% 45%, rgba(137,180,250,0.03) 0%, transparent 60%)',
      }} />

      {/* Corner brand */}
      <div style={{
        position: 'absolute', top: 36, left: 52,
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: interpolate(frame, [30, 50, T.OUTRO_IN - 10, T.OUTRO_IN], [0, 0.35, 0.35, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        <Img src={staticFile('logo.webp')} style={{ width: 24, height: 24, objectFit: 'contain' }} />
        <span style={{ fontFamily: FM, fontSize: 11, color: C.textMuted, letterSpacing: '0.1em' }}>REALMXAI</span>
      </div>

      {/* ACT 1: Typing in terminal */}
      <TypingPhase frame={frame} />

      {/* ACT 2: Result reveal */}
      <ResultReveal frame={frame} />

      {/* ACT 3: Status screen + sidebar */}
      <StatusScreen frame={frame} />

      {/* Statement */}
      <Statement frame={frame} />

      {/* Outro */}
      <Outro frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
