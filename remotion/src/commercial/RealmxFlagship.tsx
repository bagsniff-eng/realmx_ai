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
// TIMING CONSTANTS (540 frames @ 30fps = 18s)
// ============================================================================
const FPS = 30;
const DURATION = 540;

const T = {
  FORGE_START: 0,
  FORGE_END: 135,       // 4.5s
  NETWORK_START: 135,
  NETWORK_END: 285,     // 9.5s
  ORBIT_START: 285,
  ORBIT_END: 420,       // 14s
  MONUMENT_START: 420,
  MONUMENT_END: 540,    // 18s
};

// ============================================================================
// COLORS & STYLES
// ============================================================================
const C = {
  bg: '#05030A',
  purple: '#8B5CF6',
  purpleGlow: 'rgba(139, 92, 246, 0.6)',
  violet: '#6D28D9',
  teal: '#14B8A6',
  tealGlow: 'rgba(20, 184, 166, 0.5)',
  panelBg: 'rgba(12, 10, 20, 0.75)',
  panelBorder: 'rgba(139, 92, 246, 0.25)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A78BFA',
};

const FONT_DISPLAY = '"Fraunces", serif';
const FONT_MONO = '"IBM Plex Mono", monospace';
const FONT_BODY = '"Source Sans 3", sans-serif';

// Basic spring wrapper
const sp = (frame: number, delay: number, fps: number = 30) => {
  return spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 14, stiffness: 90, mass: 0.8 } });
};

// ============================================================================
// ICONS
// ============================================================================
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12.08c0-.85-.08-1.68-.22-2.48H12v4.69h5.69a5.4 5.4 0 0 1-2.35 3.55v2.94h3.8C21.36 18.73 22 15.65 22 12.08z"/>
    <path d="M12 22c2.81 0 5.18-.93 6.9-2.52l-3.8-2.94c-.94.63-2.14 1.01-3.1 1.01-2.4 0-4.43-1.62-5.16-3.8H2.9v3.04C4.64 20.25 8.04 22 12 22z"/>
    <path d="M6.84 13.75a6.04 6.04 0 0 1 0-3.5V7.21H2.9a10.05 10.05 0 0 0 0 9.58l3.94-3.04z"/>
    <path d="M12 5.38c1.53 0 2.91.53 3.99 1.55l2.99-2.99C17.17 2.16 14.8 1 12 1 8.04 1 4.64 2.75 2.9 6.25l3.94 3.04C7.57 7 9.6 5.38 12 5.38z"/>
  </svg>
);

// ============================================================================
// UI MODULES (3D Floating Panels)
// ============================================================================

const FloatingPanel: React.FC<{
  x: number; y: number; z: number;
  rotY?: number; rotX?: number;
  width?: number; height?: number;
  children: React.ReactNode;
  frame: number;
  delay?: number;
}> = ({ x, y, z, rotY = 0, rotX = 0, width = 300, height = 180, children, frame, delay = 0 }) => {
  const enter = sp(frame, delay);
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width, height,
        marginLeft: -width / 2, marginTop: -height / 2,
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${interpolate(enter, [0, 1], [0.8, 1])})`,
        opacity: interpolate(enter, [0, 1], [0, 1]),
        background: C.panelBg,
        border: `1px solid ${C.panelBorder}`,
        borderRadius: '16px',
        boxShadow: `0 0 30px ${C.purpleGlow}, inset 0 0 20px rgba(139, 92, 246, 0.1)`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '24px',
        display: 'flex', flexDirection: 'column',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Light sweep reflection */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '16px', pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
      }} />
      {children}
    </div>
  );
};

// ============================================================================
// SCENES
// ============================================================================

const Act1Forge: React.FC<{ frame: number }> = ({ frame }) => {
  const scale = interpolate(sp(frame, 15), [0, 1], [0, 1.2]);
  const rotation = frame * 1.5;
  const pulse = 1 + Math.sin(frame / 8) * 0.15;
  const fadeOut = interpolate(frame, [T.FORGE_END - 20, T.FORGE_END], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const officialLogoOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const energyOpacity = interpolate(frame, [60, 90], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
      {/* Swirling energy sphere */}
      <div style={{
        position: 'absolute', 
        width: '400px', height: '400px',
        transform: `scale(${scale * pulse}) rotate(${rotation}deg)`,
        opacity: energyOpacity,
        filter: 'blur(8px)',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke={C.purple} strokeWidth="2" strokeDasharray="10 20" />
          <circle cx="50" cy="50" r="30" fill="none" stroke={C.teal} strokeWidth="1.5" strokeDasharray="5 15" transform={`rotate(${-rotation * 2} 50 50)`} />
          <circle cx="50" cy="50" r="20" fill="none" stroke={C.violet} strokeWidth="4" opacity="0.6" />
        </svg>
      </div>

      {/* Official Logo Forging */}
      <div style={{
        position: 'absolute',
        transform: `scale(${scale * pulse})`,
        opacity: officialLogoOpacity,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        boxShadow: `0 0 120px ${C.purpleGlow}`,
        borderRadius: '50%'
      }}>
        <Img src={staticFile('logo.webp')} style={{ width: 140, height: 140, objectFit: 'contain' }} />
      </div>

      {/* Glow aura */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        background: `radial-gradient(circle, ${C.purpleGlow} 0%, transparent 60%)`,
        opacity: scale * 0.8,
        transform: `scale(${pulse})`,
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};

const Act2NetworkDive: React.FC<{ frame: number }> = ({ frame }) => {
  // We offset the frame locally to start components properly
  const localFrame = frame - T.NETWORK_START;
  const isVisible = frame >= T.NETWORK_START - 30 && frame <= T.NETWORK_END;
  if (!isVisible) return null;

  // Camera pushes forward heavily in Z space
  // Global container holds all panels
  const zDolly = interpolate(localFrame, [0, T.NETWORK_END - T.NETWORK_START], [-3000, 1000]);
  const camRotY = Math.sin(localFrame / 30) * 10;
  const camRotX = Math.cos(localFrame / 40) * 5;

  return (
    <AbsoluteFill style={{ perspective: '1200px', overflow: 'hidden' }}>
      <div style={{
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${zDolly}px) rotateY(${camRotY}deg) rotateX(${camRotX}deg)`,
      }}>
        
        {/* Connection Lines rendered behind panels */}
        <svg style={{ position: 'absolute', width: '200vw', height: '200vh', top: '-50vh', left: '-50vw', transform: 'translateZ(-1500px)' }}>
           <path d="M 50vw 100vh Q 80vw 50vh 150vw 150vh" fill="none" stroke={C.purple} strokeWidth="4" strokeDasharray="20 40" style={{opacity: 0.3}} />
           <path d="M 0 50vh Q 100vw 20vh 200vw 100vh" fill="none" stroke={C.teal} strokeWidth="2" strokeDasharray="10 30" style={{opacity: 0.2}} />
        </svg>

        {/* Dashboards floating in space */}
        {/* Center-far panel */}
        <FloatingPanel frame={localFrame} delay={10} x={0} y={-100} z={-1500} width={400} height={200}>
           <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.textSecondary }}>Network Status</div>
           <div style={{ fontSize: 56, fontFamily: FONT_DISPLAY, color: C.textPrimary, marginTop: 'auto' }}>
              1,500 <span style={{fontSize: 24, fontFamily: FONT_BODY, color: C.teal}}>Active Threads</span>
           </div>
        </FloatingPanel>

        {/* Left-mid panel */}
        <FloatingPanel frame={localFrame} delay={20} x={-600} y={150} z={-800} rotY={25} width={320} height={220}>
           <ShieldIcon />
           <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.textSecondary, marginTop: 12 }}>Privacy Routing</div>
           <div style={{ fontSize: 32, fontFamily: FONT_BODY, color: C.textPrimary, marginTop: 8, fontWeight: 600 }}>Zero-Knowledge</div>
           <div style={{ width: '100%', height: 4, background: C.panelBorder, marginTop: 'auto', borderRadius: 2 }}>
             <div style={{ width: '78%', height: '100%', background: C.teal, borderRadius: 2 }} />
           </div>
        </FloatingPanel>

        {/* Right-near panel */}
        <FloatingPanel frame={localFrame} delay={30} x={800} y={0} z={-400} rotY={-30} width={340} height={160}>
           <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.textSecondary }}>Encrypted Shards</div>
           <div style={{ fontSize: 42, fontFamily: FONT_MONO, color: C.textPrimary, marginTop: 'auto' }}>
             {Math.floor(interpolate(localFrame, [0, 100], [4280, 4892])).toLocaleString()}
           </div>
        </FloatingPanel>

        {/* Top-mid panel */}
        <FloatingPanel frame={localFrame} delay={40} x={250} y={-500} z={-1000} rotX={20} width={280} height={140}>
           <div style={{ fontSize: 14, fontFamily: FONT_MONO, color: C.textSecondary }}>RealmxAI Uptime</div>
           <div style={{ fontSize: 36, fontFamily: FONT_DISPLAY, color: '#10B981', marginTop: 'auto' }}>
             99.999%
           </div>
        </FloatingPanel>
      </div>
    </AbsoluteFill>
  );
};

const Act3Orbit: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - T.ORBIT_START;
  const isVisible = frame >= T.ORBIT_START - 20 && frame <= T.ORBIT_END;
  if (!isVisible) return null;

  // Camera orbits a central cluster
  // Rotate around Y axis over time
  const orbitAngle = interpolate(localFrame, [0, T.ORBIT_END - T.ORBIT_START], [-80, 80]);
  const camZ = interpolate(localFrame, [0, T.ORBIT_END - T.ORBIT_START], [-800, -600]);

  const introOpacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const outroOpacity = interpolate(localFrame, [T.ORBIT_END - T.ORBIT_START - 20, T.ORBIT_END - T.ORBIT_START], [1, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ perspective: '1000px', backgroundColor: 'transparent', opacity: Math.min(introOpacity, outroOpacity) }}>
      <div style={{
        width: '100%', height: '100%',
        transformStyle: 'preserve-3d',
        transform: `translateZ(${camZ}px) rotateX(-10deg) rotateY(${orbitAngle}deg)`,
      }}>
        
        {/* Core Node Indicator */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 200, height: 200, marginLeft: -100, marginTop: -100,
          background: `radial-gradient(circle, ${C.purpleGlow}, transparent 70%)`,
          transform: `rotateY(${-orbitAngle}deg)`, // Billboard it so it always faces camera
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
           <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.bg, border: `2px solid ${C.purple}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${C.purple}` }}>
              <Img src={staticFile('logo.webp')} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
           </div>
        </div>

        {/* Orbiting Wallet Panel 1 */}
        <FloatingPanel frame={localFrame} delay={10} x={400} y={-100} z={200} rotY={-45} width={240} height={120}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <WalletIcon />
            <span style={{ fontFamily: FONT_BODY, fontSize: 18, color: C.textPrimary, fontWeight: 600 }}>Web3 Wallet</span>
          </div>
          <div style={{ marginTop: 'auto', fontFamily: FONT_MONO, fontSize: 12, color: C.teal }}>0x8A2B...9F1A Verified</div>
        </FloatingPanel>

        {/* Orbiting Google Panel 2 */}
        <FloatingPanel frame={localFrame} delay={20} x={-400} y={150} z={-200} rotY={45} width={240} height={120}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GoogleIcon />
            <span style={{ fontFamily: FONT_BODY, fontSize: 18, color: C.textPrimary, fontWeight: 600 }}>Google Sign-In</span>
          </div>
          <div style={{ marginTop: 'auto', fontFamily: FONT_MONO, fontSize: 12, color: '#10B981' }}>Secure Auth Active</div>
        </FloatingPanel>

        {/* Connecting Beams */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, transform: 'translateZ(0px)', overflow: 'visible' }}>
          <line x1="50%" y1="50%" x2="calc(50% + 400px)" y2="calc(50% - 100px)" stroke={C.purple} strokeWidth="3" opacity="0.4" strokeDasharray="10 10">
            <animate attributeName="stroke-dashoffset" values="40;0" dur="2s" repeatCount="indefinite" />
          </line>
          <line x1="50%" y1="50%" x2="calc(50% - 400px)" y2="calc(50% + 150px)" stroke={C.teal} strokeWidth="3" opacity="0.4" strokeDasharray="10 10">
            <animate attributeName="stroke-dashoffset" values="0;40" dur="2s" repeatCount="indefinite" />
          </line>
        </svg>

      </div>
    </AbsoluteFill>
  );
};

const Act4Monument: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - T.MONUMENT_START;
  const isVisible = frame >= T.MONUMENT_START;
  if (!isVisible) return null;

  // Final dramatic scale up, bloom and text appear
  const scale = interpolate(sp(localFrame, 5), [0, 1], [0.8, 1]);
  const textOpacity = interpolate(localFrame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const textY = interpolate(sp(localFrame, 20), [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background Volumetric Beam */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%',
        width: 1000, height: 1000, marginLeft: -500,
        background: `conic-gradient(from 180deg at 50% 50%, transparent 120deg, ${C.purpleGlow} 180deg, transparent 240deg)`,
        opacity: interpolate(localFrame, [0, 30], [0, 0.4]),
        filter: 'blur(40px)',
      }} />

      {/* Hero Logo */}
      <div style={{
        transform: `scale(${scale})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: 36,
          background: C.panelBg, border: `1.5px solid rgba(255,255,255,0.15)`,
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 30px 100px ${C.purpleGlow}`
        }}>
          <Img src={staticFile('logo.webp')} style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
        </div>

        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 48, color: C.textPrimary,
          marginTop: 40, letterSpacing: '-0.02em', fontStyle: 'italic',
          opacity: textOpacity, transform: `translateY(${textY}px)`
        }}>
          The Privacy Engine.
        </div>
        
        <div style={{
          fontFamily: FONT_MONO, fontSize: 16, color: C.textSecondary,
          marginTop: 16, letterSpacing: '0.2em', textTransform: 'uppercase',
          opacity: textOpacity * 0.7, transform: `translateY(${textY * 1.5}px)`
        }}>
          realmxai.com
        </div>
      </div>
    </AbsoluteFill>
  );
};


// ============================================================================
// MAIN COMPOSITION
// ============================================================================

export const RealmxFlagship: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Global Background Grid Noise / Texture */}
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      {/* Render Scenes by checking frame bounds inside components, or utilizing Sequence. 
          In 3D sequences, standard overlapping is sometimes easier by manually passing frames. 
          Here we use a hybrid approach since 3D perspectives can be tricky with parent Divs modifying transforms. */}
      <Sequence from={T.FORGE_START} durationInFrames={T.FORGE_END - T.FORGE_START + 30}>
         <Act1Forge frame={frame} />
      </Sequence>
      
      <Sequence from={0} durationInFrames={DURATION}>
        <Act2NetworkDive frame={frame} />
        <Act3Orbit frame={frame} />
        <Act4Monument frame={frame} />
      </Sequence>

      {/* Ambient vignetting */}
      <AbsoluteFill style={{
        background: `radial-gradient(circle, transparent 40%, #000000 120%)`,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
