"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { MARCA_LABELS } from "@/types";

type Pdv = {
  id: string;
  numeroPdv: number;
  espacio: number;
  provincia: string;
  cadena: string;
  mallZona: string;
  marca: string;
  impulsador: string | null;
  estado: string;
};

const PROVINCIAS = ["Panamá", "Chorrera", "Arraijan", "Colón", "Chiriquí", "Veraguas", "Coclé", "Herrera"];
const ESTADOS = ["Actualizado", "Normal", "Critico", "Desactualizado"];
const MARCAS = [
  { value: "JohnnyCotton", label: "Johnny Cotton" },
  { value: "ChessKing", label: "Chess King" },
  { value: "RAFFINE", label: "RAFFINE" },
  { value: "JCX", label: "JCX" },
  { value: "JCB", label: "JCB" },
];

export default function PdvPage() {
  const [pdvs, setPdvs] = useState<Pdv[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [q, setQ] = useState("");
  const [provincia, setProvincia] = useState("");
  const [cadena, setCadena] = useState("");
  const [estado, setEstado] = useState("");
  const [marca, setMarca] = useState("");

  const fetchPdvs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (provincia) params.set("provincia", provincia);
    if (cadena) params.set("cadena", cadena);
    if (estado) params.set("estado", estado);
    if (marca) params.set("marca", marca);
    params.set("page", page.toString());

    const res = await fetch(`/api/pdv?${params}`);
    const json = await res.json();
    setPdvs(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [q, provincia, cadena, estado, marca, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchPdvs, 300);
    return () => clearTimeout(timeout);
  }, [fetchPdvs]);

  const totalPages = Math.ceil(total / pageSize);

  function resetFiltros() {
    setQ(""); setProvincia(""); setCadena(""); setEstado(""); setMarca(""); setPage(1);
  }

  const hayFiltros = q || provincia || cadena || estado || marca;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Venta</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Cargando..." : `${total} espacios en tiendas de Panamá`}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nuevo PDV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por tienda, zona o impulsador..."
              className="bg-transparent text-sm flex-1 outline-none"
            />
          </div>

          <select
            value={provincia}
            onChange={(e) => { setProvincia(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select
            value={marca}
            onChange={(e) => { setMarca(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las marcas</option>
            {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>

          {hayFiltros && (
            <button
              onClick={resetFiltros}
              className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              <Filter size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600"># PDV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Espacio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Provincia</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadena</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Zona / CC</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Impulsador</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Cargando puntos de venta...
                  </td>
                </tr>
              ) : pdvs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No se encontraron PDVs con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                pdvs.map((pdv) => (
                  <tr key={pdv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          PDV-{String(pdv.numeroPdv).padStart(3, "0")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                        {pdv.espacio}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pdv.provincia}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{pdv.cadena}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={pdv.mallZona}>
                      {pdv.mallZona}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {MARCA_LABELS[pdv.marca as keyof typeof MARCA_LABELS] ?? pdv.marca}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{pdv.impulsador ?? "—"}</td>
                    <td className="px-4 py-3">
                      <BadgeEstadoEspacio estado={pdv.estado as never} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {total === 0 ? "0 resultados" : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} PDVs`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-600 px-2">
                Pág. {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
