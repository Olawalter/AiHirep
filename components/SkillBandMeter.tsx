import { bandColor, bandLabel } from "@/lib/utils";
import { bandToPercent } from "@/lib/genlayer";

interface BandMeterProps {
  label: string;
  band: string;
  weight?: number;
}

export function SkillBandMeter({ label, band, weight }: BandMeterProps) {
  const percent = bandToPercent(band);
  const color = bandColor(band);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-grey">{label}</span>
        <div className="flex items-center gap-2">
          {weight !== undefined && (
            <span className="text-xs font-mono text-slate-grey/60">{weight}%</span>
          )}
          <span className="text-xs font-mono font-medium" style={{ color }}>
            {bandLabel(band)}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

interface BandGridProps {
  technical_band: string;
  communication_band: string;
  experience_band: string;
  role_alignment_band: string;
  evidence_strength_band: string;
  culture_fit_band: string;
  weights?: Record<string, number>;
}

export function BandGrid({
  technical_band,
  communication_band,
  experience_band,
  role_alignment_band,
  evidence_strength_band,
  culture_fit_band,
  weights,
}: BandGridProps) {
  const bands = [
    { label: "Technical", band: technical_band, key: "technical_skills" },
    { label: "Communication", band: communication_band, key: "communication" },
    { label: "Experience", band: experience_band, key: "experience" },
    { label: "Role Alignment", band: role_alignment_band, key: "role_alignment" },
    { label: "Evidence Strength", band: evidence_strength_band, key: "portfolio_quality" },
    { label: "Culture Fit", band: culture_fit_band, key: "culture_fit" },
  ];

  return (
    <div className="space-y-3">
      {bands.map(({ label, band, key }) => (
        <SkillBandMeter
          key={label}
          label={label}
          band={band}
          weight={weights?.[key]}
        />
      ))}
    </div>
  );
}
