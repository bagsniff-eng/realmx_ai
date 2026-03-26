import React from 'react';
import { 
  RainbowKitProvider, 
  getDefaultConfig, 
  darkTheme 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'REALMxAI Node Dashboard',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '87106bbca1a3afbb8a6baea1a4fb42bc', // Valid 32-char hex fallback
  chains: [mainnet],
  ssr: true, // If your app supports SSR
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
