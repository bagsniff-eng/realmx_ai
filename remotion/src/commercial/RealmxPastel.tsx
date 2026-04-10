import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

// ============================================================================
// TIMING CONSTANTS (450 frames total @ 30fps = 15s)
// ============================================================================
const FPS = 30;
const DURATION = 450;
const T = {
  INTRO_START: 0,
  INTRO_END: 90,
  ECOSYSTEM_START: 90,
  ECOSYSTEM_END: 240,
  GROWTH_START: 240,
  GROWTH_END: 360,
  OUTRO_START: 360,
  OUTRO_END: 450,
};

// ============================================================================
// COLORS & STYLES
// ============================================================================
const C = {
  bgStart: '#E6E6FA', // Lavender
  bgEnd: '#AFEEEE',   // Turquoise
  textPrimary: '#1E1B4B', // Deep Indigo
  textSecondary: '#4338CA', // Indigo slightly lighter
  cardBg: 'rgba(255, 255, 255, 0.65)',
  cardBorder: 'rgba(255, 255, 255, 0.9)',
  cardShadow: '0 20px 40px rgba(30, 27, 75, 0.05)',
  greenLive: '#10B981',
};

const sp = (frame: number, delay: number, fps: number = 30) => {
  return spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: { damping: 16, stiffness: 100, mass: 0.8 },
  });
};

const spBouncy = (frame: number, delay: number, fps: number = 30) => {
  return spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: { damping: 12, stiffness: 120, mass: 1 },
  });
};

// ============================================================================
// ICONS
// ============================================================================
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12.08c0-.85-.08-1.68-.22-2.48H12v4.69h5.69a5.4 5.4 0 0 1-2.35 3.55v2.94h3.8C21.36 18.73 22 15.65 22 12.08z"/>
    <path d="M12 22c2.81 0 5.18-.93 6.9-2.52l-3.8-2.94c-.94.63-2.14 1.01-3.1 1.01-2.4 0-4.43-1.62-5.16-3.8H2.9v3.04C4.64 20.25 8.04 22 12 22z"/>
    <path d="M6.84 13.75a6.04 6.04 0 0 1 0-3.5V7.21H2.9a10.05 10.05 0 0 0 0 9.58l3.94-3.04z"/>
    <path d="M12 5.38c1.53 0 2.91.53 3.99 1.55l2.99-2.99C17.17 2.16 14.8 1 12 1 8.04 1 4.64 2.75 2.9 6.25l3.94 3.04C7.57 7 9.6 5.38 12 5.38z"/>
  </svg>
);

const RankIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
const GlassCard: React.FC<{
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ children, width, height, style }) => {
  return (
    <div
      style={{
        background: C.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '24px',
        boxShadow: C.cardShadow,
        width: width,
        height: height,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const WhisperedText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <h1
    style={{
      fontFamily: '"Fraunces", serif',
      fontWeight: 300,
      fontSize: '84px',
      color: C.textPrimary,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      margin: 0,
      ...style,
    }}
  >
    {children}
  </h1>
);

// ============================================================================
// ECOSYSTEM CARDS
// ============================================================================
const NodeStatusCard: React.FC = () => {
  const frame = useCurrentFrame();
  const uptimeFloat = interpolate(frame, [0, 450], [99.8, 99.99]);
  
  return (
    <GlassCard width={320} height={180}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontFamily: '"IBM Plex Mono", monospace', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Node Status</div>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: C.greenLive, boxShadow: `0 0 10px ${C.greenLive}` }} />
      </div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '48px', fontFamily: '"Fraunces", serif', fontWeight: 500, color: C.textPrimary }}>{uptimeFloat.toFixed(2)}%</div>
        <div style={{ fontSize: '16px', color: '#6B7280', fontFamily: '"Source Sans 3", sans-serif' }}>Session Uptime</div>
      </div>
    </GlassCard>
  );
};

const PointsMeterCard: React.FC = () => {
  const frame = useCurrentFrame();
  const pts = Math.floor(interpolate(frame, [0, 200], [12500, 12525], { extrapolateRight: 'clamp' }));
  const progress = interpolate(frame, [0, 200], [60, 68], { extrapolateRight: 'clamp' });
  
  return (
    <GlassCard width={320} height={180}>
      <div style={{ fontSize: '14px', fontFamily: '"IBM Plex Mono", monospace', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Points Balance</div>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ fontSize: '48px', fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color: C.textPrimary }}>
          {pts.toLocaleString()}
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${C.textSecondary}, #8B5CF6)`, borderRadius: '3px' }} />
        </div>
      </div>
    </GlassCard>
  );
};

const ReferralCard: React.FC = () => (
  <GlassCard width={320} height={120} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
    <div>
      <div style={{ fontSize: '14px', fontFamily: '"IBM Plex Mono", monospace', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Referral Code</div>
      <div style={{ fontSize: '20px', fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, color: C.textPrimary, background: 'rgba(255,255,255,0.5)', padding: '8px 12px', borderRadius: '8px' }}>RLMX-8A2F</div>
    </div>
    <div style={{ color: C.textSecondary, cursor: 'pointer', background: 'rgba(255,255,255,0.8)', padding: '12px', borderRadius: '50%' }}>
      <CopyIcon />
    </div>
  </GlassCard>
);

const RankCard: React.FC = () => (
  <GlassCard width={150} height={150} style={{ alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
    <RankIcon />
    <div style={{ fontSize: '14px', fontFamily: '"IBM Plex Mono", monospace', color: C.textSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Global Rank</div>
    <div style={{ fontSize: '32px', fontFamily: '"Fraunces", serif', fontWeight: 600, color: C.textPrimary }}>#15</div>
  </GlassCard>
);

const WalletCard: React.FC<{ type: 'wallet' | 'google' }> = ({ type }) => {
  return (
    <GlassCard width={260} height={80} style={{ flexDirection: 'row', alignItems: 'center', gap: '16px', padding: '0 20px' }}>
      <div style={{ padding: '8px', background: 'rgba(255,255,255,0.8)', borderRadius: '12px' }}>
        {type === 'wallet' ? <WalletIcon /> : <GoogleIcon />}
      </div>
      <div>
        <div style={{ fontSize: '16px', fontFamily: '"Source Sans 3", sans-serif', fontWeight: 600, color: C.textPrimary }}>
          {type === 'wallet' ? 'WalletConnect' : 'Google Account'}
        </div>
        <div style={{ fontSize: '13px', color: '#6B7280', fontFamily: '"Source Sans 3", sans-serif' }}>Connected</div>
      </div>
    </GlassCard>
  );
};


// ============================================================================
// SCENES
// ============================================================================

const Scene1Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const o1 = interpolate(frame, [0, 15, 40, 50], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const y1 = interpolate(frame, [0, 50], [20, -10], { extrapolateRight: 'clamp' });
  
  const o2 = interpolate(frame, [45, 60, 85, 90], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const y2 = interpolate(frame, [45, 90], [20, -10], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: '120px' }}>
      <div style={{ position: 'absolute', opacity: o1, transform: `translateY(${y1}px)` }}>
        <WhisperedText>Pseudonymous&nbsp;<br />security.</WhisperedText>
      </div>
      <div style={{ position: 'absolute', opacity: o2, transform: `translateY(${y2}px)` }}>
        <WhisperedText>Fair&nbsp;<br />earnings.</WhisperedText>
      </div>
    </AbsoluteFill>
  );
};

const Scene2Ecosystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Entire ecosystem group glides into place smoothly, then stays
  // We use spring to bring them in, then let them hover
  const groupY = interpolate(sp(frame, 0, fps), [0, 1], [400, 0]);
  const groupOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  
  // They hover gently up and down over time
  const hoverY = Math.sin(frame / 30) * 10;
  
  // Transition out when scene ends (frames 135 to 150 = global 225-240)
  const masterFadeOut = interpolate(frame, [135, 150], [1, 1], { extrapolateRight: 'clamp' }); // Oh wait, they persist into scene 3. We'll just let them jump/offset in Scene 3 instead.
  // Actually, to make sliding and rearranging work across scenes without cutting, we can render the Cluster globally and modify its transforms via the main absolute time.
  // We'll move the cards up to the main component to share state, or just render Scene 2 and Scene 3 as one continuous sequence!
  return null; // Implemented in global scope
};

const Scene4Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const titleO = interpolate(frame, [0, 20, 50, 60], [0, 1, 1, 0], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 60], [20, -10]);

  const logoO = interpolate(frame, [50, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoScale = interpolate(spBouncy(frame, 50, 30), [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', opacity: titleO, transform: `translateY(${titleY}px)` }}>
        <WhisperedText style={{ textAlign: 'center', fontSize: '72px' }}>Smart earning,<br />zero complexity.</WhisperedText>
      </div>
      
      <div style={{ position: 'absolute', opacity: logoO, transform: `scale(${logoScale})`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ 
          width: '100px', height: '100px', background: C.textPrimary, borderRadius: '24px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(30, 27, 75, 0.2)' 
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
        </div>
        <div style={{ marginTop: '24px', fontFamily: '"Fraunces", serif', fontSize: '32px', color: C.textPrimary, fontWeight: 500, fontStyle: 'italic' }}>
          Realm<span style={{color: '#8B5CF6', fontStyle: 'normal'}}>X</span>AI
        </div>
      </div>
    </AbsoluteFill>
  );
};


// ============================================================================
// MAIN COMPOSITION
// ============================================================================

export const RealmxPastel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background shifts gently from lavender to turquoise
  const bgAngle = interpolate(frame, [0, DURATION], [135, 180]);
  
  // ECOSYSTEM CLUSTER LOGIC (Visible from T.ECOSYSTEM_START to T.OUTRO_START)
  // We define it in the root to allow continuous sliding animations between scenes!
  
  // Intro to hover phase
  const isClusterVisible = frame >= T.ECOSYSTEM_START && frame <= T.OUTRO_START;
  const clusterInY = interpolate(spBouncy(frame, T.ECOSYSTEM_START, fps), [0, 1], [600, 0]);
  const clusterHoverY = Math.sin(frame / 20) * 15;
  const clusterOp = interpolate(frame, [T.ECOSYSTEM_START, T.ECOSYSTEM_START + 15], [0, 1], { extrapolateRight: 'clamp' });
  const clusterOutOp = interpolate(frame, [T.OUTRO_START - 20, T.OUTRO_START], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  
  // Growth phase shift (Cluster moves to left, scales down slightly)
  const shiftX = interpolate(sp(frame, T.GROWTH_START, fps), [0, 1], [0, -350]);
  const shiftScale = interpolate(sp(frame, T.GROWTH_START, fps), [0, 1], [1, 0.85]);

  // Wallet cards gliding in during Growth Phase
  const walletsVisible = frame >= T.GROWTH_START && frame <= T.OUTRO_START;
  const walletsX = interpolate(spBouncy(frame, T.GROWTH_START + 10, fps), [0, 1], [400, 200]);
  const walletsY = interpolate(spBouncy(frame, T.GROWTH_START + 10, fps), [0, 1], [200, 0]);
  const walletsOp = interpolate(frame, [T.GROWTH_START + 10, T.GROWTH_START + 25], [0, 1], { extrapolateRight: 'clamp' });

  // Growth Text Logic
  const growthTextOp = interpolate(frame, [T.GROWTH_START + 15, T.GROWTH_START + 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const growthTextOutOp = interpolate(frame, [T.OUTRO_START - 20, T.OUTRO_START], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const growthTextY = interpolate(sp(frame, T.GROWTH_START + 15, fps), [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ 
      background: `linear-gradient(${bgAngle}deg, ${C.bgStart} 0%, ${C.bgEnd} 100%)`,
      overflow: 'hidden'
    }}>
      
      {/* SCENE 1: Intro */}
      <Sequence from={T.INTRO_START} durationInFrames={T.INTRO_END - T.INTRO_START}>
        <Scene1Intro />
      </Sequence>
      
      {/* THE CONTINUOUS ECOSYSTEM CLUSTER */}
      {isClusterVisible && (
        <AbsoluteFill style={{ 
          alignItems: 'center', 
          justifyContent: 'center',
          opacity: Math.min(clusterOp, clusterOutOp) * (frame < T.OUTRO_START ? 1 : 0),
          transform: `translate(${shiftX}px, ${clusterInY + clusterHoverY}px) scale(${shiftScale})`
        }}>
          <div style={{ position: 'relative', width: '800px', height: '600px' }}>
            <div style={{ position: 'absolute', top: '100px', left: '100px' }}>
              <NodeStatusCard />
            </div>
            <div style={{ position: 'absolute', top: '300px', left: '150px' }}>
              <PointsMeterCard />
            </div>
            <div style={{ position: 'absolute', top: '140px', right: '120px' }}>
              <ReferralCard />
            </div>
            <div style={{ position: 'absolute', top: '300px', right: '180px' }}>
              <RankCard />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* THE NEW WALLET CLUSTER ADDED IN GROWTH PHASE */}
      {walletsVisible && (
        <AbsoluteFill style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: Math.min(walletsOp, clusterOutOp),
          transform: `translate(${walletsX}px, ${walletsY + clusterHoverY * 0.5}px)`
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <WalletCard type="wallet" />
            <WalletCard type="google" />
            <div style={{ 
              marginTop: '12px',
              marginLeft: '20px',
              fontFamily: '"Source Sans 3", sans-serif', 
              fontSize: '24px', 
              color: C.textPrimary,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(10px)',
              padding: '12px 24px',
              borderRadius: '20px',
              width: 'fit-content'
            }}>
              +25 pts today
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* GROWTH TEXT HEADER */}
      {walletsVisible && (
        <AbsoluteFill style={{ padding: '80px 120px', opacity: Math.min(growthTextOp, growthTextOutOp), transform: `translateY(${growthTextY}px)` }}>
          <WhisperedText style={{ fontSize: '64px' }}>Your privacy is in<br />growth mode.</WhisperedText>
        </AbsoluteFill>
      )}

      {/* SCENE 4: Outro */}
      <Sequence from={T.OUTRO_START} durationInFrames={DURATION - T.OUTRO_START}>
        <Scene4Outro />
      </Sequence>
      
    </AbsoluteFill>
  );
};
