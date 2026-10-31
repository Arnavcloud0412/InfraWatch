import Link from "next/link";
import { StatusBadge } from "@/components/Badges";
import { ReviewForm } from "@/components/ReviewForm";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { formatWhen, lifecycleLabel, verificationLabel } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";
import { isOpenForReview } from "@/lib/workflow";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const focusEvent = one(params.event);
  const snapshot = await getSnapshot();
  const queue = snapshot.events
    .filter((event) => isOpenForReview(event.evidence_status))
    .sort((a, b) => {
      if (focusEvent && a.id === focusEvent) return -1;
      if (focusEvent && b.id === focusEvent) return 1;
      return a.created_at.localeCompare(b.created_at);
    });
  const recent = [...snapshot.review_logs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">Workflow · Review</p>
          <h1>Verification Centre</h1>
        </div>
        <p className="muted">{queue.length} open</p>
      </header>
      <WorkflowStrip
        current="review"
        question="Which claims need human assessment?"
      />
      <p className="banner">
        Several outlets repeating one release are not independent corroboration. Conflicting claims stay on the record. A model recommendation cannot mark a claim officially confirmed. This is the primary place to accept, reject, or request further verification.
      </p>
      {queue.length === 0 ? <p className="panel">The review queue is empty.</p> : null}
      <div className="stack">
        {queue.map((event) => {
          const project = snapshot.projects.find((item) => item.id === event.project_id);
          const source = snapshot.sources.find((item) => item.id === event.source_id);
          const rows = snapshot.evidence.filter((item) => item.event_id === event.id);
          const reported = typeof event.extracted_data?.reported_lifecycle === "string" ? event.extracted_data.reported_lifecycle : null;
          const focused = focusEvent === event.id;
          return (
            <article key={event.id} id={event.id} className={focused ? "panel focus" : "panel"}>
              <div className="split-head">
                <h2 style={{ margin: 0 }}>
                  {project ? <Link href={`/projects/${project.id}`}>{project.project_name}</Link> : "Unlinked project"}
                </h2>
                <StatusBadge status={event.evidence_status} />
              </div>
              <p>{event.reported_claim}</p>
              <p className="prose">
                {source?.publisher || "Unknown publisher"} · {source?.source_type || "unknown"} · retrieved {formatWhen(source?.retrieved_at)}
                {source?.source_url ? (
                  <>
                    {" · "}
                    <a href={source.source_url} target="_blank" rel="noreferrer">
                      Original source
                    </a>
                  </>
                ) : (
                  " · No source URL on record"
                )}
              </p>
              <div className="actions" style={{ marginBottom: 10 }}>
                {project ? <Link href={`/projects/${project.id}`}>Associated project</Link> : null}
                <Link href={`/feed#${event.id}`}>Intelligence record</Link>
                {reported ? <span className="badge">Reported lifecycle: {lifecycleLabel(reported)}</span> : null}
              </div>
              <p className="muted" style={{ fontSize: 13 }}>{event.recommendation_rationale}</p>
              <ul className="prose">
                {rows.map((row) => (
                  <li key={row.id}>{row.supporting_or_conflicting}: {row.evidence_description}</li>
                ))}
              </ul>
              <ReviewForm eventId={event.id} reportedLifecycle={reported} />
            </article>
          );
        })}
      </div>
      <section className="panel" style={{ marginTop: 14 }}>
        <h2>Recent decisions</h2>
        {recent.length === 0 ? <p className="muted">No decisions yet.</p> : null}
        <ul className="prose">
          {recent.map((log) => {
            const event = snapshot.events.find((item) => item.id === log.event_id);
            const project = event ? snapshot.projects.find((item) => item.id === event.project_id) : null;
            return (
              <li key={log.id}>
                {formatWhen(log.created_at)} · {log.reviewer_action} · {verificationLabel(log.previous_status)} → {verificationLabel(log.new_status)}
                {project ? (
                  <>
                    {" · "}
                    <Link href={`/projects/${project.id}`}>{project.project_name}</Link>
                  </>
                ) : null}
                {log.reviewer_notes ? `. ${log.reviewer_notes}` : ""}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
