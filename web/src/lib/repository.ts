import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import type {
  CorrelationCandidate,
  Evidence,
  InfraEvent,
  Project,
  ReviewLog,
  Snapshot,
  Source,
} from "./types";

const seedPath = path.join(process.cwd(), "data", "seed.json");
const storePath = path.join(process.cwd(), "data", "store.json");

let lock: Promise<void> = Promise.resolve();

function locked<T>(task: () => Promise<T>): Promise<T> {
  const run = lock.then(task, task);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function storageMode(): "supabase" | "file" {
  return process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "file";
}

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function readSeed(): Snapshot {
  if (!fs.existsSync(seedPath)) {
    throw new Error("Demonstration seed is missing at web/data/seed.json.");
  }
  return normalise(JSON.parse(fs.readFileSync(seedPath, "utf8")) as Snapshot);
}

function readFileStore(): Snapshot {
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.copyFileSync(seedPath, storePath);
  }
  return normalise(JSON.parse(fs.readFileSync(storePath, "utf8")) as Snapshot);
}

function writeFileStore(snapshot: Snapshot) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(snapshot, null, 2));
}

function normalise(snapshot: Snapshot): Snapshot {
  for (const project of snapshot.projects) {
    project.contextual_criticality_score = Number(project.contextual_criticality_score);
    project.baseline_criticality_tier = Number(project.baseline_criticality_tier) as Project["baseline_criticality_tier"];
    project.proposed_criticality_tier = Number(project.proposed_criticality_tier) as Project["proposed_criticality_tier"];
    project.synthetic = Boolean(project.synthetic);
    project.investment_amount = project.investment_amount == null ? null : Number(project.investment_amount);
  }
  for (const candidate of snapshot.correlation_candidates ?? []) {
    candidate.score = Number(candidate.score);
    candidate.auto_linked = Boolean(candidate.auto_linked);
  }
  snapshot.correlation_candidates ??= [];
  return snapshot;
}

async function ensureSupabaseSeed(client: SupabaseClient) {
  const { count, error } = await client.from("projects").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;
  const seed = readSeed();
  const inserts: [string, unknown[]][] = [
    ["projects", seed.projects],
    ["sources", seed.sources],
    ["events", seed.events],
    ["evidence", seed.evidence],
    ["review_logs", seed.review_logs],
    ["correlation_candidates", seed.correlation_candidates],
  ];
  for (const [table, rows] of inserts) {
    if (!rows.length) continue;
    const { error: insertError } = await client.from(table).insert(rows);
    if (insertError) throw new Error(`${table}: ${insertError.message}`);
  }
}

async function readSupabase(client: SupabaseClient): Promise<Snapshot> {
  await ensureSupabaseSeed(client);
  const [projects, sources, events, evidence, reviewLogs, candidates] = await Promise.all([
    client.from("projects").select("*"),
    client.from("sources").select("*"),
    client.from("events").select("*"),
    client.from("evidence").select("*"),
    client.from("review_logs").select("*"),
    client.from("correlation_candidates").select("*"),
  ]);
  for (const result of [projects, sources, events, evidence, reviewLogs, candidates]) {
    if (result.error) throw new Error(result.error.message);
  }
  return normalise({
    projects: (projects.data ?? []) as Snapshot["projects"],
    sources: (sources.data ?? []) as Snapshot["sources"],
    events: (events.data ?? []) as Snapshot["events"],
    evidence: (evidence.data ?? []) as Snapshot["evidence"],
    review_logs: (reviewLogs.data ?? []) as Snapshot["review_logs"],
    correlation_candidates: (candidates.data ?? []) as Snapshot["correlation_candidates"],
  });
}

export function getSnapshot(): Promise<Snapshot> {
  return locked(async () => {
    const client = supabase();
    if (client) return readSupabase(client);
    return readFileStore();
  });
}

export interface IntakeChange {
  source: Source;
  project: Project | null;
  touchedProjectId: string | null;
  event: InfraEvent | null;
  evidence: Evidence[];
  candidates: CorrelationCandidate[];
}

export function applyIntake(change: IntakeChange): Promise<void> {
  return locked(async () => {
    const client = supabase();
    if (!client) {
      const snapshot = readFileStore();
      if (snapshot.sources.some((source) => source.content_hash === change.source.content_hash)) return;
      snapshot.sources.push(change.source);
      if (change.project) snapshot.projects.push(change.project);
      if (change.touchedProjectId) {
        const project = snapshot.projects.find((item) => item.id === change.touchedProjectId);
        if (project) project.updated_at = change.event?.created_at ?? new Date().toISOString();
      }
      if (change.event) snapshot.events.push(change.event);
      snapshot.evidence.push(...change.evidence);
      snapshot.correlation_candidates.push(...change.candidates);
      writeFileStore(snapshot);
      return;
    }
    const { error: sourceError } = await client.from("sources").insert(change.source);
    if (sourceError) {
      if (sourceError.code === "23505") return;
      throw new Error(sourceError.message);
    }
    if (change.project) {
      const { error } = await client.from("projects").insert(change.project);
      if (error) throw new Error(error.message);
    }
    if (change.touchedProjectId && change.event) {
      const { error } = await client
        .from("projects")
        .update({ updated_at: change.event.created_at })
        .eq("id", change.touchedProjectId);
      if (error) throw new Error(error.message);
    }
    if (change.event) {
      const { error } = await client.from("events").insert(change.event);
      if (error) throw new Error(error.message);
    }
    if (change.evidence.length) {
      const { error } = await client.from("evidence").insert(change.evidence);
      if (error) throw new Error(error.message);
    }
    if (change.candidates.length) {
      const { error } = await client.from("correlation_candidates").insert(change.candidates);
      if (error) throw new Error(error.message);
    }
  });
}

export interface ReviewChange {
  eventId: string;
  evidenceStatus: InfraEvent["evidence_status"];
  projectId: string;
  lifecycleStatus: Project["lifecycle_status"] | null;
  evidenceReviewStatus: string;
  log: ReviewLog;
}

export function applyReview(change: ReviewChange): Promise<void> {
  return locked(async () => {
    const now = change.log.created_at;
    const client = supabase();
    if (!client) {
      const snapshot = readFileStore();
      const event = snapshot.events.find((item) => item.id === change.eventId);
      const project = snapshot.projects.find((item) => item.id === change.projectId);
      if (!event || !project) throw new Error("That record is no longer in the workspace.");
      event.evidence_status = change.evidenceStatus;
      project.updated_at = now;
      if (change.lifecycleStatus) project.lifecycle_status = change.lifecycleStatus;
      for (const item of snapshot.evidence) {
        if (item.event_id === change.eventId) item.review_status = change.evidenceReviewStatus;
      }
      snapshot.review_logs.push(change.log);
      writeFileStore(snapshot);
      return;
    }
    const { error: eventError } = await client
      .from("events")
      .update({ evidence_status: change.evidenceStatus })
      .eq("id", change.eventId);
    if (eventError) throw new Error(eventError.message);
    const projectUpdate: Record<string, string> = { updated_at: now };
    if (change.lifecycleStatus) projectUpdate.lifecycle_status = change.lifecycleStatus;
    const { error: projectError } = await client.from("projects").update(projectUpdate).eq("id", change.projectId);
    if (projectError) throw new Error(projectError.message);
    const { error: evidenceError } = await client
      .from("evidence")
      .update({ review_status: change.evidenceReviewStatus })
      .eq("event_id", change.eventId);
    if (evidenceError) throw new Error(evidenceError.message);
    const { error: logError } = await client.from("review_logs").insert(change.log);
    if (logError) throw new Error(logError.message);
  });
}

export function updateProjectLifecycle(projectId: string, lifecycleStatus: Project["lifecycle_status"]): Promise<void> {
  return locked(async () => {
    const now = new Date().toISOString();
    const client = supabase();
    if (!client) {
      const snapshot = readFileStore();
      const project = snapshot.projects.find((item) => item.id === projectId);
      if (!project) throw new Error("Project not found.");
      project.lifecycle_status = lifecycleStatus;
      project.updated_at = now;
      writeFileStore(snapshot);
      return;
    }
    const { error } = await client
      .from("projects")
      .update({ lifecycle_status: lifecycleStatus, updated_at: now })
      .eq("id", projectId);
    if (error) throw new Error(error.message);
  });
}
