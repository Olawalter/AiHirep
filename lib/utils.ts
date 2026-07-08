import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDeadline(ts: number): string {
  if (!ts) return "—";
  const now = Date.now() / 1000;
  const diff = ts - now;
  if (diff < 0) return "Closed";
  if (diff < 3600) return `${Math.floor(diff / 60)}m remaining`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h remaining`;
  return `${Math.floor(diff / 86400)}d remaining`;
}

export function isDeadlinePassed(ts: number): boolean {
  return Date.now() / 1000 > ts;
}

export function bandLabel(band: string): string {
  return band.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function bandColor(band: string): string {
  const colors: Record<string, string> = {
    exceptional: "#2CE88A",
    strong: "#22D3EE",
    good: "#F5B841",
    developing: "#8B93A1",
    insufficient: "#FF4D5E",
  };
  return colors[band] ?? "#8B93A1";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    open: "Open",
    closed: "Applications Closed",
    ranked: "Ranked",
    appeal_pending: "Appeal Pending",
    appeal_reviewed: "Appeal Reviewed",
    finalized: "Finalized",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "#8B93A1",
    open: "#2CE88A",
    closed: "#F5B841",
    ranked: "#2563EB",
    appeal_pending: "#F5B841",
    appeal_reviewed: "#8B5CF6",
    finalized: "#2CE88A",
    cancelled: "#FF4D5E",
  };
  return colors[status] ?? "#8B93A1";
}

export function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    strong_yes: "Strong Yes",
    yes: "Yes",
    maybe: "Maybe",
    no: "No",
    upheld: "Appeal Upheld",
    dismissed: "Appeal Dismissed",
  };
  return labels[verdict] ?? verdict;
}

export function confidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[confidence] ?? confidence;
}
