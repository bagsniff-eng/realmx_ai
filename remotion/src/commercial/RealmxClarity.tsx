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

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const TOTAL = 1200;
const logo = staticFile('le6jxytl.webp');

const COLORS = {
  dark: '#0E0A18',
  cream: '#F7F5F2',
  purple: '#8A2BE2',
  teal: '#38BDAF',
  white: '#FFFFFF',
  textDark: '#1A1A29',
  textMuted: '#5B5B6E',
  panelDark: 'rgba(255,255,255,0.08)',
  panelLight: 'rgba(255,255,255,0.96)',
  borderDark: 'rgba(255,255,255,0.14)',
  borderLight: 'rgba(26,26,41,0.10)',
};

const fonts = {
  heading: '"Inter", "Segoe UI", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
  mono: '"SFMono-Regular", "Cascadia Code", "Consolas", monospace',
};

const enterSpring = (frame: number, delay = 0, durationInFrames = 24) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 18, stiffness: 120, mass: 0.9},
  });

const sceneFade = (frame: number, duration: number) =>
  interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Background: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <AbsoluteFill
    style={{
      background: dark ? COLORS.dark : COLORS.cream,
    }}
  />
);

const LogoBadge: React.FC<{size: number; dark?: boolean}> = ({size, dark = false}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
      border: `1px solid ${dark ? COLORS.borderDark : COLORS.borderLight}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark
        ? '0 24px 60px rgba(0,0,0,0.4), 0 0 30px rgba(138,43,226,0.18)'
        : '0 24px 60px rgba(26,26,41,0.08)',
      overflow: 'hidden',
    }}
  >
    <Img src={logo} style={{width: '74%', height: '74%', objectFit: 'contain'}} />
  </div>
);

const BrandTopLeft: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <div
    style={{
      position: 'absolute',
      top: 48,
      left: 54,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 20,
    }}
  >
    <LogoBadge size={56} dark={dark} />
    <div
      style={{
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 30,
        color: dark ? COLORS.white : COLORS.textDark,
      }}
    >
      RealmxAI
    </div>
  </div>
);

const Panel: React.FC<{
  dark?: boolean;
  width: number;
  height: number;
  left: number;
  top: number;
  frame: number;
  delay?: number;
  fromX?: number;
  fromY?: number;
  children: React.ReactNode;
}> = ({dark = false, width, height, left, top, frame, delay = 0, fromX = 0, fromY = 0, children}) => {
  const enter = enterSpring(frame, delay, 26);
  return (
    <div
      style={{
        position: 'absolute',
        left: left + interpolate(enter, [0, 1], [fromX, 0]),
        top: top + interpolate(enter, [0, 1], [fromY, 0]),
        width,
        height,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
        borderRadius: 34,
        background: dark ? COLORS.panelDark : COLORS.panelLight,
        border: `1px solid ${dark ? COLORS.borderDark : COLORS.borderLight}`,
        boxShadow: dark
          ? '0 28px 80px rgba(0,0,0,0.36)'
          : '0 28px 80px rgba(26,26,41,0.10)',
        backdropFilter: 'blur(18px)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const Scene1LogoTagline: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 150);
  const ring = interpolate(frame, [0, 60], [0.75, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tagline = enterSpring(frame, 36, 26);
  const settle = interpolate(frame, [110, 150], [1, 0.86], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const yMove = interpolate(frame, [110, 150], [0, -74], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background dark />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${yMove}px) scale(${settle})`,
        }}
      >
        <div style={{position: 'relative', width: 240, height: 240}}>
          <div
            style={{
              position: 'absolute',
              inset: -34,
              borderRadius: 999,
              border: `3px solid rgba(138,43,226,0.85)`,
              boxShadow: '0 0 34px rgba(138,43,226,0.42)',
              opacity: 0.9 - frame / 260,
              transform: `scale(${ring})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: -70,
              borderRadius: 999,
              border: `1px solid rgba(56,189,175,0.45)`,
              opacity: 0.6 - frame / 320,
              transform: `scale(${interpolate(frame, [0, 60], [0.86, 1.12], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })})`,
            }}
          />
          <div style={{position: 'absolute', inset: 0}}>
            <LogoBadge size={240} dark />
          </div>
        </div>
        <div
          style={{
            marginTop: 42,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 58,
            color: COLORS.white,
            letterSpacing: '-0.04em',
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [34, 0])}px)`,
          }}
        >
          Enhancing Bitcoin privacy
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Mission: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 150);
  const steps = [
    {text: 'Secure your transactions', keyword: 'Secure', mode: 'down'},
    {text: 'Earn rewards fairly', keyword: 'Earn', mode: 'up'},
    {text: 'Build a private future', keyword: 'private', mode: 'fade'},
  ] as const;

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background />
      <BrandTopLeft />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {steps.map((step, index) => {
          const local = frame - index * 42;
          const visible = interpolate(local, [0, 10, 34, 42], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const y =
            step.mode === 'down'
              ? interpolate(local, [0, 24], [-60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
              : step.mode === 'up'
                ? interpolate(local, [0, 24], [60, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
                : 0;
          return (
            <div
              key={step.text}
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: visible,
                transform: `translateY(${y}px) scale(${interpolate(visible, [0, 1], [0.98, 1])})`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  fontSize: 72,
                  color: COLORS.textDark,
                  letterSpacing: '-0.04em',
                }}
              >
                {step.text}
              </div>
              <div
                style={{
                  marginTop: 18,
                  width:
                    step.keyword === 'Secure' ? 205 : step.keyword === 'Earn' ? 150 : 145,
                  height: 5,
                  borderRadius: 999,
                  background: step.keyword === 'Earn' ? COLORS.teal : COLORS.purple,
                }}
              />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3Network: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 150);
  const nodes = Array.from({length: 18}, (_, index) => {
    const column = index % 6;
    const row = Math.floor(index / 6);
    const baseX = 390 + column * 230;
    const baseY = 250 + row * 170;
    return {
      x: baseX + Math.sin(frame / 18 + index) * 26,
      y: baseY + Math.cos(frame / 20 + index) * 24,
      size: 12 + (index % 3) * 4,
    };
  });
  const zoom = interpolate(frame, [0, 150], [0.95, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const counters = [
    {text: '4 K active nodes', delay: 16},
    {text: '14 M points earned', delay: 78},
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background dark />
      <BrandTopLeft dark />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${zoom})`,
        }}
      >
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          {nodes.map((node, index) =>
            nodes[index + 1] ? (
              <line
                key={`${index}-line`}
                x1={node.x}
                y1={node.y}
                x2={nodes[index + 1].x}
                y2={nodes[index + 1].y}
                stroke="rgba(138,43,226,0.35)"
                strokeWidth={2}
              />
            ) : null,
          )}
        </svg>
        {nodes.map((node, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: node.x - node.size / 2,
              top: node.y - node.size / 2,
              width: node.size,
              height: node.size,
              borderRadius: 999,
              background: index % 2 === 0 ? COLORS.purple : COLORS.teal,
              boxShadow:
                index % 2 === 0
                  ? '0 0 18px rgba(138,43,226,0.9)'
                  : '0 0 18px rgba(56,189,175,0.9)',
            }}
          />
        ))}
      </div>
      {counters.map((counter) => {
        const local = frame - counter.delay;
        const visible = interpolate(local, [0, 12, 42, 54], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const count = Math.round(
          interpolate(local, [0, 42], [0, counter.text.startsWith('4') ? 4000 : 14000000], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        );
        const label = counter.text.startsWith('4')
          ? `${Math.round(count / 1000)} K active nodes`
          : `${Math.round(count / 1000000)} M points earned`;
        return (
          <div
            key={counter.text}
            style={{
              position: 'absolute',
              left: 88,
              top: 140,
              fontFamily: fonts.heading,
              fontWeight: 700,
              fontSize: 56,
              color: COLORS.white,
              opacity: visible,
              transform: `translateY(${interpolate(visible, [0, 1], [20, 0])}px)`,
            }}
          >
            {label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const MetricPanel: React.FC<{title: string; body: React.ReactNode}> = ({title, body}) => (
  <div style={{padding: '44px 54px', width: '100%', height: '100%'}}>
    <div
      style={{
        fontFamily: fonts.body,
        fontWeight: 700,
        fontSize: 34,
        color: COLORS.textMuted,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}
    >
      {title}
    </div>
    <div style={{marginTop: 30}}>{body}</div>
  </div>
);

const Scene4DashboardHighlights: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 300);
  const windows = [
    {start: 0, end: 60, label: 'Node Status', fromX: -130, fromY: 0},
    {start: 69, end: 129, label: 'Points Balance', fromX: 130, fromY: 0},
    {start: 138, end: 198, label: 'Referral Code', fromX: 0, fromY: -120},
    {start: 207, end: 267, label: 'Leaderboard', fromX: 0, fromY: 120},
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background />
      <BrandTopLeft />
      {windows.map((item) => {
        const local = frame - item.start;
        const visible = interpolate(local, [0, 12, item.end - item.start - 12, item.end - item.start], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) {
          return null;
        }

        const shiftX = interpolate(local, [0, 22], [item.fromX, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const shiftY = interpolate(local, [0, 22], [item.fromY, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={item.label}
            style={{
              position: 'absolute',
              left: 360 + shiftX,
              top: 215 + shiftY,
              width: 1200,
              height: 560,
              opacity: visible,
            }}
          >
            <Panel dark={false} width={1200} height={560} left={0} top={0} frame={24}>
              {item.label === 'Node Status' ? (
                <MetricPanel
                  title="Node Status"
                  body={
                    <>
                      <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 98, color: COLORS.textDark}}>12h 48m</div>
                      <div style={{marginTop: 26, width: 620, height: 18, borderRadius: 999, background: 'rgba(56,189,175,0.18)', overflow: 'hidden'}}>
                        <div style={{width: `${interpolate(local, [0, 40], [0, 78], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, height: '100%', background: COLORS.teal}} />
                      </div>
                      <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 34, color: COLORS.textMuted}}>Health status is active and stable</div>
                    </>
                  }
                />
              ) : null}
              {item.label === 'Points Balance' ? (
                <MetricPanel
                  title="Points Balance"
                  body={
                    <>
                      <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 110, color: COLORS.textDark}}>
                        {Math.round(interpolate(local, [0, 40], [0, 2480], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
                      </div>
                      <div style={{marginTop: 22, fontFamily: fonts.body, fontSize: 34, color: COLORS.textMuted}}>Rewards grow as your node stays online</div>
                    </>
                  }
                />
              ) : null}
              {item.label === 'Referral Code' ? (
                <MetricPanel
                  title="Referral Code"
                  body={
                    <>
                      <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 92, color: COLORS.purple}}>RL-12345-AI</div>
                      <div
                        style={{
                          marginTop: 34,
                          width: 250,
                          height: 72,
                          borderRadius: 999,
                          background: COLORS.purple,
                          color: COLORS.white,
                          fontFamily: fonts.heading,
                          fontWeight: 700,
                          fontSize: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        Copy
                      </div>
                    </>
                  }
                />
              ) : null}
              {item.label === 'Leaderboard' ? (
                <MetricPanel
                  title="Leaderboard"
                  body={
                    <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
                      {[
                        ['Aarav', '3,420'],
                        ['Nina', '3,240'],
                        ['Leo', '3,110'],
                      ].map(([name, pts], index) => (
                        <div
                          key={name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '18px 24px',
                            borderRadius: 22,
                            background: index === 0 ? 'rgba(138,43,226,0.08)' : 'rgba(26,26,41,0.04)',
                          }}
                        >
                          <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 42, color: COLORS.textDark}}>{name}</div>
                          <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 38, color: COLORS.textMuted}}>{pts}</div>
                        </div>
                      ))}
                    </div>
                  }
                />
              ) : null}
            </Panel>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene5Onboarding: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 210);
  const steps = [
    {title: 'Connect your wallet', subtitle: 'Use MetaMask or WalletConnect', kind: 'wallet'},
    {title: 'Link your Google account', subtitle: 'Verify identity for node trust', kind: 'google'},
    {title: 'Start mining & earn points', subtitle: 'Activate your node and track rewards', kind: 'mining'},
  ] as const;

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background dark />
      <BrandTopLeft dark />
      {steps.map((step, index) => {
        const start = index * 70;
        const local = frame - start;
        const visible = interpolate(local, [0, 10, 58, 70], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) {
          return null;
        }

        const cardY = interpolate(local, [0, 20], [50, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={step.title}
            style={{
              position: 'absolute',
              left: 330,
              top: 220 + cardY,
              width: 1260,
              height: 560,
              opacity: visible,
            }}
          >
            <Panel dark width={1260} height={560} left={0} top={0} frame={24}>
              <div style={{padding: '58px 70px'}}>
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 66, color: COLORS.white, letterSpacing: '-0.04em'}}>
                  {step.title}
                </div>
                <div style={{marginTop: 20, fontFamily: fonts.body, fontSize: 34, color: 'rgba(255,255,255,0.66)'}}>
                  {step.subtitle}
                </div>
                {step.kind === 'wallet' ? (
                  <div style={{marginTop: 54, display: 'flex', gap: 24}}>
                    {['MetaMask', 'WalletConnect'].map((label, i) => (
                      <div
                        key={label}
                        style={{
                          width: 340,
                          height: 92,
                          borderRadius: 26,
                          border: `1px solid ${COLORS.borderDark}`,
                          background: i === 0 ? 'rgba(138,43,226,0.16)' : 'rgba(56,189,175,0.16)',
                          color: COLORS.white,
                          fontFamily: fonts.heading,
                          fontWeight: 700,
                          fontSize: 34,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                ) : null}
                {step.kind === 'google' ? (
                  <div style={{marginTop: 58, display: 'flex', alignItems: 'center', gap: 28}}>
                    <div
                      style={{
                        width: 108,
                        height: 108,
                        borderRadius: 30,
                        background: 'rgba(255,255,255,0.92)',
                        color: '#4285F4',
                        fontFamily: fonts.heading,
                        fontWeight: 700,
                        fontSize: 58,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      G
                    </div>
                    <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 42, color: COLORS.white}}>
                      Google verification ready
                    </div>
                  </div>
                ) : null}
                {step.kind === 'mining' ? (
                  <div style={{marginTop: 60}}>
                    <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 88, color: COLORS.white}}>
                      {Math.round(interpolate(local, [0, 50], [0, 50], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))} pts
                    </div>
                    <div style={{marginTop: 26, width: 760, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.12)', overflow: 'hidden'}}>
                      <div
                        style={{
                          width: `${interpolate(local, [0, 50], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.teal})`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene6Community: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 150);
  const firstVisible = frame < 75;
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background />
      <BrandTopLeft />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {firstVisible ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 290 + interpolate(frame, [0, 22], [-90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                top: 340,
                width: 730,
                padding: '36px 42px',
                borderRadius: 30,
                background: 'rgba(255,255,255,0.95)',
                border: `1px solid ${COLORS.borderLight}`,
                boxShadow: '0 24px 70px rgba(26,26,41,0.08)',
              }}
            >
              <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 56, color: COLORS.textDark, letterSpacing: '-0.04em'}}>
                Earn points for every friend
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                right: 320 + interpolate(frame, [0, 22], [90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                top: 360,
                width: 360,
                height: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 116,
                    height: 116,
                    borderRadius: 999,
                    background: i === 0 ? COLORS.purple : COLORS.teal,
                    boxShadow: i === 0 ? '0 0 26px rgba(138,43,226,0.32)' : '0 0 26px rgba(56,189,175,0.3)',
                  }}
                />
              ))}
              <div
                style={{
                  position: 'absolute',
                  left: 100,
                  top: 98,
                  width: 150,
                  height: 6,
                  borderRadius: 999,
                  background: COLORS.textDark,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                right: 300 + interpolate(frame - 75, [0, 22], [90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                top: 340,
                width: 700,
                padding: '36px 42px',
                borderRadius: 30,
                background: 'rgba(255,255,255,0.95)',
                border: `1px solid ${COLORS.borderLight}`,
                boxShadow: '0 24px 70px rgba(26,26,41,0.08)',
              }}
            >
              <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 56, color: COLORS.textDark, letterSpacing: '-0.04em'}}>
                Track your rank in real time
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 340 + interpolate(frame - 75, [0, 22], [-90, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
                top: 336,
                width: 300,
                height: 260,
                display: 'flex',
                alignItems: 'flex-end',
                gap: 22,
              }}
            >
              {[90, 150, 210].map((h, i) => (
                <div
                  key={h}
                  style={{
                    width: 76,
                    height: h,
                    borderRadius: 26,
                    background: i === 2 ? COLORS.purple : i === 1 ? COLORS.teal : 'rgba(26,26,41,0.2)',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Scene7Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneFade(frame, 90);
  const pulse = interpolate(frame, [0, 24, 48], [0.96, 1.04, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tagline = enterSpring(frame, 18, 24);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background dark />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scale(${pulse})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -42,
              borderRadius: 999,
              background: 'radial-gradient(circle, rgba(138,43,226,0.20), transparent 65%)',
            }}
          />
          <LogoBadge size={208} dark />
        </div>
        <div
          style={{
            marginTop: 40,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 56,
            color: COLORS.white,
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [28, 0])}px)`,
          }}
        >
          Join the privacy revolution
        </div>
        <div
          style={{
            marginTop: 26,
            width: 250,
            height: 76,
            borderRadius: 999,
            background: COLORS.purple,
            color: COLORS.white,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: tagline,
          }}
        >
          Start Now
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxClarity: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: fonts.body}}>
      <Sequence from={0} durationInFrames={150}>
        <Scene1LogoTagline />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <Scene2Mission />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <Scene3Network />
      </Sequence>
      <Sequence from={450} durationInFrames={300}>
        <Scene4DashboardHighlights />
      </Sequence>
      <Sequence from={750} durationInFrames={210}>
        <Scene5Onboarding />
      </Sequence>
      <Sequence from={960} durationInFrames={150}>
        <Scene6Community />
      </Sequence>
      <Sequence from={1110} durationInFrames={90}>
        <Scene7Finale />
      </Sequence>
    </AbsoluteFill>
  );
};
