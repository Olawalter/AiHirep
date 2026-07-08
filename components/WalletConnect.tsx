"use client";

import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/wallet";
import { Wallet, CheckCircle } from "lucide-react";

export function WalletConnect() {
  const { address, connected, connecting, connect, error } = useWallet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-skill-green/10 border border-skill-green/20">
          <CheckCircle size={13} className="text-skill-green" />
          <span className="text-sm font-mono text-skill-green">{formatAddress(address)}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        onClick={connect}
        loading={connecting}
      >
        <Wallet size={14} />
        Connect Wallet
      </Button>
      {error && (
        <p className="text-xs text-risk-red font-mono mt-1">{error}</p>
      )}
    </div>
  );
}
