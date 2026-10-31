import { agentFetch, projectContext } from "@/lib/agent";
import { saveAssessments } from "@/lib/intake";
import { getSnapshot } from "@/lib/repository";
import type { AgentAssessment } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const maxItems = Math.max(1, Math.min(5, Number(body.max_items) || 3));
  const snapshot = await getSnapshot();
  try {
    const result = await agentFetch<{ items?: AgentAssessment[]; errors?: string[]; duplicates?: number; considered?: number }>(
      "/pipeline/discover",
      {
        max_items: maxItems,
        existing_projects: projectContext(snapshot.projects),
        known_hashes: snapshot.sources.map((source) => source.content_hash),
      },
    );
    const summary = await saveAssessments(result.items ?? []);
    return Response.json({ ...summary, errors: result.errors ?? [], considered: result.considered ?? 0, sourceDuplicates: result.duplicates ?? 0 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Discovery failed." }, { status: 503 });
  }
}
