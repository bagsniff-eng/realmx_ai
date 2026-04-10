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
  darkC: '#171329',
  white: '#FFFFFF',
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

const quickSpring = (frame: number, delay = 0, durationInFrames = 16) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 20, stiffness: 210, mass: 0.82},
  });

const softSpring = (frame: number, delay = 0, durationInFrames = 22) =>
  spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    durationInFrames,
    config: {damping: 18, stiffness: 150, mass: 0.9},
  });

const sceneFade = (frame: number, duration: number) =>
  interpolate(frame, [0, 6, duration - 6, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const Background: React.FC<{frame: number}> = ({frame}) => (
  <AbsoluteFill
    style={{
      backgroundImage: [
        `radial-gradient(circle at ${24 + Math.sin(frame / 50) * 2}% ${22 + Math.cos(frame / 60) * 2}%, rgba(138,43,226,0.18), transparent 28%)`,
        `radial-gradient(circle at ${78 + Math.sin(frame / 70) * 2}% ${76 + Math.cos(frame / 40) * 2}%, rgba(101,201,255,0.14), transparent 32%)`,
        `linear-gradient(160deg, ${COLORS.darkA}, ${COLORS.darkB} 55%, ${COLORS.darkC})`,
      ].join(','),
    }}
  />
);

const ParticleField: React.FC<{frame: number; count?: number}> = ({frame, count = 18}) => {
  const items = Array.from({length: count}, (_, i) => ({
    x: 130 + (i % 6) * 320 + Math.sin(frame / 34 + i) * 14,
    y: 120 + Math.floor(i / 6) * 250 + Math.cos(frame / 39 + i) * 14,
    size: 3 + (i % 3),
    color: i % 2 === 0 ? 'rgba(101,201,255,0.54)' : 'rgba(138,43,226,0.42)',
  }));

  return (
    <>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.size,
            height: item.size,
            borderRadius: 999,
            background: item.color,
            boxShadow: `0 0 12px ${item.color}`,
          }}
        />
      ))}
    </>
  );
};

const LogoCard: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: 'rgba(255,255,255,0.08)',
      border: `1px solid ${COLORS.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      boxShadow: '0 26px 80px rgba(0,0,0,0.42), 0 0 28px rgba(138,43,226,0.18)',
    }}
  >
    <Img src={logo} style={{width: '76%', height: '76%', objectFit: 'contain'}} />
  </div>
);

const CenterCopy: React.FC<{
  headline: string;
  subtext?: string;
  frame: number;
  maxWidth?: number;
}> = ({headline, subtext, frame, maxWidth = 1200}) => {
  const enter = quickSpring(frame, 0, 16);
  return (
    <div
      style={{
        maxWidth,
        textAlign: 'center',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 60,
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
          color: COLORS.white,
        }}
      >
        {headline}
      </div>
      {subtext ? (
        <div
          style={{
            marginTop: 16,
            fontFamily: fonts.body,
            fontSize: 28,
            lineHeight: 1.35,
            color: COLORS.muted,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

const Pill: React.FC<{label: string; color?: string; mono?: boolean}> = ({label, color = COLORS.blue, mono = false}) => (
  <div
    style={{
      padding: '16px 24px',
      borderRadius: 999,
      border: `1px solid ${COLORS.border}`,
      background: 'rgba(255,255,255,0.08)',
      color,
      fontFamily: mono ? fonts.mono : fonts.body,
      fontWeight: 700,
      fontSize: 28,
    }}
  >
    {label}
  </div>
);

const GlassCard: React.FC<{
  frame: number;
  left: number;
  top: number;
  width: number;
  height: number;
  fromX?: number;
  fromY?: number;
  children: React.ReactNode;
}> = ({frame, left, top, width, height, fromX = 0, fromY = 0, children}) => {
  const enter = quickSpring(frame, 0, 16);
  return (
    <div
      style={{
        position: 'absolute',
        left: left + interpolate(enter, [0, 1], [fromX, 0]),
        top: top + interpolate(enter, [0, 1], [fromY, 0]),
        width,
        height,
        opacity: enter,
        transform: `scale(${interpolate(enter, [0, 1], [0.97, 1])})`,
        borderRadius: 30,
        border: `1px solid ${COLORS.border}`,
        background: COLORS.panel,
        boxShadow: '0 24px 70px rgba(0,0,0,0.34)',
        overflow: 'hidden',
        backdropFilter: 'blur(18px)',
      }}
    >
      {children}
    </div>
  );
};

const Scene1Opening: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 90);
  const logoIn = quickSpring(frame, 0, 14);
  const taglineIn = quickSpring(frame, 18, 14);
  const bodyIn = softSpring(frame, 42, 18);

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame} />
      <ParticleField frame={frame} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{transform: `scale(${interpolate(logoIn, [0, 1], [0.8, 1])})`, opacity: logoIn}}>
          <LogoCard size={190} />
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 52,
            color: COLORS.white,
            textAlign: 'center',
            opacity: taglineIn,
            transform: `translateY(${interpolate(taglineIn, [0, 1], [22, 0])}px)`,
          }}
        >
          Protect your Bitcoin. Mix, Mine, Maintain Privacy.
        </div>
        <div
          style={{
            marginTop: 18,
            maxWidth: 930,
            fontFamily: fonts.body,
            fontSize: 28,
            lineHeight: 1.35,
            color: COLORS.muted,
            textAlign: 'center',
            opacity: bodyIn,
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
  const opacity = sceneFade(frame, 90);
  const nodes = Array.from({length: 20}, (_, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    return {
      x: 300 + col * 320 + Math.sin(frame / 20 + i) * 8,
      y: 220 + row * 170 + Math.cos(frame / 24 + i) * 10,
    };
  });
  const scanX = interpolate(frame, [0, 30], [360, 1360], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const line1 = quickSpring(frame, 28, 12);
  const line2 = quickSpring(frame, 55, 12);

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 80} />
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
            left: node.x - 8,
            top: node.y - 8,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.55)',
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: scanX,
          top: 320 + Math.sin(frame / 10) * 8,
          width: 110,
          height: 110,
          borderRadius: 999,
          border: `9px solid ${COLORS.red}`,
          boxShadow: '0 0 20px rgba(255,92,115,0.35)',
          opacity: interpolate(frame, [0, 55, 75], [1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: scanX + 78,
          top: 398,
          width: 82,
          height: 8,
          borderRadius: 999,
          background: COLORS.red,
          transform: 'rotate(44deg)',
          transformOrigin: 'left center',
          opacity: interpolate(frame, [0, 55, 75], [1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 118, display: 'flex', justifyContent: 'center'}}>
        {frame < 52 ? (
          <div style={{opacity: line1}}>
            <CenterCopy headline="Every transaction tells a story." frame={frame - 28} />
          </div>
        ) : (
          <div style={{opacity: line2}}>
            <CenterCopy headline="Anyone can follow the links." frame={frame - 55} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 120);
  const hubIn = quickSpring(frame, 0, 16);
  const headlineIn = quickSpring(frame, 18, 12);

  const orbit = Array.from({length: 6}, (_, i) => {
    const angle = (Math.PI * 2 * i) / 6 + frame / 16;
    return {
      x: WIDTH / 2 + Math.cos(angle) * 210,
      y: 530 + Math.sin(angle) * 130,
      color: i % 2 === 0 ? COLORS.blue : COLORS.purple,
    };
  });

  const callouts = [
    {label: 'Google + WalletConnect', icon: 'G + W'},
    {label: 'Live mining & mix points', icon: '↗'},
    {label: 'Earn together, no loopholes.', icon: '↔'},
  ];

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 120} />
      <ParticleField frame={frame + 40} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {orbit.map((point, i) => (
          <line key={i} x1={WIDTH / 2} y1={530} x2={point.x} y2={point.y} stroke="rgba(101,201,255,0.22)" strokeWidth={2} />
        ))}
      </svg>
      {orbit.map((point, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: point.x - 14,
            top: point.y - 14,
            width: 28,
            height: 28,
            borderRadius: 999,
            background: point.color,
            boxShadow: `0 0 18px ${point.color}`,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: WIDTH / 2 - 145, top: 385, opacity: hubIn}}>
        <LogoCard size={290} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 108,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 58,
          color: COLORS.white,
          opacity: headlineIn,
        }}
      >
        Mix. Hide. Reward.
      </div>
      {callouts.map((item, i) => {
        const local = frame - (48 + i * 18);
        const visible = interpolate(local, [0, 6, 14, 22], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) return null;
        return (
          <div
            key={item.label}
            style={{
              position: 'absolute',
              left: 430,
              right: 430,
              bottom: 90,
              display: 'flex',
              justifyContent: 'center',
              opacity: visible,
              transform: `translateY(${interpolate(visible, [0, 1], [14, 0])}px)`,
            }}
          >
            <div
              style={{
                minWidth: 760,
                padding: '20px 26px',
                borderRadius: 999,
                border: `1px solid ${COLORS.border}`,
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <Pill label={item.icon} color={COLORS.blue} />
              <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 28, color: COLORS.white}}>
                {item.label}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const LaptopFrame: React.FC<{frame: number; children: React.ReactNode}> = ({frame, children}) => (
  <GlassCard frame={frame} left={500} top={170} width={920} height={650} fromY={28}>
    <div style={{padding: 24, height: '100%'}}>
      <div style={{display: 'flex', gap: 8, marginBottom: 18}}>
        {[COLORS.red, '#FFD166', COLORS.teal].map((c) => (
          <div key={c} style={{width: 12, height: 12, borderRadius: 999, background: c}} />
        ))}
      </div>
      <div style={{borderRadius: 24, border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.04)', height: 'calc(100% - 22px)'}}>
        {children}
      </div>
    </div>
  </GlassCard>
);

const Scene4Onboarding: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 150);
  const steps = [
    {title: 'Connect Wallet', sub: 'Scan & sign.', type: 'wallet', start: 0},
    {title: 'Sign in with Google', sub: 'Continue securely.', type: 'google', start: 45},
    {title: 'Start Node Mining', sub: 'Turn privacy on.', type: 'mining', start: 90},
  ] as const;

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 160} />
      <ParticleField frame={frame + 20} />
      {steps.map((step) => {
        const local = frame - step.start;
        const visible = interpolate(local, [0, 6, 32, 40], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (visible <= 0) return null;
        return (
          <div key={step.title} style={{opacity: visible}}>
            <LaptopFrame frame={Math.max(local, 0)}>
              <div style={{padding: '72px 80px'}}>
                <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 58, color: COLORS.white}}>
                  {step.title}
                </div>
                <div style={{marginTop: 14, fontFamily: fonts.body, fontSize: 28, color: COLORS.muted}}>
                  {step.sub}
                </div>
                {step.type === 'wallet' ? (
                  <div style={{marginTop: 42, display: 'flex', alignItems: 'center', gap: 34}}>
                    <div style={{width: 146, height: 146, borderRadius: 18, background: 'rgba(255,255,255,0.94)', display: 'grid', placeItems: 'center'}}>
                      <div style={{width: 88, height: 88, border: '5px solid #111', borderRadius: 10}} />
                    </div>
                    <Pill label="WalletConnect QR" color={COLORS.blue} />
                  </div>
                ) : null}
                {step.type === 'google' ? (
                  <div style={{marginTop: 48, width: 420, height: 86, borderRadius: 999, background: 'rgba(138,43,226,0.16)', border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
                    <div style={{width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.96)', color: '#4285F4', display: 'grid', placeItems: 'center', fontFamily: fonts.heading, fontWeight: 700, fontSize: 24}}>G</div>
                    <div style={{fontFamily: fonts.body, fontWeight: 700, fontSize: 28, color: COLORS.white}}>Continue with Google</div>
                  </div>
                ) : null}
                {step.type === 'mining' ? (
                  <>
                    <div style={{marginTop: 46, width: 360, height: 86, borderRadius: 999, background: 'rgba(101,201,255,0.18)', border: `1px solid ${COLORS.border}`, display: 'grid', placeItems: 'center', fontFamily: fonts.body, fontWeight: 700, fontSize: 28, color: COLORS.white}}>
                      Start Mining
                    </div>
                    <div style={{marginTop: 28, width: 560, height: 18, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                      <div style={{width: `${interpolate(local, [0, 24], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.teal})`}} />
                    </div>
                  </>
                ) : null}
              </div>
            </LaptopFrame>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 92,
          textAlign: 'center',
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 52,
          color: COLORS.white,
          opacity: quickSpring(frame, 116, 12),
        }}
      >
        It takes under 15 seconds.
      </div>
    </AbsoluteFill>
  );
};

const Scene5Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 150);
  const cardIn = quickSpring(frame, 0, 16);
  const statsIn = quickSpring(frame, 12, 10);
  const uptimeIn = quickSpring(frame, 24, 10);
  const rankIn = quickSpring(frame, 36, 10);
  const copyIn = quickSpring(frame, 30, 10);
  const points = Math.round(interpolate(frame, [0, 90], [1800, 2480], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 220} />
      <ParticleField frame={frame + 40} />
      <div style={{opacity: cardIn}}>
        <GlassCard frame={frame} left={360} top={170} width={1200} height={620} fromX={90}>
          <div style={{padding: '44px 48px'}}>
            <div style={{display: 'flex', gap: 48}}>
              <div style={{opacity: statsIn, width: 330}}>
                <div style={{fontFamily: fonts.body, fontSize: 24, color: COLORS.muted}}>Mix Points</div>
                <div style={{marginTop: 10, fontFamily: fonts.heading, fontWeight: 700, fontSize: 94, color: COLORS.white}}>{points}</div>
              </div>
              <div style={{opacity: uptimeIn, width: 360}}>
                <div style={{fontFamily: fonts.body, fontSize: 24, color: COLORS.muted}}>Node Uptime</div>
                <div style={{marginTop: 20, width: 340, height: 18, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden'}}>
                  <div style={{width: `${interpolate(frame, [0, 50], [0, 88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}%`, height: '100%', background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.blue})`}} />
                </div>
              </div>
              <div style={{opacity: rankIn, width: 280}}>
                <div style={{fontFamily: fonts.body, fontSize: 24, color: COLORS.muted}}>Community Rank</div>
                <div style={{marginTop: 12, fontFamily: fonts.heading, fontWeight: 700, fontSize: 84, color: COLORS.white}}>Top 8%</div>
              </div>
            </div>
            <div style={{marginTop: 50, width: 760, height: 150, opacity: interpolate(frame, [42, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
              <svg width="760" height="150">
                <polyline fill="none" stroke={COLORS.blue} strokeWidth="6" points="0,126 110,122 220,108 320,102 430,84 560,68 650,54 760,28" />
              </svg>
            </div>
          </div>
        </GlassCard>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', justifyContent: 'center', opacity: copyIn}}>
        <CenterCopy headline="Watch privacy grow in real time." frame={frame - 30} />
      </div>
    </AbsoluteFill>
  );
};

const Scene6Referral: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 120);
  const codeIn = quickSpring(frame, 0, 12);
  const arrowsIn = quickSpring(frame, 24, 10);
  const copyIn = quickSpring(frame, 54, 10);

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 260} />
      <ParticleField frame={frame + 20} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 130, display: 'flex', justifyContent: 'center', opacity: codeIn}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <div style={{width: 76, height: 76, borderRadius: 999, background: 'rgba(101,201,255,0.18)', border: `1px solid ${COLORS.border}`}} />
          <Pill label="Your code: ABC123" color={COLORS.white} mono />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, opacity: arrowsIn}}>
        <div style={{width: 110, height: 110, borderRadius: 999, background: COLORS.blue, boxShadow: `0 0 22px ${COLORS.blue}`}} />
        <div style={{width: 140, height: 6, borderRadius: 999, background: COLORS.white}} />
        <div style={{width: 110, height: 110, borderRadius: 999, background: COLORS.purple, boxShadow: `0 0 22px ${COLORS.purple}`}} />
        <div style={{width: 140, height: 6, borderRadius: 999, background: COLORS.white}} />
        <div style={{width: 110, height: 110, borderRadius: 999, background: COLORS.teal, boxShadow: `0 0 22px ${COLORS.teal}`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 90, display: 'flex', justifyContent: 'center', opacity: copyIn}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 54, color: COLORS.white}}>
            Fair. Transparent. Rewarding.
          </div>
          <div style={{marginTop: 14, fontFamily: fonts.body, fontSize: 26, color: COLORS.muted}}>
            One code per user. No loopholes.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene7Community: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 120);
  const orbit = Array.from({length: 8}, (_, i) => {
    const angle = (Math.PI * 2 * i) / 8 + frame / 14;
    return {
      x: WIDTH / 2 + Math.cos(angle) * 250,
      y: 420 + Math.sin(angle) * 145,
      color: i % 3 === 0 ? COLORS.blue : i % 3 === 1 ? COLORS.purple : COLORS.teal,
    };
  });

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 320} />
      <ParticleField frame={frame + 50} count={24} />
      <svg width={WIDTH} height={HEIGHT} style={{position: 'absolute', inset: 0}}>
        {orbit.map((node, i) => (
          <line key={i} x1={WIDTH / 2} y1={420} x2={node.x} y2={node.y} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
        ))}
      </svg>
      <div style={{position: 'absolute', left: WIDTH / 2 - 92, top: 328}}>
        <LogoCard size={184} />
      </div>
      {orbit.map((node, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: node.x - 34,
            top: node.y - 34,
            width: 68,
            height: 68,
            borderRadius: 999,
            background: node.color,
            boxShadow: `0 0 22px ${node.color}`,
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 88, display: 'flex', justifyContent: 'center'}}>
        <CenterCopy
          headline="Your privacy fuels our network."
          subtext="Earn points, climb ranks, unlock perks."
          frame={frame}
        />
      </div>
    </AbsoluteFill>
  );
};

const Scene8Security: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 120);
  const shieldIn = quickSpring(frame, 0, 10);
  const badge1 = quickSpring(frame, 18, 10);
  const badge2 = quickSpring(frame, 27, 10);
  const badge3 = quickSpring(frame, 36, 10);
  const cap1 = quickSpring(frame, 54, 10);
  const cap2 = quickSpring(frame, 72, 10);

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 360} />
      <ParticleField frame={frame + 30} />
      <div style={{position: 'absolute', left: WIDTH / 2 - 95, top: 180, opacity: shieldIn}}>
        <div
          style={{
            width: 190,
            height: 220,
            clipPath: 'polygon(50% 0%, 86% 16%, 86% 58%, 50% 100%, 14% 58%, 14% 16%)',
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${COLORS.border}`,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div style={{width: 78, height: 78, borderRadius: 999, border: `6px solid ${COLORS.white}`}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 445, display: 'flex', justifyContent: 'center', gap: 16}}>
        <div style={{opacity: badge1}}><Pill label="TLS" color={COLORS.blue} /></div>
        <div style={{opacity: badge2}}><Pill label="2FA" color={COLORS.purple} /></div>
        <div style={{opacity: badge3}}><Pill label="Privacy Compliant" color={COLORS.teal} /></div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 126, textAlign: 'center'}}>
        <div style={{fontFamily: fonts.heading, fontWeight: 700, fontSize: 48, color: COLORS.white, opacity: cap1}}>
          Secure connections, encrypted data.
        </div>
        <div style={{marginTop: 12, fontFamily: fonts.body, fontSize: 28, color: COLORS.muted, opacity: cap2}}>
          Built with industry best practices
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Scene9Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, 300);
  const logoIn = softSpring(frame, 0, 18);
  const headlineIn = quickSpring(frame, 60, 12);
  const subIn = quickSpring(frame, 120, 12);
  const buttonIn = quickSpring(frame, 180, 12);
  const pulse = interpolate(frame, [180, 220, 260], [1, 1.03, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{opacity}}>
      <Background frame={frame + 420} />
      <ParticleField frame={frame + 24} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            transform: `translateY(${interpolate(logoIn, [0, 1], [18, 0])}px) scale(${interpolate(logoIn, [0, 1], [0.88, 1])})`,
            opacity: logoIn,
          }}
        >
          <LogoCard size={210} />
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 58,
            color: COLORS.white,
            textAlign: 'center',
            opacity: headlineIn,
          }}
        >
          Join the private future of Bitcoin.
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: fonts.body,
            fontSize: 30,
            color: COLORS.muted,
            opacity: subIn,
          }}
        >
          Start mixing. Start mining. Start today.
        </div>
        <div
          style={{
            marginTop: 30,
            width: 310,
            height: 84,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.blue})`,
            color: COLORS.white,
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            opacity: buttonIn,
            transform: `translateY(${interpolate(buttonIn, [0, 1], [26, 0])}px) scale(${pulse})`,
            boxShadow: '0 0 28px rgba(101,201,255,0.28)',
          }}
        >
          Get Started
          <span style={{fontSize: 36}}>→</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxMomentum: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: fonts.body}}>
      <Sequence from={0} durationInFrames={90}>
        <Scene1Opening />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <Scene2Problem />
      </Sequence>
      <Sequence from={180} durationInFrames={120}>
        <Scene3Solution />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <Scene4Onboarding />
      </Sequence>
      <Sequence from={450} durationInFrames={150}>
        <Scene5Dashboard />
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <Scene6Referral />
      </Sequence>
      <Sequence from={720} durationInFrames={120}>
        <Scene7Community />
      </Sequence>
      <Sequence from={840} durationInFrames={120}>
        <Scene8Security />
      </Sequence>
      <Sequence from={960} durationInFrames={300}>
        <Scene9Cta />
      </Sequence>
    </AbsoluteFill>
  );
};
