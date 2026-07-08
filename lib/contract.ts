"use client";

import { createClient, chains } from "genlayer-js";
import { CHAIN_CONFIG, type HiringPanel, type CandidateApplication, type RankingResult, type Appeal } from "./genlayer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CalldataEncodable = any;

const CONTRACT = CHAIN_CONFIG.contractAddress as `0x${string}`;

// ─── Clients ─────────────────────────────────────────────────────────────────

let _publicClient: ReturnType<typeof createClient> | null = null;

function getPublicClient() {
  if (!_publicClient) {
    _publicClient = createClient({
      chain: chains.studionet,
      endpoint: CHAIN_CONFIG.rpcUrl,
    });
  }
  return _publicClient;
}

function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not available. Please install MetaMask.");
  }
  return createClient({
    chain: chains.studionet,
    endpoint: CHAIN_CONFIG.rpcUrl,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: window.ethereum as any,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callView<T>(fn: string, args: CalldataEncodable[] = [], retries = 5): Promise<T> {
  const client = getPublicClient();
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await client.readContract({ address: CONTRACT, functionName: fn, args });
      console.log(`[callView] ${fn} raw result:`, result, typeof result);
      if (typeof result === "string") {
        try { return JSON.parse(result) as T; } catch { return result as unknown as T; }
      }
      if (result !== null && typeof result === "object") return result as T;
      return result as T;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const busy = msg.includes("Server busy") || msg.includes("execution slots");
      if (busy && attempt < retries) {
        const delay = 2000 * (attempt + 1);
        console.warn(`[callView] ${fn} server busy, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw new Error(`[callView] ${fn} failed after ${retries} retries`);
}

// Poll until a predicate resolves true or timeout (ms) elapses.
export async function pollUntil(
  check: () => Promise<boolean>,
  intervalMs = 2000,
  timeoutMs = 90000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      if (await check()) return;
    } catch {
      // keep polling
    }
  }
}

// No-op export kept for callers in [panelId]/page.tsx — those use pollUntil internally now.
export async function waitForTx(_txHash: string): Promise<void> {
  // StudioNet eth_getTransactionByHash is unreliable from browser.
  // Callers that need state confirmation should use pollUntil instead.
  await new Promise((r) => setTimeout(r, 3000));
}

async function sendTx(fn: string, args: CalldataEncodable[], from: string): Promise<string> {
  const client = getWalletClient();
  console.log(`[sendTx] calling ${fn} from ${from}, args:`, args);
  const txHash = await client.writeContract({
    account: { address: from as `0x${string}`, type: "json-rpc" as const },
    address: CONTRACT,
    functionName: fn,
    args,
    value: BigInt(0),
  });
  console.log(`[sendTx] ${fn} tx hash:`, txHash);

  // Immediately check the EVM tx to see if it landed
  try {
    const receipt = await fetch(CHAIN_CONFIG.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionByHash", params: [txHash] }),
    }).then((r) => r.json());
    console.log(`[sendTx] eth_getTransactionByHash for ${fn}:`, JSON.stringify(receipt).slice(0, 400));
  } catch (e) {
    console.warn("[sendTx] could not fetch tx:", e);
  }

  return txHash as string;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAllPanels(): Promise<HiringPanel[]> {
  try {
    const result = await callView<HiringPanel[]>("get_all_panels");
    console.log("[getAllPanels] result:", result);
    return result ?? [];
  } catch (e) {
    console.error("[getAllPanels] error:", e);
    return [];
  }
}

export async function getPanel(panelId: number): Promise<HiringPanel | null> {
  try { return await callView<HiringPanel>("get_panel", [panelId]); }
  catch { return null; }
}

export async function getPanelApplications(panelId: number): Promise<CandidateApplication[]> {
  try { return await callView<CandidateApplication[]>("get_panel_applications", [panelId]); }
  catch { return []; }
}

export async function getApplication(applicationId: number): Promise<CandidateApplication | null> {
  try { return await callView<CandidateApplication>("get_application", [applicationId]); }
  catch { return null; }
}

export async function getRankingResult(panelId: number): Promise<RankingResult | null> {
  try { return await callView<RankingResult>("get_ranking_result", [panelId]); }
  catch { return null; }
}

export async function getAppeal(panelId: number): Promise<Appeal | null> {
  try { return await callView<Appeal>("get_appeal", [panelId]); }
  catch { return null; }
}

export async function getPanelsByManager(address: string): Promise<HiringPanel[]> {
  try { return await callView<HiringPanel[]>("get_panels_by_manager", [address.toLowerCase()]); }
  catch { return []; }
}

export async function getApplicationsByCandidate(address: string): Promise<CandidateApplication[]> {
  try {
    const result = await callView<CandidateApplication[]>("get_applications_by_candidate", [address.toLowerCase()]);
    console.log("[getApplicationsByCandidate] result for", address.toLowerCase(), ":", result);
    return result ?? [];
  } catch (e) {
    console.error("[getApplicationsByCandidate] error:", e);
    return [];
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createPanel(
  from: string,
  params: {
    organisation_name: string;
    role_title: string;
    role_summary: string;
    must_have_requirements: string[];
    nice_to_have_requirements: string[];
    evaluation_weights: Record<string, number>;
    culture_values: string;
    minimum_evidence_required: number;
    application_deadline: number;
    appeal_window: number;
  }
): Promise<string> {
  return sendTx("create_panel", [
    params.organisation_name,
    params.role_title,
    params.role_summary,
    JSON.stringify(params.must_have_requirements),
    JSON.stringify(params.nice_to_have_requirements),
    JSON.stringify(params.evaluation_weights),
    params.culture_values,
    params.minimum_evidence_required,
    params.application_deadline,
    params.appeal_window,
  ], from);
}

export async function openPanel(from: string, panelId: number): Promise<string> {
  return sendTx("open_panel", [panelId], from);
}

export async function closeApplications(from: string, panelId: number): Promise<string> {
  return sendTx("close_applications", [panelId], from);
}

export async function cancelPanel(from: string, panelId: number): Promise<string> {
  return sendTx("cancel_panel", [panelId], from);
}

export async function submitApplication(
  from: string,
  panelId: number,
  params: {
    name_or_handle: string;
    resume_summary: string;
    portfolio_url: string;
    github_url: string;
    reference_urls: string[];
    work_sample_urls: string[];
    communication_statement: string;
    role_fit_statement: string;
    evidence_urls: string[];
  }
): Promise<string> {
  return sendTx("submit_application", [
    panelId,
    params.name_or_handle,
    params.resume_summary,
    params.portfolio_url,
    params.github_url,
    JSON.stringify(params.reference_urls),
    JSON.stringify(params.work_sample_urls),
    params.communication_statement,
    params.role_fit_statement,
    JSON.stringify(params.evidence_urls),
  ], from);
}

export async function reviseApplication(
  from: string,
  candidateId: number,
  params: {
    name_or_handle: string;
    resume_summary: string;
    portfolio_url: string;
    github_url: string;
    reference_urls: string[];
    work_sample_urls: string[];
    communication_statement: string;
    role_fit_statement: string;
    evidence_urls: string[];
  }
): Promise<string> {
  return sendTx("revise_application", [
    candidateId,
    params.name_or_handle,
    params.resume_summary,
    params.portfolio_url,
    params.github_url,
    JSON.stringify(params.reference_urls),
    JSON.stringify(params.work_sample_urls),
    params.communication_statement,
    params.role_fit_statement,
    JSON.stringify(params.evidence_urls),
  ], from);
}

export async function requestRanking(from: string, panelId: number): Promise<string> {
  return sendTx("request_ranking", [panelId], from);
}

export async function fileAppeal(
  from: string,
  panelId: number,
  basis: string,
  statement: string,
  evidenceUrls: string[]
): Promise<string> {
  return sendTx("file_appeal", [panelId, basis, statement, JSON.stringify(evidenceUrls)], from);
}

export async function requestAppealReview(from: string, panelId: number): Promise<string> {
  return sendTx("request_appeal_review", [panelId], from);
}

export async function finalizeRanking(from: string, panelId: number): Promise<string> {
  return sendTx("finalize_ranking", [panelId], from);
}
