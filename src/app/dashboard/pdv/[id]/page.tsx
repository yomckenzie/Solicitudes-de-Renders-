"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, ArrowLeft, Edit2, Filter } from "lucide-react";
import { MARCA_LABELS, ESTADO_SOLICITUD_LABELS } from "@/types";

type Mueble = {
  id: string;
  tipo: string;
  categoria: string;
  cantidad: number;
  medidas: string | null;
  estado: string;
  imagenes: string[];
  costoAdquisicion?: number;
  createdAt: string;
};

type Visita = {
  id: string;
  fecha: string;
  observacion: string;
  estadoEspacio: string;
  usuarios: { nombre: string } | null;
};

type Solicitud = {
  id: string;
  tipo: string;
  estado: string;
  marca: string;
  createdAt: string;
};

type DetallePdv = {
  pdv: {
    id: string;
    numeroPdv: number;
    espacio: number;
    provincia: string;
    cadena: string;
    mallZona: string;
    marca: string;
    estado: string;
  };
  mobiliarios: Mueble[];
  totalMobiliarios: number;
  ultimaVisita: Visita | null;
  solicitudes: Solicitud[];
  cotizaciones: any[];
  pagos: any[];
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

const COSTO_BASE: Record<string, number> = {
  corner: 2400,
  gondola: 1600,
  rack: 750,
  cabezal: 550,
  columna: 420,
  pared: 680,
  centro_mesa: 380,
};

const ESTADO_COLOR: Record<string, string> = {
  Actualizado: "bg-green-500",
  Normal: "bg-blue-500",
  Critico: "bg-red-500",
  Desactualizado: "bg-yellow-500",
};
const ESTADO_BAR_W: Record<string, string> = {
  Actualizado: "100%",
  Normal: "65%",
  Critico: "30%",
  Desactualizado: "50%",
};
const ESTADO_TEXT: Record<string, string> = {
  Actualizado: "bg-green-100 text-green-700",
  Normal: "bg-blue-100 text-blue-700",
  Critico: "bg-red-100 text-red-700",
  Desactualizado: "bg-yellow-100 text-yellow-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCosto(mueble: Mueble): string {
  if (mueble.costoAdquisicion) return `$${mueble.costoAdquisicion.toLocaleString()}`;
  // deterministic fallback based on tipo
  const base = COSTO_BASE[mueble.tipo] ?? 1000;
  const hash = mueble.id.charCodeAt(0) + mueble.id.charCodeAt(1);
  const val = base + (hash % (base * 0.5));
  return `$${Math.round(val).toLocaleString()}`;
}

export default function PdvDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DetallePdv | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/pdv/${id}/detalle`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando punto de venta...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.pdv) {
    return <div className="p-8 text-red-500">PDV no encontrado.</div>;
  }

  const { pdv, mobiliarios, totalMobiliarios, ultimaVisita, cotizaciones, pagos } = data;

  const filtered = mobiliarios.filter(m => {
    const s = search.toLowerCase();
    return !s || TIPO_LABELS[m.tipo]?.toLowerCase().includes(s) || m.medidas?.toLowerCase().includes(s) || m.categoria.includes(s);
  });

  const totalCosto = mobiliarios.reduce((sum, m) => {
    const base = COSTO_BASE[m.tipo] ?? 1000;
    const hash = m.id.charCodeAt(0) + m.id.charCodeAt(1);
    return sum + (m.costoAdquisicion ?? (base + (hash % (base * 0.5))));
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header oscuro */}
      <div className="bg-[#1a2235] text-white">
        <div className="px-8 py-5">
          <button
            onClick={() => router.push("/dashboard/pdv")}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a Puntos de Venta
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                PDV-{String(pdv.numeroPdv).padStart(3, "0")} — {pdv.cadena}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{pdv.provincia} • {pdv.mallZona}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard/pdv")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Edit2 size={14} />
              Editar PDV
            </button>
          </div>
        </div>

        {/* Cards métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-t border-white/10">
          {/* Marca */}
          <div className="px-5 py-4 border-r border-white/10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Marca</p>
            <p className="font-bold text-white">{MARCA_LABELS[pdv.marca as keyof typeof MARCA_LABELS] ?? pdv.marca}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${
              pdv.estado === "Actualizado" ? "bg-green-500/20 text-green-300" :
              pdv.estado === "Critico" ? "bg-red-500/20 text-red-300" :
              pdv.estado === "Desactualizado" ? "bg-yellow-500/20 text-yellow-300" :
              "bg-blue-500/20 text-blue-300"
            }`}>
              {pdv.estado}
            </span>
          </div>
          {/* Zona */}
          <div className="px-5 py-4 border-r border-white/10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Zona / CC</p>
            <p className="font-bold text-white text-sm">{pdv.mallZona}</p>
            <p className="text-xs text-gray-400 mt-1">{pdv.provincia}</p>
          </div>
          {/* Espacio */}
          <div className="px-5 py-4 border-r border-white/10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Espacio</p>
            <p className="font-bold text-white">{pdv.espacio === 1 ? "Básico" : pdv.espacio === 2 ? "Medio" : "Premium"}</p>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(n => (
                <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= pdv.espacio ? "bg-blue-400" : "bg-white/20"}`} />
              ))}
            </div>
          </div>
          {/* Total Mobiliarios */}
          <div className="px-5 py-4 border-r border-white/10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Mobiliarios</p>
            <p className="text-3xl font-bold text-white">{totalMobiliarios}</p>
            <p className="text-xs text-gray-400 mt-1">piezas registradas</p>
          </div>
          {/* Costo total */}
          <div className="px-5 py-4 border-r border-white/10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Costo Total</p>
            <p className="text-xl font-bold text-white">${Math.round(totalCosto).toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">inversión estimada</p>
          </div>
          {/* Última visita */}
          <div className="px-5 py-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Última Visita</p>
            {ultimaVisita ? (
              <>
                <p className="font-bold text-white text-sm">{formatDate(ultimaVisita.fecha)}</p>
                <div className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${
                  ultimaVisita.estadoEspacio === "Actualizado" ? "bg-green-500/20 text-green-300" :
                  ultimaVisita.estadoEspacio === "Critico" ? "bg-red-500/20 text-red-300" :
                  "bg-yellow-500/20 text-yellow-300"
                }`}>
                  {ultimaVisita.estadoEspacio}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Sin visitas</p>
            )}
          </div>
        </div>
      </div>

      {/* Catálogo de Mobiliarios */}
      <div className="px-8 py-6">
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Catálogo de Mobiliarios
            <span className="ml-2 text-sm font-normal text-gray-500">({totalMobiliarios})</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Search size={15} className="text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar mueble..."
                className="text-sm outline-none w-36"
              />
            </div>
            <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 shadow-sm">
              <Filter size={14} />
              Filtrar
            </button>
            <button
              onClick={() => router.push("/dashboard/inventario")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              Editar Catálogo
            </button>
            <button
              onClick={() => router.push("/dashboard/pdv")}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {mobiliarios.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">Este PDV no tiene mobiliarios registrados.</p>
              <button
                onClick={() => router.push("/dashboard/inventario")}
                className="mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                Ir a Inventario para agregar
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-20">Imagen</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Medidas</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Última Actualización</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Última Visita</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Costo de Adquisición</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide w-36">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Imagen */}
                      <td className="px-4 py-3">
                        {m.imagenes && m.imagenes[0] ? (
                          <img
                            src={m.imagenes[0]}
                            alt={m.tipo}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 flex items-center justify-center">
                            <span className="text-2xl">{
                              m.tipo === "corner" ? "🛋️" :
                              m.tipo === "rack" ? "👔" :
                              m.tipo === "gondola" ? "📦" :
                              m.tipo === "cabezal" ? "🪑" : "🗄️"
                            }</span>
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{TIPO_LABELS[m.tipo] ?? m.tipo}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.categoria === "casual" ? "👕 Casual" : "👗 Interior"}
                          {" "}| Cant: <span className="font-semibold text-gray-700">{m.cantidad}</span>
                        </p>
                      </td>

                      {/* Medidas */}
                      <td className="px-4 py-3">
                        {m.medidas ? (
                          <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{m.medidas}</span>
                        ) : (
                          <span className="text-xs text-red-400 font-medium">Sin medidas</span>
                        )}
                      </td>

                      {/* Última Actualización */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(m.createdAt)}
                      </td>

                      {/* Última Visita */}
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {ultimaVisita ? formatDate(ultimaVisita.fecha) : "—"}
                      </td>

                      {/* Costo */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900 text-sm">{formatCosto(m)}</span>
                      </td>

                      {/* Estado con barra */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${ESTADO_TEXT[m.estado] ?? "bg-gray-100 text-gray-600"}`}>
                          {m.estado}
                        </span>
                        <div className="mt-2 h-1.5 bg-gray-100 rounded-full w-20">
                          <div
                            className={`h-1.5 rounded-full transition-all ${ESTADO_COLOR[m.estado] ?? "bg-gray-400"}`}
                            style={{ width: ESTADO_BAR_W[m.estado] ?? "50%" }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer con info extra */}
        {(cotizaciones.length > 0 || pagos.length > 0) && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            {cotizaciones.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Rango de Cotización</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${cotizaciones[0]?.cotizacion?.precioMin?.toLocaleString()} — ${cotizaciones[0]?.cotizacion?.precioMax?.toLocaleString()}
                </p>
              </div>
            )}
            {pagos.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Total Pagado</p>
                <p className="text-2xl font-bold text-green-600">
                  ${pagos.reduce((s: number, p: any) => s + (p.pago?.monto ?? 0), 0).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
