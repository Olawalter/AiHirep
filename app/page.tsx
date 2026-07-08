import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { ArrowRight, Shield, Layers, GitBranch, Award } from "lucide-react";

const FLOW_STEPS = [
  { step: "01", label: "Create Hiring Panel", desc: "Define role mandate, requirements, and evaluation weights." },
  { step: "02", label: "Collect Applications", desc: "Candidates submit structured packets with portfolio, GitHub, and evidence links." },
  { step: "03", label: "GenLayer Consensus", desc: "Validators independently assess each candidate against the role mandate." },
  { step: "04", label: "Canonical Ranking", desc: "A consensus-backed shortlist is stored on-chain, auditable and appealable." },
];

const USE_CASES = [
  "Software engineer hiring",
  "Developer relations roles",
  "DAO contributor selection",
  "Grant reviewer selection",
  "Hackathon fellowship",
  "Research assistant",
  "Product designer evaluation",
  "AI agent builder selection",
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-consensus-cyan/30 bg-consensus-cyan/5 text-consensus-cyan text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-consensus-cyan animate-pulse" />
          Powered by GenLayer StudioNet Validators
        </div>

        <h1 className="font-accent text-5xl sm:text-6xl lg:text-7xl text-paper-white leading-tight mb-6">
          Do not screen resumes.
          <br />
          <span className="text-signal-blue">Evaluate role fit</span> with evidence.
        </h1>

        <p className="text-slate-grey text-lg sm:text-xl max-w-3xl mx-auto font-mono leading-relaxed mb-10">
          AI Hiring Panel uses GenLayer validators to compare candidates by technical skill, communication, experience,
          portfolio evidence, references, and role alignment — then produces a{" "}
          <strong className="text-paper-white">consensus-backed ranking</strong>.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/panels/create">
            <Button size="lg" variant="primary">
              Create Hiring Panel
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link href="/panels">
            <Button size="lg" variant="outline">
              View Panels
            </Button>
          </Link>
        </div>
      </section>

      {/* Why section */}
      <section className="py-16 border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display font-bold text-3xl text-paper-white mb-6">
              Hiring is judgement, not keyword matching.
            </h2>
            <div className="space-y-4 text-slate-grey font-mono text-sm leading-relaxed">
              <p>A resume can overclaim.</p>
              <p>A portfolio can prove.</p>
              <p className="text-paper-white">
                GenLayer lets validators compare the evidence, not just the words.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {[
                { Icon: Shield, label: "Evidence-Based", desc: "Portfolio, GitHub, work samples, and references — not just resume text." },
                { Icon: Layers, label: "Consensus-Backed", desc: "Multiple validators independently evaluate and agree on a canonical ranking." },
                { Icon: GitBranch, label: "Auditable & Appealable", desc: "Every ranking is stored on-chain with a structured appeal process." },
                { Icon: Award, label: "Role-Specific", desc: "Each panel is anchored to a role mandate with custom evaluation weights." },
              ].map(({ Icon, label, desc }) => (
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-signal-blue/10 border border-signal-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-signal-blue" />
                  </div>
                  <div>
                    <p className="text-paper-white font-display font-semibold text-sm">{label}</p>
                    <p className="text-slate-grey text-xs font-mono mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-hiring-navy p-5">
              <p className="text-xs font-mono text-slate-grey mb-2">Normal ATS says:</p>
              <p className="font-mono text-slate-grey line-through text-sm">&ldquo;This candidate looks good.&rdquo;</p>
            </div>
            <div className="text-center text-slate-grey text-xs font-mono">vs</div>
            <div className="rounded-xl border border-consensus-cyan/30 bg-consensus-cyan/5 p-5">
              <p className="text-xs font-mono text-consensus-cyan mb-2">AI Hiring Panel asks:</p>
              <p className="font-mono text-paper-white text-sm leading-relaxed">
                &ldquo;Which candidate best satisfies the role mandate and hiring rubric based on submitted evidence?&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="py-16 border-t border-white/10">
        <h2 className="font-display font-bold text-2xl text-paper-white mb-10 text-center">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FLOW_STEPS.map(({ step, label, desc }) => (
            <div
              key={step}
              className="relative bg-hiring-navy border border-white/10 rounded-xl p-5 hover:border-signal-blue/30 transition-colors"
            >
              <span className="font-accent text-4xl text-signal-blue/20">{step}</span>
              <h3 className="font-display font-semibold text-paper-white mt-2 mb-2">{label}</h3>
              <p className="text-xs font-mono text-slate-grey leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display font-bold text-2xl text-paper-white mb-6">Use Cases</h2>
            <div className="grid grid-cols-2 gap-2">
              {USE_CASES.map((uc) => (
                <div
                  key={uc}
                  className="px-3 py-2 rounded-lg bg-hiring-navy border border-white/10 text-xs font-mono text-slate-grey"
                >
                  {uc}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-2xl text-paper-white mb-6">Who Uses It?</h2>
            {[
              { who: "Hiring Teams", desc: "Evaluate candidates against a structured role rubric." },
              { who: "DAOs", desc: "Rank contributors for funded roles transparently." },
              { who: "Hackathon Organisers", desc: "Evaluate applicants for builder programs." },
              { who: "Grant Programs", desc: "Select fellows, builders, and reviewers fairly." },
            ].map(({ who, desc }) => (
              <div key={who} className="flex gap-3">
                <div className="w-1.5 rounded-full bg-skill-green flex-shrink-0 mt-1" style={{ height: "auto" }} />
                <div>
                  <p className="font-display font-semibold text-paper-white text-sm">{who}</p>
                  <p className="text-xs font-mono text-slate-grey">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fairness */}
      <section className="py-16 border-t border-white/10">
        <FairnessGuardrailNotice />
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/10 text-center">
        <h2 className="font-accent text-3xl text-paper-white mb-4">
          Ready to evaluate evidence, not keywords?
        </h2>
        <p className="text-slate-grey font-mono text-sm mb-8">
          Create a hiring panel, define your role mandate, and let GenLayer validators produce a consensus-backed ranking.
        </p>
        <Link href="/panels/create">
          <Button size="lg" variant="primary">
            Create Hiring Panel
            <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
    </div>
  );
}
