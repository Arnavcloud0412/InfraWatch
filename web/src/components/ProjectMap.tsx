"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const colours: Record<number, string> = {
  1: "#061f18",
  2: "#0f5c45",
  3: "#3d6b58",
  4: "#8a4b12",
  5: "#9a9a9a",
};

export function ProjectMap({
  points,
}: {
  points: { id: string; name: string; lat: number; lng: number; tier: number; place: string }[];
}) {
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
  const tileUrl = cartoKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer center={[19.6, 75.9]} zoom={6} scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attribution/">CARTO</a>' url={tileUrl} />
      {points.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.lat, point.lng]}
          radius={7}
          pathOptions={{ color: colours[point.tier] ?? "#0f5c45", fillColor: colours[point.tier] ?? "#0f5c45", fillOpacity: 0.9, weight: 1 }}
        >
          <Tooltip>
            <strong>{point.name}</strong>
            <br />
            {point.place} · tier {point.tier}
            <br />
            City or district centroid, not a surveyed site.
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
