import Link from "next/link";
import { OriginBadge, StatusBadge, TierBadge } from "@/components/Badges";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { FILTER_DISTRICTS } from "@/lib/districts";
import { CATEGORY_LABELS, categoryLabel, lifecycleLabel, LIFECYCLE_LABELS } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";
import { latestStatus } from "@/lib/stats";
import type { LifecycleStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = one(params.q).trim().toLowerCase();
  const district = one(params.district);
  const category = one(params.category);
  const tier = one(params.tier);
  const lifecycle = one(params.lifecycle);
  const snapshot = await getSnapshot();
  const projects = snapshot.projects
    .filter((project) => {
      const haystack = `${project.project_name} ${project.description ?? ""} ${project.location_name ?? ""}`.toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (district && project.district !== district) return false;
      if (category && project.infrastructure_category !== category) return false;
      if (tier && String(project.proposed_criticality_tier) !== tier) return false;
      if (lifecycle && project.lifecycle_status !== lifecycle) return false;
      return true;
    })
    .sort((a, b) => a.project_name.localeCompare(b.project_name));

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">Intelligence · Track</p>
          <h1>Project Explorer</h1>
        </div>
        <p className="muted">{projects.length} shown</p>
      </header>
      <WorkflowStrip
        current="track"
        question="What infrastructure projects are being tracked?"
      />
      <div className="grid-main">
        <form className="panel filters" method="get">
          <label>
            Search
            <input name="q" defaultValue={one(params.q)} placeholder="Name or place" />
          </label>
          <label>
            District
            <select name="district" defaultValue={district}>
              <option value="">All districts</option>
              {FILTER_DISTRICTS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select name="category" defaultValue={category}>
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Proposed tier
            <select name="tier" defaultValue={tier}>
              <option value="">All tiers</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>Tier {value}</option>
              ))}
            </select>
          </label>
          <label>
            Recorded lifecycle
            <select name="lifecycle" defaultValue={lifecycle}>
              <option value="">All stages</option>
              {Object.entries(LIFECYCLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button type="submit">Apply filters</button>
        </form>
        <div className="panel">
          {projects.length === 0 ? <p className="muted">No projects match these filters.</p> : null}
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Category</th>
                <th>Tier</th>
                <th>Lifecycle</th>
                <th>Latest evidence</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/projects/${project.id}`}>{project.project_name}</Link>
                    <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>{project.district}{project.location_name ? ` · ${project.location_name}` : ""}</div>
                    <div style={{ marginTop: 6 }}><OriginBadge origin={project.record_origin} synthetic={project.synthetic} /></div>
                  </td>
                  <td>{categoryLabel(project.infrastructure_category)}</td>
                  <td><TierBadge tier={project.proposed_criticality_tier} /></td>
                  <td>{lifecycleLabel(project.lifecycle_status as LifecycleStatus)}</td>
                  <td><StatusBadge status={latestStatus(snapshot, project.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
