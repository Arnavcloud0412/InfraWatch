import Link from "next/link";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { LitTrail } from "./LitTrail";
import { Reveal } from "./Reveal";
import "./landing.css";

const AGENT_GROUPS = [
  {
    label: "Prepare the notice",
    items: [
      { name: "Discovery", role: "Finds projects and updates from official and open sources." },
      { name: "Extraction", role: "Pulls fields from text, PDFs, Word files, and images." },
      { name: "Cleaning", role: "Translates and normalises names, places, and dates." },
      { name: "Source trust", role: "Scores origin, freshness, and place before anything else runs." },
    ],
  },
  {
    label: "Decide what it is",
    items: [
      { name: "Correlation", role: "Matches the notice to an existing project, or opens a new one." },
      { name: "Classification", role: "Sets category and importance from 1 to 5." },
      { name: "Assessment", role: "Cross-checks earlier steps and keeps a confidence reason." },
    ],
  },
  {
    label: "Gate and store",
    items: [
      { name: "Human review", role: "A person accepts, rejects, or sends the claim back." },
      { name: "Project record", role: "Creates or updates the record only after review." },
    ],
  },
] as const;

const CATEGORIES = [
  { name: "Critical", role: "Rail, bridges, ports, highways, tunnels, airports" },
  { name: "Essential", role: "Hospitals, emergency, fire, helipads, power" },
  { name: "Economic", role: "Industrial zones and logistics" },
  { name: "Regional", role: "Municipal, PWD, government offices" },
  { name: "General", role: "Residential and local civic works" },
] as const;

const LIFE = [
  "Proposed",
  "Approved",
  "Tendering",
  "Construction started",
  "Under construction",
  "Partly operational",
  "Completed",
] as const;

export function HomeLanding() {
  return (
    <div className="land" id="top">
      <LandingNav />
      <main>
        <header className="land-hero" aria-labelledby="hero-title">
          <div className="hero-media" aria-hidden>
            <img
              src="/landing/bhayander-railway-bridge-panoramio.jpg"
              width={1600}
              height={1067}
              alt=""
              decoding="async"
            />
          </div>
          <div className="hero-veil" aria-hidden />
          <div className="hero-copy">
            <p className="hero-brand">InfraWatch AI</p>
            <h1 id="hero-title">
              Public infrastructure notices, turned into project records
            </h1>
            <p className="hero-support">
              Agents pull claims from official portals and open sources, score trust, and wait for a person before anything becomes a record.
            </p>
            <div className="hero-actions">
              <Link className="land-btn hero-cta" href="/overview">
                Launch prototype
              </Link>
            </div>
          </div>
          <a className="hero-scroll" href="#pipeline">
            Scroll down to view architecture
            <span aria-hidden>↓</span>
          </a>
        </header>

        <div className="land-bridge" aria-hidden />

        <section id="pipeline" className="land-chapter" data-chapter="paper">
          <div className="land-wrap land-center">
            <Reveal>
              <h2 className="chapter-head">How a notice moves</h2>
            </Reveal>
            <Reveal>
              <ol className="arch">
                <li className="arch-stage">
                  <p className="arch-label">Sources</p>
                  <div className="arch-chain">
                    <div className="arch-node high">
                      <strong>Official</strong>
                      <span>Gov sites, portals, notices. Higher trust.</span>
                    </div>
                    <span className="arch-plus" aria-hidden>+</span>
                    <div className="arch-node low">
                      <strong>OSINT</strong>
                      <span>News, APIs, social. Lower trust.</span>
                    </div>
                  </div>
                </li>

                <li className="arch-join" aria-hidden><span /></li>

                <li className="arch-stage">
                  <p className="arch-label">Orchestration</p>
                  <div className="arch-node wide">
                    <strong>Orchestration</strong>
                    <span>Routes agents. Keeps confidence and reason at each step.</span>
                  </div>
                </li>

                <li className="arch-join" aria-hidden><span /></li>

                <li className="arch-stage">
                  <p className="arch-label">Data acquisition</p>
                  <div className="arch-chain">
                    <div className="arch-node">
                      <strong>Discovery</strong>
                      <span>Find projects and updates</span>
                    </div>
                    <span className="arch-arrow" aria-hidden />
                    <div className="arch-node">
                      <strong>Extraction</strong>
                      <span>Text, PDF, Word, images</span>
                    </div>
                    <span className="arch-arrow" aria-hidden />
                    <div className="arch-node">
                      <strong>Cleaning</strong>
                      <span>Translate and normalise</span>
                    </div>
                    <span className="arch-arrow" aria-hidden />
                    <div className="arch-node">
                      <strong>Source trust</strong>
                      <span>Origin, freshness, place</span>
                    </div>
                  </div>
                </li>

                <li className="arch-join" aria-hidden><span /></li>

                <li className="arch-stage">
                  <p className="arch-label">Decide what the claim is</p>
                  <div className="arch-chain">
                    <div className="arch-node">
                      <strong>Correlation</strong>
                      <span>New project or update</span>
                    </div>
                    <span className="arch-arrow" aria-hidden />
                    <div className="arch-node">
                      <strong>Classification</strong>
                      <span>Category and importance 1–5</span>
                    </div>
                    <span className="arch-arrow" aria-hidden />
                    <div className="arch-node">
                      <strong>Assessment</strong>
                      <span>Cross-check confidence</span>
                    </div>
                  </div>
                </li>

                <li className="arch-join" aria-hidden><span /></li>

                <li className="arch-stage">
                  <p className="arch-label">Gate</p>
                  <div className="arch-node wide gate">
                    <strong>Human review</strong>
                    <span>Accept, reject, or send back. Critical updates wait here.</span>
                  </div>
                </li>

                <li className="arch-join" aria-hidden><span /></li>

                <li className="arch-stage">
                  <p className="arch-label">Store</p>
                  <div className="arch-node wide">
                    <strong>Project record</strong>
                    <span>Create or update. Lifecycle changes only after review.</span>
                  </div>
                </li>
              </ol>
            </Reveal>
          </div>
        </section>

        <section id="agents" className="land-chapter" data-chapter="paper">
          <div className="land-wrap land-center">
            <Reveal>
              <h2 className="chapter-head">From notice to record</h2>
              <p className="chapter-dek">
                Agents that handle the claim, how it is categorised, and the stages a project can enter.
              </p>
            </Reveal>
            <div className="roster-stack">
              {AGENT_GROUPS.map((group) => (
                <Reveal key={group.label}>
                  <section className="define-block">
                    <h3 className="roster-sub">{group.label}</h3>
                    <dl className="define-list">
                      {group.items.map((item) => (
                        <div key={item.name}>
                          <dt>{item.name}</dt>
                          <dd>{item.role}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                </Reveal>
              ))}
              <Reveal>
                <section className="define-block">
                  <h3 className="roster-sub">Categories</h3>
                  <p className="roster-note">
                    Every claim lands in one category. Importance is scored 1–5 inside it.
                  </p>
                  <dl className="define-list">
                    {CATEGORIES.map((item) => (
                      <div key={item.name}>
                        <dt>{item.name}</dt>
                        <dd>{item.role}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </Reveal>
              <Reveal>
                <section className="define-block define-block-life">
                  <h3 className="roster-sub">Lifecycle</h3>
                  <p className="roster-note">
                    Moves only after human review. Can also go on hold or be cancelled.
                  </p>
                  <ol className="life-track">
                    {LIFE.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="land-chapter" data-chapter="paper">
          <div className="land-wrap">
            <h2 className="chapter-head">Evidence trail</h2>
            <Reveal>
              <LitTrail />
            </Reveal>
          </div>
        </section>

        <section className="land-chapter field" data-chapter="field">
          <div className="land-wrap pair">
            <Reveal>
              <img
                src="/landing/ships-in-bombay-harbour-1731.jpg"
                width={1000}
                height={610}
                alt="Historical painting of ships in Bombay Harbour, 1731"
                loading="lazy"
                decoding="async"
              />
            </Reveal>
            <Reveal>
              <div className="copy">
                <h2 className="chapter-head">Production stays offline</h2>
                <p>
                  No public extraction APIs. Models on private servers. A person on every critical call. The Maharashtra prototype can use outside services; the operational target cannot.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        <figure className="photo-band">
          <img
            src="/landing/entrance-to-the-bombay-port-trust.jpg"
            width={1920}
            height={1440}
            alt="Stone entrance to the Bombay Port Trust"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Entrance to the Bombay Port Trust. Public photograph of harbour administration fabric.</figcaption>
        </figure>

        <section className="land-chapter surface" data-chapter="paper">
          <div className="land-wrap pair flip">
            <Reveal>
              <img
                src="/landing/bhayander-railway-bridge-panoramio.jpg"
                width={1632}
                height={1224}
                alt="Bhayander railway bridge spanning water under open sky"
                loading="lazy"
                decoding="async"
              />
            </Reveal>
            <Reveal>
              <div className="copy">
                <h2 className="chapter-head">Open the workspace</h2>
                <p>
                  What you can use today is the Maharashtra prototype: public text in, a structured claim out, correlation, category and importance, and a reviewer gate.
                </p>
                <Link className="land-btn" href="/architecture">
                  Technical notes
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <Link className="cta-band" href="/overview" data-chapter="accent">
          <p>Opens the Maharashtra prototype with seeded demonstration projects and the live review queue.</p>
          <svg viewBox="0 0 48 48" aria-hidden>
            <path d="M10 38 L38 10 M18 10 H38 V30" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <strong>Open</strong>
        </Link>
      </main>
      <LandingFooter />
    </div>
  );
}
