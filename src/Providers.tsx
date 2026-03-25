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
  projectId: 'YOUR_PROJECT_ID', // Replaced with dummy value as requested by standard patterns if not provided
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
