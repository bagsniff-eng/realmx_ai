import React from 'react';
import { 
  RainbowKitProvider, 
  getDefaultConfig, 
  darkTheme 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

let config: ReturnType<typeof getDefaultConfig> | null = null;
try {
  config = getDefaultConfig({
    appName: 'REALMxAI Node Dashboard',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '87106bbca1a3afbb8a6baea1a4fb42bc',
    chains: [mainnet],
    ssr: false,
  });
} catch (e) {
  console.error('[REALMxAI] Failed to initialize wallet config:', e);
}

const queryClient = new QueryClient();

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
    console.error('[REALMxAI] Provider initialization error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      // Render children without wallet providers as fallback
      return <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!config) {
    // Wallet config failed — render without wallet providers
    console.warn('[REALMxAI] Wallet providers unavailable, rendering without them');
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <ProviderErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme()}>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ProviderErrorBoundary>
  );
}
