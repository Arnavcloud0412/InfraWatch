import Link from "next/link";
import { WorkflowStrip } from "@/components/WorkflowStrip";
import { WORKFLOW_STEPS } from "@/lib/workflow";

export const metadata = { title: "Architecture · InfraWatch AI" };

export default function ArchitecturePage() {
  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">System</p>
          <h1>Architecture</h1>
        </div>
      </header>
      <WorkflowStrip question="How does the platform work?" />

      <section className="panel">
        <h2>Intelligence workflow</h2>
        <p className="prose">
          Every workspace page sits in this sequence. Public announcements are collected, turned into structured claims, compared with records already held, assessed for evidence, reviewed by a person, then tracked on the project record.
        </p>
        <ol className="stages">
          {WORKFLOW_STEPS.map((step) => (
            <li key={step.id}>
              <span>{String(step.number).padStart(2, "0")}</span>
              <div>
                <h3>
                  {step.label}
                  {step.href ? (
                    <>
                      {" · "}
                      <Link href={step.href}>{step.owner}</Link>
                    </>
                  ) : (
                    <span className="muted"> · {step.owner}</span>
                  )}
                </h3>
                <p>{step.summary}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>What it does</h2>
        <p className="prose">
          Public announcements are collected, turned into structured claims, compared with records already in the workspace, and given a preliminary evidence state and a public-service criticality score. A person accepts, rejects, or sends a claim back for verification. The audit log keeps that decision.
        </p>
        <div className="flow">
          <span>Sources</span>
          <span>Discovery agent</span>
          <span>Extraction agent</span>
          <span>Correlation</span>
          <span>Evidence assessment</span>
          <span>Criticality function</span>
          <span>Store</span>
          <span>Verification Centre</span>
        </div>
        <p className="prose">
          The Python service is the agent runtime. Google ADK runs single-turn agents. Evidence review and classification commentary run as an ADK sequential workflow named <code>infrawatch_review_sequence</code>. Duplicate checks, criticality maths, and status changes are ordinary Python and TypeScript, not model loops. If no Gemini key is configured, the same route uses a deterministic keyword fallback and says so.
        </p>
      </section>

      <section className="panel">
        <h2>Agents</h2>
        <div className="grid-2">
          <article>
            <h3>Discovery</h3>
            <p className="prose">Reads GDELT, an optional official RSS feed, and social APIs only when credentials exist. Drops items that are not infrastructure announcements. It does not crawl the state. Surfaces in Data Acquisition.</p>
          </article>
          <article>
            <h3>Extraction</h3>
            <p className="prose">Pulls a project name, place, category, event type, and claims into a validated schema. Missing budgets and dates stay empty. The instruction forbids inventing figures.</p>
          </article>
          <article>
            <h3>Correlation</h3>
            <p className="prose">Token overlap proposes candidates. An ambiguous pair is not merged. A later report does not overwrite the project name, money, or lifecycle.</p>
          </article>
          <article>
            <h3>Evidence assessment</h3>
            <p className="prose">Describes the source, support, conflict, and what is missing. It cannot emit officially confirmed or rejected. One publisher, even if widely reprinted, is not corroboration.</p>
          </article>
          <article>
            <h3>Classification</h3>
            <p className="prose">A fixed taxonomy sets the baseline tier. Five civilian factors, each 0–20, make a 0–100 score. A score of at least 75 raises the proposed tier by one. A score of 30 or below lowers it by one. The model may suggest a delta of at most 4 points per factor. The tier is still calculated in code.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Sources</h2>
        <p className="prose">
          GDELT’s document API is the live default and needs no key. Maharashtra PWD has no public API in this build, so its notices are submitted by URL. PIB RSS is attempted and skipped with an error if it fails. data.gov.in, X, YouTube, and Reddit stay idle until environment variables are set. Keys stay on the server. The manual form in Data Acquisition fetches a public URL or accepts pasted text, and it refuses private addresses.
        </p>
      </section>

      <section className="panel">
        <h2>Prototype limits</h2>
        <ul className="prose">
          <li>Coverage is Maharashtra only, and only the infrastructure categories in the project brief.</li>
          <li>Illustrative seed rows are not official claims.</li>
          <li>There is no nationwide crawler, custom model, or streaming cluster.</li>
          <li>The file store is for a single workstation. Supabase is optional and used only from the server.</li>
          <li>Map pins are city or district centroids.</li>
          <li>ADK’s sequential agent is deprecated upstream in favour of a future workflow type. This prototype still uses the sequential agent because that workflow cannot yet host these model agents.</li>
        </ul>
      </section>

      <section className="panel proposal">
        <h2>Operational deployment — proposal only</h2>
        <p className="prose">
          This section is not implemented. An operational deployment for an authorised organisation would replace the commercial model API, the public file store, and open outbound collection.
        </p>
        <ul className="prose">
          <li>Models hosted by the organisation, behind the same extraction and evidence interfaces.</li>
          <li>An organisation-controlled database, with the prototype’s relational records kept: projects, sources, events, evidence, and review logs.</li>
          <li>Connectors limited to approved feeds. Outbound network access restricted.</li>
          <li>Role-based access, encryption in transit and at rest, and an audit log of reviewer actions.</li>
          <li>A security assessment before any operational use.</li>
        </ul>
        <p className="prose">
          The current app can run on Vercel for the Next.js workspace and on Render, or a similar host, for the Python service. That hosting convenience is not the operational design. The full proposed feature set is listed on{" "}
          <Link href="/features">Features</Link>.
        </p>
      </section>
    </div>
  );
}
