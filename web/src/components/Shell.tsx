"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; badge?: number };
type NavGroup = { label?: string; items: NavItem[] };

export function Shell({
  children,
  pendingReviews = 0,
}: {
  children: React.ReactNode;
  pendingReviews?: number;
}) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;

  const groups: NavGroup[] = [
    {
      items: [{ href: "/overview", label: "Overview" }],
    },
    {
      label: "Intelligence",
      items: [
        { href: "/feed", label: "Intelligence Feed" },
        { href: "/projects", label: "Project Explorer" },
      ],
    },
    {
      label: "Workflow",
      items: [
        { href: "/ingest", label: "Data Acquisition" },
        { href: "/verification", label: "Verification Centre", badge: pendingReviews },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/architecture", label: "Architecture" },
        { href: "/features", label: "Features" },
      ],
    },
  ];

  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand">
          <strong>InfraWatch AI</strong>
          <span>Infrastructure intelligence platform</span>
        </Link>
        <nav className="nav">
          {groups.map((group, index) => (
            <div key={group.label ?? `top-${index}`} className="nav-group">
              {group.label ? <p className="nav-group-label">{group.label}</p> : null}
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={active ? "active" : undefined}>
                    <span>{item.label}</span>
                    {item.badge != null && item.badge > 0 ? <span className="nav-badge">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="side-note">
          <Link href="/" className="side-logout">
            Log out
          </Link>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
