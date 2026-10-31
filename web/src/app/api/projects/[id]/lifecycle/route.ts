import { LIFECYCLE_ORDER } from "@/lib/labels";
import { getSnapshot, updateProjectLifecycle } from "@/lib/repository";
import type { LifecycleStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const LIFECYCLES = new Set<LifecycleStatus>(LIFECYCLE_ORDER);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const lifecycle = body?.lifecycle as string | undefined;
  if (!lifecycle || !LIFECYCLES.has(lifecycle as LifecycleStatus)) {
    return Response.json({ error: "Choose a valid project stage." }, { status: 400 });
  }

  const snapshot = await getSnapshot();
  const project = snapshot.projects.find((item) => item.id === id);
  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }

  try {
    await updateProjectLifecycle(id, lifecycle as LifecycleStatus);
    return Response.json({ ok: true, lifecycle });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Update failed." }, { status: 400 });
  }
}
