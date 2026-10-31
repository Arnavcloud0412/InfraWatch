import type { CriticalityTier, InfrastructureCategory, LifecycleStatus, VerificationStatus } from "./types";

export const CATEGORY_LABELS: Record<InfrastructureCategory, string> = {
  national_highway: "National highway",
  expressway: "Expressway",
  railway: "Railway",
  bridge: "Bridge",
  tunnel: "Tunnel",
  port: "Port",
  airport: "Airport",
  hospital: "Hospital",
  emergency_healthcare: "Emergency healthcare",
  energy: "Energy",
  utilities: "Utilities",
  other: "Other",
};

export const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  proposed: "Proposed",
  approved: "Approved / sanctioned",
  tendering: "Tendering",
  construction_started: "Construction started",
  under_construction: "Under construction",
  partially_operational: "Partially operational",
  completed: "Completed / operational",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  newly_detected: "Newly detected",
  under_verification: "Under verification",
  corroborated: "Corroborated",
  officially_confirmed: "Officially confirmed",
  conflicting: "Conflicting",
  rejected: "Rejected",
};

export const TIER_LABELS: Record<CriticalityTier, string> = {
  1: "Critical connectivity",
  2: "Essential public services",
  3: "Economic and industrial",
  4: "Regional and community",
  5: "General development",
};

export const FACTOR_LABELS: Record<string, string> = {
  connectivity: "Connectivity",
  essential_service: "Essential service",
  economic: "Economic significance",
  public_dependency: "Public dependency",
  emergency: "Emergency relevance",
};

export const LIFECYCLE_ORDER: LifecycleStatus[] = [
  "proposed",
  "approved",
  "tendering",
  "construction_started",
  "under_construction",
  "partially_operational",
  "completed",
  "on_hold",
  "cancelled",
];

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value as InfrastructureCategory] ?? value;
}

export function lifecycleLabel(value: string | null | undefined): string {
  if (!value) return "Not stated";
  return LIFECYCLE_LABELS[value as LifecycleStatus] ?? value;
}

export function verificationLabel(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return VERIFICATION_LABELS[value as VerificationStatus] ?? value;
}

export function tierLabel(value: number): string {
  return TIER_LABELS[value as CriticalityTier] ?? `Tier ${value}`;
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatInvestment(amount: number | null, currency: string | null, status: string | null): string {
  if (amount == null) return "Not stated";
  let formatted = `${currency || "INR"} ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
  try {
    formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    formatted = `${currency || "INR"} ${amount}`;
  }
  if (status === "synthetic_demonstration") return `${formatted} · synthetic figure`;
  if (status === "reported_unverified") return `${formatted} · reported, unverified`;
  if (status === "analyst_accepted") return `${formatted} · accepted by a reviewer`;
  return formatted;
}
