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
const TOTAL = 900;

const COLORS = {
  bgA: '#FDF6FD',
  bgB: '#E0F7F1',
  accentBlue: '#65C9FF',
  accentPink: '#F5A9D0',
  accentMint: '#AFF0D1',
  ink: '#1B2140',
  muted: '#5E688E',
  border: 'rgba(27,33,64,0.14)',
  white: 'rgba(255,255,255,0.72)',
};

const fonts = {
  headline: '"Montserrat SemiBold", "Montserrat", "Inter", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
};

const logo = staticFile('le6jxytl.webp');

const Background: React.FC<{frame: number}> = ({frame}) => {
  const shift = interpolate(frame, [0, TOTAL], [0, 1]);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: [
          `radial-gradient(circle at ${18 + shift * 10}% ${18 + shift * 5}%, rgba(101,201,255,0.22), transparent 24%)`,
          `radial-gradient(circle at ${82 - shift * 8}% ${14 + shift * 7}%, rgba(245,169,208,0.24), transparent 26%)`,
          `radial-gradient(circle at ${62 - shift * 5}% ${82 - shift * 4}%, rgba(175,240,209,0.26), transparent 28%)`,
          `linear-gradient(135deg, ${COLORS.bgA} 0%, ${COLORS.bgB} 100%)`,
        ].join(','),
      }}
    />
  );
};

const Frost: React.FC<{x: number; y: number; width: number; height: number; rotate?: number; frame: number; delay?: number; children: React.ReactNode}> = ({
  x,
  y,
  width,
  height,
  rotate = 0,
  frame,
  delay = 0,
  children,
}) => {
  const enter = spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    config: {damping: 15, stiffness: 120, mass: 0.9},
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: 30,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.white,
        boxShadow: '0 24px 70px rgba(101, 201, 255, 0.15), 0 12px 34px rgba(27,33,64,0.08)',
        backdropFilter: 'blur(18px)',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])}) rotate(${rotate}deg)`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const Header: React.FC<{label: string; title: string}> = ({label, title}) => (
  <div style={{padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 8}}>
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.muted,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.headline,
        fontSize: 34,
        lineHeight: 1,
        color: COLORS.ink,
      }}
    >
      {title}
    </div>
  </div>
);

const LogoBadge: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      background: 'rgba(255,255,255,0.9)',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 20px 50px rgba(27,33,64,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Img src={logo} style={{width: '74%', height: '74%', objectFit: 'contain'}} />
  </div>
);

const NumberCounter: React.FC<{from: number; to: number; frame: number}> = ({from, to, frame}) => {
  const value = Math.round(interpolate(frame, [0, 180], [from, to], {extrapolateRight: 'clamp'}));
  return (
    <div
      style={{
        fontFamily: fonts.headline,
        fontSize: 96,
        lineHeight: 0.95,
        color: COLORS.ink,
      }}
    >
      {value}
    </div>
  );
};

const LaunchBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = spring({fps: FPS, frame, config: {damping: 14, stiffness: 100, mass: 0.95}});
  const explode = spring({fps: FPS, frame: Math.max(0, frame - 42), config: {damping: 14, stiffness: 80, mass: 1}});

  const particles = [
    {x: -340, y: -170, size: 72},
    {x: -180, y: -260, size: 52},
    {x: -60, y: -190, size: 44},
    {x: 120, y: -250, size: 60},
    {x: 250, y: -140, size: 50},
    {x: 330, y: 10, size: 62},
    {x: 240, y: 180, size: 46},
    {x: 70, y: 240, size: 58},
    {x: -130, y: 220, size: 54},
    {x: -290, y: 120, size: 48},
  ];

  return (
    <AbsoluteFill>
      <Background frame={frame} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            position: 'relative',
            width: 820,
            height: 820,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) scale(${interpolate(enter, [0, 1], [0.7, 1])})`,
              opacity: interpolate(frame, [0, 20, 80, 120], [0, 1, 1, 0.15], {extrapolateRight: 'clamp'}),
            }}
          >
            <LogoBadge size={220} />
          </div>
          {particles.map((p, i) => (
            <div
              key={`${p.x}-${p.y}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${interpolate(explode, [0, 1], [0, p.x])}px, ${interpolate(explode, [0, 1], [0, p.y])}px) scale(${interpolate(explode, [0, 1], [0.35, 1])}) rotate(${i * 16}deg)`,
                opacity: interpolate(frame, [40, 70, 120], [0, 1, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <LogoBadge size={p.size} />
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 110,
          textAlign: 'center',
          fontFamily: fonts.headline,
          fontSize: 78,
          lineHeight: 0.95,
          color: COLORS.ink,
          opacity: interpolate(frame, [25, 60, 120], [0, 1, 0.78], {extrapolateRight: 'clamp'}),
        }}
      >
        Realm XAI
      </div>
    </AbsoluteFill>
  );
};

const ReferralPointsGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame;
  return (
    <AbsoluteFill>
      <Background frame={frame + 120} />
      <Frost x={90} y={120} width={820} height={360} rotate={-2} frame={local} delay={0}>
        <Header label="Panel A" title="Points Earned" />
        <div style={{padding: '26px 22px'}}>
          <NumberCounter from={0} to={500} frame={local} />
          <div style={{marginTop: 16, fontFamily: fonts.body, fontSize: 26, color: COLORS.muted}}>Animated points growth</div>
          <div style={{marginTop: 30, height: 16, borderRadius: 999, background: 'rgba(101,201,255,0.18)'}}>
            <div
              style={{
                width: `${interpolate(local, [0, 180], [0, 100], {extrapolateRight: 'clamp'})}%`,
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentMint})`,
              }}
            />
          </div>
        </div>
      </Frost>

      <Frost x={1010} y={120} width={820} height={360} rotate={2} frame={local} delay={12}>
        <Header label="Panel B" title="Referral Invite List" />
        <div style={{padding: '22px', display: 'flex', flexDirection: 'column', gap: 14}}>
          {['Ava joined', 'Noah invited', 'Mia pending'].map((row, i) => (
            <div
              key={row}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  background: [COLORS.accentBlue, COLORS.accentPink, COLORS.accentMint][i],
                }}
              />
              <div style={{fontFamily: fonts.body, fontSize: 24, color: COLORS.ink, fontWeight: 600}}>{row}</div>
              <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.muted}}>active</div>
            </div>
          ))}
          <div
            style={{
              marginTop: 6,
              alignSelf: 'flex-start',
              borderRadius: 999,
              padding: '16px 26px',
              background: COLORS.accentPink,
              color: COLORS.ink,
              fontFamily: fonts.headline,
              fontSize: 24,
            }}
          >
            + Invite
          </div>
        </div>
      </Frost>

      <Frost x={90} y={560} width={820} height={360} rotate={1.5} frame={local} delay={20}>
        <Header label="Panel C" title="Leaderboard" />
        <div style={{padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14}}>
          {[
            ['1', 'Ariana', '640 pts'],
            ['2', 'Leo', '580 pts'],
            ['3', 'Sam', '530 pts'],
          ].map(([rank, name, points], i) => (
            <div
              key={name}
              style={{
                display: 'grid',
                gridTemplateColumns: '68px 1fr auto',
                alignItems: 'center',
                gap: 16,
                padding: '18px 18px',
                borderRadius: 22,
                border: `1px solid ${COLORS.border}`,
                background: i === 0 ? 'rgba(101,201,255,0.24)' : 'rgba(255,255,255,0.5)',
              }}
            >
              <div style={{fontFamily: fonts.headline, fontSize: 32, color: COLORS.ink}}>{rank}</div>
              <div style={{fontFamily: fonts.body, fontSize: 26, color: COLORS.ink, fontWeight: 600}}>{name}</div>
              <div style={{fontFamily: fonts.body, fontSize: 22, color: COLORS.muted}}>{points}</div>
            </div>
          ))}
        </div>
      </Frost>

      <Frost x={1010} y={560} width={820} height={360} rotate={-1.5} frame={local} delay={28}>
        <Header label="Panel D" title="Status Summary" />
        <div style={{padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18}}>
          {[
            ['Wallet connected', COLORS.accentBlue],
            ['Google linked', COLORS.accentPink],
            ['Mining active', COLORS.accentMint],
          ].map(([text, color]) => (
            <div
              key={text}
              style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr auto',
                alignItems: 'center',
                gap: 14,
                padding: '18px 18px',
                borderRadius: 20,
                border: `1px solid ${COLORS.border}`,
                background: 'rgba(255,255,255,0.5)',
              }}
            >
              <div style={{width: 18, height: 18, borderRadius: 999, background: String(color)}} />
              <div style={{fontFamily: fonts.body, fontSize: 25, color: COLORS.ink, fontWeight: 600}}>{text}</div>
              <div style={{fontFamily: fonts.body, fontSize: 18, color: COLORS.muted}}>ready</div>
            </div>
          ))}
        </div>
      </Frost>
    </AbsoluteFill>
  );
};

const CommunityConnections: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame;
  const avatars = [
    {x: 330, y: 200, color: COLORS.accentBlue, speed: 0.55},
    {x: 540, y: 420, color: COLORS.accentPink, speed: 0.9},
    {x: 810, y: 240, color: COLORS.accentMint, speed: 0.7},
    {x: 1140, y: 470, color: COLORS.accentBlue, speed: 1},
    {x: 1430, y: 260, color: COLORS.accentPink, speed: 0.75},
    {x: 1620, y: 430, color: COLORS.accentMint, speed: 0.62},
  ];
  return (
    <AbsoluteFill>
      <Background frame={frame + 300} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center'}}>
        <div style={{fontFamily: fonts.headline, fontSize: 84, lineHeight: 0.94, color: COLORS.ink}}>Your community grows</div>
        <div style={{marginTop: 24, fontFamily: fonts.body, fontSize: 34, color: COLORS.muted, fontWeight: 700}}>10 referrals = 200 points</div>
      </div>

      <div style={{position: 'absolute', left: 0, right: 0, top: 300, bottom: 80}}>
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          {avatars.map((a) => (
            <line
              key={`${a.x}-${a.y}`}
              x1={WIDTH / 2}
              y1={HEIGHT / 2 + 40}
              x2={a.x}
              y2={a.y}
              stroke="rgba(101,201,255,0.34)"
              strokeWidth="3"
            />
          ))}
        </svg>
        <div style={{position: 'absolute', left: WIDTH / 2 - 80, top: HEIGHT / 2 - 40}}>
          <LogoBadge size={160} />
        </div>
        {avatars.map((a, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: a.x + Math.sin((local + i * 8) / 24) * 22 * a.speed,
              top: a.y + Math.cos((local + i * 7) / 20) * 18 * a.speed,
              width: 88,
              height: 88,
              borderRadius: 999,
              background: a.color,
              border: '6px solid rgba(255,255,255,0.75)',
              boxShadow: '0 18px 40px rgba(27,33,64,0.12)',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const FinalCta: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame;
  const holdOpacity = interpolate(local, [0, 30, 250, 295], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  const stackY = [280, 410, 540];
  return (
    <AbsoluteFill style={{opacity: holdOpacity}}>
      <Background frame={frame + 500} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 90, display: 'flex', justifyContent: 'center'}}>
        <div
          style={{
            transform: `scale(${interpolate(local, [0, 80], [0.8, 1.18], {extrapolateRight: 'clamp'})})`,
          }}
        >
          <LogoBadge size={156} />
        </div>
      </div>

      {[
        ['Points 500', COLORS.accentBlue],
        ['Invite friends', COLORS.accentPink],
        ['Mining active', COLORS.accentMint],
      ].map(([text, color], i) => (
        <Frost
          key={text}
          x={WIDTH / 2 - 280}
          y={stackY[i]}
          width={560}
          height={98}
          rotate={0}
          frame={local}
          delay={i * 10}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              gridTemplateColumns: '26px 1fr',
              alignItems: 'center',
              gap: 18,
              padding: '0 28px',
            }}
          >
            <div style={{width: 18, height: 18, borderRadius: 999, background: String(color)}} />
            <div style={{fontFamily: fonts.headline, fontSize: 32, color: COLORS.ink}}>{text}</div>
          </div>
        </Frost>
      ))}

      <div style={{position: 'absolute', left: 0, right: 0, bottom: 175, textAlign: 'center'}}>
        <div style={{fontFamily: fonts.headline, fontSize: 74, lineHeight: 0.95, color: COLORS.ink}}>Start earning with privacy</div>
        <div
          style={{
            marginTop: 28,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
            padding: '20px 34px',
            background: `linear-gradient(90deg, ${COLORS.accentBlue}, ${COLORS.accentPink})`,
            color: COLORS.ink,
            fontFamily: fonts.headline,
            fontSize: 30,
            boxShadow: '0 18px 44px rgba(101,201,255,0.24)',
            transform: `translateY(${Math.sin(local / 10) * 4}px)`,
          }}
        >
          Join Now
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxPastelSpec: React.FC = () => {
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={120}>
        <LaunchBurst />
      </Sequence>
      <Sequence from={120} durationInFrames={300}>
        <ReferralPointsGrid />
      </Sequence>
      <Sequence from={420} durationInFrames={180}>
        <CommunityConnections />
      </Sequence>
      <Sequence from={600} durationInFrames={300}>
        <FinalCta />
      </Sequence>
    </AbsoluteFill>
  );
};
