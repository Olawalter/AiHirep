"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPanel, submitApplication, pollUntil, getApplicationsByCandidate } from "@/lib/contract";
import { HiringPanel } from "@/lib/genlayer";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { ExplorerLinkCard } from "@/components/ExplorerLinkCard";
import { AlertCircle, Plus, Minus, Loader2, CheckCircle } from "lucide-react";
import { isDeadlinePassed } from "@/lib/utils";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const panelId = parseInt(params.panelId as string);
  const { address, connected, connect } = useWallet();

  const [panel, setPanel] = useState<HiringPanel | null>(null);
  const [loadingPanel, setLoadingPanel] = useState(true);

  const [form, setForm] = useState({
    name_or_handle: "",
    resume_summary: "",
    portfolio_url: "",
    github_url: "",
    communication_statement: "",
    role_fit_statement: "",
  });
  const [referenceUrls, setReferenceUrls] = useState<string[]>([""]);
  const [workSampleUrls, setWorkSampleUrls] = useState<string[]>([""]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(["", ""]);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Submitting...");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getPanel(panelId).then(setPanel).finally(() => setLoadingPanel(false));
  }, [panelId]);

  const handleSubmit = async () => {
    if (!connected || !address) { await connect(); return; }
    setError(null);
    setLoading(true);
    try {
      setLoadingMsg("Confirm in MetaMask...");
      const tx = await submitApplication(address, panelId, {
        name_or_handle: form.name_or_handle,
        resume_summary: form.resume_summary,
        portfolio_url: form.portfolio_url,
        github_url: form.github_url,
        reference_urls: referenceUrls.filter(Boolean),
        work_sample_urls: workSampleUrls.filter(Boolean),
        communication_statement: form.communication_statement,
        role_fit_statement: form.role_fit_statement,
        evidence_urls: evidenceUrls.filter(Boolean),
      });
      setTxHash(tx);
      setLoadingMsg("Waiting for validator consensus...");
      await pollUntil(async () => {
        const apps = await getApplicationsByCandidate(address);
        return apps.some((a) => a.panel_id === panelId);
      }, 4000, 180000);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (loadingPanel) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-slate-grey">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-mono text-sm">Loading panel...</span>
      </div>
    );
  }

  if (!panel || panel.status !== "open" || isDeadlinePassed(panel.application_deadline)) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="text-slate-grey font-mono mb-4">
          {!panel ? "Panel not found" : "This panel is not accepting applications."}
        </p>
        <Link href={`/panels/${panelId}`}>
          <Button variant="outline">Back to Panel</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-skill-green/20 border border-skill-green/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-skill-green" />
        </div>
        <h1 className="font-display font-bold text-2xl text-paper-white mb-3">Application Submitted</h1>
        <p className="text-slate-grey font-mono text-sm mb-6">
          Your candidate packet has been submitted to panel #{panelId}. Validators will evaluate your evidence after the application window closes.
        </p>
        {txHash && <ExplorerLinkCard label="Application Transaction" txHash={txHash} />}
        <div className="flex gap-3 justify-center mt-6">
          <Link href={`/panels/${panelId}`}><Button variant="outline">View Panel</Button></Link>
          <Link href="/profile"><Button variant="secondary">My Applications</Button></Link>
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
        <h1 className="font-display font-bold text-2xl text-paper-white">Submit Application</h1>
        <p className="text-slate-grey text-sm font-mono mt-1">
          {panel.role_title} · {panel.organisation_name}
        </p>
      </div>

      {/* Role requirements reminder */}
      <Card className="mb-6 bg-signal-blue/5 border-signal-blue/20">
        <p className="text-xs font-mono text-slate-grey uppercase tracking-wider mb-2">Must-Have Requirements</p>
        <ul className="space-y-1">
          {panel.must_have_requirements.map((req, i) => (
            <li key={i} className="text-sm text-paper-white font-mono">{req}</li>
          ))}
        </ul>
      </Card>

      <div className="space-y-6">
        {/* Identity */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Your Identity</h2>
          <Input
            label="Name or Handle"
            placeholder="builder_xyz"
            value={form.name_or_handle}
            onChange={(e) => setForm({ ...form, name_or_handle: e.target.value })}
            hint="Public name or pseudonym for this panel"
          />
        </Card>

        {/* Experience */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Resume & Experience</h2>
          <Textarea
            label="Resume Summary"
            placeholder="Frontend engineer with 3 years of React and Next.js experience. Built wallet-connected dApp dashboards and design system components..."
            value={form.resume_summary}
            onChange={(e) => setForm({ ...form, resume_summary: e.target.value })}
            hint="50–3000 characters. Focus on relevant experience."
            rows={5}
          />
        </Card>

        {/* Evidence links */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-1">Portfolio & GitHub</h2>
          <p className="text-xs font-mono text-slate-grey mb-4">Links validators can visit to assess your evidence.</p>
          <div className="space-y-4">
            <Input
              label="Portfolio URL"
              placeholder="https://yourportfolio.com"
              type="url"
              value={form.portfolio_url}
              onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
            />
            <Input
              label="GitHub URL"
              placeholder="https://github.com/yourhandle"
              type="url"
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
            />
          </div>
        </Card>

        {/* Work samples */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-1">Work Samples</h2>
          <p className="text-xs font-mono text-slate-grey mb-4">Links to specific projects, demos, or repositories. Required: 1–8.</p>
          <div className="space-y-2">
            {workSampleUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`https://example.com/project-${i + 1}`}
                  type="url"
                  value={url}
                  onChange={(e) => setWorkSampleUrls(workSampleUrls.map((u, idx) => idx === i ? e.target.value : u))}
                  className="flex-1"
                />
                {workSampleUrls.length > 1 && (
                  <button onClick={() => setWorkSampleUrls(workSampleUrls.filter((_, idx) => idx !== i))} className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red">
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
            {workSampleUrls.length < 8 && (
              <Button variant="ghost" size="sm" onClick={() => setWorkSampleUrls([...workSampleUrls, ""])}>
                <Plus size={13} /> Add Work Sample
              </Button>
            )}
          </div>
        </Card>

        {/* References */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-1">References</h2>
          <p className="text-xs font-mono text-slate-grey mb-4">Optional. Links to public references or recommendations.</p>
          <div className="space-y-2">
            {referenceUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`https://example.com/reference-${i + 1}`}
                  type="url"
                  value={url}
                  onChange={(e) => setReferenceUrls(referenceUrls.map((u, idx) => idx === i ? e.target.value : u))}
                  className="flex-1"
                />
                <button onClick={() => setReferenceUrls(referenceUrls.filter((_, idx) => idx !== i))} className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red">
                  <Minus size={14} />
                </button>
              </div>
            ))}
            {referenceUrls.length < 5 && (
              <Button variant="ghost" size="sm" onClick={() => setReferenceUrls([...referenceUrls, ""])}>
                <Plus size={13} /> Add Reference
              </Button>
            )}
          </div>
        </Card>

        {/* Evidence URLs */}
        <Card glow="cyan">
          <h2 className="font-display font-semibold text-paper-white mb-1">Evidence Links</h2>
          <p className="text-xs font-mono text-slate-grey mb-4">
            Your strongest proof links. Required: {panel.minimum_evidence_required}–10. These are what validators will assess.
          </p>
          <div className="space-y-2">
            {evidenceUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Evidence ${i + 1}: GitHub project, demo, or proof link`}
                  type="url"
                  value={url}
                  onChange={(e) => setEvidenceUrls(evidenceUrls.map((u, idx) => idx === i ? e.target.value : u))}
                  className="flex-1"
                />
                {evidenceUrls.length > panel.minimum_evidence_required && (
                  <button onClick={() => setEvidenceUrls(evidenceUrls.filter((_, idx) => idx !== i))} className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red">
                    <Minus size={14} />
                  </button>
                )}
              </div>
            ))}
            {evidenceUrls.length < 10 && (
              <Button variant="ghost" size="sm" onClick={() => setEvidenceUrls([...evidenceUrls, ""])}>
                <Plus size={13} /> Add Evidence Link
              </Button>
            )}
          </div>
        </Card>

        {/* Statements */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Your Statements</h2>
          <div className="space-y-4">
            <Textarea
              label="Communication Statement"
              placeholder="I write concise implementation notes and document major decisions. I prefer async-first communication with weekly syncs..."
              value={form.communication_statement}
              onChange={(e) => setForm({ ...form, communication_statement: e.target.value })}
              hint="30–1500 characters. How you communicate and collaborate."
              rows={3}
            />
            <Textarea
              label="Role Fit Statement"
              placeholder="I have shipped wallet-connected dashboards and can build GenLayer dApp interfaces. My portfolio shows Next.js work with blockchain APIs..."
              value={form.role_fit_statement}
              onChange={(e) => setForm({ ...form, role_fit_statement: e.target.value })}
              hint="30–1500 characters. Why you fit this specific role."
              rows={3}
            />
          </div>
        </Card>

        <FairnessGuardrailNotice />

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-risk-red/10 border border-risk-red/30 text-sm text-risk-red font-mono">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={loading}
          className="w-full"
        >
          {loading ? loadingMsg : connected ? "Submit Candidate Packet" : "Connect Wallet to Apply"}
        </Button>
      </div>
    </div>
  );
}
