import type { Metadata } from "next";
import { HomeLanding } from "@/components/landing/HomeLanding";

export const metadata: Metadata = {
  title: "InfraWatch AI",
  description:
    "InfraWatch turns Maharashtra infrastructure notices into project records with trust scores.",
};

export default function HomePage() {
  return (
    <>
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      <link
        href="https://api.fontshare.com/v2/css?f[]=sentient@300,400,500&display=swap"
        rel="stylesheet"
      />
      <HomeLanding />
    </>
  );
}
