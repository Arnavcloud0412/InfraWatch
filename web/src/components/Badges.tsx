import { verificationLabel } from "@/lib/labels";

export function OriginBadge({ origin, synthetic }: { origin: string; synthetic?: boolean }) {
  if (synthetic || origin === "demonstration") return null;
  return <span className="badge live">Live source</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "conflicting" || status === "rejected" ? "bad" : status === "corroborated" || status === "officially_confirmed" ? "good" : "warn";
  return <span className={`badge ${tone}`}>{verificationLabel(status)}</span>;
}

export function TierBadge({ tier }: { tier: number }) {
  return <span className="badge info">Tier {tier}</span>;
}
