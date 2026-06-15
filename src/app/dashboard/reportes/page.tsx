"use client";

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, AlertTriangle, Package } from "lucide-react";
import { MARCA_LABELS, ESTADO_SOLICITUD_LABELS } from "@/types";

type ReportData = {
  pdv: {
    total: number;
    porEstado: Record<string, number>;
    porProvincia: Record<string, number>;
    porMarca: Record<string, number>;
    topCadenas: [string, number][];
    criticos: number;
  };
  inventario: {
    total: number;
    sinMedidas: number;
    porTipo: Record<string, number>;
  };
  solicitudes: {
    total: number;
    porEstado: Record<string, number>;
    porTipo: Record<string, number>;
  };
};

const TIPO_LABELS: Record<string, string> = {
  corner: "Corner",
  gondola: "Góndola",
  rack: "Rack",
  cabezal: "Cabezal",
  columna: "Columna",
  pared: "Pared",
  centro_mesa: "Centro de Mesa",
};

const ESTADO_COLORS: Record<string, string> = {
  Actualizado: "bg-green-500",
  Normal: "bg-blue-500",
  Critico: "bg-red-500",
  Desactualizado: "bg-yellow-500",
};

const SOL_TIPO_LABELS: Record<string, string> = {
  disenio: "Diseño",
  cotizacion: "Cotización",
  retiro: "Retiro",
};

function BarraHorizontal({ label, value, max, color = "bg-blue-500" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-800 w-8 text-right">{value}</span>
    </div>
  );
}

export default function ReportesPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reportes")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <p className="text-gray-400">Cargando reportes...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">Error al cargar reportes.</div>
    );
  }

  const maxProvincia = Math.max(...Object.values(data.pdv.porProvincia));
  const maxCadena = data.pdv.topCadenas[0]?.[1] ?? 1;
  const maxMarca = Math.max(...Object.values(data.pdv.porMarca));
  const maxTipo = Math.max(...Object.values(data.inventario.porTipo));
  const maxSolEstado = Math.max(...Object.values(data.solicitudes.porEstado));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart2 size={18} className="text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Total PDVs</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.pdv.total}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <p className="text-sm text-gray-500">PDVs Críticos</p>
          </div>
          <p className="text-3xl font-bold text-red-600">{data.pdv.criticos}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package size={18} className="text-purple-600" />
            </div>
            <p className="text-sm text-gray-500">Piezas Inventario</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.inventario.total}</p>
          {data.inventario.sinMedidas > 0 && (
            <p className="text-xs text-yellow-600 mt-1">{data.inventario.sinMedidas} sin medidas</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Solicitudes</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.solicitudes.total}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDVs por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">PDVs por Estado</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.pdv.porEstado).map(([estado, count]) => (
              <div key={estado} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${ESTADO_COLORS[estado] ?? "bg-gray-400"}`} />
                <div>
                  <p className="text-xs text-gray-500">{estado}</p>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PDVs por provincia */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">PDVs por Provincia</h2>
          <div className="space-y-3">
            {Object.entries(data.pdv.porProvincia)
              .sort((a, b) => b[1] - a[1])
              .map(([prov, count]) => (
                <BarraHorizontal key={prov} label={prov} value={count} max={maxProvincia} color="bg-blue-500" />
              ))}
          </div>
        </div>

        {/* Top cadenas */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top Cadenas</h2>
          <div className="space-y-3">
            {data.pdv.topCadenas.map(([cadena, count]) => (
              <BarraHorizontal key={cadena} label={cadena} value={count} max={maxCadena} color="bg-indigo-500" />
            ))}
          </div>
        </div>

        {/* PDVs por marca */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">PDVs por Marca</h2>
          <div className="space-y-3">
            {Object.entries(data.pdv.porMarca)
              .sort((a, b) => b[1] - a[1])
              .map(([marca, count]) => (
                <BarraHorizontal
                  key={marca}
                  label={MARCA_LABELS[marca as keyof typeof MARCA_LABELS] ?? marca}
                  value={count}
                  max={maxMarca}
                  color="bg-violet-500"
                />
              ))}
          </div>
        </div>

        {/* Inventario por tipo */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Inventario por Tipo de Mueble</h2>
          <div className="space-y-3">
            {Object.entries(data.inventario.porTipo)
              .sort((a, b) => b[1] - a[1])
              .map(([tipo, count]) => (
                <BarraHorizontal
                  key={tipo}
                  label={TIPO_LABELS[tipo] ?? tipo}
                  value={count}
                  max={maxTipo}
                  color="bg-purple-500"
                />
              ))}
          </div>
          {data.inventario.sinMedidas > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-700">
                <strong>{data.inventario.sinMedidas}</strong> piezas sin medidas registradas
              </p>
            </div>
          )}
        </div>

        {/* Solicitudes por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Solicitudes por Estado</h2>
          {data.solicitudes.total === 0 ? (
            <p className="text-gray-400 text-sm">No hay solicitudes registradas.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.solicitudes.porEstado)
                .sort((a, b) => b[1] - a[1])
                .map(([estado, count]) => (
                  <BarraHorizontal
                    key={estado}
                    label={ESTADO_SOLICITUD_LABELS[estado as keyof typeof ESTADO_SOLICITUD_LABELS] ?? estado}
                    value={count}
                    max={maxSolEstado}
                    color="bg-cyan-500"
                  />
                ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Por Tipo</h3>
            <div className="flex gap-4">
              {Object.entries(data.solicitudes.porTipo).map(([tipo, count]) => (
                <div key={tipo} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{SOL_TIPO_LABELS[tipo] ?? tipo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
