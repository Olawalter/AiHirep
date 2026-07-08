"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HiringPanelCard } from "@/components/HiringPanelCard";
import { Button } from "@/components/ui/Button";
import { getAllPanels, getPanelApplications } from "@/lib/contract";
import { HiringPanel } from "@/lib/genlayer";
import { Plus, Loader2, RefreshCw } from "lucide-react";

export default function PanelsPage() {
  const [panels, setPanels] = useState<HiringPanel[]>([]);
  const [appCounts, setAppCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAllPanels();
        if (cancelled) return;
        setPanels(data);

        const counts: Record<number, number> = {};
        await Promise.all(
          data.map(async (p) => {
            try {
              const apps = await getPanelApplications(p.panel_id);
              counts[p.panel_id] = apps.length;
            } catch {
              counts[p.panel_id] = 0;
            }
          })
        );
        if (!cancelled) setAppCounts(counts);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load panels");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Auto-refresh every 8 seconds so newly-confirmed panels appear without manual refresh
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-paper-white">Hiring Panels</h1>
          <p className="text-slate-grey text-sm font-mono mt-1">
            {panels.length} panel{panels.length !== 1 ? "s" : ""} on GenLayer StudioNet
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={async () => {
              setRefreshing(true);
              try {
                const data = await getAllPanels();
                setPanels(data);
              } finally {
                setRefreshing(false);
              }
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </Button>
          <Link href="/panels/create">
            <Button variant="primary" size="md">
              <Plus size={16} />
              Create Panel
            </Button>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24 gap-3 text-slate-grey">
          <Loader2 size={20} className="animate-spin" />
          <span className="font-mono text-sm">Loading panels from contract...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-risk-red/30 bg-risk-red/5 p-6 text-center">
          <p className="text-risk-red font-mono text-sm">{error}</p>
          <p className="text-slate-grey text-xs font-mono mt-2">
            Make sure the contract is deployed and NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS is set.
          </p>
        </div>
      )}

      {!loading && !error && panels.length === 0 && (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
          <p className="font-display font-semibold text-paper-white text-lg mb-2">No panels visible yet</p>
          <p className="text-slate-grey font-mono text-sm mb-2">
            If you just created a panel, validators are reaching consensus — this page refreshes automatically every 8s.
          </p>
          <p className="text-slate-grey font-mono text-xs mb-6 opacity-60">
            Or create the first panel to start evaluating candidates through validator consensus.
          </p>
          <Link href="/panels/create">
            <Button variant="primary">
              <Plus size={16} />
              Create Panel
            </Button>
          </Link>
        </div>
      )}

      {!loading && panels.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {panels.map((panel) => (
            <HiringPanelCard
              key={panel.panel_id}
              panel={panel}
              applicationCount={appCounts[panel.panel_id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
