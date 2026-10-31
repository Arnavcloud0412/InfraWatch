import { agentFetch, projectContext } from "@/lib/agent";
import { fetchPublicText } from "@/lib/fetch-url";
import { saveAssessments } from "@/lib/intake";
import { getSnapshot } from "@/lib/repository";
import type { AgentAssessment, SourceType } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SOURCE_TYPES = new Set<SourceType>(["official", "news", "social", "manual", "demonstration"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Send a JSON body." }, { status: 400 });
  const url = String(body.url || "").trim();
  let text = String(body.text || "").trim();
  const title = String(body.title || "").trim() || url || "Manual submission";
  if (!text && !url) return Response.json({ error: "Provide announcement text or a public URL." }, { status: 400 });
  let fullText = Boolean(text);
  if (!text && url) {
    try {
      text = await fetchPublicText(url);
      fullText = true;
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : "The URL could not be read." }, { status: 400 });
    }
  }
  const sourceType = SOURCE_TYPES.has(body.source_type) ? body.source_type : "manual";
  const snapshot = await getSnapshot();
  try {
    const assessment = await agentFetch<AgentAssessment>("/pipeline/process", {
      title,
      text: text.slice(0, 8000),
      url: url || null,
      publisher: String(body.publisher || "Manual submission"),
      source_type: sourceType,
      language: String(body.language || "") || null,
      published_at: null,
      full_text_retrieved: fullText,
      existing_projects: projectContext(snapshot.projects),
      known_hashes: snapshot.sources.map((source) => source.content_hash),
    });
    const summary = await saveAssessments([assessment]);
    const message =
      summary.duplicates > 0
        ? "That source is already in the workspace."
        : summary.irrelevant > 0
          ? "The text was stored as out of scope and no project was created."
          : "The claim was stored as unverified.";
    return Response.json({ ...summary, message });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Extraction failed." }, { status: 503 });
  }
}
