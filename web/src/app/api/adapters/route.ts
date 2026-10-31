import { agentFetch } from "@/lib/agent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await agentFetch<{ adapters: unknown[] }>("/adapters", undefined, 8000);
    return Response.json(payload);
  } catch (error) {
    return Response.json({ adapters: [], error: error instanceof Error ? error.message : "Agent unreachable" });
  }
}
