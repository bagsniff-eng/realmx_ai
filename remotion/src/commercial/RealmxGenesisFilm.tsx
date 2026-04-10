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
const TOTAL = 1050;
const logo = staticFile('le6jxytl.webp');

const COLORS = {
  bg: '#0E0A18',
  bgSoft: '#171127',
  purple: '#8A2BE2',
  purpleSoft: 'rgba(138,43,226,0.18)',
  turquoise: '#38BDAF',
  turquoiseSoft: 'rgba(56,189,175,0.18)',
  white: '#F6F2FF',
  muted: '#B5AFD1',
  faint: 'rgba(246,242,255,0.08)',
  border: 'rgba(246,242,255,0.14)',
};

const fonts = {
  heading: '"Inter", "Segoe UI", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
};

const springIn = (frame: number, delay = 0, durationInFrames = 28) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 18, stiffness: 120, mass: 0.95},
  });

const Background: React.FC<{frame: number; dim?: boolean}> = ({frame, dim = false}) => {
  const drift = interpolate(frame, [0, TOTAL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dim ? '#09070F' : COLORS.bg,
        backgroundImage: [
          `radial-gradient(circle at ${20 + drift * 10}% ${20 + drift * 4}%, rgba(138,43,226,0.34), transparent 26%)`,
          `radial-gradient(circle at ${80 - drift * 8}% ${75 - drift * 4}%, rgba(56,189,175,0.2), transparent 28%)`,
          'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
        ].join(','),
      }}
    />
  );
};

const CenterGlow: React.FC<{size: number; color: string; opacity?: number}> = ({
  size,
  color,
  opacity = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      filter: `blur(${size / 3}px)`,
      opacity,
    }}
  />
);

const LogoBadge: React.FC<{size: number; glow?: boolean}> = ({size, glow = true}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: 'rgba(8,8,12,0.9)',
      border: `1px solid ${COLORS.border}`,
      boxShadow: glow
        ? '0 0 0 1px rgba(138,43,226,0.24), 0 30px 80px rgba(0,0,0,0.45), 0 0 40px rgba(138,43,226,0.26)'
        : '0 24px 60px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}
  >
    <Img src={logo} style={{width: '78%', height: '78%', objectFit: 'contain'}} />
  </div>
);

const TopLabel: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: 'absolute',
      top: 52,
      left: 62,
      fontFamily: fonts.heading,
      fontSize: 28,
      fontWeight: 700,
      color: COLORS.white,
      letterSpacing: '-0.03em',
    }}
  >
    {text}
  </div>
);

const CounterNumber: React.FC<{frame: number; from: number; to: number; suffix?: string}> = ({
  frame,
  from,
  to,
  suffix = '',
}) => {
  const value = Math.round(
    interpolate(frame, [0, 44], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};

const GenesisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = interpolate(springIn(frame, 6, 40), [0, 1], [0.74, 1]);
  const ringScale = interpolate(springIn(frame, 0, 48), [0, 1], [0.65, 1]);
  const textY = interpolate(springIn(frame, 24, 34), [0, 1], [40, 0]);
  const fade = interpolate(frame, [0, 18, 80], [0, 1, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <Background frame={frame} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 420,
            height: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${ringScale})`,
          }}
        >
          <CenterGlow size={280} color="rgba(138,43,226,0.2)" />
          <CenterGlow size={220} color="rgba(56,189,175,0.12)" opacity={0.8} />
          {[0, 1, 2].map((index) => {
            const size = 200 + index * 54;
            const rotate = frame * (0.5 + index * 0.18) * (index % 2 === 0 ? 1 : -1);
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  border: `2px solid ${index === 1 ? 'rgba(56,189,175,0.65)' : 'rgba(138,43,226,0.72)'}`,
                  boxShadow:
                    index === 1
                      ? '0 0 34px rgba(56,189,175,0.32)'
                      : '0 0 34px rgba(138,43,226,0.34)',
                  transform: `rotate(${rotate}deg) scaleX(${1 + index * 0.08}) scaleY(${1 - index * 0.03})`,
                }}
              />
            );
          })}
          <div style={{transform: `scale(${logoScale})`}}>
            <LogoBadge size={150} />
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: fonts.heading,
            fontSize: 62,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: '-0.05em',
            transform: `translateY(${textY}px)`,
            opacity: springIn(frame, 26, 30),
          }}
        >
          Enhancing Bitcoin privacy
        </div>
      </div>
    </AbsoluteFill>
  );
};

const NetworkCounter: React.FC<{
  frame: number;
  delay: number;
  top: number;
  left: number;
  label: string;
  value: string;
}> = ({frame, delay, top, left, label, value}) => {
  const enter = springIn(frame, delay, 34);
  const y = interpolate(enter, [0, 1], [60, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width: 380,
        padding: '22px 26px',
        borderRadius: 26,
        background: 'rgba(14,10,24,0.62)',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 20px 50px rgba(0,0,0,0.34)',
        backdropFilter: 'blur(12px)',
        transform: `translateY(${y}px) scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 18,
          fontWeight: 500,
          color: COLORS.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: fonts.heading,
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.white,
          letterSpacing: '-0.04em',
        }}
      >
        {value}
      </div>
    </div>
  );
};

const NetworkForgeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(springIn(frame, 0, 210), [0, 1], [0.86, 1.12]);
  const shiftX = interpolate(springIn(frame, 0, 210), [0, 1], [-80, 50]);
  const shiftY = interpolate(springIn(frame, 0, 210), [0, 1], [40, -30]);

  const nodes = Array.from({length: 18}, (_, index) => {
    const baseX = 180 + (index % 6) * 290;
    const baseY = 170 + Math.floor(index / 6) * 220;
    const depth = 0.78 + (index % 5) * 0.1;
    const wobble = Math.sin(frame / 18 + index) * 24;
    return {
      x: baseX + wobble,
      y: baseY + Math.cos(frame / 22 + index) * 22,
      size: 10 + (index % 4) * 5,
      depth,
    };
  });

  return (
    <AbsoluteFill>
      <Background frame={frame + 80} />
      <TopLabel text="RealmxAI Network" />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shiftX}px, ${shiftY}px) scale(${push})`,
          transformOrigin: 'center',
        }}
      >
        <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
          {nodes.map((node, index) =>
            nodes.slice(index + 1, index + 3).map((next, connectionIndex) => (
              <line
                key={`${index}-${connectionIndex}`}
                x1={node.x}
                y1={node.y}
                x2={next.x}
                y2={next.y}
                stroke={connectionIndex === 0 ? 'rgba(138,43,226,0.4)' : 'rgba(56,189,175,0.3)'}
                strokeWidth={1.4}
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
              background: index % 3 === 0 ? COLORS.turquoise : COLORS.purple,
              boxShadow:
                index % 3 === 0
                  ? '0 0 20px rgba(56,189,175,0.7)'
                  : '0 0 20px rgba(138,43,226,0.74)',
              transform: `scale(${node.depth})`,
            }}
          />
        ))}
      </div>
      <NetworkCounter frame={frame} delay={16} top={124} left={128} label="Network live" value="4 K active nodes" />
      <NetworkCounter frame={frame} delay={76} top={356} left={1020} label="Points flowing" value="14 M points earned" />
      <NetworkCounter frame={frame} delay={136} top={690} left={230} label="Community reach" value="100 K referrals" />
    </AbsoluteFill>
  );
};

const DashboardPanel: React.FC<{
  frame: number;
  delay: number;
  x: number;
  title: string;
  prefix?: string;
  suffix?: string;
  valueFrom: number;
  valueTo: number;
  active?: boolean;
}> = ({frame, delay, x, title, prefix = '', suffix = '', valueFrom, valueTo, active = false}) => {
  const enter = springIn(frame, delay, 34);
  const y = interpolate(enter, [0, 1], [80, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: 130,
        width: 370,
        height: 290,
        borderRadius: 30,
        background: 'rgba(11,13,22,0.7)',
        border: `1px solid ${active ? 'rgba(138,43,226,0.4)' : COLORS.border}`,
        boxShadow: '0 24px 60px rgba(0,0,0,0.32)',
        transform: `translateY(${y}px) scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        opacity: enter,
      }}
    >
      <div style={{padding: '34px 34px 0'}}>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.muted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: fonts.heading,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: '-0.05em',
          }}
        >
          {prefix}
          <CounterNumber frame={Math.max(0, frame - delay - 10)} from={valueFrom} to={valueTo} suffix={suffix} />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 34,
          right: 34,
          bottom: 26,
          height: 4,
          borderRadius: 999,
          background: active ? `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.turquoise})` : COLORS.faint,
          boxShadow: active ? '0 0 18px rgba(138,43,226,0.5)' : 'none',
        }}
      />
    </div>
  );
};

const DashboardShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = springIn(frame, 0, 44);
  const cardScale = interpolate(enter, [0, 1], [0.84, 1]);
  const cardY = interpolate(enter, [0, 1], [110, 0]);

  return (
    <AbsoluteFill>
      <Background frame={frame + 240} />
      <TopLabel text="RealmxAI Dashboard" />
      <div
        style={{
          position: 'absolute',
          left: 180,
          top: 170,
          width: 1560,
          height: 610,
          borderRadius: 42,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.42)',
          backdropFilter: 'blur(18px)',
          transform: `translateY(${cardY}px) scale(${cardScale})`,
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 46,
            top: 40,
            fontFamily: fonts.heading,
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: '-0.04em',
          }}
        >
          Live privacy operations
        </div>
        <div
          style={{
            position: 'absolute',
            left: 46,
            top: 96,
            fontFamily: fonts.body,
            fontSize: 22,
            fontWeight: 500,
            color: COLORS.muted,
          }}
        >
          Track activity, rewards, and network growth in one view.
        </div>
        <DashboardPanel frame={frame} delay={14} x={58} title="Session Time" valueFrom={0} valueTo={148} suffix=" min" active />
        <DashboardPanel frame={frame} delay={34} x={472} title="Points" valueFrom={0} valueTo={25840} />
        <DashboardPanel frame={frame} delay={54} x={886} title="Referrals" valueFrom={0} valueTo={342} />
      </div>
    </AbsoluteFill>
  );
};

const GlobeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = springIn(frame, 0, 40);
  const scale = interpolate(enter, [0, 1], [0.88, 1]);
  const rotate = interpolate(springIn(frame, 0, 210), [0, 1], [-20, 18]);
  const orbit = interpolate(frame, [0, 210], [0, 360], {
    extrapolateRight: 'clamp',
  });

  const nodes = [
    [250, 220],
    [420, 160],
    [540, 280],
    [690, 190],
    [790, 320],
    [980, 240],
    [1160, 180],
    [1290, 290],
    [1440, 210],
  ];

  return (
    <AbsoluteFill>
      <Background frame={frame + 500} />
      <TopLabel text="Global privacy layer" />
      <div
        style={{
          position: 'absolute',
          left: 270,
          top: 165,
          width: 1380,
          height: 680,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px solid rgba(246,242,255,0.08)',
            background:
              'radial-gradient(circle at 40% 40%, rgba(138,43,226,0.12), rgba(14,10,24,0.18) 50%, rgba(14,10,24,0.55) 75%)',
            boxShadow: '0 0 100px rgba(138,43,226,0.16)',
            overflow: 'hidden',
          }}
        >
          <svg width="1380" height="680" style={{position: 'absolute', inset: 0}}>
            <ellipse cx="690" cy="340" rx="620" ry="250" fill="none" stroke="rgba(246,242,255,0.08)" strokeWidth="1.2" />
            <ellipse cx="690" cy="340" rx="510" ry="190" fill="none" stroke="rgba(56,189,175,0.1)" strokeWidth="1.2" />
            <ellipse cx="690" cy="340" rx="350" ry="130" fill="none" stroke="rgba(138,43,226,0.12)" strokeWidth="1.2" />
            <path d="M180 380 C340 260, 520 250, 760 340 S1150 430, 1280 310" fill="none" stroke="rgba(246,242,255,0.08)" strokeWidth="1.2" />
            <path d="M160 250 C340 330, 580 390, 740 300 S1080 180, 1240 270" fill="none" stroke="rgba(246,242,255,0.08)" strokeWidth="1.2" />
          </svg>
          {nodes.map(([x, y], index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: index % 2 === 0 ? COLORS.turquoise : COLORS.purple,
                boxShadow:
                  index % 2 === 0
                    ? '0 0 22px rgba(56,189,175,0.75)'
                    : '0 0 22px rgba(138,43,226,0.8)',
                transform: `scale(${1 + Math.sin(frame / 8 + index) * 0.22})`,
              }}
            />
          ))}
          <div
            style={{
              position: 'absolute',
              left: 690 + Math.cos((orbit * Math.PI) / 180) * 500 - 120,
              top: 340 + Math.sin((orbit * Math.PI) / 180) * 200 - 120,
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: '4px solid rgba(56,189,175,0.85)',
              boxShadow: '0 0 50px rgba(56,189,175,0.28)',
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 186,
          width: 370,
          padding: '24px 28px',
          borderRadius: 28,
          background: 'rgba(8,8,14,0.55)',
          border: `1px solid ${COLORS.border}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{fontFamily: fonts.body, fontSize: 18, fontWeight: 500, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.08em'}}>
          Live sync
        </div>
        <div style={{marginTop: 10, fontFamily: fonts.heading, fontSize: 50, fontWeight: 700, color: COLORS.white}}>
          <CounterNumber frame={frame} from={0} to={4000} suffix=" nodes" />
        </div>
        <div style={{marginTop: 12, fontFamily: fonts.body, fontSize: 24, fontWeight: 500, color: COLORS.muted}}>
          pulses across the network
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = springIn(frame, 0, 40);
  const scaleIn = interpolate(enter, [0, 1], [0.82, 1]);
  const holdScale = interpolate(frame, [0, 150, 240], [scaleIn, 1, 0.94], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 18, 210, 240], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textEnter = springIn(frame, 18, 30);

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 760} dim />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${holdScale})`,
        }}
      >
        <CenterGlow size={340} color="rgba(138,43,226,0.16)" />
        <LogoBadge size={186} />
        <div
          style={{
            marginTop: 32,
            fontFamily: fonts.heading,
            fontSize: 60,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: '-0.04em',
            transform: `translateY(${interpolate(textEnter, [0, 1], [28, 0])}px)`,
            opacity: textEnter,
          }}
        >
          Join the privacy revolution
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxGenesisFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={0} durationInFrames={90}>
        <GenesisScene />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <NetworkForgeScene />
      </Sequence>
      <Sequence from={300} durationInFrames={300}>
        <DashboardShowcaseScene />
      </Sequence>
      <Sequence from={600} durationInFrames={210}>
        <GlobeScene />
      </Sequence>
      <Sequence from={810} durationInFrames={240}>
        <FinaleScene />
      </Sequence>
    </AbsoluteFill>
  );
};
