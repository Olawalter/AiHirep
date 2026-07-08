import Link from "next/link";
import { Users, Clock, ChevronRight } from "lucide-react";
import { HiringPanel } from "@/lib/genlayer";
import { statusLabel, statusColor, formatDeadline } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface HiringPanelCardProps {
  panel: HiringPanel;
  applicationCount?: number;
}

export function HiringPanelCard({ panel, applicationCount }: HiringPanelCardProps) {
  const color = statusColor(panel.status);

  return (
    <Link href={`/panels/${panel.panel_id}`}>
      <div className="group bg-hiring-navy border border-white/10 rounded-xl p-5 hover:border-white/20 hover:bg-hiring-navy/80 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge color={color}>{statusLabel(panel.status)}</Badge>
              <span className="text-xs text-slate-grey font-mono">#{panel.panel_id}</span>
            </div>
            <h3 className="font-display font-semibold text-paper-white group-hover:text-consensus-cyan transition-colors truncate">
              {panel.role_title}
            </h3>
            <p className="text-sm text-slate-grey mt-0.5">{panel.organisation_name}</p>
          </div>
          <ChevronRight size={18} className="text-slate-grey group-hover:text-consensus-cyan transition-colors flex-shrink-0 mt-1" />
        </div>

        <p className="text-sm text-slate-grey/80 mt-3 line-clamp-2 font-mono text-xs leading-relaxed">
          {panel.role_summary}
        </p>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
          {applicationCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-grey">
              <Users size={13} />
              <span className="font-mono">{applicationCount} candidate{applicationCount !== 1 ? "s" : ""}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-grey">
            <Clock size={13} />
            <span className="font-mono">{formatDeadline(panel.application_deadline)}</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-1">
            {Object.entries(panel.evaluation_weights)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([key, weight]) => (
                <span
                  key={key}
                  className="text-xs font-mono text-slate-grey/60 bg-white/5 px-2 py-0.5 rounded"
                >
                  {key.replace(/_/g, " ")} {weight}%
                </span>
              ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
