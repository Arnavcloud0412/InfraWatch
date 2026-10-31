"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/overview", label: "Overview" },
  { href: "/projects", label: "Project Explorer" },
  { href: "/feed", label: "Intelligence Feed" },
  { href: "/#pipeline", label: "Pipeline" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="land-nav">
      <Link href="/#top" className="land-logo" onClick={() => setOpen(false)}>
        InfraWatch AI
      </Link>
      <button
        type="button"
        className="land-menu"
        aria-expanded={open}
        aria-controls="landing-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <nav id="landing-menu" className={open ? "land-links open" : "land-links"}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </Link>
        ))}
        <Link className="land-btn" href="/overview" onClick={() => setOpen(false)}>
          Launch
        </Link>
      </nav>
    </header>
  );
}
