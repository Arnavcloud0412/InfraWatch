import Link from "next/link";
import { CategoryChart, LifecycleChart, TierChart } from "@/components/Charts";
import { ClientOnly } from "@/components/ClientOnly";
import { MaharashtraMap } from "@/components/MaharashtraMap";
import { OriginBadge, StatusBadge, TierBadge } from "@/components/Badges";
import { ServiceStrip } from "@/components/ServiceStrip";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { categoryLabel, formatWhen, lifecycleLabel } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";
import { summarise } from "@/lib/stats";
import { isOpenForReview } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const snapshot = await getSnapshot();
  const stats = summarise(snapshot);
  const recent = [...snapshot.events].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);
  const points = snapshot.projects
    .filter((project) => project.latitude != null && project.longitude != null)
    .map((project) => ({
      id: project.id,
      name: project.project_name,
      lat: project.latitude as number,
      lng: project.longitude as number,
      tier: project.proposed_criticality_tier,
      place: project.location_name || project.district || "Maharashtra",
    }));

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">Maharashtra prototype</p>
          <h1>Overview</h1>
        </div>
        <ServiceStrip />
      </header>
      <WorkflowStrip question="What's happening across the platform?" />
      <p className="banner">
        This is only a prototype intended to show a proof of concept. The showcase is restricted to Maharashtra. The data is synthetic and not verified.
      </p>
      <section className="stats">
        <article className="stat"><b>{stats.totalProjects}</b><span>Projects</span></article>
        <article className="stat"><b>{stats.pending}</b><span>Open for review</span></article>
        <article className="stat"><b>{stats.corroborated}</b><span>Corroborated</span></article>
        <article className="stat"><b>{stats.confirmed}</b><span>Officially confirmed</span></article>
        <article className="stat"><b>{stats.rejected}</b><span>Rejected</span></article>
      </section>
      <section className="grid-3">
        <ClientOnly fallback={<div className="panel" style={{ height: 300 }} />}>
          <CategoryChart data={stats.categories} />
        </ClientOnly>
        <ClientOnly fallback={<div className="panel" style={{ height: 300 }} />}>
          <TierChart data={stats.tiers} />
        </ClientOnly>
        <ClientOnly fallback={<div className="panel" style={{ height: 300 }} />}>
          <LifecycleChart data={stats.lifecycles} />
        </ClientOnly>
      </section>
      <section className="grid-2" style={{ marginTop: 14 }}>
        <div className="panel">
          <h2>Recent announcements</h2>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Claim</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((event) => {
                const project = snapshot.projects.find((item) => item.id === event.project_id);
                return (
                  <tr key={event.id}>
                    <td>{formatWhen(event.created_at)}</td>
                    <td>
                      <a href={`/projects/${event.project_id}`}>{project?.project_name ?? "Unlinked project"}</a>
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{event.reported_claim}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {project ? <OriginBadge origin={project.record_origin} synthetic={project.synthetic} /> : null}
                        {project ? <TierBadge tier={project.proposed_criticality_tier} /> : null}
                        <span className="badge">{categoryLabel(project?.infrastructure_category ?? "other")}</span>
                        <span className="badge">{lifecycleLabel(project?.lifecycle_status)}</span>
                        {isOpenForReview(event.evidence_status) ? (
                          <Link href={`/verification?event=${event.id}`}>Review claim</Link>
                        ) : null}
                      </div>
                    </td>
                    <td><StatusBadge status={event.evidence_status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <MaharashtraMap points={points} />
      </section>
    </div>
  );
}
