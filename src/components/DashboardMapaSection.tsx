"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, X } from "lucide-react";
import { PanamaMapa, type PdvMapaItem } from "./PanamaMapa";

interface Props {
  pdvsMapa: PdvMapaItem[];
  provinciaMap: Record<string, { total: number; critico: number; normal: number }>;
}

export function DashboardMapaSection({ pdvsMapa, provinciaMap }: Props) {
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState<string | null>(null);

  const provinciasOrdenadas = Object.entries(provinciaMap).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Mapa de Puntos de Venta — Panamá</h2>
        <span className="ml-auto text-xs text-gray-400">
          Click en una provincia para hacer zoom en el mapa
        </span>
      </div>

      <PanamaMapa pdvs={pdvsMapa} focusProvincia={provinciaSeleccionada} />

      {/* Resumen por provincia (clickable → zoom al mapa) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mt-5 pt-5 border-t border-gray-100">
        {provinciasOrdenadas.map(([prov, info]) => {
          const activa = provinciaSeleccionada === prov;
          return (
            <div
              key={prov}
              className={`relative text-center rounded-lg border p-2 transition-colors ${
                activa
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <button
                onClick={() => setProvinciaSeleccionada(activa ? null : prov)}
                className="w-full text-left"
                title={`Zoom al mapa en ${prov}`}
              >
                <p className="text-lg font-bold text-gray-800">{info.total}</p>
                <p className="text-[10px] font-medium text-gray-500 leading-tight truncate">{prov}</p>
                {info.critico > 0 && (
                  <p className="text-[10px] text-red-500 font-medium">⚠ {info.critico}</p>
                )}
              </button>
              {activa && (
                <button
                  onClick={() => setProvinciaSeleccionada(null)}
                  className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-0.5 hover:bg-blue-700"
                  title="Quitar zoom"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {provinciaSeleccionada && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            📍 Vista enfocada en <strong className="text-gray-700">{provinciaSeleccionada}</strong>
          </span>
          <Link
            href={`/dashboard/pdv?provincia=${encodeURIComponent(provinciaSeleccionada)}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver PDV de esta provincia →
          </Link>
        </div>
      )}
    </div>
  );
}
