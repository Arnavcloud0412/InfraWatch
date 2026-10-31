import { agentFetch } from "@/lib/agent";
import { storageMode } from "@/lib/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const agent = await agentFetch<Record<string, unknown>>("/health", undefined, 4000);
    return Response.json({ storage: storageMode(), agent });
  } catch (error) {
    return Response.json({
      storage: storageMode(),
      agent: { status: "down", detail: error instanceof Error ? error.message : "Agent unreachable" },
    });
  }
}
