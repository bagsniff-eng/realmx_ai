import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

/**
 * Wallet providers are loaded dynamically to prevent module-level crashes
 * from causing a blank page. If wallet modules fail to load, the app
 * still renders without wallet functionality.
 */
function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  const [WalletLayer, setWalletLayer] = useState<React.ComponentType<{ children: React.ReactNode }> | null>(null);
  const [failed, setFailed] = useState(false);

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

        // Import rainbowkit styles
        await import('@rainbow-me/rainbowkit/styles.css');

        if (cancelled) return;

        // Create a wrapper component with the loaded modules
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
      } catch (err) {
        console.error('[REALMxAI] Failed to load wallet providers:', err);
        if (!cancelled) setFailed(true);
      }
    }

    loadWalletProviders();
    return () => { cancelled = true; };
  }, []);

  // Wallet providers loaded successfully
  if (WalletLayer) {
    return <WalletLayer>{children}</WalletLayer>;
  }

  // Still loading or failed — render without wallet providers
  return <>{children}</>;
}

class ProviderErrorBoundary extends React.Component<
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
    console.error('[REALMxAI] Provider error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProviderErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WalletProviderWrapper>
          {children}
        </WalletProviderWrapper>
      </QueryClientProvider>
    </ProviderErrorBoundary>
  );
}
