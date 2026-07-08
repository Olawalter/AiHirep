import { ExternalLink } from "lucide-react";
import { CHAIN_CONFIG, getExplorerTxUrl, getExplorerContractUrl } from "@/lib/genlayer";

interface ExplorerLinkCardProps {
  label: string;
  txHash?: string;
  isContract?: boolean;
}

export function ExplorerLinkCard({ label, txHash, isContract }: ExplorerLinkCardProps) {
  const url = isContract ? getExplorerContractUrl() : txHash ? getExplorerTxUrl(txHash) : null;

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-4 py-3 rounded-lg bg-panel-black border border-white/10 hover:border-consensus-cyan/30 hover:bg-consensus-cyan/5 transition-all group"
    >
      <div>
        <p className="text-xs text-slate-grey font-mono">{label}</p>
        <p className="text-sm text-consensus-cyan font-mono mt-0.5 truncate max-w-[280px]">
          {txHash ?? CHAIN_CONFIG.contractAddress}
        </p>
      </div>
      <ExternalLink size={14} className="text-slate-grey group-hover:text-consensus-cyan transition-colors flex-shrink-0" />
    </a>
  );
}

export function ExplorerLinksSection({ txHashes }: { txHashes: Record<string, string> }) {
  const entries = Object.entries(txHashes).filter(([, v]) => !!v);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-grey font-mono uppercase tracking-wider">On-Chain Transactions</p>
      <div className="space-y-1.5">
        {entries.map(([label, hash]) => (
          <ExplorerLinkCard key={label} label={label} txHash={hash} />
        ))}
        {CHAIN_CONFIG.contractAddress && (
          <ExplorerLinkCard label="Contract" isContract />
        )}
      </div>
    </div>
  );
}
