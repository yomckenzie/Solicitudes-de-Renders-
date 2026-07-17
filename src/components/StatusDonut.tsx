"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ESTADO_META, type Estado } from "@/lib/constants";

const COLORS: Record<Estado, string> = {
  actualizado:        "#10b981",
  pendiente:          "#f59e0b",
  requiere_inversion: "#f43f5e",
  sin_mobiliario:     "#64748b",
  en_mantenimiento:   "#0ea5e9",
};

export function StatusDonut({ counts }: { counts: Record<Estado, number> }) {
  const data = (Object.keys(counts) as Estado[])
    .map((k) => ({ name: ESTADO_META[k].label, value: counts[k], key: k }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="h-64 grid place-items-center text-sm text-slate-500">
        Sin datos todavía
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
