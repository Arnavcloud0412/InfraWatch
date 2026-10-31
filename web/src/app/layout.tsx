import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Shell } from "@/components/Shell";
import { getSnapshot } from "@/lib/repository";
import { isOpenForReview } from "@/lib/workflow";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "InfraWatch AI",
  description: "Public infrastructure intelligence prototype for Maharashtra.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let pendingReviews = 0;
  try {
    const snapshot = await getSnapshot();
    pendingReviews = snapshot.events.filter((event) => isOpenForReview(event.evidence_status)).length;
  } catch {
    pendingReviews = 0;
  }

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=sentient@300,400,500&display=swap"
        />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <Shell pendingReviews={pendingReviews}>{children}</Shell>
      </body>
    </html>
  );
}
