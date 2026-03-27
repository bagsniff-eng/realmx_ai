import React from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

console.log('[REALMxAI] Step 1: Core imports loaded');

// Lazy import App and Providers to catch import-time crashes
let App: any;
let Providers: any;

console.log('[REALMxAI] Step 2: Setting up global error handlers');

function isExtensionOriginError(message?: string, stack?: string, filename?: string) {
  const source = [message, stack, filename].filter(Boolean).join('\n');
  return (
    source.includes('chrome-extension://') ||
    source.includes('runtime.sendMessage') ||
    source.includes('Extension ID') ||
    source.includes('inpage.js')
  );
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (isExtensionOriginError(e.message, e.error?.stack, e.filename)) {
      console.warn('[REALMxAI] Ignoring extension script error:', e.message);
      return;
    }
    console.error('[REALMxAI] GLOBAL ERROR:', e.message, e.error?.stack);
    document.body.innerHTML = `<div style="padding: 20px; color: red; background: black; z-index: 9999; position: absolute; inset: 0; font-family: 'IBM Plex Mono', monospace;"><h1>Global Error Catch</h1><pre>${e.message}\\n${e.error?.stack || ''}</pre></div>`;
  });
  window.addEventListener('unhandledrejection', (e) => {
    const message = e.reason?.message || String(e.reason || '');
    const stack = e.reason?.stack || '';
    if (isExtensionOriginError(message, stack)) {
      console.warn('[REALMxAI] Ignoring extension promise rejection:', message);
      return;
    }
    console.error('[REALMxAI] UNHANDLED REJECTION:', message);
    document.body.innerHTML = `<div style="padding: 20px; color: #ff55aa; background: black; z-index: 9999; position: absolute; inset: 0; font-family: 'IBM Plex Mono', monospace;"><h1>Unhandled Promise Rejection</h1><pre>${e.reason?.message || e.reason}\\n${e.reason?.stack || ''}</pre></div>`;
  });
}

console.log('[REALMxAI] Step 3: Checking root element');

console.log('[REALMxAI] Step 4: Defining error boundary');

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  declare props: { children: React.ReactNode };
  declare state: { hasError: boolean; error: Error | null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[REALMxAI] Fatal render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#0A0D10', color: '#E6EDF3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Source Sans 3', sans-serif" }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ color: '#2FE6D2', fontSize: '1.5rem', marginBottom: '1rem' }}>REALMxAI</h1>
            <p style={{ color: '#8B949E', fontSize: '0.875rem' }}>System initialization failed. Please refresh or try again later.</p>
            <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.5rem' }}>{this.state.error?.message}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#2FE6D2', color: '#0A0D10', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('[REALMxAI] Step 5: Loading App and CSS modules');

async function bootstrap() {
  try {
    console.log('[REALMxAI] Step 5a: CSS already loaded, importing App');
    const appModule = await import('./App.tsx');
    App = appModule.default;
    console.log('[REALMxAI] Step 5b: App loaded, importing Providers');
    const provModule = await import('./Providers.tsx');
    Providers = provModule.Providers;
    console.log('[REALMxAI] Step 6: All modules loaded, rendering');

    createRoot(document.getElementById('root')!).render(
      <AppErrorBoundary>
        <Providers>
          <App />
        </Providers>
      </AppErrorBoundary>,
    );
    console.log('[REALMxAI] Step 7: React render called successfully');
  } catch (err: any) {
    console.error('[REALMxAI] BOOTSTRAP FATAL:', err);
    document.getElementById('root')!.innerHTML = `<div style="padding: 40px; color: #ff5555; background: #0A0D10; font-family: 'IBM Plex Mono', monospace; min-height: 100vh;">
      <h1 style="color: #2FE6D2;">REALMxAI — Boot Failure</h1>
      <pre style="color: #ff5555; white-space: pre-wrap; margin-top: 20px;">${err?.message || err}\n\n${err?.stack || ''}</pre>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 24px; background: #2FE6D2; color: #0A0D10; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Reload</button>
    </div>`;
  }
}

bootstrap();
