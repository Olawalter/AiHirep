"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPanel, getPanelApplications, getRankingResult } from "@/lib/contract";
import { HiringPanel, CandidateApplication, RankingResult } from "@/lib/genlayer";
import { ConsensusRankingSeal } from "@/components/ConsensusRankingSeal";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatTimestamp } from "@/lib/utils";
import { Loader2, ExternalLink } from "lucide-react";

export default function RankingPage() {
  const params = useParams();
  const panelId = parseInt(params.panelId as string);

  const [panel, setPanel] = useState<HiringPanel | null>(null);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getPanel(panelId),
      getPanelApplications(panelId),
      getRankingResult(panelId),
    ]).then(([p, apps, r]) => {
      if (p.status === "fulfilled" && p.value) setPanel(p.value);
      if (apps.status === "fulfilled") setApplications(apps.value);
      if (r.status === "fulfilled" && r.value) setRanking(r.value);
    }).finally(() => setLoading(false));
  }, [panelId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-slate-grey">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-mono text-sm">Loading consensus ranking...</span>
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-slate-grey font-mono mb-2">No ranking available yet.</p>
        <p className="text-slate-grey/60 text-xs font-mono mb-6">
          The hiring manager must close applications and request a consensus ranking.
        </p>
        <Link href={`/panels/${panelId}`}><Button variant="outline">Back to Panel</Button></Link>
      </div>
    );
  }

  const appById = Object.fromEntries(applications.map((a) => [a.application_id, a]));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link href={`/panels/${panelId}`} className="text-slate-grey text-xs font-mono hover:text-paper-white mb-3 inline-block">
          ← Back to Panel
        </Link>
        <h1 className="font-display font-bold text-2xl text-paper-white">Consensus Ranking Room</h1>
        {panel && (
          <p className="text-slate-grey text-sm font-mono mt-1">
            {panel.role_title} · {panel.organisation_name}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ConsensusRankingSeal result={ranking} />

          {/* Full ranked list with application details */}
          {ranking.rankings.length > 0 && (
            <Card>
              <h2 className="font-display font-semibold text-paper-white mb-4">Candidate Details</h2>
              <div className="space-y-4">
                {ranking.rankings.map((entry) => {
                  const app = appById[entry.application_id];
                  return (
                    <div key={entry.application_id} className="border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-grey">Rank #{entry.rank}</span>
                        {app && (
                          <span className="font-display font-semibold text-paper-white">
                            {app.name_or_handle}
                          </span>
                        )}
                        <span className="text-xs text-slate-grey font-mono">App #{entry.application_id}</span>
                      </div>
                      {app && (
                        <p className="text-xs text-slate-grey font-mono leading-relaxed mb-2 line-clamp-2">
                          {app.resume_summary}
                        </p>
                      )}
                      {app && (
                        <div className="flex gap-3 flex-wrap">
                          {app.portfolio_url && (
                            <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-consensus-cyan font-mono hover:underline flex items-center gap-1">
                              Portfolio <ExternalLink size={10} />
                            </a>
                          )}
                          {app.github_url && (
                            <a href={app.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-consensus-cyan font-mono hover:underline flex items-center gap-1">
                              GitHub <ExternalLink size={10} />
                            </a>
                          )}
                          {app.work_sample_urls.slice(0, 2).map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-consensus-cyan font-mono hover:underline flex items-center gap-1">
                              Sample {idx + 1} <ExternalLink size={10} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-display font-semibold text-paper-white text-sm mb-3">Ranking Details</h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-grey">Issued at</span>
                <span className="text-paper-white">{formatTimestamp(ranking.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-grey">Candidates ranked</span>
                <span className="text-paper-white">{ranking.rankings.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-grey">Status</span>
                <span className="text-paper-white">{ranking.status}</span>
              </div>
            </div>
          </Card>

          {panel?.status === "ranked" && (
            <Link href={`/panels/${panelId}/appeal`}>
              <Button variant="outline" size="sm" className="w-full">
                File an Appeal
              </Button>
            </Link>
          )}

          <FairnessGuardrailNotice compact />
        </div>
      </div>
    </div>
  );
}
