import Link from "next/link";
import { StatusBadge } from "@/components/Badges";
import { IngestPanel } from "@/components/IngestPanel";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { formatWhen } from "@/lib/labels";
import { getSnapshot } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function IngestPage() {
  const snapshot = await getSnapshot();
  const collected = [...snapshot.events]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 12);

  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">Workflow · Discover</p>
          <h1>Data Acquisition</h1>
        </div>
      </header>
      <WorkflowStrip
        current="discover"
        question="Where does information come from, and how is it collected?"
      />
      <IngestPanel />
      <section className="panel" style={{ marginTop: 14 }}>
        <h2>Recently collected</h2>
        <p className="prose">Each collection produces an intelligence record after extraction. Open the record to see the claim, or send an unreviewed claim to the Verification Centre.</p>
        {collected.length === 0 ? <p className="muted">Nothing collected yet. Run discovery or submit a URL above.</p> : null}
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Collected item</th>
              <th>Status</th>
              <th>Intelligence</th>
            </tr>
          </thead>
          <tbody>
            {collected.map((event) => {
              const project = snapshot.projects.find((item) => item.id === event.project_id);
              const source = snapshot.sources.find((item) => item.id === event.source_id);
              return (
                <tr key={event.id}>
                  <td>{formatWhen(event.created_at)}</td>
                  <td>
                    <div>{source?.title || project?.project_name || "Untitled intake"}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                      {source?.publisher || "Unknown publisher"}
                      {source?.source_type ? ` · ${source.source_type}` : ""}
                    </div>
                  </td>
                  <td><StatusBadge status={event.evidence_status} /></td>
                  <td>
                    <div className="actions">
                      <Link href={`/feed#${event.id}`}>Intelligence record</Link>
                      {project ? <Link href={`/projects/${project.id}`}>Project</Link> : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
