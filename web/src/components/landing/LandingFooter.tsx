import Link from "next/link";

const NAV = [
  { href: "/overview", label: "Overview" },
  { href: "/projects", label: "Project Explorer" },
  { href: "/feed", label: "Intelligence Feed" },
  { href: "/verification", label: "Verification Centre" },
];

export function LandingFooter() {
  return (
    <footer className="land-footer" data-chapter="ink">
      <div className="land-footer-cols">
        <div>
          <strong>Where</strong>
          <p>Maharashtra, India</p>
          <p>Public infrastructure intelligence</p>
        </div>
        <div>
          <strong>Workspace</strong>
          {NAV.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div>
          <strong>Read</strong>
          <Link href="/architecture">Architecture</Link>
          <Link href="/features">Features</Link>
          <Link href="/ingest">Data Acquisition</Link>
          <Link href="/#pipeline">Pipeline</Link>
        </div>
        <div>
          <strong>Scope</strong>
          <p>Demonstration prototype</p>
          <p>Not an operational defence system</p>
        </div>
      </div>
      <div>
        <p className="land-wordmark">InfraWatch</p>
        <p className="land-legal">
          Demonstration prototype using publicly available information. Photographs show Maharashtra
          infrastructure and harbour history; they are not project records from this workspace. Credits:
          DesiBoy101; Rahul Rajbhar; Samuel Scott; Primacheen; Maciek Roszkowski, via Wikimedia Commons.
        </p>
      </div>
    </footer>
  );
}
