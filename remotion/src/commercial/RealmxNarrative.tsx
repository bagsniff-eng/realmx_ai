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
const logo = staticFile('le6jxytl.webp');

const COLORS = {
  darkA: '#0B0E14',
  darkB: '#111627',
  darkC: '#161228',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.72)',
  blue: '#65C9FF',
  purple: '#8A2BE2',
  red: '#FF5C73',
  teal: '#4CE4C5',
  border: 'rgba(255,255,255,0.12)',
  panel: 'rgba(255,255,255,0.08)',
  panelStrong: 'rgba(255,255,255,0.12)',
};

const fonts = {
  heading: '"Montserrat", "Inter", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
  mono: '"SFMono-Regular", "Cascadia Code", "Consolas", monospace',
};

const easeIn = (frame: number, delay = 0, durationInFrames = 24) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 18, stiffness: 110, mass: 0.9},
  });

const sceneOpacity = (frame: number, duration: number) =>
  interpolate(frame, [0, 10, duration - 10, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const DarkBackdrop: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill
    style={{
      backgroundImage: [
        `radial-gradient(circle at ${22 + Math.sin(frame / 60) * 3}% ${20 + Math.cos(frame / 70) * 2}%, rgba(138,43,226,0.18), transparent 26%)`,
        `radial-gradient(circle at ${76 + Math.sin(frame / 80) * 2}% ${74 + Math.cos(frame / 50) * 3}%, rgba(101,201,255,0.16), transparent 30%)`,
        `linear-gradient(160deg, ${COLORS.darkA}, ${COLORS.darkB} 55%, ${COLORS.darkC})`,
      ].join(','),
    }}
  />
);

const Particles: React.FC<{frame: number; count?: number}> = ({frame, count = 24}) => {
  const dots = Array.from({length: count}, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return {
      x: 180 + col * 300 + Math.sin(frame / 40 + i) * 22,
      y: 160 + row * 180 + Math.cos(frame / 46 + i) * 18,
      size: 3 + (i % 3),
      color: i % 2 === 0 ? 'rgba(101,201,255,0.55)' : 'rgba(138,43,226,0.45)',
    };
  });

  return (
    <>
      {dots.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            borderRadius: 999,
            background: dot.color,
            boxShadow: `0 0 12px ${dot.color}`,
          }}
        />
      ))}
    </>
  );
};

const CenterLogo: React.FC<{size: number; dark?: boolean}> = ({size, dark = true}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
      border: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark
        ? '0 30px 90px rgba(0,0,0,0.42), 0 0 40px rgba(138,43,226,0.18)'
        : '0 24px 70px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    }}
  >
    <Img src={logo} style={{width: '76%', height: '76%', objectFit: 'contain'}} />
  </div>
);

const CopyBlock: React.FC<{
  headline: string;
  subtext?: string;
  frame: number;
  align?: 'center' | 'left';
  maxWidth?: number;
}> = ({headline, subtext, frame, align = 'center', maxWidth = 1120}) => {
  const enter = easeIn(frame, 0, 26);
  return (
    <div
      style={{
        width: maxWidth,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 64,
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
          color: COLORS.text,
        }}
      >
        {headline}
      </div>
      {subtext ? (
        <div
          style={{
            marginTop: 20,
            fontFamily: fonts.body,
            fontSize: 30,
            lineHeight: 1.35,
            color: COLORS.muted,
            maxWidth: 950,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

const MiniBadge: React.FC<{label: string; color?: string}> = ({label, color = COLORS.blue}) => (
  <div
    style={{
      padding: '14px 22px',
      borderRadius: 999,
      border: `1px solid ${COLORS.border}`,
      background: 'rgba(255,255,255,0.06)',
      color,
      fontFamily: fonts.body,
      fontWeight: 700,
      fontSize: 26,
    }}
  >
    {label}
  </div>
);

const Card: React.FC<{
  left: number;
  top: number;
  width: number;
  height: number;
  frame: number;
  fromX?: number;
  fromY?: number;
  children: React.ReactNode;
}> = ({left, top, width, height, frame, fromX = 0, fromY = 0, children}) => {
  const enter = easeIn(frame, 0, 24);
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
        border: `1px solid ${COLORS.border}`,
        background: COLORS.panel,
        backdropFilter: 'blur(18px)',
        boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 150);
  const logoIn = easeIn(frame, 0, 30);
  const pulse = interpolate(frame, [20, 60, 90], [1, 1.03, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame} />
      <Particles frame={frame} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${interpolate(logoIn, [0, 1], [0.8, pulse])})`, opacity: logoIn}}>
          <CenterLogo size={230} />
        </div>
        <div
          style={{
            marginTop: 38,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 52,
            color: COLORS.text,
            opacity: easeIn(frame, 26, 24),
            transform: `translateY(${interpolate(easeIn(frame, 26, 24), [0, 1], [24, 0])}px)`,
          }}
        >
          Protect your Bitcoin. Mix, Mine, Maintain Privacy.
        </div>
        <div
          style={{
            marginTop: 32,
            fontFamily: fonts.body,
            fontSize: 32,
            color: COLORS.muted,
            opacity: easeIn(frame, 56, 24),
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Privacy isn’t optional. Bitcoin is pseudonymous, not anonymous.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 150);
  const nodes = Array.from({length: 24}, (_, i) => {
    const col = i % 6;
    const row = Math.floor(i / 6);
    return {
      x: 300 + col * 250 + Math.sin(frame / 35 + i) * 10,
      y: 250 + row * 150 + Math.cos(frame / 30 + i) * 12,
    };
  });
  const scanX = interpolate(frame, [18, 110], [360, 1500], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 30} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {nodes.map((node, i) =>
          nodes[i + 1] ? (
            <line key={i} x1={node.x} y1={node.y} x2={nodes[i + 1].x} y2={nodes[i + 1].y} stroke="rgba(255,255,255,0.16)" strokeWidth={2} />
          ) : null,
        )}
      </svg>
      {nodes.map((node, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: node.x - 7,
            top: node.y - 7,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.52)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: scanX,
          top: 320 + Math.sin(frame / 12) * 10,
          width: 120,
          height: 120,
          borderRadius: 999,
          border: `10px solid ${COLORS.red}`,
          boxShadow: '0 0 24px rgba(255,92,115,0.35)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: scanX + 84,
          top: 408,
          width: 90,
          height: 10,
          borderRadius: 999,
          background: COLORS.red,
          transform: 'rotate(44deg)',
          transformOrigin: 'left center',
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 120, display: 'flex', justifyContent: 'center'}}>
        <CopyBlock
          frame={frame}
          headline="Every transaction tells a story."
          subtext="Anyone can follow the links."
        />
      </div>
    </AbsoluteFill>
  );
};

const Scene3Introducing: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 240);
  const callouts = [
    {label: 'Dual login: Google & WalletConnect', iconA: 'G', iconB: 'W'},
    {label: 'Real-time mining dashboard', iconA: 'L', iconB: '▲'},
    {label: 'Fair referral rewards', iconA: 'R', iconB: '↔'},
  ];

  const orbitNodes = Array.from({length: 8}, (_, i) => {
    const angle = (Math.PI * 2 * i) / 8 + frame / 26;
    return {
      x: WIDTH / 2 + Math.cos(angle) * 260,
      y: HEIGHT / 2 + Math.sin(angle) * 160,
    };
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 90} />
      <Particles frame={frame + 40} count={18} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {orbitNodes.map((node, i) => (
          <line key={i} x1={WIDTH / 2} y1={HEIGHT / 2} x2={node.x} y2={node.y} stroke="rgba(101,201,255,0.22)" strokeWidth={2} />
        ))}
      </svg>
      {orbitNodes.map((node, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: node.x - 16,
            top: node.y - 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            background: i % 2 === 0 ? COLORS.blue : COLORS.purple,
            boxShadow: i % 2 === 0 ? '0 0 18px rgba(101,201,255,0.6)' : '0 0 18px rgba(138,43,226,0.6)',
          }}
        />
      ))}
      <div style={{position: 'absolute', left: WIDTH / 2 - 180, top: HEIGHT / 2 - 180}}>
        <CenterLogo size={360} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: WIDTH / 2 - 190,
          top: HEIGHT / 2 + 210,
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 42,
          color: COLORS.text,
        }}
      >
        RealmxAI Node
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center'}}>
        <CopyBlock
          frame={frame}
          headline="RealmxAI mixes your transactions, hides the trail, and rewards participation."
          maxWidth={1260}
        />
      </div>
      {callouts.map((callout, i) => {
        const local = frame - (50 + i * 55);
        const visible = interpolate(local, [0, 10, 38, 50], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) return null;
        return (
          <div
            key={callout.label}
            style={{
              position: 'absolute',
              left: 280,
              right: 280,
              bottom: 90,
              display: 'flex',
              justifyContent: 'center',
              opacity: visible,
              transform: `translateY(${interpolate(visible, [0, 1], [16, 0])}px)`,
            }}
          >
            <div
              style={{
                minWidth: 920,
                padding: '24px 30px',
                borderRadius: 28,
                border: `1px solid ${COLORS.border}`,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{display: 'flex', gap: 12}}>
                <MiniBadge label={callout.iconA} color={COLORS.blue} />
                <MiniBadge label={callout.iconB} color={COLORS.teal} />
              </div>
              <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: COLORS.text}}>
                {callout.label}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const DeviceFrame: React.FC<{frame: number; children: React.ReactNode}> = ({frame, children}) => (
  <Card left={490} top={155} width={940} height={770} frame={frame} fromY={40}>
    <div style={{padding: '28px 28px 34px 28px', width: '100%', height: '100%'}}>
      <div style={{display: 'flex', gap: 8, marginBottom: 18}}>
        {[COLORS.red, '#FFD166', COLORS.teal].map((c) => (
          <div key={c} style={{width: 12, height: 12, borderRadius: 999, background: c}} />
        ))}
      </div>
      <div style={{borderRadius: 28, width: '100%', height: 'calc(100% - 30px)', background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`}}>
        {children}
      </div>
    </div>
  </Card>
);

const Scene4Onboarding: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 300);
  const steps = [
    {title: 'Connect Wallet', text: 'Scan & sign.', label: 'WalletConnect', accent: COLORS.blue},
    {title: 'Sign in with Google', text: 'Verify identity securely.', label: 'Continue with Google', accent: COLORS.purple},
    {title: 'Activate Node Mining', text: 'Start mining.', label: 'Start Mining', accent: COLORS.teal},
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 120} />
      <Particles frame={frame + 20} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 72, display: 'flex', justifyContent: 'center'}}>
        <CopyBlock frame={frame} headline="Get started in three clear steps." />
      </div>
      {steps.map((step, i) => {
        const local = frame - i * 90;
        const visible = interpolate(local, [0, 10, 70, 90], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) return null;
        return (
          <div key={step.title} style={{opacity: visible}}>
            <DeviceFrame frame={Math.max(local, 0)}>
              <div style={{padding: '80px 90px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 64, color: COLORS.text}}>
                  {step.title}
                </div>
                <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 32, color: COLORS.muted}}>
                  {step.text}
                </div>
                {i === 0 ? (
                  <div style={{marginTop: 48, display: 'flex', alignItems: 'center', gap: 34}}>
                    <div style={{width: 156, height: 156, borderRadius: 20, background: 'rgba(255,255,255,0.92)', display: 'grid', placeItems: 'center'}}>
                      <div style={{width: 96, height: 96, border: '5px solid #111', borderRadius: 12}} />
                    </div>
                    <div style={{padding: '26px 32px', borderRadius: 24, background: 'rgba(101,201,255,0.12)', border: `1px solid ${COLORS.border}`, fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: COLORS.text}}>
                      {step.label}
                    </div>
                  </div>
                ) : null}
                {i === 1 ? (
                  <div style={{marginTop: 54, width: 420, height: 92, borderRadius: 999, background: 'rgba(138,43,226,0.16)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18}}>
                    <div style={{width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.95)', color: '#4285F4', display: 'grid', placeItems: 'center', fontFamily: fonts.heading, fontSize: 26, fontWeight: 700}}>G</div>
                    <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: COLORS.text}}>{step.label}</div>
                  </div>
                ) : null}
                {i === 2 ? (
                  <>
                    <div style={{marginTop: 48, width: 360, height: 92, borderRadius: 999, background: 'rgba(76,228,197,0.18)', border: `1px solid ${COLORS.border}`, display: 'grid', placeItems: 'center', fontFamily: fonts.body, fontWeight: 700, fontSize: 30, color: COLORS.text}}>
                      {step.label}
                    </div>
                    <div style={{marginTop: 34, width: 520, height: 18, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                      <div style={{width: `${interpolate(local, [0, 60], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.teal})`}} />
                    </div>
                  </>
                ) : null}
              </div>
            </DeviceFrame>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Scene5Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 240);
  const pointsIn = easeIn(frame, 14, 24);
  const barIn = easeIn(frame, 48, 24);
  const chartIn = easeIn(frame, 84, 24);
  const points = Math.round(interpolate(frame, [0, 80], [0, 2480], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 180} />
      <Particles frame={frame + 80} />
      <div style={{position: 'absolute', left: 360, top: 160}}>
        <Card left={0} top={0} width={1200} height={680} frame={frame} fromY={30}>
          <div style={{padding: '52px 56px'}}>
            <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 34, color: COLORS.muted, textTransform: 'uppercase'}}>
              Real-time dashboard
            </div>
            <div style={{marginTop: 18, fontFamily: fonts.heading, fontWeight: 700, fontSize: 60, color: COLORS.text}}>
              Watch your privacy grow in real time.
            </div>
            <div style={{marginTop: 48, opacity: pointsIn}}>
              <div style={{fontFamily: fonts.body, fontSize: 26, color: COLORS.muted}}>Current Mix Points</div>
              <div style={{marginTop: 12, fontFamily: fonts.heading, fontWeight: 700, fontSize: 108, color: COLORS.text}}>
                {points}
              </div>
            </div>
            <div style={{marginTop: 30, opacity: barIn}}>
              <div style={{fontFamily: fonts.body, fontSize: 26, color: COLORS.muted}}>Node uptime</div>
              <div style={{marginTop: 16, width: 780, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                <div style={{width: `${interpolate(barIn, [0, 1], [0, 86])}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.blue})`}} />
              </div>
            </div>
            <div style={{marginTop: 38, opacity: chartIn}}>
              <div style={{fontFamily: fonts.body, fontSize: 26, color: COLORS.muted}}>Live activity</div>
              <svg width="760" height="180" style={{marginTop: 18}}>
                <polyline
                  fill="none"
                  stroke={COLORS.blue}
                  strokeWidth="6"
                  points={`0,160 120,148 210,126 320,118 430,92 560,76 670,54 760,32`}
                  style={{strokeDasharray: 1200, strokeDashoffset: interpolate(chartIn, [0, 1], [1200, 0])}}
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </AbsoluteFill>
  );
};

const Scene6Referral: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 240);
  const codeVisible = frame < 120;

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 220} />
      <Particles frame={frame + 30} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {codeVisible ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{padding: '26px 36px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: `1px solid ${COLORS.border}`, fontFamily: fonts.mono, fontSize: 44, color: COLORS.text}}>
              RL-12345-AI
            </div>
            <div style={{marginTop: 22, fontFamily: fonts.body, fontWeight: 700, fontSize: 26, color: COLORS.muted}}>
              * One code per user; no loopholes.
            </div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
              {[COLORS.blue, COLORS.purple].map((c, i) => (
                <div key={i} style={{width: 130, height: 130, borderRadius: 999, background: c, boxShadow: `0 0 24px ${c}`}} />
              ))}
              <div style={{width: 180, height: 6, borderRadius: 999, background: COLORS.text}} />
            </div>
            <div style={{marginTop: 42, fontFamily: fonts.heading, fontWeight: 700, fontSize: 60, color: COLORS.text}}>
              Invite friends. Earn together.
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Scene7Community: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 240);
  const avatars = Array.from({length: 10}, (_, i) => {
    const angle = (Math.PI * 2 * i) / 10 + frame / 42;
    return {
      x: WIDTH / 2 + Math.cos(angle) * 310,
      y: HEIGHT / 2 + Math.sin(angle) * 190,
      color: i % 3 === 0 ? COLORS.blue : i % 3 === 1 ? COLORS.purple : COLORS.teal,
    };
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 260} />
      <Particles frame={frame + 60} count={28} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {avatars.map((a, i) => (
          <line key={i} x1={WIDTH / 2} y1={HEIGHT / 2} x2={a.x} y2={a.y} stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: WIDTH / 2 - 120, top: HEIGHT / 2 - 120}}>
        <CenterLogo size={240} />
      </div>
      {avatars.map((avatar, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: avatar.x - 40,
            top: avatar.y - 40,
            width: 80,
            height: 80,
            borderRadius: 999,
            background: avatar.color,
            boxShadow: `0 0 24px ${avatar.color}`,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', justifyContent: 'center'}}>
        <CopyBlock
          frame={frame}
          headline="Your privacy fuels our network."
          subtext="Earn points, climb ranks, unlock perks."
        />
      </div>
    </AbsoluteFill>
  );
};

const Scene8Security: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 180);
  const items = [
    {label: 'TLS', color: COLORS.blue},
    {label: '2FA', color: COLORS.purple},
    {label: 'GDPR', color: COLORS.teal},
  ];

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 320} />
      <Particles frame={frame + 20} />
      <div style={{position: 'absolute', left: WIDTH / 2 - 120, top: 180}}>
        <div
          style={{
            width: 240,
            height: 280,
            clipPath: 'polygon(50% 0%, 88% 16%, 88% 58%, 50% 100%, 12% 58%, 12% 16%)',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              border: `6px solid ${COLORS.text}`,
              position: 'relative',
            }}
          >
            <div style={{position: 'absolute', left: 28, top: 22, width: 28, height: 32, borderRadius: '14px 14px 8px 8px', border: `6px solid ${COLORS.text}`, borderBottom: 'none'}} />
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 500, display: 'flex', justifyContent: 'center', gap: 18}}>
        {items.map((item, i) => {
          const visible = easeIn(frame, 20 + i * 26, 20);
          return (
            <div
              key={item.label}
              style={{
                opacity: visible,
                transform: `translateY(${interpolate(visible, [0, 1], [24, 0])}px)`,
              }}
            >
              <MiniBadge label={item.label} color={item.color} />
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 96, display: 'flex', justifyContent: 'center'}}>
        <CopyBlock
          frame={frame}
          headline="Built with industry best practices."
          subtext="Secure connections, encrypted data, compliant with privacy regulations."
          maxWidth={1180}
        />
      </div>
    </AbsoluteFill>
  );
};

const Scene9Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = sceneOpacity(frame, 210);
  const logoIn = easeIn(frame, 0, 28);
  const buttonIn = easeIn(frame, 48, 24);
  const pulse = interpolate(frame, [70, 110, 150], [1, 1.03, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity: fade}}>
      <DarkBackdrop frame={frame + 400} />
      <Particles frame={frame + 30} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${interpolate(logoIn, [0, 1], [0.86, 1])})`, opacity: logoIn}}>
          <CenterLogo size={250} />
        </div>
        <div style={{marginTop: 40, fontFamily: fonts.heading, fontWeight: 700, fontSize: 62, color: COLORS.text, textAlign: 'center'}}>
          Join the private future of Bitcoin.
        </div>
        <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 32, color: COLORS.muted}}>
          Start mixing. Start mining. Start today.
        </div>
        <div
          style={{
            marginTop: 34,
            width: 320,
            height: 84,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.blue})`,
            boxShadow: '0 0 28px rgba(101,201,255,0.28)',
            color: COLORS.text,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            opacity: buttonIn,
            transform: `scale(${pulse})`,
          }}
        >
          Get Started
          <span style={{fontSize: 38}}>→</span>
        </div>
        <div style={{marginTop: 28, fontFamily: fonts.body, fontSize: 28, color: COLORS.muted, maxWidth: 940, textAlign: 'center', opacity: buttonIn}}>
          Become part of the RealmxAI community and protect your financial freedom.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxNarrative: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: fonts.body}}>
      <Sequence from={0} durationInFrames={150}>
        <Scene1Opening />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <Scene2Problem />
      </Sequence>
      <Sequence from={300} durationInFrames={240}>
        <Scene3Introducing />
      </Sequence>
      <Sequence from={540} durationInFrames={300}>
        <Scene4Onboarding />
      </Sequence>
      <Sequence from={840} durationInFrames={240}>
        <Scene5Dashboard />
      </Sequence>
      <Sequence from={1080} durationInFrames={240}>
        <Scene6Referral />
      </Sequence>
      <Sequence from={1320} durationInFrames={240}>
        <Scene7Community />
      </Sequence>
      <Sequence from={1560} durationInFrames={180}>
        <Scene8Security />
      </Sequence>
      <Sequence from={1740} durationInFrames={210}>
        <Scene9Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
