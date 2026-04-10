import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Variant = 'vertical' | 'wide';

type SceneProps = {
  variant: Variant;
};

const BRAND = {
  paper: '#F5F4EF',
  paper2: '#FFFFFF',
  ink: '#101111',
  muted: '#66645E',
  soft: '#B8B5AD',
  line: '#DDDAD2',
};

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Source Sans 3", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
};

const DURATION = 450;
const SCENE = {
  hero: 84,
  terminal: 96,
  ecosystem: 108,
  lifecycle: 84,
  cta: 78,
};

const OFFSETS = {
  hero: 0,
  terminal: SCENE.hero,
  ecosystem: SCENE.hero + SCENE.terminal,
  lifecycle: SCENE.hero + SCENE.terminal + SCENE.ecosystem,
  cta: SCENE.hero + SCENE.terminal + SCENE.ecosystem + SCENE.lifecycle,
};

const Background: React.FC<{frame: number}> = ({frame}) => {
  const shift = interpolate(frame, [0, DURATION], [0, 1]);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.paper,
        backgroundImage: [
          `radial-gradient(circle at ${15 + shift * 8}% ${14 + shift * 5}%, rgba(255,255,255,0.96), transparent 30%)`,
          `radial-gradient(circle at ${78 - shift * 5}% ${18 + shift * 2}%, rgba(225,222,214,0.8), transparent 24%)`,
          `radial-gradient(circle at ${62 - shift * 10}% ${80 - shift * 8}%, rgba(232,229,222,0.8), transparent 30%)`,
          'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(245,244,239,0.98) 42%, rgba(239,236,230,1) 100%)',
        ].join(','),
      }}
    />
  );
};

const FloorGrid: React.FC<{frame: number}> = ({frame}) => {
  const y = interpolate(frame, [0, DURATION], [0, -140]);
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-18%',
        transform: `perspective(1600px) rotateX(77deg) translateY(${y}px)`,
        opacity: 0.34,
        backgroundImage:
          'linear-gradient(rgba(16,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16,17,17,0.05) 1px, transparent 1px)',
        backgroundSize: '112px 112px',
        maskImage:
          'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.92) 32%, rgba(0,0,0,1) 60%, transparent 100%)',
      }}
    />
  );
};

const FaintWordmark: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 'auto 0 40px 0',
        textAlign: 'center',
        fontFamily: fonts.mono,
        fontSize: 220,
        fontWeight: 700,
        letterSpacing: '-0.08em',
        color: 'rgba(16,17,17,0.06)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      REALMXAI
    </div>
  );
};

const Eyebrow: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      borderRadius: 999,
      padding: '12px 18px',
      border: `1px solid ${BRAND.line}`,
      background: 'rgba(255,255,255,0.76)',
      color: BRAND.ink,
      fontFamily: fonts.mono,
      fontSize: 16,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
    }}
  >
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        background: BRAND.ink,
        boxShadow: '0 0 0 4px rgba(16,17,17,0.08)',
      }}
    />
    {text}
  </div>
);

const Wordmark: React.FC<{frame: number}> = ({frame}) => {
  const enter = spring({
    fps: 30,
    frame,
    config: {damping: 16, stiffness: 110, mass: 0.85},
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.88)',
          border: `1px solid ${BRAND.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 48px rgba(16,17,17,0.1)',
        }}
      >
        <Img src={staticFile('le6jxytl.webp')} style={{width: '76%', height: '76%', objectFit: 'contain'}} />
      </div>
      <div
        style={{
          fontFamily: fonts.mono,
          color: BRAND.ink,
          fontSize: 54,
          fontWeight: 700,
          letterSpacing: '-0.08em',
        }}
      >
        Realm XAI
      </div>
    </div>
  );
};

const TitleBlock: React.FC<{title: string; body: string; frame: number}> = ({title, body, frame}) => {
  const enter = spring({
    fps: 30,
    frame,
    config: {damping: 16, stiffness: 120, mass: 0.86},
  });
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [28, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 92,
          lineHeight: 0.92,
          color: BRAND.ink,
          letterSpacing: '-0.07em',
          maxWidth: 850,
          textWrap: 'balance',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: 28,
          lineHeight: 1.35,
          color: BRAND.muted,
          maxWidth: 760,
        }}
      >
        {body}
      </div>
    </div>
  );
};

const SurfacePanel: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotateY: number;
  rotateX?: number;
  rotateZ?: number;
  z: number;
  children: React.ReactNode;
}> = ({x, y, width, height, rotateY, rotateX = 0, rotateZ = 0, z, children}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      borderRadius: 30,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,247,242,0.98))',
      border: `1px solid ${BRAND.line}`,
      boxShadow: '0 32px 90px rgba(16,17,17,0.12), inset 0 1px 0 rgba(255,255,255,0.96)',
      transformStyle: 'preserve-3d',
      transform: `translateZ(${z}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const PanelHeader: React.FC<{label: string; title: string}> = ({label, title}) => (
  <div
    style={{
      padding: '18px 22px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: BRAND.ink,
            boxShadow: '0 0 0 4px rgba(16,17,17,0.08)',
          }}
        />
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: BRAND.muted,
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          width: 52,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${BRAND.ink})`,
        }}
      />
    </div>
    <div
      style={{
        fontFamily: fonts.body,
        fontSize: 24,
        fontWeight: 600,
        color: BRAND.ink,
      }}
    >
      {title}
    </div>
  </div>
);

const RowMetric: React.FC<{label: string; value: string}> = ({label, value}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 0',
      borderBottom: `1px solid ${BRAND.line}`,
    }}
  >
    <span style={{fontFamily: fonts.body, fontSize: 18, color: BRAND.muted}}>{label}</span>
    <span style={{fontFamily: fonts.mono, fontSize: 18, color: BRAND.ink}}>{value}</span>
  </div>
);

const Terminal: React.FC<{frame: number}> = ({frame}) => {
  const lines = [
    '$ realmxai privacy:enable --zk --selective-disclosure',
    '> confidential execution initialized',
    '$ realmxai identity:preserve --wallet --google',
    '> participation verified',
    '$ realmxai node:start --points-mining',
    '> dashboard synchronized',
  ];
  const visibleChars = Math.floor(
    interpolate(frame, [0, 80], [0, lines.join('').length + 20], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  let consumed = 0;
  const rendered = lines.map((line) => {
    const next = line.length + 1;
    const slice = Math.max(0, Math.min(line.length, visibleChars - consumed));
    consumed += next;
    return line.slice(0, slice);
  });
  const activeIndex = rendered.findIndex((line, index) => line.length < lines[index].length);
  const blink = Math.floor(frame / 12) % 2 === 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(20,20,20,0.98), rgba(28,28,28,1))',
        color: BRAND.paper2,
        fontFamily: fonts.mono,
        fontSize: 24,
        lineHeight: 1.7,
        padding: 28,
      }}
    >
      <div style={{display: 'flex', gap: 10, marginBottom: 18}}>
        {['#ff5f57', '#febc2e', '#28c840'].map((color) => (
          <span key={color} style={{width: 12, height: 12, borderRadius: 999, background: color}} />
        ))}
      </div>
      {rendered.map((line, index) => (
        <div key={`${line}-${index}`} style={{whiteSpace: 'pre'}}>
          {line}
          {index === activeIndex && blink ? '|' : ''}
        </div>
      ))}
    </div>
  );
};

const HeroScene: React.FC<SceneProps> = ({variant}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const enter = spring({
    fps: 30,
    frame,
    config: {damping: 18, stiffness: 100},
  });
  const panelX = interpolate(enter, [0, 1], [width + 140, width * 0.58]);
  const drift = Math.sin(frame / 18) * 6;

  return (
    <AbsoluteFill>
      <Background frame={frame} />
      <FloorGrid frame={frame} />
      <FaintWordmark />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: variant === 'wide' ? '82px 92px' : '76px 64px',
          display: 'flex',
          flexDirection: variant === 'wide' ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 28}}>
          <Eyebrow text="launch commercial" />
          <Wordmark frame={frame} />
          <TitleBlock
            frame={frame}
            title="Effortless private execution."
            body="Realm XAI is building the infrastructure of trust for confidential execution, identity preservation, and privacy-first participation."
          />
        </div>

        <div
          style={{
            position: variant === 'wide' ? 'relative' : 'absolute',
            right: variant === 'wide' ? 'auto' : 50,
            bottom: variant === 'wide' ? 'auto' : 60,
            width: variant === 'wide' ? width * 0.4 : width * 0.8,
            height: variant === 'wide' ? height * 0.72 : height * 0.36,
            perspective: 1800,
          }}
        >
          <SurfacePanel
            x={variant === 'wide' ? panelX - width * 0.4 : 0}
            y={variant === 'wide' ? 92 + drift : 0}
            width={variant === 'wide' ? width * 0.4 : width * 0.8}
            height={variant === 'wide' ? height * 0.72 : height * 0.36}
            rotateY={-16}
            rotateX={10}
            rotateZ={-2}
            z={170}
          >
            <PanelHeader label="ecosystem overview" title="Building the Infrastructure of Trust." />
            <div style={{padding: '18px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16}}>
              {[
                ['Zero-Knowledge', 'Confidential by design'],
                ['Selective Disclosure', 'Transparency by choice'],
                ['Identity Preservation', 'Verifiable participation'],
                ['Node Dashboard', 'One module in the stack'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 20,
                    border: `1px solid ${BRAND.line}`,
                    background: 'rgba(16,17,17,0.03)',
                    padding: '18px 18px 16px',
                  }}
                >
                  <div style={{fontFamily: fonts.body, fontSize: 22, color: BRAND.ink, fontWeight: 600}}>{label}</div>
                  <div style={{fontFamily: fonts.body, fontSize: 16, color: BRAND.muted, marginTop: 8}}>{value}</div>
                </div>
              ))}
            </div>
          </SurfacePanel>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TerminalScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const localFrame = frame;
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background frame={frame + OFFSETS.terminal} />
      <FloorGrid frame={frame + OFFSETS.terminal} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '82px 92px',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        <Eyebrow text="private rails" />
        <TitleBlock
          frame={localFrame}
          title="Privacy, made legible."
          body="The dashboard is one visible proof point. The real message is Realm XAI's wider system for trust, confidentiality, and coordinated participation."
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 92,
          top: 430,
          width: width - 184,
          height: height - 520,
          perspective: 1800,
        }}
      >
        <SurfacePanel x={0} y={0} width={width * 0.64} height={height * 0.35} rotateY={-8} rotateX={8} z={240}>
          <Terminal frame={localFrame} />
        </SurfacePanel>

        <SurfacePanel x={width * 0.7} y={12} width={width * 0.18} height={164} rotateY={-20} rotateX={10} z={120}>
          <PanelHeader label="output" title="Selective disclosure" />
          <div style={{padding: '8px 22px 18px'}}>
            <RowMetric label="Privacy" value="Default" />
            <RowMetric label="Compliance" value="Granular" />
          </div>
        </SurfacePanel>

        <SurfacePanel x={width * 0.65} y={200} width={width * 0.22} height={176} rotateY={-16} rotateX={10} rotateZ={2} z={160}>
          <PanelHeader label="runtime" title="Node dashboard" />
          <div style={{padding: '8px 22px 18px'}}>
            <RowMetric label="Points mining" value="Active" />
            <RowMetric label="Auth" value="Wallet + Google" />
          </div>
        </SurfacePanel>
      </div>
    </AbsoluteFill>
  );
};

const EcosystemScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const localFrame = frame;
  const {width, height} = useVideoConfig();
  const move = interpolate(localFrame, [0, SCENE.ecosystem], [0, 1]);

  return (
    <AbsoluteFill>
      <Background frame={frame + OFFSETS.ecosystem} />
      <FloorGrid frame={frame + OFFSETS.ecosystem} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '82px 92px',
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
        }}
      >
        <Eyebrow text="ecosystem" />
        <TitleBlock
          frame={localFrame}
          title="More than a node dashboard."
          body="Realm XAI brings together zero-knowledge architecture, ultra-fast settlement, identity preservation, and participation tooling in one ecosystem."
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 360,
          bottom: 0,
          perspective: 2200,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            transform: `translateX(${interpolate(move, [0, 1], [80, -60])}px) rotateY(${interpolate(move, [0, 1], [-4, 6])}deg)`,
          }}
        >
          <SurfacePanel x={width * 0.15} y={120} width={width * 0.5} height={height * 0.44} rotateY={-10} rotateX={8} z={220}>
            <PanelHeader label="stack" title="Realm XAI ecosystem map" />
            <div style={{padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 18}}>
              <div
                style={{
                  borderRadius: 20,
                  border: `1px solid ${BRAND.line}`,
                  background: 'rgba(16,17,17,0.03)',
                  padding: 18,
                  height: 260,
                }}
              >
                <div style={{fontFamily: fonts.mono, color: BRAND.muted, fontSize: 14, marginBottom: 14}}>Core capabilities</div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14}}>
                  {['ZK Architecture', 'Ultra-Fast Settlement', 'Selective Disclosure', 'Identity Preservation'].map((item) => (
                    <div
                      key={item}
                      style={{
                        borderRadius: 18,
                        border: `1px solid ${BRAND.line}`,
                        background: BRAND.paper2,
                        padding: '18px 16px',
                        fontFamily: fonts.body,
                        color: BRAND.ink,
                        fontSize: 20,
                        fontWeight: 600,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div
                style={{
                  borderRadius: 20,
                  border: `1px solid ${BRAND.line}`,
                  background: 'rgba(16,17,17,0.03)',
                  padding: 18,
                }}
              >
                <RowMetric label="Use case" value="Confidential payments" />
                <RowMetric label="Use case" value="Secure voting" />
                <RowMetric label="Participation" value="Points mining" />
                <RowMetric label="Trust" value="Verifiable" />
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel x={width * 0.66} y={88} width={width * 0.17} height={190} rotateY={-24} rotateX={8} z={120}>
            <PanelHeader label="module" title="Node dashboard" />
            <div style={{padding: '4px 22px 18px'}}>
              <RowMetric label="Role" value="Participation" />
              <RowMetric label="Reward" value="Points" />
            </div>
          </SurfacePanel>

          <SurfacePanel x={width * 0.7} y={300} width={width * 0.16} height={190} rotateY={-22} rotateX={8} rotateZ={2} z={160}>
            <PanelHeader label="module" title="Admin visibility" />
            <div style={{padding: '4px 22px 18px'}}>
              <RowMetric label="Sessions" value="Tracked" />
              <RowMetric label="Referrals" value="Audited" />
            </div>
          </SurfacePanel>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LifecycleScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const localFrame = frame;
  const orbit = interpolate(localFrame, [0, SCENE.lifecycle], [0, 1]);
  return (
    <AbsoluteFill>
      <Background frame={frame + OFFSETS.lifecycle} />
      <FloorGrid frame={frame + OFFSETS.lifecycle} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 24,
          padding: '0 140px',
        }}
      >
        <Eyebrow text="protocol evolution" />
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 96,
            lineHeight: 0.94,
            letterSpacing: '-0.07em',
            color: BRAND.ink,
            maxWidth: 1020,
            textWrap: 'balance',
          }}
        >
          A sustainable network lifecycle.
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            lineHeight: 1.35,
            color: BRAND.muted,
            maxWidth: 860,
          }}
        >
          Pre-TGE points mining. At TGE proof of stake. Post-TGE a deflationary model for long-term stability, security, and growth.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 70,
          width: 780,
          height: 240,
          perspective: 1800,
        }}
      >
        {[
          {x: interpolate(orbit, [0, 1], [20, 0]), y: 18, z: 120, rotate: -24, text: '01  Points Mining'},
          {x: 270, y: 54, z: 260, rotate: 0, text: '02  Proof of Stake'},
          {x: interpolate(orbit, [0, 1], [540, 560]), y: 12, z: 120, rotate: 24, text: '03  Deflationary Model'},
        ].map((item) => (
          <SurfacePanel
            key={item.text}
            x={item.x}
            y={item.y}
            width={220}
            height={120}
            rotateY={item.rotate}
            rotateX={8}
            z={item.z}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.mono,
                fontSize: 24,
                color: BRAND.ink,
                letterSpacing: '-0.03em',
                textAlign: 'center',
                padding: '0 18px',
              }}
            >
              {item.text}
            </div>
          </SurfacePanel>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CtaScene: React.FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const localFrame = frame;
  const enter = spring({
    fps: 30,
    frame: localFrame,
    config: {damping: 16, stiffness: 100, mass: 0.9},
  });
  return (
    <AbsoluteFill>
      <Background frame={frame + OFFSETS.cta} />
      <FloorGrid frame={frame + OFFSETS.cta} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          textAlign: 'center',
          padding: '0 140px',
          transform: `scale(${interpolate(enter, [0, 1], [0.95, 1])})`,
          opacity: enter,
        }}
      >
        <Wordmark frame={localFrame} />
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 84,
            lineHeight: 0.94,
            letterSpacing: '-0.07em',
            color: BRAND.ink,
            maxWidth: 960,
          }}
        >
          Privacy has entered a new era.
        </div>
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 28,
            lineHeight: 1.35,
            color: BRAND.muted,
            maxWidth: 820,
          }}
        >
          Join the architects of the future with Realm XAI, the infrastructure of trust for confidential execution and digital sovereignty.
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: '18px 30px',
            background: BRAND.ink,
            color: BRAND.paper2,
            fontFamily: fonts.mono,
            fontSize: 23,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            boxShadow: '0 16px 44px rgba(16,17,17,0.14)',
          }}
        >
          Request Access
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxCommercial: React.FC<SceneProps> = ({variant}) => {
  const frame = useCurrentFrame();

  if (variant !== 'wide') {
    return (
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Background frame={frame} />
        <FloorGrid frame={frame} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 24,
            padding: '100px 80px',
          }}
        >
          <Eyebrow text="realm xai" />
          <Wordmark frame={frame} />
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 74,
              lineHeight: 0.94,
              color: BRAND.ink,
              letterSpacing: '-0.07em',
            }}
          >
            This commercial is designed for 16:9 landscape.
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              lineHeight: 1.35,
              color: BRAND.muted,
              maxWidth: 760,
            }}
          >
            The wide cut carries the intended ecosystem story, typography, terminal motion, and layered 3D panels.
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Sequence from={OFFSETS.hero} durationInFrames={SCENE.hero}>
        <HeroScene variant={variant} />
      </Sequence>
      <Sequence from={OFFSETS.terminal} durationInFrames={SCENE.terminal}>
        <TerminalScene variant={variant} />
      </Sequence>
      <Sequence from={OFFSETS.ecosystem} durationInFrames={SCENE.ecosystem}>
        <EcosystemScene variant={variant} />
      </Sequence>
      <Sequence from={OFFSETS.lifecycle} durationInFrames={SCENE.lifecycle}>
        <LifecycleScene variant={variant} />
      </Sequence>
      <Sequence from={OFFSETS.cta} durationInFrames={SCENE.cta}>
        <CtaScene variant={variant} />
      </Sequence>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 160px rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
