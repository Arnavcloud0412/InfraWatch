import Link from "next/link";
import { notFound } from "next/navigation";
import { OriginBadge, StatusBadge, TierBadge } from "@/components/Badges";
import { LifecycleForm } from "@/components/LifecycleForm";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { FACTOR_LABELS, categoryLabel, formatInvestment, formatWhen, lifecycleLabel, tierLabel, verificationLabel } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";
import { isOpenForReview } from "@/lib/workflow";
import type { LifecycleStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getSnapshot();
  const project = snapshot.projects.find((item) => item.id === id);
  if (!project) notFound();
  const events = snapshot.events.filter((event) => event.project_id === project.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const logs = snapshot.review_logs.filter((log) => events.some((event) => event.id === log.event_id)).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const candidates = snapshot.correlation_candidates.filter((candidate) => events.some((event) => event.id === candidate.event_id));
  const openEvents = events.filter((event) => isOpenForReview(event.evidence_status));
  const latest = events[0];

  return (
    <div>
      <p className="kicker"><Link href="/projects">Project Explorer</Link></p>
      <header className="page-head">
        <div>
          <h1>{project.project_name}</h1>
          <p className="muted">{project.district || "District not stated"} · {project.location_name || "Location not stated"} · {project.state}</p>
        </div>
        <div className="actions">
          <OriginBadge origin={project.record_origin} synthetic={project.synthetic} />
          <TierBadge tier={project.proposed_criticality_tier} />
          {latest ? <StatusBadge status={latest.evidence_status} /> : null}
        </div>
      </header>
      <WorkflowStrip
        current="track"
        question="What is this project's history, lifecycle and verification status?"
      />
      <p className="prose">{project.description}</p>
      {openEvents.length ? (
        <p className="banner">
          {openEvents.length} claim{openEvents.length === 1 ? "" : "s"} open for review.{" "}
          <Link href={`/verification?event=${openEvents[0].id}`}>Review in Verification Centre</Link>
        </p>
      ) : null}
      <div className="grid-2">
        <section className="panel">
          <h2>Record</h2>
          <table>
            <tbody>
              <tr><td>Category</td><td>{categoryLabel(project.infrastructure_category)}</td></tr>
              <tr><td>Recorded lifecycle</td><td>{lifecycleLabel(project.lifecycle_status)}</td></tr>
              <tr><td>Reported lifecycle</td><td>{lifecycleLabel(project.reported_lifecycle_status)} <span className="muted">· claim, not the record</span></td></tr>
              <tr><td>Investment</td><td>{formatInvestment(project.investment_amount, project.currency, project.investment_status)}</td></tr>
              <tr><td>Expected completion</td><td>{project.expected_completion_date ? formatWhen(project.expected_completion_date) : "Not accepted onto the record"}</td></tr>
              <tr><td>Coordinates</td><td>{project.latitude != null ? `${project.latitude}, ${project.longitude}` : "—"} <span className="muted">· {project.coordinate_source || "none"}</span></td></tr>
              <tr><td>Current verification</td><td>{latest ? verificationLabel(latest.evidence_status) : "No events yet"}</td></tr>
              <tr><td>Updated</td><td>{formatWhen(project.updated_at)}</td></tr>
            </tbody>
          </table>
          <LifecycleForm projectId={project.id} current={project.lifecycle_status as LifecycleStatus} />
        </section>
        <section className="panel">
          <h2>Preliminary criticality</h2>
          <p className="prose">Baseline tier {project.baseline_criticality_tier} ({tierLabel(project.baseline_criticality_tier)}). Proposed tier {project.proposed_criticality_tier} after the contextual score of {project.contextual_criticality_score}. Method: {project.classification_method}. Review of the tier: {project.classification_review_status}.</p>
          {Object.entries(project.contextual_factors ?? {}).map(([key, value]) => (
            <div className="factor" key={key}>
              <span>{FACTOR_LABELS[key] ?? key}</span>
              <div className="bar"><span style={{ width: `${Math.max(0, Math.min(20, Number(value))) * 5}%` }} /></div>
              <span>{value}</span>
            </div>
          ))}
          <p className="prose">{project.classification_rationale}</p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 14 }}>
        <h2>Timeline</h2>
        <p className="prose">Events, sources and verification status for this project. Reviews are made in the Verification Centre.</p>
        {events.length === 0 ? <p className="muted">No events are linked.</p> : null}
        <ul className="timeline">
          {events.map((event) => {
            const source = snapshot.sources.find((item) => item.id === event.source_id);
            const rows = snapshot.evidence.filter((item) => item.event_id === event.id);
            const open = isOpenForReview(event.evidence_status);
            return (
              <li key={event.id}>
                <div className="split-head">
                  <h3>{formatWhen(event.event_date || event.created_at)} · {event.event_type.replaceAll("_", " ")}</h3>
                  <StatusBadge status={event.evidence_status} />
                </div>
                <p>{event.reported_claim}</p>
                <p className="muted" style={{ fontSize: 13 }}>
                  Recommendation: {event.ai_recommended_status || "none"}. {event.recommendation_rationale}
                </p>
                {source ? (
                  <p className="prose">
                    {source.publisher || "Unknown publisher"} · {source.source_type} · published {formatWhen(source.published_at)} · retrieved {formatWhen(source.retrieved_at)}
                    {source.source_url ? (
                      <>
                        {" · "}
                        <a href={source.source_url} target="_blank" rel="noreferrer">
                          Original source
                        </a>
                      </>
                    ) : null}
                    {source.full_text_retrieved ? "" : " · full text was not retrieved"}
                  </p>
                ) : null}
                {source?.raw_content ? <div className="raw">{source.raw_content}</div> : null}
                {rows.length ? (
                  <ul className="prose">
                    {rows.map((row) => (
                      <li key={row.id}>
                        <span className={`badge ${row.supporting_or_conflicting === "conflicting" ? "bad" : row.supporting_or_conflicting === "supporting" ? "good" : ""}`}>
                          {row.supporting_or_conflicting}
                        </span>{" "}
                        {row.evidence_description}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="actions">
                  <Link href={`/feed#${event.id}`}>Intelligence record</Link>
                  {open ? <Link href={`/verification?event=${event.id}`}>Review this claim</Link> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {candidates.length ? (
        <section className="panel" style={{ marginTop: 14 }}>
          <h2>Correlation candidates</h2>
          <p className="prose">A candidate is not a merge. Project fields are not overwritten by a later report.</p>
          <ul className="prose">
            {candidates.map((candidate) => {
              const other = snapshot.projects.find((item) => item.id === candidate.candidate_project_id);
              return (
                <li key={candidate.id}>
                  Score {candidate.score}. {candidate.auto_linked ? "Event attached. " : "Not attached. "}
                  {other ? <Link href={`/projects/${other.id}`}>{other.project_name}</Link> : candidate.candidate_project_id}
                  {candidate.rationale ? ` — ${candidate.rationale}` : ""}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="panel" style={{ marginTop: 14 }}>
        <h2>Verification history</h2>
        <p className="prose">Human decisions for claims linked to this project. New reviews are made in the Verification Centre.</p>
        {logs.length === 0 ? <p className="muted">No reviewer has acted on these events.</p> : null}
        <ul className="prose">
          {logs.map((log) => (
            <li key={log.id}>
              {formatWhen(log.created_at)} · {log.reviewer_action} · {verificationLabel(log.previous_status)} → {verificationLabel(log.new_status)}
              {log.reviewer_notes ? ` — ${log.reviewer_notes}` : ""}
              {" · "}
              <Link href={`/verification?event=${log.event_id}`}>Review item</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
