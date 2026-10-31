import Link from "next/link";

export const metadata = { title: "Features · InfraWatch AI" };

type Feature = {
  title: string;
  summary: string;
  covers: string[];
  href?: string;
};

/** Surfaces the demo shell walks through — a proof of concept, not a finished product. */
const DEMO_SHELL: Feature[] = [
  {
    title: "Six-step intelligence workflow",
    summary:
      "The shell presents a Discover → Extract → Correlate → Assess → Review → Track path across Data Acquisition, agents, Verification Centre and Project Explorer.",
    covers: ["Shared workflow strip on workspace pages", "Clear ownership per step", "Claims stay claims until a human accepts them"],
    href: "/architecture",
  },
  {
    title: "Multi-agent processing pipeline",
    summary:
      "A demonstration agent path (Google ADK when configured, otherwise a deterministic keyword fallback) sketches discovery, extraction, correlation, evidence notes and criticality commentary.",
    covers: ["Discovery, extraction, correlation", "Evidence review sequence", "Classification commentary without inventing facts"],
    href: "/architecture",
  },
  {
    title: "Data Acquisition",
    summary:
      "Demo intake from GDELT when reachable, optional official RSS and social adapters if credentials exist, plus manual URL or pasted text—with private-address refusal.",
    covers: ["Run discovery", "Submit URL or text", "Adapter readiness status", "Link from collection to intelligence record"],
    href: "/ingest",
  },
  {
    title: "Structured claim extraction",
    summary:
      "Unstructured notices are shaped into project name, place, category, event type, lifecycle claims and investment fields—empty when unknown, not invented.",
    covers: ["Validated extraction schema", "Reported vs recorded lifecycle", "Language detection"],
    href: "/feed",
  },
  {
    title: "Correlation without silent merges",
    summary:
      "The shell shows related or duplicate candidates by token overlap. Ambiguous pairs stay unmerged; later reports do not overwrite name, money or lifecycle on the record.",
    covers: ["Candidate scores and rationale", "Auto-link only when clear", "Visible on project detail"],
    href: "/projects",
  },
  {
    title: "Evidence assessment and Verification Centre",
    summary:
      "Model-style recommendations describe support, conflict and gaps. A human can accept, reject or request verification in the demo queue. Agents cannot mark a claim officially confirmed.",
    covers: ["Open review queue", "Source and project links", "Single primary review surface"],
    href: "/verification",
  },
  {
    title: "Public-service criticality scoring",
    summary:
      "Baseline tier from infrastructure category, plus five civilian contextual factors (0–20) into a 0–100 score that can raise or lower the proposed tier by one.",
    covers: ["Tiers 1–5", "Factor bars on project detail", "Method and review status on record"],
    href: "/projects",
  },
  {
    title: "Project Explorer and project timeline",
    summary:
      "Browse illustrative Maharashtra projects; each detail page shows record fields, criticality, event timeline, sources, correlation candidates and verification history.",
    covers: ["District, category, tier, lifecycle filters", "Review this claim → Verification Centre", "No duplicate review form on detail"],
    href: "/projects",
  },
  {
    title: "Intelligence Feed",
    summary:
      "A chronological list of extracted claims with source links, pipeline trace and a Review claim action for open records.",
    covers: ["Live and illustrative intakes", "Open project / review links", "Status badges from canonical vocabulary"],
    href: "/feed",
  },
  {
    title: "Overview workspace",
    summary:
      "A dashboard-style pulse: counts, open reviews, charts and a Maharashtra map of geolocated pins—for the demonstration dataset.",
    covers: ["Canonical lifecycle labels", "Recent announcements", "Service health strip"],
    href: "/overview",
  },
  {
    title: "Review audit log",
    summary:
      "Accept, reject or request-verification actions in the demo write previous → new status, notes and timestamp for inspection on the project and in Verification Centre.",
    covers: ["Decision history rows", "Optional lifecycle apply on accept", "Visible on project detail"],
    href: "/verification",
  },
  {
    title: "Maharashtra demonstration scope",
    summary:
      "The shell is restricted to Maharashtra and the infrastructure categories in the brief, with an illustrative seed dataset and optional Supabase or local file store.",
    covers: ["Seed / live record origin badges", "District map pins", "Architecture limits documented"],
    href: "/architecture",
  },
];

const PROPOSED: Feature[] = [
  {
    title: "Role-based access control",
    summary:
      "Login for multiple personnel with distinct authorisation levels—analysts, reviewers, operators and administrators—so each person only sees and acts within their remit.",
    covers: ["Signed-in workspace", "Role-scoped queues and actions", "Audit trail tied to identity"],
  },
  {
    title: "Fully offline LLMs for agents",
    summary:
      "Run the base models that power discovery, extraction, correlation and evidence assessment entirely offline, without calling commercial model APIs from the operational network.",
    covers: ["On-prem or air-gapped inference", "Same agent interfaces as the shell", "No outbound model traffic"],
  },
  {
    title: "Social listening without third-party dependency",
    summary:
      "Collect and monitor public social signals with infrastructure owned and operated by the organisation—no reliance on commercial social-listening SaaS or opaque vendor pipelines.",
    covers: ["First-party collectors", "Controlled retention", "No vendor lock-in for open-source channels"],
  },
  {
    title: "Hyperlocal broadcast and resilient collection",
    summary:
      "Target hyperlocal broadcasting channels and use headless browser automation so collection can continue when feeds are blocked, embargoed or degraded in war-like or contested connectivity situations.",
    covers: ["Regional and local broadcasters", "Headless browser automation", "Continuity when APIs and portals fail"],
  },
  {
    title: "Offline document and image parsing",
    summary:
      "Parse PDFs, scans and photographs on local infrastructure using ImageNet-class vision models and OpenCV—without sending documents or imagery to external cloud services.",
    covers: ["Document OCR and layout", "Image understanding", "Air-gapped media intake"],
  },
  {
    title: "Multi-state and national coverage",
    summary:
      "Extend beyond Maharashtra to the strategically vital states named in the brief—Gujarat, Goa, Tamil Nadu, Andhra Pradesh, Telangana, Kerala, Madhya Pradesh—and toward national scale.",
    covers: ["Per-state connectors", "Shared project identity across states", "Federated or central store"],
  },
  {
    title: "Scheduled continuous discovery",
    summary:
      "Replace on-demand “Run discovery” with scheduled, monitored collectors so new public notices enter the queue without an operator clicking each time.",
    covers: ["Cron / queue workers", "Backoff and failure alerts", "Per-adapter schedules"],
  },
  {
    title: "Logistics and dual-use impact views",
    summary:
      "Layer defence-planning context on verified projects: corridor connectivity, dual-use potential, mobilisation relevance and bottleneck risk—without treating criticality as a truth score.",
    covers: ["Route / corridor overlays", "Dual-use tags", "Planner-facing brief exports"],
  },
  {
    title: "Geospatial corridor analysis",
    summary:
      "Move from district centroids to surveyed alignments, port hinterlands and rail corridors so planners can see how a project changes movement options on the map.",
    covers: ["Alignment geometry", "Distance and travel-time estimates", "Change detection on the map"],
  },
  {
    title: "Change and conflict alerts",
    summary:
      "Notify authorised reviewers when a high-tier project’s lifecycle flips, budgets conflict, or independent sources disagree—so information asymmetry shrinks in near real time.",
    covers: ["Watchlists by tier or district", "In-app and optional secure channels", "Deduped alert batches"],
  },
  {
    title: "Deeper multilingual intake",
    summary:
      "First-class Marathi, Hindi and other regional-language parsing for notices and social text, with translation kept as evidence rather than substituted for the original.",
    covers: ["Original + translation side by side", "Language-aware extraction", "Script-safe search"],
  },
  {
    title: "Organisation-controlled datastore and encryption",
    summary:
      "Host projects, sources, events, evidence and review logs in an organisation-owned database with encryption in transit and at rest, replacing the demo file store and commercial hosting defaults.",
    covers: ["Controlled DB", "Key management", "Restricted outbound network"],
  },
  {
    title: "Intelligence brief export",
    summary:
      "Generate reviewer-ready summaries—project dossier, open conflicts, source list and verification history—for briefings without copying from the UI by hand.",
    covers: ["PDF / structured export", "Redaction by role", "Snapshot at decision time"],
  },
  {
    title: "Collaborative review and escalation",
    summary:
      "Assign claims, escalate conflicting evidence, and require dual approval for officially confirmed status on critical connectivity projects.",
    covers: ["Assignee and due state", "Second-reviewer gate", "Escalation notes in the audit log"],
  },
];

function FeatureList({
  items,
  kind,
}: {
  items: Feature[];
  kind: "shell" | "proposed";
}) {
  const panelClass = kind === "proposed" ? "panel proposal" : "panel";

  return (
    <div className="stack">
      {items.map((feature, index) => (
        <article key={feature.title} className={panelClass}>
          <h2 style={{ margin: "0 0 10px" }}>
            <span className="muted" style={{ fontFamily: "var(--font-mono), monospace", marginRight: 8 }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            {feature.title}
          </h2>
          <p className="prose">{feature.summary}</p>
          <ul className="prose">
            {feature.covers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {feature.href ? (
            <p className="prose" style={{ marginBottom: 0 }}>
              <Link href={feature.href}>Open related surface</Link>
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div>
      <header className="page-head">
        <div>
          <p className="kicker">System</p>
          <h1>Features</h1>
        </div>
        <p className="muted">Proof of concept · not operational</p>
      </header>

      <p className="banner">
        This is a demonstration shell for walkthroughs—not a finished or operational system. Nothing below is production-ready. Demo surfaces need substantial further engineering and scale-up before any real deployment. Proposed items are not in the shell at all. See{" "}
        <Link href="/architecture">Architecture</Link> for limits.
      </p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 12 }}>Demonstration shell</h2>
        <p className="prose" style={{ marginTop: 0, marginBottom: 14 }}>
          Concept surfaces and sample flows only. Partial agent wiring and illustrative data do not constitute a finished capability. Each item below still requires additional engineering, hardening and scale-up.
        </p>
        <FeatureList items={DEMO_SHELL} kind="shell" />
      </section>

      <section>
        <h2 style={{ marginBottom: 12 }}>Proposed — not built</h2>
        <p className="prose" style={{ marginTop: 0, marginBottom: 14 }}>
          These capabilities do not exist in the demonstration shell. They are proposals only for a future authorised deployment and must not be read as available, partially delivered or implied by the demo.
        </p>
        <FeatureList items={PROPOSED} kind="proposed" />
      </section>
    </div>
  );
}
