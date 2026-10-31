const base = process.env.AGENT_SERVICE_URL || "http://127.0.0.1:8000";

export async function agentFetch<T>(path: string, body?: unknown, timeoutMs = 180000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text.slice(0, 400) || `Agent service returned ${response.status}.`);
    }
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The agent service took too long to respond.");
    }
    if (error instanceof Error && error.message.includes("Agent service")) throw error;
    throw new Error("The agent service is not running. Start it with the command in the README, then try again.");
  } finally {
    clearTimeout(timer);
  }
}

export function projectContext(projects: { id: string; project_name: string; district: string | null; location_name: string | null; infrastructure_category: string }[]) {
  return projects.slice(0, 200).map((project) => ({
    id: project.id,
    project_name: project.project_name,
    district: project.district,
    location_name: project.location_name,
    infrastructure_category: project.infrastructure_category,
  }));
}
