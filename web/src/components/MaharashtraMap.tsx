"use client";

import dynamic from "next/dynamic";
import { ClientOnly } from "./ClientOnly";

const ProjectMap = dynamic(() => import("./ProjectMap").then((mod) => mod.ProjectMap), { ssr: false });

export function MaharashtraMap({
  points,
}: {
  points: { id: string; name: string; lat: number; lng: number; tier: number; place: string }[];
}) {
  return (
    <div className="panel">
      <h2>Maharashtra orientation map</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        Markers are placed on city or district centroids so the workspace can be scanned. They are not project coordinates.
      </p>
      <ClientOnly fallback={<div className="map-frame" />}>
        <div className="map-frame">
          <ProjectMap points={points} />
        </div>
      </ClientOnly>
    </div>
  );
}
