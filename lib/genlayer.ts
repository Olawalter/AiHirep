import { createClient, chains } from "genlayer-js";

export const CHAIN_CONFIG = {
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || "GenLayer StudioNet",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "61999"),
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api",
  explorerUrl: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL || "https://explorer-studio.genlayer.com",
  contractAddress: process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "",
};

export type PanelStatus =
  | "draft"
  | "open"
  | "closed"
  | "ranked"
  | "appeal_pending"
  | "appeal_reviewed"
  | "finalized"
  | "cancelled";

export type CandidateVerdict = "strong_yes" | "yes" | "maybe" | "no";
export type SkillBand = "exceptional" | "strong" | "good" | "developing" | "insufficient";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface HiringPanel {
  panel_id: number;
  manager: string;
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
  status: PanelStatus;
  created_at: number;
}

export interface CandidateApplication {
  application_id: number;
  panel_id: number;
  candidate: string;
  name_or_handle: string;
  resume_summary: string;
  portfolio_url: string;
  github_url: string;
  reference_urls: string[];
  work_sample_urls: string[];
  communication_statement: string;
  role_fit_statement: string;
  evidence_urls: string[];
  status: string;
  submitted_at: number;
}

export interface RankingEntry {
  application_id: number;
  rank: number;
  verdict: CandidateVerdict;
  technical_band: SkillBand;
  communication_band: SkillBand;
  experience_band: SkillBand;
  role_alignment_band: SkillBand;
  evidence_strength_band: SkillBand;
  culture_fit_band: SkillBand;
  overall_score: number;
  confidence: ConfidenceLevel;
  reasoning: string;
  flags: string[];
}

export interface RankingResult {
  panel_id: number;
  rankings: RankingEntry[];
  status: string;
  created_at: number;
}

export interface Appeal {
  panel_id: number;
  appellant: string;
  basis: string;
  statement: string;
  evidence_urls: string[];
  status: string;
  filed_at: number;
  verdict: string;
  reasoning: string;
}

export const APPEAL_BASES = [
  "new_work_sample",
  "reference_misread",
  "github_evidence_misread",
  "portfolio_misread",
  "experience_misread",
  "role_requirement_misapplied",
  "application_identity_error",
  "conflict_of_interest_claim",
] as const;

export type AppealBasis = (typeof APPEAL_BASES)[number];

let _client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!_client) {
    _client = createClient({ chain: chains.studionet });
  }
  return _client;
}

export function getExplorerTxUrl(txHash: string): string {
  return `${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`;
}

export function getExplorerContractUrl(): string {
  return `${CHAIN_CONFIG.explorerUrl}/address/${CHAIN_CONFIG.contractAddress}`;
}

export function bandToScore(band: string): number {
  const scores: Record<string, number> = {
    exceptional: 5,
    strong: 4,
    good: 3,
    developing: 2,
    insufficient: 1,
  };
  return scores[band] ?? 3;
}

export function bandToPercent(band: string): number {
  return (bandToScore(band) / 5) * 100;
}
