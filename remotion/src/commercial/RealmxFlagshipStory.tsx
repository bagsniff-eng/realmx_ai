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
const TOTAL = 1500;
const logo = staticFile('le6jxytl.webp');

const COLORS = {
  white: '#F7F5F2',
  cream: '#F8F4EF',
  dark: '#0E0A18',
  dark2: '#1A1A29',
  purple: '#8A2BE2',
  teal: '#38BDAF',
  pastelA: '#FDF6FD',
  pastelB: '#E0F7F1',
  ink: '#1D2033',
  softInk: '#5C6077',
  bright: '#F8F5FF',
  borderLight: 'rgba(29,32,51,0.12)',
  borderDark: 'rgba(248,245,255,0.14)',
};

const fonts = {
  heading: '"Montserrat", "Georgia", "Inter", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
  mono: '"SFMono-Regular", "Cascadia Code", "Consolas", monospace',
};

const springProgress = (frame: number, delay = 0, durationInFrames = 28) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 18, stiffness: 120, mass: 0.95},
  });

const LogoChip: React.FC<{size: number; dark?: boolean}> = ({size, dark = false}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: dark ? 'rgba(7,7,12,0.88)' : 'rgba(255,255,255,0.92)',
      border: `1px solid ${dark ? COLORS.borderDark : COLORS.borderLight}`,
      boxShadow: dark
        ? '0 22px 60px rgba(0,0,0,0.42), 0 0 24px rgba(138,43,226,0.22)'
        : '0 22px 60px rgba(29,32,51,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    <Img src={logo} style={{width: '78%', height: '78%', objectFit: 'contain'}} />
  </div>
);

const LightBackground: React.FC<{frame: number; tone?: 'white' | 'cream' | 'pastel'}> = ({
  frame,
  tone = 'white',
}) => {
  if (tone === 'pastel') {
    const drift = interpolate(frame, [0, TOTAL], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill
        style={{
          backgroundImage: [
            `radial-gradient(circle at ${18 + drift * 6}% ${18 + drift * 5}%, rgba(138,43,226,0.12), transparent 28%)`,
            `radial-gradient(circle at ${78 - drift * 7}% ${80 - drift * 5}%, rgba(56,189,175,0.18), transparent 30%)`,
            `linear-gradient(135deg, ${COLORS.pastelA}, ${COLORS.pastelB})`,
          ].join(','),
        }}
      />
    );
  }

  const base = tone === 'cream' ? COLORS.cream : COLORS.white;
  return (
    <AbsoluteFill
      style={{
        background: base,
        backgroundImage:
          'radial-gradient(circle at 50% 28%, rgba(29,32,51,0.05), transparent 36%), radial-gradient(circle at 80% 82%, rgba(138,43,226,0.04), transparent 24%)',
      }}
    />
  );
};

const DarkBackground: React.FC<{frame: number}> = ({frame}) => {
  const drift = interpolate(frame, [0, TOTAL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.dark,
        backgroundImage: [
          `radial-gradient(circle at ${20 + drift * 9}% ${18 + drift * 4}%, rgba(138,43,226,0.28), transparent 28%)`,
          `radial-gradient(circle at ${79 - drift * 5}% ${78 - drift * 6}%, rgba(56,189,175,0.18), transparent 30%)`,
          `linear-gradient(180deg, ${COLORS.dark}, ${COLORS.dark2})`,
        ].join(','),
      }}
    />
  );
};

const TopLeftBrand: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <div
    style={{
      position: 'absolute',
      left: 52,
      top: 42,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 20,
    }}
  >
    <LogoChip size={54} dark={dark} />
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 30,
        fontWeight: 700,
        color: dark ? COLORS.bright : COLORS.ink,
      }}
    >
      RealmxAI
    </div>
  </div>
);

const FloatCard: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  frame: number;
  delay?: number;
  fromX?: number;
  fromY?: number;
  dark?: boolean;
  rotate?: number;
  children: React.ReactNode;
}> = ({
  x,
  y,
  width,
  height,
  frame,
  delay = 0,
  fromX = 0,
  fromY = 0,
  dark = false,
  rotate = 0,
  children,
}) => {
  const enter = springProgress(frame, delay, 32);
  const floatY = Math.sin((frame + delay) / 18) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        left: x + interpolate(enter, [0, 1], [fromX, 0]),
        top: y + interpolate(enter, [0, 1], [fromY, 0]) + floatY,
        width,
        height,
        borderRadius: 30,
        background: dark ? 'rgba(14,10,24,0.72)' : 'rgba(255,255,255,0.85)',
        border: `1px solid ${dark ? COLORS.borderDark : COLORS.borderLight}`,
        boxShadow: dark
          ? '0 30px 80px rgba(0,0,0,0.34)'
          : '0 24px 70px rgba(29,32,51,0.1)',
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.92, 1])}) rotate(${rotate}deg)`,
        overflow: 'hidden',
        backdropFilter: 'blur(18px)',
      }}
    >
      {children}
    </div>
  );
};

const MissionIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 14, 160, 180], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lines = [
    'Enhancing Bitcoin privacy',
    'Fair rewards for participation',
    'Join the future today',
  ];
  const phraseProgress = interpolate(frame, [88, 128], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const logoMove = springProgress(frame, 118, 40);

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <LightBackground frame={frame} tone="white" />
      <TopLeftBrand />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {lines.map((line, index) => {
          const enter = springProgress(frame, index * 18, 28);
          return (
            <div
              key={line}
              style={{
                position: 'relative',
                fontFamily: fonts.heading,
                fontSize: 74,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: '-0.04em',
                opacity: enter,
                transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px) scale(${interpolate(
                  enter,
                  [0, 1],
                  [0.97, 1],
                )})`,
              }}
            >
              {line}
              {index === 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: '41%',
                    bottom: -10,
                    width: 330 * phraseProgress,
                    height: 4,
                    borderRadius: 999,
                    background: COLORS.purple,
                    boxShadow: '0 0 16px rgba(138,43,226,0.35)',
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: interpolate(logoMove, [0, 1], [WIDTH / 2 - 72, WIDTH - 170]),
          top: interpolate(logoMove, [0, 1], [HEIGHT / 2 + 120, HEIGHT - 170]),
          transform: `scale(${interpolate(logoMove, [0, 1], [1.5, 0.78])})`,
        }}
      >
        <LogoChip size={144} />
      </div>
    </AbsoluteFill>
  );
};

const CinematicNetwork: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 12, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const camera = springProgress(frame, 0, 220);
  const shieldScale = interpolate(camera, [0, 1], [0.9, 1.2]);
  const networkFade = interpolate(frame, [40, 90, 220], [0, 1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const nodes = Array.from({length: 20}, (_, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return {
      x: 380 + col * 280 + Math.sin(frame / 18 + index) * 30,
      y: 250 + row * 160 + Math.cos(frame / 22 + index) * 26,
      size: 10 + (index % 4) * 4,
    };
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackground frame={frame} />
      <TopLeftBrand dark />
      <div
        style={{
          position: 'absolute',
          left: WIDTH / 2 - 220,
          top: 180,
          width: 440,
          height: 440,
          transform: `scale(${shieldScale}) translateY(${interpolate(camera, [0, 1], [24, -30])}px)`,
          opacity: interpolate(frame, [0, 24, 110], [0, 1, 0.28], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 70 - i * 16,
              borderRadius: '50%',
              border: `2px solid ${i === 1 ? 'rgba(56,189,175,0.7)' : 'rgba(138,43,226,0.72)'}`,
              boxShadow:
                i === 1
                  ? '0 0 30px rgba(56,189,175,0.28)'
                  : '0 0 30px rgba(138,43,226,0.28)',
              transform: `rotate(${frame * (0.55 + i * 0.18)}deg) scaleX(${1 + i * 0.08}) scaleY(${1 - i * 0.04})`,
            }}
          />
        ))}
        <div style={{position: 'absolute', left: 148, top: 148}}>
          <LogoChip size={144} dark />
        </div>
      </div>
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: networkFade,
          transform: `scale(${interpolate(camera, [0, 1], [0.94, 1.08])}) translateY(${interpolate(
            camera,
            [0, 1],
            [18, -10],
          )}px)`,
        }}
      >
        {nodes.map((node, index) =>
          nodes.slice(index + 1, index + 3).map((next, inner) => (
            <line
              key={`${index}-${inner}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke={inner === 0 ? 'rgba(138,43,226,0.35)' : 'rgba(56,189,175,0.28)'}
              strokeWidth="1.5"
            />
          )),
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
            borderRadius: '50%',
            background: index % 3 === 0 ? COLORS.teal : COLORS.purple,
            opacity: networkFade,
            boxShadow:
              index % 3 === 0
                ? '0 0 18px rgba(56,189,175,0.72)'
                : '0 0 18px rgba(138,43,226,0.78)',
            transform: `scale(${1 + Math.sin(frame / 7 + index) * 0.2})`,
          }}
        />
      ))}
      <FloatCard x={130} y={84} width={360} height={134} frame={frame} dark delay={28} fromY={-50}>
        <div style={{padding: '22px 24px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 17, fontWeight: 500, color: '#B6B0CF', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Network</div>
          <div style={{marginTop: 12, fontFamily: fonts.heading, fontSize: 48, fontWeight: 700, color: COLORS.bright}}>
            {Math.round(interpolate(frame, [30, 180], [0, 4000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})).toLocaleString()} active nodes
          </div>
        </div>
      </FloatCard>
      <FloatCard x={1430} y={84} width={360} height={134} frame={frame} dark delay={48} fromY={-50}>
        <div style={{padding: '22px 24px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 17, fontWeight: 500, color: '#B6B0CF', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Rewards</div>
          <div style={{marginTop: 12, fontFamily: fonts.heading, fontSize: 48, fontWeight: 700, color: COLORS.bright}}>
            {Math.round(interpolate(frame, [50, 190], [0, 14000000], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})).toLocaleString()} points
          </div>
        </div>
      </FloatCard>
    </AbsoluteFill>
  );
};

const PastelDashboards: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <LightBackground frame={frame} tone="pastel" />
      <div
        style={{
          position: 'absolute',
          top: 78,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.heading,
          fontSize: 52,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        Your privacy is now in growth mode
      </div>
      <FloatCard x={90} y={178} width={800} height={300} frame={frame} delay={0} fromX={-120}>
        <div style={{padding: '26px 30px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.softInk, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Node Status</div>
          <div style={{marginTop: 18, fontFamily: fonts.heading, fontSize: 66, fontWeight: 700, color: COLORS.ink}}>
            {Math.round(interpolate(frame, [20, 140], [0, 148], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))} min
          </div>
          <div style={{marginTop: 28, height: 18, borderRadius: 999, background: 'rgba(29,32,51,0.08)'}}>
            <div
              style={{
                width: `${interpolate(frame, [10, 150], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`,
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.teal})`,
              }}
            />
          </div>
        </div>
      </FloatCard>
      <FloatCard x={1030} y={170} width={800} height={320} frame={frame} delay={16} fromY={-100}>
        <div style={{padding: '26px 30px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.softInk, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Points Balance</div>
          <div style={{marginTop: 20, fontFamily: fonts.heading, fontSize: 84, fontWeight: 700, color: COLORS.ink}}>
            {Math.round(interpolate(frame, [30, 170], [0, 25840], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})).toLocaleString()}
          </div>
        </div>
      </FloatCard>
      <FloatCard x={90} y={566} width={800} height={320} frame={frame} delay={28} fromY={120}>
        <div style={{padding: '26px 30px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.softInk, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Referral Code</div>
          <div style={{marginTop: 20, fontFamily: fonts.heading, fontSize: 72, fontWeight: 700, color: COLORS.purple, letterSpacing: '0.06em'}}>RL-12345-AI</div>
          <div style={{marginTop: 28, width: 240, height: 64, borderRadius: 999, background: COLORS.purple, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 30, fontWeight: 700}}>Copy code</div>
        </div>
      </FloatCard>
      <FloatCard x={1030} y={566} width={800} height={320} frame={frame} delay={42} fromX={120}>
        <div style={{padding: '26px 30px'}}>
          <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.softInk, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Leaderboard</div>
          {[
            ['Ava', '12,420'],
            ['Noah', '11,880'],
            ['Mia', '10,940'],
          ].map(([name, score], i) => (
            <div
              key={name}
              style={{
                marginTop: i === 0 ? 22 : 16,
                display: 'grid',
                gridTemplateColumns: '70px 1fr auto',
                alignItems: 'center',
                fontFamily: fonts.body,
                fontSize: 32,
                color: COLORS.ink,
              }}
            >
              <div style={{fontWeight: 700}}>{i + 1}</div>
              <div>{name}</div>
              <div style={{fontWeight: 700}}>{score}</div>
            </div>
          ))}
        </div>
      </FloatCard>
    </AbsoluteFill>
  );
};

const OnboardingFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 12, 280, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stage = frame < 90 ? 0 : frame < 180 ? 1 : 2;
  const panels = [
    {title: 'Step 1: Connect your wallet', subtitle: 'MetaMask or WalletConnect', action: 'Connect Wallet'},
    {title: 'Step 2: Link Google', subtitle: 'Verify identity to activate node trust', action: 'Link Google'},
    {title: 'Step 3: Start Mining', subtitle: 'Launch the node and watch points flow', action: 'Start Mining'},
  ];
  const active = panels[stage];
  const slide = springProgress(frame, stage * 90, 28);
  const contentX = interpolate(slide, [0, 1], [60, 0]);

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <LightBackground frame={frame} tone="cream" />
      <TopLeftBrand />
      <FloatCard x={270} y={118} width={1380} height={620} frame={frame} delay={0}>
        <div
          style={{
            position: 'absolute',
            left: 46,
            right: 46,
            top: 26,
            height: 8,
            borderRadius: 999,
            background: 'rgba(29,32,51,0.08)',
          }}
        >
          <div
            style={{
              width: `${interpolate(frame, [0, 260], [0, 100], {extrapolateRight: 'clamp'})}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.teal})`,
            }}
          />
        </div>
        <div style={{position: 'absolute', left: 70, right: 70, top: 90, bottom: 170}}>
          <div style={{transform: `translateX(${contentX}px)`, opacity: slide}}>
            <div style={{fontFamily: fonts.heading, fontSize: 58, fontWeight: 700, color: COLORS.ink}}>{active.title}</div>
            <div style={{marginTop: 12, fontFamily: fonts.body, fontSize: 30, color: COLORS.softInk}}>{active.subtitle}</div>
            {stage === 0 ? (
              <div style={{marginTop: 38, display: 'flex', gap: 18}}>
                {['MetaMask', 'WalletConnect'].map((label) => (
                  <div key={label} style={{padding: '18px 24px', borderRadius: 20, background: '#fff', border: `1px solid ${COLORS.borderLight}`, fontFamily: fonts.body, fontSize: 28, color: COLORS.ink}}>
                    {label}
                  </div>
                ))}
              </div>
            ) : null}
            {stage === 1 ? (
              <div style={{marginTop: 38, width: 92, height: 92, borderRadius: 26, background: '#fff', border: `1px solid ${COLORS.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 40, fontWeight: 700, color: '#4285F4'}}>G</div>
            ) : null}
            {stage === 2 ? (
              <div>
                <div style={{marginTop: 36, fontFamily: fonts.heading, fontSize: 32, fontWeight: 700, color: COLORS.ink}}>Mining active</div>
                <div style={{marginTop: 18, width: 620, height: 18, borderRadius: 999, background: 'rgba(29,32,51,0.08)'}}>
                  <div
                    style={{
                      width: `${interpolate(frame, [180, 250], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.teal})`,
                    }}
                  />
                </div>
                <div style={{marginTop: 18, fontFamily: fonts.heading, fontSize: 76, fontWeight: 700, color: COLORS.ink}}>
                  {Math.round(interpolate(frame, [190, 280], [0, 50], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
                </div>
              </div>
            ) : null}
            <div style={{marginTop: 40, width: 340, height: 72, borderRadius: 999, background: COLORS.purple, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 30, fontWeight: 700}}>
              {active.action}
            </div>
            <div style={{marginTop: 32, display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 42, height: 42, borderRadius: '50%', background: '#2FBF71', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{width: 14, height: 8, borderLeft: '3px solid #fff', borderBottom: '3px solid #fff', transform: 'rotate(-45deg) translateY(-1px)'}} />
              </div>
              <div style={{fontFamily: fonts.body, fontSize: 30, color: COLORS.ink}}>Complete</div>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: 44,
            right: 44,
            bottom: 34,
            height: 120,
            borderRadius: 24,
            background: 'rgba(255,255,255,0.88)',
            border: `1px solid ${COLORS.borderLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 34px',
          }}
        >
          <div>
            <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.softInk, textTransform: 'uppercase', letterSpacing: '0.08em'}}>Referral code</div>
            <div style={{marginTop: 8, fontFamily: fonts.heading, fontSize: 48, fontWeight: 700, color: COLORS.purple}}>RL-12345-AI</div>
          </div>
          <div style={{width: 220, height: 64, borderRadius: 999, background: COLORS.purple, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.heading, fontSize: 28, fontWeight: 700}}>Copy code</div>
        </div>
      </FloatCard>
    </AbsoluteFill>
  );
};

const CommunityBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10, 220, 240], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const explode = springProgress(frame, 8, 40);
  const calloutIndex = frame < 70 ? 0 : frame < 145 ? 1 : 2;
  const callouts = [
    'Earn points for each referral',
    'Invite friends and grow',
    'Track your rank in real time',
  ];
  const colors = ['#8A2BE2', '#38BDAF', '#F5A9D0'];
  const particles = [
    [-340, -170], [-190, -250], [-60, -180], [120, -260], [260, -120],
    [330, 12], [250, 178], [90, 230], [-120, 220], [-300, 100],
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <LightBackground frame={frame} tone="pastel" />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: 860, height: 860}}>
          <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
            <LogoChip size={150} />
          </div>
          <svg width="860" height="860" style={{position: 'absolute', inset: 0}}>
            {particles.map((p, i) =>
              i < particles.length - 1 ? (
                <line
                  key={i}
                  x1={430 + p[0] * explode * 0.55}
                  y1={430 + p[1] * explode * 0.55}
                  x2={430 + particles[i + 1][0] * explode * 0.55}
                  y2={430 + particles[i + 1][1] * explode * 0.55}
                  stroke="rgba(29,32,51,0.12)"
                  strokeWidth="1.5"
                />
              ) : null,
            )}
          </svg>
          {particles.map((p, i) => (
            <div
              key={`${p[0]}-${p[1]}`}
              style={{
                position: 'absolute',
                left: 430 + p[0] * explode * 0.55,
                top: 430 + p[1] * explode * 0.55,
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.86)',
                border: `2px solid ${i % 2 === 0 ? 'rgba(138,43,226,0.24)' : 'rgba(56,189,175,0.24)'}`,
                boxShadow: '0 16px 38px rgba(29,32,51,0.12)',
                transform: `translate(-50%, -50%) translateY(${Math.sin(frame / 12 + i) * 8}px)`,
              }}
            />
          ))}
        </div>
      </div>
      <FloatCard x={1210} y={170} width={560} height={160} frame={frame} delay={calloutIndex * 12} fromX={80}>
        <div style={{padding: '32px 34px', fontFamily: fonts.heading, fontSize: 44, fontWeight: 700, color: colors[calloutIndex]}}>
          {callouts[calloutIndex]}
        </div>
      </FloatCard>
    </AbsoluteFill>
  );
};

const DeveloperInterlude: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10, 100, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const typeLen = Math.floor(interpolate(frame, [18, 70], [0, 25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const command = 'npx realmxai-node install'.slice(0, typeLen);
  return (
    <AbsoluteFill style={{opacity: fade}}>
      <LightBackground frame={frame} tone="white" />
      <div
        style={{
          position: 'absolute',
          left: 440,
          top: 220,
          width: 1040,
          height: 460,
          borderRadius: 34,
          background: '#fff',
          border: `1px solid ${COLORS.borderLight}`,
          boxShadow: '0 34px 90px rgba(29,32,51,0.12)',
          transform: `perspective(1200px) rotateX(7deg) rotateY(-9deg) scale(${interpolate(
            springProgress(frame, 0, 30),
            [0, 1],
            [0.94, 1],
          )})`,
        }}
      >
        <div style={{padding: '24px 28px', display: 'flex', gap: 10}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((color) => (
            <div key={color} style={{width: 14, height: 14, borderRadius: '50%', background: color}} />
          ))}
        </div>
        <div style={{padding: '38px 44px', fontFamily: fonts.mono, fontSize: 36, color: COLORS.ink}}>
          <div style={{color: COLORS.softInk}}>$ {command}<span style={{opacity: frame % 20 < 10 ? 1 : 0}}>|</span></div>
          <div style={{marginTop: 44, fontSize: 48, fontWeight: 700, color: COLORS.teal, opacity: interpolate(frame, [70, 96], [0, 1], {extrapolateLeft: 'clamp'})}}>
            Node ready.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const KeynoteReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 14, 160, 180], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const orbit = interpolate(frame, [0, 180], [-12, 16], {
    extrapolateRight: 'clamp',
  });
  const words = [
    ['Secure', 210, 180],
    ['Earn', 1470, 210],
    ['Share', 1450, 800],
  ];
  const icons = [
    [540, 360], [820, 250], [1090, 270], [1350, 390],
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackground frame={frame} />
      <div
        style={{
          position: 'absolute',
          left: WIDTH / 2 - 320,
          top: 240,
          width: 640,
          height: 360,
          transform: `rotate(${orbit}deg)`,
        }}
      >
        <div style={{position: 'absolute', left: 120, right: 120, bottom: 20, height: 28, borderRadius: '50%', background: 'rgba(56,189,175,0.14)', filter: 'blur(18px)'}} />
        <div style={{position: 'absolute', left: 160, right: 160, bottom: 70, height: 26, borderRadius: '50%', background: 'linear-gradient(90deg, rgba(138,43,226,0.6), rgba(56,189,175,0.55))'}} />
        <div style={{position: 'absolute', left: 248, top: 52}}>
          <LogoChip size={144} dark />
        </div>
      </div>
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {icons.map(([x, y], i) => (
          <line
            key={i}
            x1={WIDTH / 2}
            y1={420}
            x2={x}
            y2={y}
            stroke="rgba(248,245,255,0.16)"
            strokeWidth="1.4"
          />
        ))}
      </svg>
      {icons.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x - 34,
            top: y - 34,
            width: 68,
            height: 68,
            borderRadius: 20,
            background: 'rgba(7,7,12,0.82)',
            border: `1px solid ${COLORS.borderDark}`,
            boxShadow: '0 0 18px rgba(138,43,226,0.18)',
          }}
        />
      ))}
      {words.map(([word, left, top], index) => (
        <div
          key={String(word)}
          style={{
            position: 'absolute',
            left: Number(left),
            top: Number(top),
            fontFamily: fonts.heading,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.bright,
            opacity: springProgress(frame, index * 18, 28),
          }}
        >
          {String(word)}
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: 'center',
          fontFamily: fonts.heading,
          fontSize: 56,
          fontWeight: 700,
          color: COLORS.bright,
        }}
      >
        Join the privacy revolution
      </div>
      <div
        style={{
          position: 'absolute',
          left: WIDTH / 2 - 120,
          bottom: 42,
          width: 240,
          height: 68,
          borderRadius: 999,
          background: COLORS.purple,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.heading,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        Start Now
      </div>
    </AbsoluteFill>
  );
};

export const RealmxFlagshipStory: React.FC = () => {
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={180}>
        <MissionIntro />
      </Sequence>
      <Sequence from={180} durationInFrames={240}>
        <CinematicNetwork />
      </Sequence>
      <Sequence from={420} durationInFrames={240}>
        <PastelDashboards />
      </Sequence>
      <Sequence from={660} durationInFrames={300}>
        <OnboardingFlow />
      </Sequence>
      <Sequence from={960} durationInFrames={240}>
        <CommunityBurst />
      </Sequence>
      <Sequence from={1200} durationInFrames={120}>
        <DeveloperInterlude />
      </Sequence>
      <Sequence from={1320} durationInFrames={180}>
        <KeynoteReveal />
      </Sequence>
    </AbsoluteFill>
  );
};
