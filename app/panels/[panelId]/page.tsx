"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPanel, getPanelApplications, getRankingResult, getAppeal, openPanel, closeApplications, cancelPanel, requestRanking, finalizeRanking, pollUntil } from "@/lib/contract";
import { HiringPanel, CandidateApplication, RankingResult, Appeal } from "@/lib/genlayer";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { ConsensusRankingSeal } from "@/components/ConsensusRankingSeal";
import { ExplorerLinkCard } from "@/components/ExplorerLinkCard";
import { statusLabel, statusColor, formatTimestamp, formatDeadline, isDeadlinePassed } from "@/lib/utils";
import { Users, Clock, Building, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export default function PanelDetailPage() {
  const params = useParams();
  const panelId = parseInt(params.panelId as string);
  const { address, connected, connect } = useWallet();

  const [panel, setPanel] = useState<HiringPanel | null>(null);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});

  async function loadData() {
    try {
      const [p, apps, r, a] = await Promise.allSettled([
        getPanel(panelId),
        getPanelApplications(panelId),
        getRankingResult(panelId),
        getAppeal(panelId),
      ]);
      if (p.status === "fulfilled" && p.value) setPanel(p.value);
      if (apps.status === "fulfilled") setApplications(apps.value);
      if (r.status === "fulfilled" && r.value) setRanking(r.value);
      if (a.status === "fulfilled" && a.value) setAppeal(a.value);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load panel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [panelId]);

  const isManager = panel && address && panel.manager.toLowerCase() === address.toLowerCase();

  async function doAction(
    actionName: string,
    fn: () => Promise<string>,
    timeoutMs = 120000,
    waitingMsg = "Waiting for consensus..."
  ) {
    if (!connected || !address) { await connect(); return; }
    setActionLoading(actionName);
    setActionMsg("Confirm in MetaMask...");
    setError(null);
    try {
      const tx = await fn();
      setTxHashes((prev) => ({ ...prev, [actionName]: tx }));
      setActionMsg(waitingMsg);
      const prevStatus = panel?.status;
      await pollUntil(async () => {
        const updated = await getPanel(panelId);
        return updated?.status !== prevStatus;
      }, 4000, timeoutMs);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Action "${actionName}" failed`);
    } finally {
      setActionLoading(null);
      setActionMsg("");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-slate-grey">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-mono text-sm">Loading panel from contract...</span>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-risk-red font-mono">{error ?? "Panel not found"}</p>
        <Link href="/panels" className="text-signal-blue text-sm font-mono mt-4 inline-block hover:underline">
          ← Back to panels
        </Link>
      </div>
    );
  }

  const color = statusColor(panel.status);
  const deadlinePassed = isDeadlinePassed(panel.application_deadline);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/panels" className="text-slate-grey text-xs font-mono hover:text-paper-white mb-4 inline-block">
          ← All Panels
        </Link>
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge color={color}>{statusLabel(panel.status)}</Badge>
              <span className="text-xs text-slate-grey font-mono">Panel #{panel.panel_id}</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-paper-white">{panel.role_title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-slate-grey">
                <Building size={14} />
                <span className="font-mono">{panel.organisation_name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-grey">
                <Users size={14} />
                <span className="font-mono">{applications.length} candidate{applications.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-grey">
                <Clock size={14} />
                <span className="font-mono">{deadlinePassed ? "Deadline passed" : formatDeadline(panel.application_deadline)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {panel.status === "open" && !isManager && (
              <Link href={`/panels/${panelId}/apply`}>
                <Button variant="primary">Apply Now</Button>
              </Link>
            )}
            {ranking && (
              <Link href={`/panels/${panelId}/ranking`}>
                <Button variant="secondary">View Ranking</Button>
              </Link>
            )}
            {panel.status === "ranked" && (
              <Link href={`/panels/${panelId}/appeal`}>
                <Button variant="outline">File Appeal</Button>
              </Link>
            )}
            {(panel.status === "appeal_pending" || panel.status === "appeal_reviewed") && (
              <Link href={`/panels/${panelId}/appeal`}>
                <Button variant="outline">View Appeal</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role mandate */}
          <Card>
            <h2 className="font-display font-semibold text-paper-white mb-4">Role Mandate</h2>
            <p className="text-sm font-mono text-slate-grey leading-relaxed mb-4">{panel.role_summary}</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono text-slate-grey uppercase tracking-wider mb-2">Must-Have Requirements</p>
                <ul className="space-y-1.5">
                  {panel.must_have_requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-paper-white font-mono">
                      <CheckCircle size={14} className="text-skill-green flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
              {panel.nice_to_have_requirements.length > 0 && (
                <div>
                  <p className="text-xs font-mono text-slate-grey uppercase tracking-wider mb-2">Nice-to-Have</p>
                  <ul className="space-y-1.5">
                    {panel.nice_to_have_requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-grey font-mono">
                        <XCircle size={14} className="text-slate-grey/50 flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {panel.culture_values && (
                <div>
                  <p className="text-xs font-mono text-slate-grey uppercase tracking-wider mb-2">Culture Values</p>
                  <p className="text-sm font-mono text-slate-grey">{panel.culture_values}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Ranking result preview */}
          {ranking && (
            <Card glow="cyan">
              <ConsensusRankingSeal result={ranking} />
              <div className="mt-4">
                <Link href={`/panels/${panelId}/ranking`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    <ExternalLink size={13} /> View Full Ranking Room
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Candidates */}
          {applications.length > 0 && (
            <Card>
              <h2 className="font-display font-semibold text-paper-white mb-4">
                Candidates ({applications.length})
              </h2>
              <div className="space-y-3">
                {applications.map((app) => {
                  const rankEntry = ranking?.rankings?.find(r => r.application_id === app.application_id);
                  const rank = rankEntry ? rankEntry.rank - 1 : undefined;
                  const isTop = rankEntry?.rank === 1;
                  return (
                    <div
                      key={app.application_id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isTop
                          ? "border-skill-green/30 bg-skill-green/5"
                          : "border-white/10 bg-panel-black/50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {isTop && <Badge color="#2CE88A" variant="subtle">Top Ranked</Badge>}
                          <span className="font-display font-medium text-paper-white text-sm">
                            {app.name_or_handle}
                          </span>
                          <span className="text-xs text-slate-grey font-mono">#{app.application_id}</span>
                        </div>
                        <p className="text-xs text-slate-grey font-mono mt-0.5">
                          Submitted {formatTimestamp(app.submitted_at)}
                        </p>
                      </div>
                      {rank !== undefined && rank >= 0 && (
                        <div className="text-xs font-mono text-slate-grey">
                          Rank #{rank + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Evaluation weights */}
          <Card>
            <h3 className="font-display font-semibold text-paper-white text-sm mb-3">Evaluation Weights</h3>
            <div className="space-y-2">
              {Object.entries(panel.evaluation_weights)
                .sort((a, b) => b[1] - a[1])
                .map(([key, weight]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-grey capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="text-paper-white font-semibold">{weight}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-signal-blue rounded-full"
                        style={{ width: `${weight}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Manager controls */}
          {isManager && (
            <Card glow="blue">
              <h3 className="font-display font-semibold text-paper-white text-sm mb-3">Panel Controls</h3>
              <div className="space-y-2">
                {panel.status === "draft" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    loading={actionLoading === "open"}
                    onClick={() => doAction("open", () => openPanel(address!, panelId))}
                  >
                    Open for Applications
                  </Button>
                )}
                {panel.status === "open" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    loading={actionLoading === "close"}
                    onClick={() => doAction("close", () => closeApplications(address!, panelId))}
                  >
                    Close Applications
                  </Button>
                )}
                {panel.status === "closed" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    loading={actionLoading === "rank"}
                    onClick={() => doAction("rank", () => requestRanking(address!, panelId), 360000, "AI validators ranking candidates (2–5 min)...")}
                  >
                    {actionLoading === "rank" ? actionMsg || "Ranking..." : "Request Consensus Ranking"}
                  </Button>
                )}
                {(panel.status === "ranked" || panel.status === "appeal_reviewed") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    loading={actionLoading === "finalize"}
                    onClick={() => doAction("finalize", () => finalizeRanking(address!, panelId))}
                  >
                    Finalize Ranking
                  </Button>
                )}
                {panel.status !== "finalized" && panel.status !== "cancelled" && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    loading={actionLoading === "cancel"}
                    onClick={() => doAction("cancel", () => cancelPanel(address!, panelId))}
                  >
                    Cancel Panel
                  </Button>
                )}
              </div>
              {actionLoading && actionMsg && actionLoading !== "rank" && (
                <p className="text-xs text-slate-grey font-mono mt-2">{actionMsg}</p>
              )}
              {error && <p className="text-xs text-risk-red font-mono mt-2">{error}</p>}
            </Card>
          )}

          {/* Timestamps */}
          <Card>
            <h3 className="font-display font-semibold text-paper-white text-sm mb-3">Timeline</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-grey">Created</span>
                <span className="text-paper-white">{formatTimestamp(panel.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-grey">Deadline</span>
                <span className="text-paper-white">{formatTimestamp(panel.application_deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-grey">Appeal window</span>
                <span className="text-paper-white">{panel.appeal_window / 3600}h</span>
              </div>
            </div>
          </Card>

          {/* Explorer links */}
          {Object.keys(txHashes).length > 0 && (
            <div className="space-y-2">
              {Object.entries(txHashes).map(([label, hash]) => (
                <ExplorerLinkCard key={label} label={label} txHash={hash} />
              ))}
            </div>
          )}

          <FairnessGuardrailNotice compact />
        </div>
      </div>
    </div>
  );
}
