"use client";

import { verdictLabel, bandColor, bandLabel } from "@/lib/utils";
import { RankingResult, RankingEntry } from "@/lib/genlayer";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface SealProps {
  result: RankingResult;
}

function verdictColor(verdict: string): string {
  if (verdict === "strong_yes" || verdict === "yes") return "#2CE88A";
  if (verdict === "maybe") return "#F5B841";
  return "#FF4D5E";
}

function EntryRow({ entry, rank }: { entry: RankingEntry; rank: number }) {
  const color = verdictColor(entry.verdict);
  const isTop = rank === 1;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${
        isTop ? "border-skill-green/30 bg-skill-green/5" : "border-white/10 bg-panel-black/40"
      }`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{
          backgroundColor: isTop ? "rgba(44,232,138,0.2)" : "rgba(255,255,255,0.05)",
          color: isTop ? "#2CE88A" : "#8B93A1",
          border: `1px solid ${isTop ? "rgba(44,232,138,0.3)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-display font-semibold text-paper-white text-sm">
            Application #{entry.application_id}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
          >
            {verdictLabel(entry.verdict)}
          </span>
          <span className="text-xs text-slate-grey font-mono">Score: {entry.overall_score}/100</span>
          <span className="text-xs text-slate-grey font-mono">Confidence: {entry.confidence}</span>
        </div>
        {entry.reasoning && (
          <p className="text-xs text-slate-grey font-mono leading-relaxed line-clamp-2">{entry.reasoning}</p>
        )}
        {entry.flags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {entry.flags.map((f, i) => (
              <span key={i} className="text-xs font-mono text-reference-gold bg-reference-gold/10 px-1.5 py-0.5 rounded">
                {f}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 gap-1 mt-2">
          {[
            ["Tech", entry.technical_band],
            ["Comm", entry.communication_band],
            ["Exp", entry.experience_band],
            ["Role", entry.role_alignment_band],
            ["Evidence", entry.evidence_strength_band],
            ["Culture", entry.culture_fit_band],
          ].map(([label, band]) => (
            <div key={label} className="text-xs font-mono">
              <span className="text-slate-grey/60">{label}: </span>
              <span style={{ color: bandColor(band) }}>{bandLabel(band)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ConsensusRankingSeal({ result }: SealProps) {
  const top = result.rankings[0];
  const topColor = top ? verdictColor(top.verdict) : "#22D3EE";
  const Icon = top
    ? top.verdict === "strong_yes" || top.verdict === "yes"
      ? CheckCircle
      : top.verdict === "maybe"
      ? AlertTriangle
      : XCircle
    : AlertTriangle;

  return (
    <div
      className="relative rounded-2xl border p-6"
      style={{ borderColor: `${topColor}30`, backgroundColor: `${topColor}08` }}
    >
      <div className="flex flex-col items-center gap-3 mb-6 text-center">
        <div
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: topColor, backgroundColor: `${topColor}15` }}
        >
          <Icon size={24} style={{ color: topColor }} />
        </div>
        <div>
          <p className="text-xs font-mono text-slate-grey uppercase tracking-widest mb-1">
            Consensus Ranking · {result.rankings.length} Candidate{result.rankings.length !== 1 ? "s" : ""}
          </p>
          <h2 className="font-display font-bold text-xl" style={{ color: topColor }}>
            {top ? `#${top.application_id} Ranked First` : "Ranking Complete"}
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {result.rankings.map((entry) => (
          <EntryRow key={entry.application_id} entry={entry} rank={entry.rank} />
        ))}
      </div>
    </div>
  );
}
