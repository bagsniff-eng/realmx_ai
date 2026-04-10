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

type Palette = {
  bg: string;
  bg2: string;
  panel: string;
  text: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
};

const fonts = {
  display: '"Fraunces", Georgia, serif',
  body: '"Source Sans 3", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
};

const PALETTES = {
  obsidian: {
    bg: '#06070A',
    bg2: '#151827',
    panel: 'rgba(255,255,255,0.08)',
    text: '#F7F4EF',
    muted: 'rgba(247,244,239,0.7)',
    line: 'rgba(255,255,255,0.12)',
    accent: '#9A87FF',
    accent2: '#8EE7FF',
  },
  velocity: {
    bg: '#FBF6FF',
    bg2: '#E7F5FF',
    panel: 'rgba(255,255,255,0.82)',
    text: '#171620',
    muted: '#6D6980',
    line: 'rgba(23,22,32,0.12)',
    accent: '#8D5BFF',
    accent2: '#38D7FF',
  },
  atlas: {
    bg: '#FAFAF6',
    bg2: '#EAF6FF',
    panel: 'rgba(255,255,255,0.9)',
    text: '#16181C',
    muted: '#686C76',
    line: 'rgba(22,24,28,0.12)',
    accent: '#4B88FF',
    accent2: '#A6E2FF',
  },
} satisfies Record<string, Palette>;

const sceneDurations = {
  intro: 96,
  spread: 102,
  proof: 102,
  close: 120,
};

const totalFrames = sceneDurations.intro + sceneDurations.spread + sceneDurations.proof + sceneDurations.close;

const LogoTile: React.FC<{palette: Palette; dark?: boolean; size?: number}> = ({palette, dark = false, size = 72}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      border: `1px solid ${palette.line}`,
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 18px 50px rgba(0,0,0,0.36)' : '0 18px 50px rgba(12,18,30,0.12)',
    }}
  >
    <Img src={staticFile('le6jxytl.webp')} style={{width: '72%', height: '72%', objectFit: 'contain'}} />
  </div>
);

const CornerBrand: React.FC<{palette: Palette; dark?: boolean}> = ({palette, dark = false}) => (
  <div
    style={{
      position: 'absolute',
      left: 52,
      top: 42,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      zIndex: 30,
    }}
  >
    <LogoTile palette={palette} dark={dark} size={58} />
    <div style={{fontFamily: fonts.mono, fontSize: 28, color: palette.text, fontWeight: 700, letterSpacing: '-0.06em'}}>
      Realm XAI
    </div>
  </div>
);

const Tag: React.FC<{palette: Palette; text: string}> = ({palette, text}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      borderRadius: 999,
      padding: '10px 16px',
      border: `1px solid ${palette.line}`,
      background: palette.panel,
      fontFamily: fonts.mono,
      fontSize: 13,
      color: palette.text,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    }}
  >
    <span
      style={{
        width: 9,
        height: 9,
        borderRadius: 999,
        background: palette.accent,
        boxShadow: `0 0 16px ${palette.accent}`,
      }}
    />
    {text}
  </div>
);

const HeroCopy: React.FC<{
  palette: Palette;
  frame: number;
  title: string;
  body: string;
  x?: number;
  y?: number;
  width?: number;
}> = ({palette, frame, title, body, x = 84, y = 122, width = 860}) => {
  const enter = spring({fps: 30, frame, config: {damping: 16, stiffness: 110, mass: 0.9}});
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
        zIndex: 20,
      }}
    >
      <Tag palette={palette} text="Realm XAI commercial" />
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 84,
          lineHeight: 0.92,
          color: palette.text,
          letterSpacing: '-0.07em',
          textWrap: 'balance',
        }}
      >
        {title}
      </div>
      <div style={{fontFamily: fonts.body, fontSize: 28, lineHeight: 1.35, color: palette.muted}}>{body}</div>
    </div>
  );
};

const Panel: React.FC<{
  palette: Palette;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
  frame: number;
  delay?: number;
  float?: number;
  dark?: boolean;
  children: React.ReactNode;
}> = ({palette, x, y, width, height, rotate = 0, frame, delay = 0, float = 10, dark = false, children}) => {
  const enter = spring({fps: 30, frame: Math.max(0, frame - delay), config: {damping: 15, stiffness: 120, mass: 0.9}});
  const drift = Math.sin((frame + delay) / 18) * float;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + drift,
        width,
        height,
        borderRadius: 28,
        border: `1px solid ${palette.line}`,
        background: dark ? 'rgba(0,0,0,0.28)' : palette.panel,
        boxShadow: dark ? '0 24px 80px rgba(0,0,0,0.3)' : '0 24px 80px rgba(16,20,32,0.12)',
        backdropFilter: 'blur(18px)',
        overflow: 'hidden',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])}) rotate(${rotate}deg)`,
      }}
    >
      {children}
    </div>
  );
};

const PanelHeader: React.FC<{palette: Palette; label: string; title: string}> = ({palette, label, title}) => (
  <div style={{padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 8}}>
    <div style={{fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: palette.muted}}>
      {label}
    </div>
    <div style={{fontFamily: fonts.body, fontSize: 25, lineHeight: 1.1, fontWeight: 700, color: palette.text}}>{title}</div>
  </div>
);

const MiniRows: React.FC<{palette: Palette; rows: string[]}> = ({palette, rows}) => (
  <div style={{padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10}}>
    {rows.map((row) => (
      <div
        key={row}
        style={{
          borderRadius: 16,
          padding: '12px 14px',
          border: `1px solid ${palette.line}`,
          fontFamily: fonts.body,
          fontSize: 18,
          color: palette.text,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        {row}
      </div>
    ))}
  </div>
);

const FloatingText: React.FC<{
  palette: Palette;
  frame: number;
  messages: string[];
  x: number;
  y: number;
  size?: number;
}> = ({palette, frame, messages, x, y, size = 42}) => {
  const index = Math.min(messages.length - 1, Math.floor(frame / 18));
  const local = frame % 18;
  const opacity = interpolate(local, [0, 5, 14, 17], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        fontFamily: fonts.display,
        fontSize: size,
        lineHeight: 0.95,
        color: palette.text,
        letterSpacing: '-0.06em',
        opacity,
        zIndex: 25,
      }}
    >
      {messages[index]}
    </div>
  );
};

const GradientBackdrop: React.FC<{palette: Palette; frame: number; dark?: boolean}> = ({palette, frame, dark = false}) => {
  const shift = interpolate(frame, [0, totalFrames], [0, 1]);
  const bg = dark
    ? [
        `radial-gradient(circle at ${18 + shift * 10}% ${18 + shift * 8}%, rgba(142,231,255,0.12), transparent 26%)`,
        `radial-gradient(circle at ${78 - shift * 8}% ${20 + shift * 4}%, rgba(154,135,255,0.14), transparent 28%)`,
        'linear-gradient(180deg, #06070A 0%, #101426 100%)',
      ].join(',')
    : [
        `radial-gradient(circle at ${14 + shift * 7}% ${18 + shift * 6}%, ${palette.accent2}33, transparent 24%)`,
        `radial-gradient(circle at ${78 - shift * 10}% ${16 + shift * 5}%, ${palette.accent}2A, transparent 24%)`,
        `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bg2} 100%)`,
      ].join(',');
  return <AbsoluteFill style={{background: bg}} />;
};

const MessageWall: React.FC<{palette: Palette; frame: number; dark?: boolean}> = ({palette, frame, dark = false}) => {
  const columns = [0, 1, 2, 3, 4];
  const rows = [0, 1, 2, 3];
  const phrases = ['private execution', 'identity preserved', 'selective disclosure', 'trust layer', 'participation', 'zero-knowledge'];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: dark ? 0.22 : 0.16}}>
      {rows.flatMap((row) =>
        columns.map((col, i) => {
          const phrase = phrases[(row + col) % phrases.length];
          return (
            <div
              key={`${row}-${col}`}
              style={{
                position: 'absolute',
                left: 90 + col * 350 + Math.sin((frame + i * 7) / 24) * 12,
                top: 160 + row * 170 + Math.cos((frame + i * 5) / 22) * 10,
                fontFamily: fonts.mono,
                fontSize: 18,
                color: palette.text,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {phrase}
            </div>
          );
        })
      )}
    </div>
  );
};

const ObsidianIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.obsidian;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame} dark />
      <CornerBrand palette={palette} dark />
      <MessageWall palette={palette} frame={frame} dark />
      <HeroCopy
        palette={palette}
        frame={frame}
        title="The trust layer should feel alive."
        body="Realm XAI is not one screen. It is a living system of private execution, identity preservation, selective disclosure, and participation."
      />
      <FloatingText palette={palette} frame={frame} messages={['private execution.', 'digital sovereignty.', 'trust infrastructure.']} x={88} y={410} size={54} />
      <Panel palette={palette} x={980} y={110} width={340} height={180} rotate={-10} frame={frame} delay={6} dark>
        <PanelHeader palette={palette} label="signal" title="Zero-knowledge core" />
        <MiniRows palette={palette} rows={['Confidential by default', 'Proof without oversharing']} />
      </Panel>
      <Panel palette={palette} x={1260} y={180} width={310} height={164} rotate={8} frame={frame} delay={12} dark>
        <PanelHeader palette={palette} label="identity" title="Wallet + Google" />
        <MiniRows palette={palette} rows={['Dual verification', 'Human-centered access']} />
      </Panel>
      <Panel palette={palette} x={1010} y={320} width={520} height={250} rotate={-7} frame={frame} delay={18} dark float={14}>
        <PanelHeader palette={palette} label="ecosystem" title="Many moving surfaces, one coherent system" />
        <div style={{padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12}}>
          {['Node dashboard', 'Referral engine', 'Admin visibility', 'Reward logic'].map((item) => (
            <div key={item} style={{borderRadius: 18, border: `1px solid ${palette.line}`, padding: '16px 14px', color: palette.text, fontFamily: fonts.body, fontSize: 20}}>
              {item}
            </div>
          ))}
        </div>
      </Panel>
      <Panel palette={palette} x={1440} y={470} width={260} height={150} rotate={6} frame={frame} delay={24} dark>
        <PanelHeader palette={palette} label="growth" title="Points mining" />
        <MiniRows palette={palette} rows={['Pre-TGE participation']} />
      </Panel>
    </AbsoluteFill>
  );
};

const ObsidianSpread: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.obsidian;
  const sweep = interpolate(frame, [0, sceneDurations.spread], [0, 1]);
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 100} dark />
      <CornerBrand palette={palette} dark />
      <FloatingText palette={palette} frame={frame} messages={['identity preserved.', 'referrals synchronized.', 'admins informed.']} x={84} y={80} size={58} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={110 + i * 250 + interpolate(sweep, [0, 1], [140, -80])}
          y={220 + (i % 2) * 150}
          width={230}
          height={150 + (i % 3) * 18}
          rotate={-12 + i * 4}
          frame={frame}
          delay={i * 6}
          dark
        >
          <PanelHeader
            palette={palette}
            label={`0${i + 1}`}
            title={['Private rails', 'Role signals', 'Live sessions', 'Fair rewards', 'Human proof', 'Future-ready'][i]}
          />
          <MiniRows palette={palette} rows={[['Selective disclosure', 'Granular trust'], ['Admins see patterns', 'Not over-collection'], ['Session duration', 'Users online'], ['Referral loop', 'Reward history'], ['Wallet ownership', 'Linked identity'], ['PoS transition', 'Deflationary path']][i]} />
        </Panel>
      ))}
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 72,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${palette.accent}, ${palette.accent2}, transparent)`,
          boxShadow: `0 0 22px ${palette.accent}`,
        }}
      />
    </AbsoluteFill>
  );
};

const ObsidianProof: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.obsidian;
  const lines = [
    'wallet ownership verified',
    'google identity linked',
    'session rewards flowing',
    'admin oversight enabled',
    'privacy messaging stays clear',
  ];
  const chars = Math.floor(interpolate(frame, [0, sceneDurations.proof], [0, lines.join('').length + 60], {extrapolateRight: 'clamp'}));
  let consumed = 0;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 220} dark />
      <CornerBrand palette={palette} dark />
      <HeroCopy
        palette={palette}
        frame={frame}
        title="Show the system. Not just the slogan."
        body="The strongest dark references keep new proof points entering while the camera world stays coherent."
        y={92}
        width={760}
      />
      <Panel palette={palette} x={80} y={360} width={930} height={300} rotate={-4} frame={frame} dark>
        <div style={{padding: 22}}>
          <div style={{display: 'flex', gap: 10, marginBottom: 18}}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <span key={c} style={{width: 12, height: 12, borderRadius: 999, background: c}} />
            ))}
          </div>
          <div style={{fontFamily: fonts.mono, fontSize: 28, lineHeight: 1.8, color: palette.text}}>
            {lines.map((line) => {
              const limit = Math.max(0, Math.min(line.length, chars - consumed));
              consumed += line.length + 8;
              return <div key={line}>{line.slice(0, limit)}</div>;
            })}
          </div>
        </div>
      </Panel>
      {[0, 1, 2, 3].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={1110 + (i % 2) * 260}
          y={250 + Math.floor(i / 2) * 190}
          width={240}
          height={150}
          rotate={i % 2 === 0 ? -8 : 7}
          frame={frame}
          delay={12 + i * 7}
          dark
        >
          <PanelHeader palette={palette} label="proof" title={['1000+ concurrent', 'TLS everywhere', 'Role-based admin', 'Referral integrity'][i]} />
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const ObsidianClose: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.obsidian;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 320} dark />
      <CornerBrand palette={palette} dark />
      <MessageWall palette={palette} frame={frame} dark />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={120 + (i % 3) * 510}
          y={160 + Math.floor(i / 3) * 260}
          width={330}
          height={150}
          rotate={-8 + i * 3}
          frame={frame}
          delay={i * 5}
          dark
        >
          <PanelHeader palette={palette} label="realm xai" title={['Private execution', 'Selective disclosure', 'Identity preservation', 'Node participation', 'Admin confidence', 'Join the future'][i]} />
        </Panel>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 98, textAlign: 'center', zIndex: 22}}>
        <div style={{fontFamily: fonts.display, fontSize: 74, lineHeight: 0.94, color: palette.text, letterSpacing: '-0.07em'}}>
          Build on the infrastructure of trust.
        </div>
        <div style={{marginTop: 18, display: 'inline-block', borderRadius: 999, padding: '18px 30px', border: `1px solid ${palette.line}`, color: palette.text, fontFamily: fonts.mono, fontSize: 20, letterSpacing: '0.16em', textTransform: 'uppercase'}}>
          Join Realm XAI
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxObsidianCommercial: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Sequence from={0} durationInFrames={sceneDurations.intro}><ObsidianIntro /></Sequence>
    <Sequence from={sceneDurations.intro} durationInFrames={sceneDurations.spread}><ObsidianSpread /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread} durationInFrames={sceneDurations.proof}><ObsidianProof /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread + sceneDurations.proof} durationInFrames={sceneDurations.close}><ObsidianClose /></Sequence>
  </AbsoluteFill>
);

const VelocityIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.velocity;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame} />
      <CornerBrand palette={palette} />
      <HeroCopy
        palette={palette}
        frame={frame}
        title="Privacy can move fast and still feel clear."
        body="This direction leans into the pastel and collage references: many tiles, many statements, and no dead air."
      />
      <FloatingText palette={palette} frame={frame} messages={['private execution.', 'referrals that reward growth.', 'identity without chaos.']} x={90} y={420} size={52} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={960 + (i % 2) * 270 + (i > 2 ? 120 : 0)}
          y={120 + i * 90}
          width={250}
          height={120}
          rotate={-10 + i * 5}
          frame={frame}
          delay={i * 5}
        >
          <div style={{padding: 18, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
            <div style={{fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: palette.muted}}>
              0{i + 1}
            </div>
            <div style={{fontFamily: fonts.body, fontSize: 26, lineHeight: 1.03, color: palette.text, fontWeight: 700}}>
              {['Trust layer', 'Live dashboard', 'Growth loops', 'Fair rewards', 'Protocol path'][i]}
            </div>
          </div>
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const VelocitySpread: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.velocity;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 100} />
      <CornerBrand palette={palette} />
      {[
        ['Infrastructure of trust', 70, 80, 52],
        ['Selective disclosure', 460, 110, 42],
        ['Identity preservation', 1120, 82, 46],
        ['Node dashboard', 1400, 380, 34],
        ['Referrals and rewards', 120, 660, 38],
      ].map(([text, x, y, size], i) => (
        <FloatingText key={String(text)} palette={palette} frame={frame + i * 6} messages={[String(text)]} x={Number(x)} y={Number(y)} size={Number(size)} />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={100 + (i % 4) * 430}
          y={180 + Math.floor(i / 4) * 280 + (i % 2) * 18}
          width={320}
          height={190}
          rotate={-7 + i * 2}
          frame={frame}
          delay={i * 4}
          float={14}
        >
          <PanelHeader palette={palette} label={`module 0${i + 1}`} title={['Wallet connect', 'Google auth', 'Mining session', 'Session logs', 'Referral stats', 'Reward balance', 'Admin actions', 'Live presence'][i]} />
          <MiniRows palette={palette} rows={[['Ownership verified', 'Link human identity'], ['OAuth secured', 'Unique account constraints'], ['Points accrue live', 'Pause/resume state'], ['Time and activity', 'Rate-limited pipes'], ['Code sharing', 'Duplicate prevention'], ['Fair attribution', 'Visible history'], ['Role access', 'Audit trail'], ['Online now', 'Concurrent users']][i]} />
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const VelocityProof: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.velocity;
  const words = [
    'private execution',
    'clear messaging',
    'modern participation',
    'security first',
    'growth with integrity',
    'digital sovereignty',
  ];
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 220} />
      <CornerBrand palette={palette} />
      {words.map((word, i) => (
        <div
          key={word}
          style={{
            position: 'absolute',
            left: 100 + (i % 3) * 560,
            top: 100 + Math.floor(i / 3) * 280,
            fontFamily: fonts.display,
            fontSize: 60 - (i % 3) * 6,
            color: palette.text,
            opacity: interpolate((frame + i * 8) % 40, [0, 8, 30, 39], [0, 1, 1, 0], {extrapolateRight: 'clamp'}),
          }}
        >
          {word}
        </div>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={120 + i * 260}
          y={400 + Math.sin((frame + i * 8) / 12) * 18}
          width={240}
          height={150}
          rotate={-9 + i * 3}
          frame={frame}
          delay={i * 3}
          float={6}
        >
          <PanelHeader palette={palette} label="proof point" title={['TLS', 'Rate limits', 'AdminJS', 'Socket updates', 'Referral checks', 'Open-source trust'][i]} />
        </Panel>
      ))}
      <div style={{position: 'absolute', left: 90, right: 90, bottom: 86, height: 4, background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent2})`, boxShadow: `0 0 22px ${palette.accent2}`}} />
    </AbsoluteFill>
  );
};

const VelocityClose: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.velocity;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 320} />
      <CornerBrand palette={palette} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={90 + (i % 4) * 430}
          y={140 + Math.floor(i / 4) * 250}
          width={300}
          height={140}
          rotate={-8 + i * 2}
          frame={frame}
          delay={i * 5}
          float={8}
        >
          <div style={{padding: 18, fontFamily: fonts.body, fontSize: 28, lineHeight: 1.08, color: palette.text, fontWeight: 700}}>
            {['Private by default', 'Visible mission', 'Human-centered auth', 'Rewarded participation', 'Admin clarity', 'Future protocol', 'Realm XAI'][i]}
          </div>
        </Panel>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 86, textAlign: 'center', zIndex: 30}}>
        <div style={{fontFamily: fonts.display, fontSize: 72, color: palette.text, lineHeight: 0.94, letterSpacing: '-0.07em'}}>
          Privacy has entered a cleaner era.
        </div>
        <div style={{marginTop: 18, display: 'inline-block', borderRadius: 999, padding: '18px 30px', background: palette.text, color: '#FFFFFF', fontFamily: fonts.mono, fontSize: 20, letterSpacing: '0.16em', textTransform: 'uppercase'}}>
          Explore Realm XAI
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxVelocityCommercial: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Sequence from={0} durationInFrames={sceneDurations.intro}><VelocityIntro /></Sequence>
    <Sequence from={sceneDurations.intro} durationInFrames={sceneDurations.spread}><VelocitySpread /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread} durationInFrames={sceneDurations.proof}><VelocityProof /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread + sceneDurations.proof} durationInFrames={sceneDurations.close}><VelocityClose /></Sequence>
  </AbsoluteFill>
);

const AtlasIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.atlas;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame} />
      <CornerBrand palette={palette} />
      <HeroCopy
        palette={palette}
        frame={frame}
        title="A whole trust ecosystem, rendered clearly."
        body="This direction takes the cleaner references and pushes them harder: more windows, more bars, more staged product motion, and more readable proof."
      />
      <FloatingText palette={palette} frame={frame} messages={['private execution.', 'identity preserved.', 'participation rewarded.']} x={90} y={420} size={50} />
      {[0, 1, 2, 3].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={980 + (i % 2) * 290}
          y={140 + Math.floor(i / 2) * 220}
          width={280}
          height={180}
          rotate={-8 + i * 4}
          frame={frame}
          delay={i * 6}
        >
          <PanelHeader palette={palette} label="window" title={['Private sessions', 'Rewarded growth', 'Live trust signals', 'Admin oversight'][i]} />
          <div style={{padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12}}>
            {[0, 1, 2].map((j) => (
              <div key={j} style={{height: 14 + j * 3, borderRadius: 999, background: j === 0 ? palette.accent : `${palette.accent}44`}} />
            ))}
          </div>
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const AtlasSpread: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.atlas;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 100} />
      <CornerBrand palette={palette} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={80 + (i % 3) * 580 + (i % 2) * 10}
          y={140 + Math.floor(i / 3) * 190}
          width={360}
          height={150}
          rotate={-6 + (i % 3) * 4}
          frame={frame}
          delay={i * 3}
          float={10}
        >
          <div style={{padding: 16, display: 'flex', flexDirection: 'column', gap: 12}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <div style={{fontFamily: fonts.mono, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: palette.muted}}>
                realm xai
              </div>
              <div style={{display: 'flex', gap: 6}}>
                {['#FF6F61', '#FFB347', palette.accent].map((c) => (
                  <span key={c} style={{width: 8, height: 8, borderRadius: 999, background: c}} />
                ))}
              </div>
            </div>
            <div style={{fontFamily: fonts.body, fontSize: 24, lineHeight: 1.1, color: palette.text, fontWeight: 700}}>
              {['Users online', 'Mining sessions', 'Referral attribution', 'Wallet linking', 'Google auth', 'Reward balance', 'Admin actions', 'Security posture', 'Future protocol path'][i]}
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
              {[0, 1, 2].map((j) => (
                <div key={j} style={{height: 26 + j * 8, borderRadius: 12, background: j === 0 ? `${palette.accent}22` : `${palette.accent2}66`, border: `1px solid ${palette.line}`}} />
              ))}
            </div>
          </div>
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const AtlasProof: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.atlas;
  const terms = [
    'infrastructure of trust',
    'transparent privacy messaging',
    'real-time participation',
    'secure web interface',
    'clear rewards',
    'responsible adoption',
  ];
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 220} />
      <CornerBrand palette={palette} />
      {terms.map((term, i) => (
        <div
          key={term}
          style={{
            position: 'absolute',
            left: 100 + (i % 2) * 760,
            top: 100 + Math.floor(i / 2) * 150,
            fontFamily: fonts.display,
            fontSize: 52,
            color: palette.text,
            opacity: interpolate((frame + i * 7) % 36, [0, 8, 26, 35], [0, 1, 1, 0], {extrapolateRight: 'clamp'}),
          }}
        >
          {term}
        </div>
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={180 + i * 300}
          y={520 + Math.sin((frame + i * 5) / 14) * 12}
          width={250}
          height={120}
          rotate={-8 + i * 3}
          frame={frame}
          delay={i * 3}
          float={5}
        >
          <div style={{padding: 18, fontFamily: fonts.body, fontSize: 24, lineHeight: 1.06, color: palette.text, fontWeight: 700}}>
            {['TLS', 'Rate limiting', 'Unique accounts', 'Role access', 'Open-source transparency'][i]}
          </div>
        </Panel>
      ))}
    </AbsoluteFill>
  );
};

const AtlasClose: React.FC = () => {
  const frame = useCurrentFrame();
  const palette = PALETTES.atlas;
  return (
    <AbsoluteFill>
      <GradientBackdrop palette={palette} frame={frame + 320} />
      <CornerBrand palette={palette} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Panel
          key={i}
          palette={palette}
          x={120 + (i % 3) * 540}
          y={170 + Math.floor(i / 3) * 220}
          width={320}
          height={130}
          rotate={-8 + i * 3}
          frame={frame}
          delay={i * 5}
          float={8}
        >
          <div style={{padding: 18, fontFamily: fonts.body, fontSize: 30, lineHeight: 1.03, color: palette.text, fontWeight: 700}}>
            {['Private execution', 'Selective disclosure', 'Identity preservation', 'Participation incentives', 'Admin intelligence', 'Realm XAI'][i]}
          </div>
        </Panel>
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 82, textAlign: 'center', zIndex: 28}}>
        <div style={{fontFamily: fonts.display, fontSize: 72, color: palette.text, lineHeight: 0.94, letterSpacing: '-0.07em'}}>
          Build the next trust layer with Realm XAI.
        </div>
        <div style={{marginTop: 18, display: 'inline-block', borderRadius: 999, padding: '18px 30px', border: `1px solid ${palette.line}`, background: 'rgba(255,255,255,0.88)', color: palette.text, fontFamily: fonts.mono, fontSize: 20, letterSpacing: '0.16em', textTransform: 'uppercase'}}>
          Request Early Access
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealmxAtlasCommercial: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <Sequence from={0} durationInFrames={sceneDurations.intro}><AtlasIntro /></Sequence>
    <Sequence from={sceneDurations.intro} durationInFrames={sceneDurations.spread}><AtlasSpread /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread} durationInFrames={sceneDurations.proof}><AtlasProof /></Sequence>
    <Sequence from={sceneDurations.intro + sceneDurations.spread + sceneDurations.proof} durationInFrames={sceneDurations.close}><AtlasClose /></Sequence>
  </AbsoluteFill>
);
