import { ShieldCheck } from "lucide-react";

export function FairnessGuardrailNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-culture-purple/10 border border-culture-purple/20 text-xs text-culture-purple font-mono">
        <ShieldCheck size={14} />
        <span>Evaluates job-relevant evidence only. Protected attributes are not scored.</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-culture-purple/10 border border-culture-purple/20 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-culture-purple" />
        <h3 className="font-display font-semibold text-culture-purple text-sm">Hiring Fairness Guardrails</h3>
      </div>
      <p className="text-sm text-slate-grey font-mono leading-relaxed">
        AI Hiring Panel evaluates candidates on <strong className="text-paper-white">job-relevant evidence only</strong>:{" "}
        technical skills, experience, portfolio quality, communication, and role alignment.
      </p>
      <p className="text-sm text-slate-grey font-mono leading-relaxed">
        This system does <strong className="text-paper-white">not</strong> score or infer protected attributes including race, gender, age, religion,
        ethnicity, disability, sexual orientation, political beliefs, family status, or health status.
      </p>
      <p className="text-xs text-slate-grey/70 font-mono">
        Final hiring decisions remain with the hiring team or organisation.
        This tool produces a consensus-backed recommendation, not a binding decision.
      </p>
    </div>
  );
}
