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
const TOTAL = 750;

const COLORS = {
  cream: '#F7F5F2',
  slate: '#1A1A29',
  purple: '#8A2BE2',
  ink: '#20243C',
  muted: '#666C88',
  border: 'rgba(32,36,60,0.12)',
  success: '#2FBF71',
  white: '#FFFFFF',
};

const fonts = {
  heading: '"Montserrat", "Inter", sans-serif',
  body: '"Inter", "Segoe UI", sans-serif',
};

const logo = staticFile('le6jxytl.webp');

const Background: React.FC<{frame: number; dark?: boolean}> = ({frame, dark = false}) => {
  const drift = interpolate(frame, [0, TOTAL], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? COLORS.slate : COLORS.cream,
        backgroundImage: dark
          ? [
              `radial-gradient(circle at ${18 + drift * 8}% ${18 + drift * 5}%, rgba(138,43,226,0.16), transparent 26%)`,
              `radial-gradient(circle at ${78 - drift * 7}% ${80 - drift * 6}%, rgba(138,43,226,0.1), transparent 28%)`,
            ].join(',')
          : [
              `radial-gradient(circle at ${14 + drift * 8}% ${18 + drift * 5}%, rgba(138,43,226,0.12), transparent 24%)`,
              `radial-gradient(circle at ${78 - drift * 6}% ${84 - drift * 6}%, rgba(138,43,226,0.08), transparent 28%)`,
            ].join(','),
      }}
    />
  );
};

const LogoTopLeft: React.FC<{dark?: boolean}> = ({dark = false}) => (
  <div
    style={{
      position: 'absolute',
      left: 58,
      top: 48,
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      zIndex: 20,
    }}
  >
    <div
      style={{
        width: 62,
        height: 62,
        borderRadius: 18,
        background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : COLORS.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: dark ? '0 18px 40px rgba(0,0,0,0.24)' : '0 18px 40px rgba(32,36,60,0.08)',
      }}
    >
      <Img src={logo} style={{width: '74%', height: '74%', objectFit: 'contain'}} />
    </div>
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 30,
        fontWeight: 700,
        color: dark ? COLORS.white : COLORS.ink,
      }}
    >
      RealmxAI
    </div>
  </div>
);

const Card: React.FC<{
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  delay?: number;
  fromX?: number;
  dark?: boolean;
  children: React.ReactNode;
}> = ({frame, x, y, width, height, delay = 0, fromX = 0, dark = false, children}) => {
  const enter = spring({
    fps: FPS,
    frame: Math.max(0, frame - delay),
    config: {damping: 16, stiffness: 120, mass: 0.92},
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x + interpolate(enter, [0, 1], [fromX, 0]),
        top: y,
        width,
        height,
        borderRadius: 34,
        background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.96)',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : COLORS.border}`,
        boxShadow: dark ? '0 30px 80px rgba(0,0,0,0.28)' : '0 28px 70px rgba(32,36,60,0.1)',
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [22, 0])}px)`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const Button: React.FC<{label: string; width?: number}> = ({label, width = 330}) => (
  <div
    style={{
      width,
      height: 72,
      borderRadius: 999,
      background: COLORS.purple,
      color: COLORS.white,
      fontFamily: fonts.heading,
      fontSize: 28,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 18px 40px rgba(138,43,226,0.24)',
    }}
  >
    {label}
  </div>
);

const Spinner: React.FC<{frame: number}> = ({frame}) => (
  <div
    style={{
      width: 50,
      height: 50,
      borderRadius: 999,
      border: `5px solid rgba(138,43,226,0.18)`,
      borderTopColor: COLORS.purple,
      transform: `rotate(${frame * 18}deg)`,
    }}
  />
);

const CheckState: React.FC<{label: string}> = ({label}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: 999,
        background: COLORS.success,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 20,
          height: 10,
          borderLeft: '4px solid #FFFFFF',
          borderBottom: '4px solid #FFFFFF',
          transform: 'rotate(-45deg) translateY(-2px)',
        }}
      />
    </div>
    <div
      style={{
        fontFamily: fonts.heading,
        fontSize: 32,
        fontWeight: 700,
        color: COLORS.ink,
      }}
    >
      {label}
    </div>
  </div>
);

const MetaMaskIcon: React.FC = () => (
  <div
    style={{
      width: 68,
      height: 68,
      borderRadius: 20,
      background: '#FFF0E5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: 700,
      color: '#D96B2B',
    }}
  >
    MM
  </div>
);

const WalletConnectIcon: React.FC = () => (
  <div
    style={{
      width: 68,
      height: 68,
      borderRadius: 20,
      background: '#EAF4FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: fonts.heading,
      fontSize: 18,
      fontWeight: 700,
      color: '#3478F6',
    }}
  >
    WC
  </div>
);

const Cursor: React.FC<{x: number; y: number}> = ({x, y}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 0,
      height: 0,
      borderLeft: '18px solid #20243C',
      borderTop: '26px solid transparent',
      borderBottom: '10px solid transparent',
      filter: 'drop-shadow(0 10px 14px rgba(32,36,60,0.18))',
    }}
  />
);

const LogoBadge: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      background: 'rgba(255,255,255,0.95)',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 22px 50px rgba(32,36,60,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Img src={logo} style={{width: '74%', height: '74%', objectFit: 'contain'}} />
  </div>
);

const WelcomeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = ['Secure.', 'Earn.', 'Share.'];

  return (
    <AbsoluteFill>
      <Background frame={frame} />
      <LogoTopLeft />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        {lines.map((line, i) => {
          const local = frame - i * 18;
          const opacity = interpolate(local, [0, 10, 40], [0, 1, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={line}
              style={{
                fontFamily: fonts.heading,
                fontSize: 84,
                lineHeight: 0.95,
                fontWeight: 700,
                color: COLORS.ink,
                opacity,
                transform: `translateY(${interpolate(local, [0, 16], [20, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                })}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
        <div
          style={{
            marginTop: 26,
            opacity: interpolate(frame, [70, 95, 120], [0, 1, 1], {
              extrapolateLeft: 'clamp',
            }),
          }}
        >
          <Button label="Start Your Node" width={390} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WalletScene: React.FC = () => {
  const frame = useCurrentFrame();
  const clickFrame = 58;
  const successFrame = 108;

  return (
    <AbsoluteFill>
      <Background frame={frame + 100} />
      <LogoTopLeft />
      <Card frame={frame} x={470} y={230} width={980} height={540}>
        <div style={{padding: '44px 56px', display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{fontFamily: fonts.heading, fontSize: 54, fontWeight: 700, color: COLORS.ink}}>Connect your wallet</div>
          <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 30, color: COLORS.muted}}>Secure your node session in one click.</div>
          <div style={{marginTop: 38, display: 'flex', gap: 18}}>
            <MetaMaskIcon />
            <WalletConnectIcon />
          </div>
          <div style={{marginTop: 52, position: 'relative', width: 360}}>
            <Button label="Connect Wallet" width={360} />
            {frame < successFrame ? (
              <Cursor
                x={298 + interpolate(frame, [0, clickFrame], [80, 0], {extrapolateRight: 'clamp'})}
                y={32 + interpolate(frame, [0, clickFrame], [40, 0], {extrapolateRight: 'clamp'})}
              />
            ) : null}
          </div>
          <div style={{marginTop: 60, height: 72, display: 'flex', alignItems: 'center'}}>
            {frame < clickFrame ? null : frame < successFrame ? <Spinner frame={frame - clickFrame} /> : <CheckState label="Wallet connected!" />}
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const GoogleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const clickFrame = 56;
  const successFrame = 108;

  return (
    <AbsoluteFill>
      <Background frame={frame + 220} dark />
      <LogoTopLeft dark />
      <Card frame={frame} x={470} y={230} width={980} height={540} fromX={-200}>
        <div style={{padding: '44px 56px', display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{fontFamily: fonts.heading, fontSize: 54, fontWeight: 700, color: COLORS.ink}}>Verify with Google</div>
          <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 30, color: COLORS.muted}}>Link identity to activate trusted mining.</div>
          <div
            style={{
              marginTop: 42,
              width: 88,
              height: 88,
              borderRadius: 24,
              background: '#FFFFFF',
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.heading,
              fontSize: 34,
              fontWeight: 700,
              color: '#4285F4',
            }}
          >
            G
          </div>
          <div style={{marginTop: 42, position: 'relative', width: 420}}>
            <Button label="Link Google account" width={420} />
            {frame < successFrame ? (
              <Cursor
                x={340 + interpolate(frame, [0, clickFrame], [60, 0], {extrapolateRight: 'clamp'})}
                y={36 + interpolate(frame, [0, clickFrame], [40, 0], {extrapolateRight: 'clamp'})}
              />
            ) : null}
          </div>
          <div style={{marginTop: 60, height: 72, display: 'flex', alignItems: 'center'}}>
            {frame < clickFrame ? null : frame < successFrame ? <Spinner frame={frame - clickFrame} /> : <CheckState label="Google verified." />}
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const MiningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const clickFrame = 46;
  const expand = spring({
    fps: FPS,
    frame: Math.max(0, frame - clickFrame),
    config: {damping: 15, stiffness: 110, mass: 0.94},
  });
  const points = Math.round(
    interpolate(frame, [clickFrame + 12, 170], [0, 50], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <AbsoluteFill>
      <Background frame={frame + 350} />
      <LogoTopLeft />
      <Card frame={frame} x={470} y={220} width={980} height={560}>
        <div style={{padding: '44px 56px', display: 'flex', flexDirection: 'column', height: '100%'}}>
          <div style={{fontFamily: fonts.heading, fontSize: 54, fontWeight: 700, color: COLORS.ink}}>Start Mining</div>
          <div style={{marginTop: 18, fontFamily: fonts.body, fontSize: 30, color: COLORS.muted}}>Activate your node and watch points accumulate.</div>
          <div style={{marginTop: 48, position: 'relative', width: 340}}>
            <Button label="Start Mining" width={340} />
            {frame < clickFrame ? (
              <Cursor
                x={284 + interpolate(frame, [0, clickFrame], [70, 0], {extrapolateRight: 'clamp'})}
                y={34 + interpolate(frame, [0, clickFrame], [40, 0], {extrapolateRight: 'clamp'})}
              />
            ) : null}
          </div>
          <div
            style={{
              marginTop: 56,
              opacity: interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], {
                extrapolateLeft: 'clamp',
              }),
            }}
          >
            <div style={{fontFamily: fonts.heading, fontSize: 34, fontWeight: 700, color: COLORS.ink}}>Mining active</div>
            <div style={{marginTop: 22, width: 760, height: 26, borderRadius: 999, background: 'rgba(138,43,226,0.12)'}}>
              <div
                style={{
                  width: `${interpolate(expand, [0, 1], [0, 100])}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${COLORS.purple}, ${COLORS.success})`,
                }}
              />
            </div>
            <div style={{marginTop: 34, fontFamily: fonts.heading, fontSize: 82, fontWeight: 700, color: COLORS.ink}}>
              {points}
            </div>
            <div style={{marginTop: 10, fontFamily: fonts.body, fontSize: 28, color: COLORS.muted}}>points earned</div>
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

const ReferralScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 14) * 0.03;

  return (
    <AbsoluteFill>
      <Background frame={frame + 520} />
      <LogoTopLeft />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 110,
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${pulse})`,
        }}
      >
        <LogoBadge size={136} />
      </div>
      <Card frame={frame} x={500} y={290} width={920} height={430}>
        <div
          style={{
            padding: '42px 56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            height: '100%',
          }}
        >
          <div style={{fontFamily: fonts.heading, fontSize: 48, fontWeight: 700, color: COLORS.ink}}>Referral Code</div>
          <div
            style={{
              marginTop: 36,
              fontFamily: fonts.heading,
              fontSize: 68,
              fontWeight: 700,
              color: COLORS.purple,
              letterSpacing: '0.08em',
            }}
          >
            RL-12345-AI
          </div>
          <div style={{marginTop: 22, fontFamily: fonts.body, fontSize: 30, color: COLORS.muted}}>Invite friends to earn more.</div>
          <div style={{marginTop: 40}}>
            <Button label="Copy code" width={280} />
          </div>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

export const RealmxNodeFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [720, 749], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity: fadeOut}}>
      <Sequence from={0} durationInFrames={120}>
        <WelcomeScene />
      </Sequence>
      <Sequence from={120} durationInFrames={150}>
        <WalletScene />
      </Sequence>
      <Sequence from={270} durationInFrames={150}>
        <GoogleScene />
      </Sequence>
      <Sequence from={420} durationInFrames={180}>
        <MiningScene />
      </Sequence>
      <Sequence from={600} durationInFrames={150}>
        <ReferralScene />
      </Sequence>
    </AbsoluteFill>
  );
};
