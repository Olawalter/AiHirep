"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { connectWallet, getConnectedAddress, switchToGenLayerStudioNet } from "@/lib/wallet";

interface WalletContextType {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connected: false,
  connecting: false,
  connect: async () => {},
  error: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConnectedAddress().then((addr) => {
      if (addr) setAddress(addr);
    });

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: unknown) => {
        const accs = accounts as string[];
        setAddress(accs?.[0] ?? null);
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
    }
  }, []);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await switchToGenLayerStudioNet();
      const addr = await connectWallet();
      setAddress(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <WalletContext.Provider value={{ address, connected: !!address, connecting, connect, error }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
