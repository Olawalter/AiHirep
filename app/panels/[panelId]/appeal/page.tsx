"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPanel, getRankingResult, getAppeal, fileAppeal, requestAppealReview, pollUntil } from "@/lib/contract";
import { HiringPanel, RankingResult, Appeal, APPEAL_BASES, AppealBasis } from "@/lib/genlayer";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ExplorerLinkCard } from "@/components/ExplorerLinkCard";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { AlertCircle, Plus, Minus, CheckCircle, Loader2, Scale } from "lucide-react";
import { verdictLabel, formatTimestamp } from "@/lib/utils";

const BASIS_LABELS: Record<AppealBasis, string> = {
  new_work_sample: "New Work Sample",
  reference_misread: "Reference Misread",
  github_evidence_misread: "GitHub Evidence Misread",
  portfolio_misread: "Portfolio Misread",
  experience_misread: "Experience Misread",
  role_requirement_misapplied: "Role Requirement Misapplied",
  application_identity_error: "Application Identity Error",
  conflict_of_interest_claim: "Conflict of Interest Claim",
};

export default function AppealPage() {
  const params = useParams();
  const router = useRouter();
  const panelId = parseInt(params.panelId as string);
  const { address, connected, connect } = useWallet();

  const [panel, setPanel] = useState<HiringPanel | null>(null);
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [existingAppeal, setExistingAppeal] = useState<Appeal | null>(null);
  const [loading, setLoading] = useState(true);

  const [basis, setBasis] = useState<AppealBasis>("new_work_sample");
  const [statement, setStatement] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([""]);

  const [submitting, setSubmitting] = useState(false);
  const [reviewRequesting, setReviewRequesting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [appealFiled, setAppealFiled] = useState(false);

  useEffect(() => {
    Promise.allSettled([getPanel(panelId), getRankingResult(panelId), getAppeal(panelId)])
      .then(([p, r, a]) => {
        if (p.status === "fulfilled" && p.value) setPanel(p.value);
        if (r.status === "fulfilled" && r.value) setRanking(r.value);
        if (a.status === "fulfilled" && a.value) setExistingAppeal(a.value);
      })
      .finally(() => setLoading(false));
  }, [panelId]);

  const isManager = panel && address && panel.manager.toLowerCase() === address.toLowerCase();

  const handleFileAppeal = async () => {
    if (!connected || !address) { await connect(); return; }
    setError(null);
    setSubmitting(true);
    try {
      const tx = await fileAppeal(address, panelId, basis, statement, evidenceUrls.filter(Boolean));
      setTxHash(tx);
      setAppealFiled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to file appeal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestReview = async () => {
    if (!connected || !address) { await connect(); return; }
    setError(null);
    setReviewRequesting(true);
    setReviewMsg("Confirm in MetaMask...");
    try {
      const tx = await requestAppealReview(address, panelId);
      setTxHash(tx);
      setReviewMsg("Validators reviewing the appeal (30–120s)...");
      await pollUntil(async () => {
        const a = await getAppeal(panelId);
        return a?.status === "reviewed";
      }, 5000, 180000);
      // Reload appeal to show verdict
      const [updatedPanel, updatedAppeal] = await Promise.all([getPanel(panelId), getAppeal(panelId)]);
      if (updatedPanel) setPanel(updatedPanel);
      if (updatedAppeal) setExistingAppeal(updatedAppeal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request review");
    } finally {
      setReviewRequesting(false);
      setReviewMsg("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-slate-grey">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-mono text-sm">Loading appeal desk...</span>
      </div>
    );
  }

  if (!ranking || !panel) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-slate-grey font-mono mb-4">No ranking to appeal.</p>
        <Link href={`/panels/${panelId}`}><Button variant="outline">Back to Panel</Button></Link>
      </div>
    );
  }

  if (appealFiled) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-reference-gold/20 border border-reference-gold/30 flex items-center justify-center mx-auto mb-6">
          <Scale size={28} className="text-reference-gold" />
        </div>
        <h1 className="font-display font-bold text-2xl text-paper-white mb-3">Appeal Filed</h1>
        <p className="text-slate-grey font-mono text-sm mb-6">
          Your appeal has been submitted. The hiring manager can request a consensus appeal review.
        </p>
        {txHash && <ExplorerLinkCard label="Appeal Transaction" txHash={txHash} />}
        <div className="flex gap-3 justify-center mt-6">
          <Link href={`/panels/${panelId}`}><Button variant="outline">Back to Panel</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href={`/panels/${panelId}`} className="text-slate-grey text-xs font-mono hover:text-paper-white mb-3 inline-block">
          ← Back to Panel
        </Link>
        <h1 className="font-display font-bold text-2xl text-paper-white">Appeal Desk</h1>
        <p className="text-slate-grey text-sm font-mono mt-1">
          {panel.role_title} · {panel.organisation_name}
        </p>
      </div>

      {/* Current ranking */}
      <Card className="mb-6 bg-signal-blue/5 border-signal-blue/20">
        <p className="text-xs font-mono text-slate-grey uppercase tracking-wider mb-2">Current Ranking</p>
        <div className="flex flex-wrap gap-3">
          <div>
            <span className="text-xs text-slate-grey font-mono">Top candidate: </span>
            <span className="text-sm text-skill-green font-mono">
              {ranking.rankings[0] ? `App #${ranking.rankings[0].application_id}` : "—"}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-grey font-mono">Candidates ranked: </span>
            <span className="text-sm text-paper-white font-mono">{ranking.rankings.length}</span>
          </div>
          <div>
            <span className="text-xs text-slate-grey font-mono">Issued: </span>
            <span className="text-sm text-paper-white font-mono">{formatTimestamp(ranking.created_at)}</span>
          </div>
        </div>
      </Card>

      {/* Existing appeal */}
      {existingAppeal && (
        <Card className="mb-6" glow="gold">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={16} className="text-reference-gold" />
            <h3 className="font-display font-semibold text-paper-white text-sm">Active Appeal</h3>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${
              existingAppeal.status === "resolved" ? "bg-skill-green/20 text-skill-green" : "bg-reference-gold/20 text-reference-gold"
            }`}>
              {existingAppeal.status}
            </span>
          </div>
          <p className="text-xs text-slate-grey font-mono mb-1">Basis: {BASIS_LABELS[existingAppeal.basis as AppealBasis] ?? existingAppeal.basis}</p>
          <p className="text-sm text-paper-white font-mono leading-relaxed">{existingAppeal.statement}</p>
          {existingAppeal.verdict && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-xs text-slate-grey font-mono mb-1">Appeal Result: <span className="text-paper-white">{verdictLabel(existingAppeal.verdict)}</span></p>
              {existingAppeal.reasoning && (
                <p className="text-xs text-paper-white font-mono bg-panel-black/60 p-3 rounded mt-1">{existingAppeal.reasoning}</p>
              )}
            </div>
          )}

          {/* Manager can request review */}
          {isManager && existingAppeal.status === "pending" && (
            <div className="mt-4 space-y-2">
              <Button
                variant="primary"
                size="sm"
                loading={reviewRequesting}
                onClick={handleRequestReview}
                className="w-full"
              >
                {reviewRequesting ? reviewMsg || "Requesting..." : "Request Consensus Appeal Review"}
              </Button>
              {txHash && !reviewRequesting && <ExplorerLinkCard label="Appeal Review Transaction" txHash={txHash} />}
            </div>
          )}
        </Card>
      )}

      {/* File new appeal */}
      {!existingAppeal && (
        <div className="space-y-6">
          <Card>
            <h2 className="font-display font-semibold text-paper-white mb-4">File an Appeal</h2>
            <p className="text-xs font-mono text-slate-grey mb-4 leading-relaxed">
              Appeals must be grounded in job-relevant evidence. Select a structured basis and provide your statement.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-display text-slate-grey mb-2">Appeal Basis</label>
                <div className="grid grid-cols-2 gap-2">
                  {APPEAL_BASES.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBasis(b)}
                      className={`px-3 py-2 rounded-lg border text-xs font-mono text-left transition-all ${
                        basis === b
                          ? "border-reference-gold/50 bg-reference-gold/10 text-reference-gold"
                          : "border-white/10 text-slate-grey hover:border-white/20"
                      }`}
                    >
                      {BASIS_LABELS[b]}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Appeal Statement"
                placeholder="Explain why this appeal is warranted. What evidence was misread, what requirement was misapplied, or what new evidence should be considered..."
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                hint="Minimum 30 characters. Focus on job-relevant factors."
                rows={4}
              />

              <div>
                <label className="block text-sm font-display text-slate-grey mb-2">Additional Evidence (optional)</label>
                <div className="space-y-2">
                  {evidenceUrls.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`https://evidence-link-${i + 1}.com`}
                        type="url"
                        value={url}
                        onChange={(e) => setEvidenceUrls(evidenceUrls.map((u, idx) => idx === i ? e.target.value : u))}
                        className="flex-1"
                      />
                      {evidenceUrls.length > 1 && (
                        <button onClick={() => setEvidenceUrls(evidenceUrls.filter((_, idx) => idx !== i))} className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red">
                          <Minus size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {evidenceUrls.length < 5 && (
                    <Button variant="ghost" size="sm" onClick={() => setEvidenceUrls([...evidenceUrls, ""])}>
                      <Plus size={13} /> Add Evidence
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <FairnessGuardrailNotice compact />

          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-risk-red/10 border border-risk-red/30 text-sm text-risk-red font-mono">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {txHash && <ExplorerLinkCard label="Appeal Transaction" txHash={txHash} />}

          <Button
            variant="primary"
            size="lg"
            onClick={handleFileAppeal}
            loading={submitting}
            className="w-full"
          >
            {connected ? "File Appeal" : "Connect Wallet to File Appeal"}
          </Button>
        </div>
      )}
    </div>
  );
}
