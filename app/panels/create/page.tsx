"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { createPanel, pollUntil, getPanelsByManager, getAllPanels } from "@/lib/contract";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FairnessGuardrailNotice } from "@/components/FairnessGuardrailNotice";
import { ExplorerLinkCard } from "@/components/ExplorerLinkCard";
import { Plus, Minus, AlertCircle } from "lucide-react";

const DEFAULT_WEIGHTS = {
  technical_skills: 35,
  experience: 20,
  portfolio_quality: 20,
  communication: 15,
  role_alignment: 10,
};

export default function CreatePanelPage() {
  const router = useRouter();
  const { address, connected, connect } = useWallet();

  const [form, setForm] = useState({
    organisation_name: "",
    role_title: "",
    role_summary: "",
    culture_values: "",
    minimum_evidence_required: 2,
    deadline_days: 7,
    appeal_window_hours: 24,
  });

  const [mustHave, setMustHave] = useState<string[]>([""]);
  const [niceToHave, setNiceToHave] = useState<string[]>([""]);
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [customWeightKey, setCustomWeightKey] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Deploying...");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const weightTotal = Object.values(weights).reduce((a, b) => a + b, 0);

  const handleCreate = async () => {
    if (!connected || !address) {
      await connect();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const deadline = Math.floor(Date.now() / 1000) + form.deadline_days * 86400;
      const appealWindow = form.appeal_window_hours * 3600;

      setLoadingMsg("Confirm in MetaMask...");
      const tx = await createPanel(address, {
        organisation_name: form.organisation_name,
        role_title: form.role_title,
        role_summary: form.role_summary,
        must_have_requirements: mustHave.filter(Boolean),
        nice_to_have_requirements: niceToHave.filter(Boolean),
        evaluation_weights: weights,
        culture_values: form.culture_values,
        minimum_evidence_required: form.minimum_evidence_required,
        application_deadline: deadline,
        appeal_window: appealWindow,
      });

      setTxHash(tx);
      setLoadingMsg("Waiting for validator consensus...");

      // Poll until the panel appears — try both manager lookup and get_all_panels
      let found: import("@/lib/genlayer").HiringPanel | null = null;
      let attempt = 0;
      await pollUntil(async () => {
        attempt++;
        // Try manager-specific lookup first
        const byManager = await getPanelsByManager(address);
        console.log(`[poll #${attempt}] getPanelsByManager(${address.toLowerCase()}):`, byManager);
        if (byManager.length > 0) {
          found = byManager[byManager.length - 1];
          return true;
        }
        // Fallback: scan all panels
        const all = await getAllPanels();
        console.log(`[poll #${attempt}] getAllPanels:`, all);
        const mine = all.filter((p) => p.manager.toLowerCase() === address.toLowerCase());
        if (mine.length > 0) {
          found = mine[mine.length - 1];
          return true;
        }
        return false;
      }, 4000, 180000);

      if (found) {
        router.push(`/panels/${(found as import("@/lib/genlayer").HiringPanel).panel_id}`);
      } else {
        // Timed out — go to panels list, it will auto-refresh
        router.push("/panels");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create panel");
    } finally {
      setLoading(false);
    }
  };

  const addMustHave = () => setMustHave([...mustHave, ""]);
  const removeMustHave = (i: number) => setMustHave(mustHave.filter((_, idx) => idx !== i));
  const updateMustHave = (i: number, v: string) => setMustHave(mustHave.map((x, idx) => idx === i ? v : x));

  const addNiceToHave = () => setNiceToHave([...niceToHave, ""]);
  const removeNiceToHave = (i: number) => setNiceToHave(niceToHave.filter((_, idx) => idx !== i));
  const updateNiceToHave = (i: number, v: string) => setNiceToHave(niceToHave.map((x, idx) => idx === i ? v : x));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-paper-white">Create Hiring Panel</h1>
        <p className="text-slate-grey text-sm font-mono mt-1">
          Define the role mandate. Validators will evaluate candidates against it.
        </p>
      </div>

      <div className="space-y-6">
        {/* Organisation & Role */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Role Identity</h2>
          <div className="space-y-4">
            <Input
              label="Organisation Name"
              placeholder="LayerWorks DAO"
              value={form.organisation_name}
              onChange={(e) => setForm({ ...form, organisation_name: e.target.value })}
              hint="3–80 characters"
            />
            <Input
              label="Role Title"
              placeholder="Frontend Engineer for GenLayer dApps"
              value={form.role_title}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
            />
            <Textarea
              label="Role Summary"
              placeholder="Build polished Next.js interfaces for contract-driven GenLayer products..."
              value={form.role_summary}
              onChange={(e) => setForm({ ...form, role_summary: e.target.value })}
              hint="30–2000 characters"
              rows={4}
            />
          </div>
        </Card>

        {/* Requirements */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Role Requirements</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-display text-slate-grey mb-2">
                Must-Have Requirements <span className="text-risk-red">*</span>
              </label>
              <div className="space-y-2">
                {mustHave.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Requirement ${i + 1}`}
                      value={req}
                      onChange={(e) => updateMustHave(i, e.target.value)}
                      className="flex-1"
                    />
                    {mustHave.length > 1 && (
                      <button
                        onClick={() => removeMustHave(i)}
                        className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red hover:border-risk-red/30 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {mustHave.length < 10 && (
                  <Button variant="ghost" size="sm" onClick={addMustHave}>
                    <Plus size={13} /> Add Requirement
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-display text-slate-grey mb-2">Nice-to-Have Requirements</label>
              <div className="space-y-2">
                {niceToHave.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Nice-to-have ${i + 1}`}
                      value={req}
                      onChange={(e) => updateNiceToHave(i, e.target.value)}
                      className="flex-1"
                    />
                    <button
                      onClick={() => removeNiceToHave(i)}
                      className="w-9 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-grey hover:text-risk-red hover:border-risk-red/30 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
                {niceToHave.length < 10 && (
                  <Button variant="ghost" size="sm" onClick={addNiceToHave}>
                    <Plus size={13} /> Add Nice-to-Have
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Evaluation Weights */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-paper-white">Evaluation Weights</h2>
            <span
              className={`font-mono text-sm font-bold ${
                weightTotal === 100 ? "text-skill-green" : "text-risk-red"
              }`}
            >
              {weightTotal}/100
            </span>
          </div>
          {weightTotal !== 100 && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-risk-red/10 border border-risk-red/20 text-xs text-risk-red font-mono">
              <AlertCircle size={12} />
              Weights must sum to exactly 100
            </div>
          )}
          <div className="space-y-3">
            {Object.entries(weights).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-sm font-mono text-slate-grey flex-1 capitalize">
                  {key.replace(/_/g, " ")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                    className="w-32 accent-signal-blue"
                  />
                  <span className="font-mono text-sm text-paper-white w-8 text-right">{val}%</span>
                  <button
                    onClick={() => {
                      const next = { ...weights };
                      delete next[key];
                      setWeights(next);
                    }}
                    className="text-slate-grey hover:text-risk-red transition-colors"
                  >
                    <Minus size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="custom_metric"
                value={customWeightKey}
                onChange={(e) => setCustomWeightKey(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (customWeightKey && !weights[customWeightKey]) {
                    setWeights({ ...weights, [customWeightKey]: 0 });
                    setCustomWeightKey("");
                  }
                }}
              >
                <Plus size={13} /> Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Culture & Settings */}
        <Card>
          <h2 className="font-display font-semibold text-paper-white mb-4">Culture & Timeline</h2>
          <div className="space-y-4">
            <Textarea
              label="Culture Values (job-relevant only)"
              placeholder="Clear communication, ownership, shipping speed, documentation discipline..."
              value={form.culture_values}
              onChange={(e) => setForm({ ...form, culture_values: e.target.value })}
              hint="Only include team-relevant professional values"
              rows={2}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Min Evidence Links"
                type="number"
                min={1}
                max={10}
                value={form.minimum_evidence_required}
                onChange={(e) => setForm({ ...form, minimum_evidence_required: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Application Window (days)"
                type="number"
                min={1}
                max={365}
                value={form.deadline_days}
                onChange={(e) => setForm({ ...form, deadline_days: parseInt(e.target.value) || 1 })}
              />
              <Input
                label="Appeal Window (hours)"
                type="number"
                min={1}
                max={168}
                value={form.appeal_window_hours}
                onChange={(e) => setForm({ ...form, appeal_window_hours: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        </Card>

        <FairnessGuardrailNotice />

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-risk-red/10 border border-risk-red/30 text-sm text-risk-red font-mono">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {txHash && (
          <ExplorerLinkCard label="Panel Creation Transaction" txHash={txHash} />
        )}

        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCreate}
            loading={loading}
            disabled={weightTotal !== 100}
            className="flex-1"
          >
            {loading ? loadingMsg : connected ? "Deploy Hiring Panel" : "Connect Wallet to Deploy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
