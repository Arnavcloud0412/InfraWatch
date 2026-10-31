import Link from "next/link";
import { OriginBadge, StatusBadge } from "@/components/Badges";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { categoryLabel, formatWhen } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";
import { isOpenForReview } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const snapshot = await getSnapshot();
  const events = [...snapshot.events].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">Intelligence</p>
          <h1>Intelligence Feed</h1>
        </div>
      </header>
      <WorkflowStrip
        current={["extract", "assess"]}
        question="What new information has been discovered?"
      />
      <p className="banner">Each card is an intake, not a confirmed update. Extraction text is what was read out of the source. Unreviewed claims go to the Verification Centre.</p>
      <div className="stack">
        {events.map((event) => {
          const project = snapshot.projects.find((item) => item.id === event.project_id);
          const source = snapshot.sources.find((item) => item.id === event.source_id);
          const trace = Array.isArray(event.extracted_data?.agent_trace) ? (event.extracted_data?.agent_trace as string[]) : [];
          const open = isOpenForReview(event.evidence_status);
          return (
            <article key={event.id} id={event.id} className="panel">
              <div className="split-head">
                <h2 style={{ margin: 0 }}>{source?.title || project?.project_name}</h2>
                <StatusBadge status={event.evidence_status} />
              </div>
              <p className="muted" style={{ fontSize: 13 }}>
                {source?.language} · {formatWhen(source?.published_at || event.created_at)}
                {source?.source_url ? <> · <a href={source.source_url}>{source.source_url}</a></> : null}
              </p>
              <p>{event.reported_claim}</p>
              <div className="actions">
                {project ? <OriginBadge origin={project.record_origin} synthetic={project.synthetic} /> : null}
                <span className="badge">{event.event_type.replaceAll("_", " ")}</span>
                {project ? <span className="badge">{categoryLabel(project.infrastructure_category)}</span> : null}
                {project ? <Link href={`/projects/${project.id}`}>Open project</Link> : null}
                {open ? <Link href={`/verification?event=${event.id}`}>Review claim</Link> : null}
              </div>
              {trace.length ? (
                <p className="muted" style={{ fontSize: 12 }}>Pipeline: {trace.join(" → ")}</p>
              ) : event.pipeline_mode === "demonstration_seed" || event.pipeline_mode === "illustrative_dataset" ? (
                <p className="muted" style={{ fontSize: 12 }}>Source: Illustrative dataset</p>
              ) : event.pipeline_mode ? (
                <p className="muted" style={{ fontSize: 12 }}>Pipeline: {event.pipeline_mode}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
