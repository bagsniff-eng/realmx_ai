import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Providers } from './Providers.tsx';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
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
        <div style={{ background: '#0A0D10', color: '#E6EDF3', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
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

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <Providers>
      <App />
    </Providers>
  </AppErrorBoundary>,
);

