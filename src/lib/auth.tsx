import React, { useState, useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { SiweMessage } from 'siwe';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const queryClient = new QueryClient();

export const wagmiConfig = getDefaultConfig({
  appName: 'REALMxAI Node Dashboard',
  projectId: 'a4eccea2b49e6129c5ac6bb4aae82247',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.email || data.walletAddress)) {
            setAuthStatus('authenticated');
            return;
          }
        }
      } catch (err) {}
      setAuthStatus('unauthenticated');
    };
    checkSession();
  }, []);

  const authAdapter = createAuthenticationAdapter({
    getNonce: async () => {
      const response = await fetch(`${API_URL}/api/auth/nonce`, { credentials: 'include' });
      const text = await response.text();
      return text;
    },
    createMessage: ({ nonce, address, chainId }) => {
      const msg = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to REALMxAI Node Dashboard',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
      });
      return msg.prepareMessage();
    },
    verify: async ({ message, signature }) => {
      const searchParams = new URLSearchParams(window.location.search);
      const refCode = searchParams.get('ref') || localStorage.getItem('ref');
      
      const verifyRes = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      
      if (verifyRes.ok) {
        const data = await verifyRes.json();
        setAuthStatus('authenticated');
        if (refCode && data.user?.id) {
           await fetch(`${API_URL}/api/referral`, {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ code: refCode, userId: data.user.id })
           }).catch(console.error);
        }
      }
      return verifyRes.ok;
    },
    signOut: async () => {
      await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setAuthStatus('unauthenticated');
    },
  });

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider adapter={authAdapter} status={authStatus}>
          <RainbowKitProvider theme={darkTheme({
            accentColor: '#3DF2E0',
            accentColorForeground: 'black',
            borderRadius: 'medium',
          })}>
            {children}
          </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
