"use client";

import Link from "next/link";

type ProvinciaData = {
  nombre: string;
  total: number;
  critico: number;
};

interface PanamaMapaProps {
  provinciaMap: Record<string, { total: number; critico: number; normal: number }>;
}

const PROVINCIAS_GEO = [
  { nombre: "Bocas del Toro", x: 35, y: 25, color: "fill-blue-400" },
  { nombre: "Chiriquí", x: 45, y: 50, color: "fill-blue-500" },
  { nombre: "Veraguas", x: 55, y: 65, color: "fill-blue-600" },
  { nombre: "Coclé", x: 65, y: 55, color: "fill-blue-500" },
  { nombre: "Herrera", x: 70, y: 70, color: "fill-blue-400" },
  { nombre: "Panamá", x: 75, y: 50, color: "fill-blue-600" },
  { nombre: "Colón", x: 78, y: 35, color: "fill-blue-500" },
  { nombre: "Arraijan", x: 72, y: 48, color: "fill-blue-400" },
  { nombre: "Chorrera", x: 70, y: 50, color: "fill-blue-400" },
];

const getColorIntensity = (total: number) => {
  if (total === 0) return "fill-gray-100 hover:fill-gray-200";
  if (total <= 3) return "fill-blue-200 hover:fill-blue-300";
  if (total <= 8) return "fill-blue-400 hover:fill-blue-500";
  if (total <= 15) return "fill-blue-600 hover:fill-blue-700";
  return "fill-blue-800 hover:fill-blue-900";
};

const getTextColor = (total: number) => {
  if (total === 0) return "text-gray-400";
  if (total <= 8) return "text-gray-700";
  return "text-white";
};

export function PanamaMapa({ provinciaMap }: PanamaMapaProps) {
  const totalPdvs = Object.values(provinciaMap).reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="w-full space-y-4">
      {/* SVG Map */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
        <svg viewBox="0 0 100 80" className="w-full h-auto" style={{ maxHeight: "300px" }}>
          {/* Background agua */}
          <rect width="100" height="80" fill="#e0f2fe" />

          {/* Forma simplificada de Panamá - línea costera */}
          <path
            d="M 30 45 Q 40 35 50 35 Q 60 32 70 35 Q 80 40 85 50 Q 82 55 75 58 Q 65 62 55 60 Q 45 60 35 55 Z"
            fill="#dcfce7"
            stroke="#86efac"
            strokeWidth="0.5"
          />

          {/* Provincias (círculos con etiquetas) */}
          {PROVINCIAS_GEO.map((prov) => {
            const data = provinciaMap[prov.nombre] || { total: 0, critico: 0, normal: 0 };
            const color = getColorIntensity(data.total);
            const textColor = getTextColor(data.total);
            const size = Math.max(6, 6 + (data.total / 2));

            return (
              <g key={prov.nombre}>
                {/* Provincia circle */}
                <Link href={`/dashboard/pdv?provincia=${encodeURIComponent(prov.nombre)}`}>
                  <circle
                    cx={prov.x}
                    cy={prov.y}
                    r={size}
                    className={`${color} transition-all duration-200 cursor-pointer stroke-white stroke-1`}
                  />
                </Link>

                {/* PDV count */}
                <text
                  x={prov.x}
                  y={prov.y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-xs font-bold ${textColor}`}
                  pointerEvents="none"
                >
                  {data.total}
                </text>

                {/* Critical indicator */}
                {data.critico > 0 && (
                  <circle
                    cx={prov.x + size + 1.5}
                    cy={prov.y - size - 1.5}
                    r="1.2"
                    fill="#ef4444"
                    stroke="#7f1d1d"
                    strokeWidth="0.3"
                  />
                )}

                {/* Provincia name (hover tooltip style) */}
                <title>{`${prov.nombre}: ${data.total} PDV${data.critico > 0 ? ` (${data.critico} crítico)` : ""}`}</title>
              </g>
            );
          })}

          {/* Océano Pacífico label */}
          <text x="15" y="70" className="text-xs text-blue-400 font-semibold" textAnchor="middle" opacity="0.5">
            Pacífico
          </text>

          {/* Mar Caribe label */}
          <text x="85" y="25" className="text-xs text-blue-400 font-semibold" textAnchor="middle" opacity="0.5">
            Caribe
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-4 border-t border-blue-200 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 mr-2">Intensidad:</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />0 PDV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-200" />1-3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-400" />4-8
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600" />9-15
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-800" />16+
          </span>
          <span className="flex items-center gap-1.5 ml-auto text-red-500 font-medium">
            ● = PDV Crítico
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{totalPdvs}</p>
          <p className="text-gray-600 font-medium">PDV totales</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gray-700">{Object.keys(provinciaMap).length}</p>
          <p className="text-gray-600 font-medium">Provincias</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-red-500">
            {Object.values(provinciaMap).reduce((sum, p) => sum + p.critico, 0)}
          </p>
          <p className="text-gray-600 font-medium">Críticos</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-500">
            {Object.values(provinciaMap).reduce((sum, p) => sum + p.normal, 0)}
          </p>
          <p className="text-gray-600 font-medium">Normales</p>
        </div>
      </div>
    </div>
  );
}
