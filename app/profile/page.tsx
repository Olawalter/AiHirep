"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { getPanelsByManager, getApplicationsByCandidate } from "@/lib/contract";
import { HiringPanel, CandidateApplication } from "@/lib/genlayer";
import { HiringPanelCard } from "@/components/HiringPanelCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTimestamp, statusColor, statusLabel } from "@/lib/utils";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";

export default function ProfilePage() {
  const { address, connected } = useWallet();
  const [panels, setPanels] = useState<HiringPanel[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(addr: string) {
    const [p, a] = await Promise.allSettled([
      getPanelsByManager(addr),
      getApplicationsByCandidate(addr),
    ]);
    if (p.status === "fulfilled") setPanels(p.value);
    if (a.status === "fulfilled") setApplications(a.value);
  }

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    loadData(address).finally(() => { if (!cancelled) setLoading(false); });
    const interval = setInterval(() => { if (!cancelled) loadData(address); }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [address]);

  if (!connected) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="font-display font-bold text-2xl text-paper-white mb-4">Profile</h1>
        <p className="text-slate-grey font-mono text-sm mb-6">
          Connect your wallet to view your hiring panels and applications.
        </p>
        <WalletConnect />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper-white">Profile</h1>
          <p className="text-slate-grey text-sm font-mono mt-1 truncate">{address}</p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={async () => {
            if (!address) return;
            setRefreshing(true);
            try { await loadData(address); } finally { setRefreshing(false); }
          }}
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-grey py-12 justify-center">
          <Loader2 size={18} className="animate-spin" />
          <span className="font-mono text-sm">Loading your panels and applications...</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-10">
          {/* Manager panels */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-paper-white">Panels You Manage</h2>
              <Link href="/panels/create">
                <Button variant="primary" size="sm">
                  <Plus size={14} /> Create Panel
                </Button>
              </Link>
            </div>
            {panels.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl py-10 text-center">
                <p className="text-slate-grey font-mono text-sm">You haven&apos;t created any panels yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {panels.map((p) => <HiringPanelCard key={p.panel_id} panel={p} />)}
              </div>
            )}
          </section>

          {/* Applications */}
          <section>
            <h2 className="font-display font-semibold text-paper-white mb-4">Your Applications</h2>
            {applications.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-xl py-10 text-center">
                <p className="text-slate-grey font-mono text-sm">No applications found yet.</p>
                <p className="text-slate-grey font-mono text-xs mt-1 opacity-60">If you just applied, validators are confirming — this refreshes automatically every 8s.</p>
                <Link href="/panels" className="text-signal-blue text-sm font-mono mt-3 inline-block hover:underline">
                  Browse open panels →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <Link key={app.application_id} href={`/panels/${app.panel_id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-hiring-navy hover:border-white/20 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge color={statusColor(app.status)}>{app.status}</Badge>
                          <span className="text-xs text-slate-grey font-mono">Panel #{app.panel_id}</span>
                        </div>
                        <p className="font-display font-semibold text-paper-white text-sm">
                          {app.name_or_handle}
                        </p>
                        <p className="text-xs text-slate-grey font-mono mt-0.5">
                          Submitted {formatTimestamp(app.submitted_at)}
                        </p>
                      </div>
                      <div className="text-xs text-slate-grey font-mono">
                        App #{app.application_id}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
