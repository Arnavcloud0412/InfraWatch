import { reviewEvent } from "@/lib/review";

export const dynamic = "force-dynamic";

const ACTIONS = new Set(["accept", "reject", "request_verification"]);

export async function POST(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || !ACTIONS.has(body.action)) {
    return Response.json({ error: "Choose accept, reject, or request verification." }, { status: 400 });
  }
  try {
    const result = await reviewEvent({
      eventId,
      action: body.action,
      notes: String(body.notes || "").slice(0, 2000),
      applyLifecycle: Boolean(body.applyLifecycle),
      lifecycle: typeof body.lifecycle === "string" ? body.lifecycle : null,
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Review failed." }, { status: 400 });
  }
}
