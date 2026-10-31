"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid rgba(17, 17, 17, 0.12)",
  borderRadius: 0,
  fontSize: 12,
  color: "#111111",
};

const tick = { fill: "#6b6b6b", fontSize: 11 };
const grid = "rgba(17,17,17,0.08)";

export function CategoryChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="panel">
      <h2>Projects by category</h2>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={tick} />
            <YAxis type="category" dataKey="name" width={118} tick={tick} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#0f5c45" radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TierChart({ data }: { data: { name: string; count: number; fill: string }[] }) {
  const slices = data.filter((entry) => entry.count > 0);

  return (
    <div className="panel">
      <h2>Proposed criticality</h2>
      <div style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 4, right: 8, bottom: 8, left: 8 }}>
            <Pie data={slices} dataKey="count" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              verticalAlign="bottom"
              height={56}
              iconType="square"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: "#6b6b6b" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LifecycleChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div className="panel">
      <h2>Recorded lifecycle</h2>
      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 0 }}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={tick} />
            <YAxis type="category" dataKey="name" width={148} tick={tick} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#3d6b58" radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
