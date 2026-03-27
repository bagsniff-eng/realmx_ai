import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoadingBreadcrumb } from '@/components/ui/animated-loading-svg-text-shimmer';

const queryClient = new QueryClient();

function ProviderStatusScreen({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-realm-black text-realm-text-primary flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-realm-border bg-realm-surface p-8 text-center">
        <h1 className="text-xl font-semibold text-realm-cyan">{title}</h1>
        <p className="mt-3 text-sm text-realm-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  const [walletLayer, setWalletLayer] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadWalletProviders() {
      try {
        const [rainbowkit, wagmi, chains] = await Promise.all([
          import('@rainbow-me/rainbowkit'),
          import('wagmi'),
          import('wagmi/chains'),
        ]);

        if (cancelled) return;

        const config = rainbowkit.getDefaultConfig({
          appName: 'REALMxAI Node Dashboard',
          projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '87106bbca1a3afbb8a6baea1a4fb42bc',
          chains: [chains.mainnet],
          ssr: false,
        });

        await import('@rainbow-me/rainbowkit/styles.css');

        if (cancelled) return;

        const Wrapper = ({ children: inner }: { children: React.ReactNode }) => (
          <wagmi.WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <rainbowkit.RainbowKitProvider theme={rainbowkit.darkTheme()}>
                {inner}
              </rainbowkit.RainbowKitProvider>
            </QueryClientProvider>
          </wagmi.WagmiProvider>
        );

        setWalletLayer(() => Wrapper);
        setStatus('ready');
      } catch (err) {
        console.error('[REALMxAI] Failed to load wallet providers:', err);
        if (!cancelled) setStatus('failed');
      }
    }

    loadWalletProviders();
    return () => {
      cancelled = true;
    };
  }, []);

  if (walletLayer) {
    const WalletLayer = walletLayer;
    return <WalletLayer>{children}</WalletLayer>;
  }

  if (status === 'failed') {
    return (
      <ProviderStatusScreen
        title="Wallet initialization failed"
        description="The dashboard could not initialize its wallet layer. Refresh the page and try again."
      />
    );
  }

  return (
    <div className="min-h-screen bg-realm-black flex items-center justify-center px-6">
      <LoadingBreadcrumb
        text="Launching"
        className="text-white [&_.shimmer-text]:!bg-[linear-gradient(90deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.35)_40%,rgba(61,242,224,1)_50%,rgba(255,255,255,0.35)_60%,rgba(255,255,255,0.35)_100%)]"
      />
    </div>
  );
}

class ProviderErrorBoundary extends React.Component<
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
    console.error('[REALMxAI] Provider error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ProviderStatusScreen
          title="Provider initialization failed"
          description={this.state.error?.message || 'A provider dependency failed during startup.'}
        />
      );
    }

    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProviderErrorBoundary>
      <WalletProviderWrapper>{children}</WalletProviderWrapper>
    </ProviderErrorBoundary>
  );
}
