"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, DollarSign, Tag, FileText, Calendar, AlertCircle, Copy, Check, Trash2, Edit3 } from "lucide-react";

type PdvLite = {
  id: string;
  numeroPdv: number;
  cadena: string;
};

type Cotizacion = {
  id: string;
  pdvId: string;
  tipo: "corner" | "cabezal" | "gondola" | "racks" | "columna" | "pared" | "centro_mesa";
  precioMin: number | null;
  precioMax: number | null;
  notas: string | null;
  creadaPor: string;
  createdAt: string;
  puntos_de_venta: {
    numeroPdv: number;
    cadena: string;
    mallZona?: string;
    provincia?: string;
  } | null;
};

const TIPOS = ["corner", "cabezal", "gondola", "racks", "columna", "pared", "centro_mesa"] as const;
const CREADORES = ["Yovanni", "Yarrisa", "Ventas"] as const;

const tipoBadge: Record<string, string> = {
  corner: "bg-blue-100 text-blue-700 border border-blue-200",
  cabezal: "bg-purple-100 text-purple-700 border border-purple-200",
  gondola: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  racks: "bg-amber-100 text-amber-700 border border-amber-200",
  columna: "bg-pink-100 text-pink-700 border border-pink-200",
  pared: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  centro_mesa: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

const tipoLabel: Record<string, string> = {
  corner: "Corner",
  cabezal: "Cabezal",
  gondola: "Góndola",
  racks: "Racks",
  columna: "Columna",
  pared: "Pared",
  centro_mesa: "Centro de Mesa",
};

const SETUP_SQL = `-- Ejecuta este SQL en Supabase Studio → SQL Editor
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "pdvId" UUID REFERENCES puntos_de_venta(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('corner', 'cabezal', 'gondola', 'racks', 'columna', 'pared', 'centro_mesa')),
  "precioMin" DECIMAL(10,2),
  "precioMax" DECIMAL(10,2),
  notas TEXT,
  "creadaPor" TEXT NOT NULL DEFAULT 'Ventas',
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_pdv ON cotizaciones("pdvId");
CREATE INDEX IF NOT EXISTS idx_cotizaciones_tipo ON cotizaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON cotizaciones("createdAt" DESC);`;

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

type FormState = {
  pdvId: string;
  tipo: Cotizacion["tipo"];
  precioMin: string;
  precioMax: string;
  notas: string;
  creadaPor: string;
};

const emptyForm: FormState = {
  pdvId: "",
  tipo: "corner",
  precioMin: "",
  precioMax: "",
  notas: "",
  creadaPor: "Ventas",
};

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [detail, setDetail] = useState<Cotizacion | null>(null);

  // Filters
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterPdvId, setFilterPdvId] = useState<string>("");

  // PDV list for the PDV select
  const [pdvOptions, setPdvOptions] = useState<PdvLite[]>([]);
  const [pdvLoading, setPdvLoading] = useState(false);

  useEffect(() => {
    fetchCotizaciones();
    fetchPdvOptions();
  }, []);

  const fetchCotizaciones = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTipo) params.set("tipo", filterTipo);
      if (filterPdvId) params.set("pdvId", filterPdvId);
      const qs = params.toString();
      const res = await fetch(`/api/cotizaciones${qs ? `?${qs}` : ""}`);
      const json = await res.json();
      if (json.needsSetup) {
        setNeedsSetup(true);
      } else {
        setCotizaciones(json.data || []);
        setNeedsSetup(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPdvOptions = async () => {
    setPdvLoading(true);
    try {
      const res = await fetch("/api/pdv?pageSize=100");
      const json = await res.json();
      const list: PdvLite[] = (json.data || []).map((p: { id: string; numeroPdv: number; cadena: string }) => ({
        id: p.id,
        numeroPdv: p.numeroPdv,
        cadena: p.cadena,
      }));
      setPdvOptions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setPdvLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchCotizaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipo, filterPdvId]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEditFromDetail = () => {
    if (!detail) return;
    setForm({
      pdvId: detail.pdvId,
      tipo: detail.tipo,
      precioMin: detail.precioMin !== null ? String(detail.precioMin) : "",
      precioMax: detail.precioMax !== null ? String(detail.precioMax) : "",
      notas: detail.notas ?? "",
      creadaPor: detail.creadaPor || "Ventas",
    });
    setEditingId(detail.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.pdvId || !form.tipo) {
      alert("Faltan campos obligatorios: PDV y tipo");
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/cotizaciones/${editingId}` : "/api/cotizaciones";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al guardar");
        return;
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      setDetail(null);
      fetchCotizaciones();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cotización?")) return;
    try {
      await fetch(`/api/cotizaciones/${id}`, { method: "DELETE" });
      setDetail(null);
      fetchCotizaciones();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = cotizaciones.length;
    const withRange = cotizaciones.filter(
      (c) => c.precioMin !== null && c.precioMax !== null
    );
    const avgRange =
      withRange.length === 0
        ? 0
        : withRange.reduce(
            (acc, c) => acc + (Number(c.precioMax) - Number(c.precioMin)),
            0
          ) / withRange.length;

    // Most quoted type
    const typeCounts: Record<string, number> = {};
    for (const c of cotizaciones) {
      typeCounts[c.tipo] = (typeCounts[c.tipo] || 0) + 1;
    }
    let topType = "—";
    let topCount = 0;
    for (const [t, n] of Object.entries(typeCounts)) {
      if (n > topCount) {
        topType = tipoLabel[t] ?? t;
        topCount = n;
      }
    }

    return { total, avgRange, topType };
  }, [cotizaciones]);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (needsSetup) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Configuración inicial requerida</h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            La tabla <code className="bg-amber-100 px-1 rounded font-mono">cotizaciones</code> no existe aún en la base de datos.
            Copia el siguiente SQL y ejecútalo en <strong>Supabase Studio → SQL Editor</strong>:
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
              {SETUP_SQL}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Abrir Supabase Studio
            </a>
            <button
              onClick={fetchCotizaciones}
              className="px-4 py-2 border border-amber-300 text-amber-800 text-sm rounded-lg font-medium hover:bg-amber-100 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 mt-1">Presupuestos de precio para fabricación e instalación de mobiliario</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nueva Cotización
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <label className={LABEL}>Tipo de mueble</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className={INPUT}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {tipoLabel[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[260px]">
          <label className={LABEL}>PDV</label>
          <select
            value={filterPdvId}
            onChange={(e) => setFilterPdvId(e.target.value)}
            className={INPUT}
            disabled={pdvLoading}
          >
            <option value="">Todos los PDV</option>
            {pdvOptions.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.numeroPdv} — {p.cadena}
              </option>
            ))}
          </select>
        </div>

        {(filterTipo || filterPdvId) && (
          <button
            onClick={() => {
              setFilterTipo("");
              setFilterPdvId("");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs">
            <FileText size={14} />
            Total de cotizaciones
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{kpis.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600 text-xs">
            <DollarSign size={14} />
            Rango promedio
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">
            {kpis.avgRange > 0 ? formatCurrency(kpis.avgRange) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Diferencia promedio entre precio máx. y mín.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-600 text-xs">
            <Tag size={14} />
            Tipo más cotizado
          </div>
          <p className="text-2xl font-bold text-purple-700 mt-2">{kpis.topType}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando cotizaciones...</div>
        ) : cotizaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay cotizaciones registradas.</p>
            <p className="text-xs mt-1">Crea la primera con el botón superior derecho.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">PDV</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Rango de Precio</th>
                  <th className="px-4 py-3 font-medium">Notas</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotizaciones.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetail(c)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      {c.puntos_de_venta ? (
                        <div>
                          <p className="font-semibold text-gray-800">#{c.puntos_de_venta.numeroPdv}</p>
                          <p className="text-xs text-gray-500">{c.puntos_de_venta.cadena}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">PDV eliminado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          tipoBadge[c.tipo] ?? "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {tipoLabel[c.tipo] ?? c.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-800">
                      {c.precioMin !== null && c.precioMax !== null
                        ? `${formatCurrency(c.precioMin)} - ${formatCurrency(c.precioMax)}`
                        : c.precioMin !== null
                        ? `Desde ${formatCurrency(c.precioMin)}`
                        : c.precioMax !== null
                        ? `Hasta ${formatCurrency(c.precioMax)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <p className="truncate">{c.notas || <span className="text-gray-300">—</span>}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(c.createdAt).toLocaleDateString("es-PA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear / Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingId ? "Editar Cotización" : "Nueva Cotización"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <label className={LABEL}>PDV *</label>
              <select
                value={form.pdvId}
                onChange={(e) => setForm((f) => ({ ...f, pdvId: e.target.value }))}
                className={INPUT}
                disabled={pdvLoading}
              >
                <option value="">{pdvLoading ? "Cargando PDV..." : "Selecciona un PDV"}</option>
                {pdvOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.numeroPdv} — {p.cadena}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as Cotizacion["tipo"] }))}
                  className={INPUT}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {tipoLabel[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Creada por</label>
                <select
                  value={form.creadaPor}
                  onChange={(e) => setForm((f) => ({ ...f, creadaPor: e.target.value }))}
                  className={INPUT}
                >
                  {CREADORES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Precio mínimo (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precioMin}
                  onChange={(e) => setForm((f) => ({ ...f, precioMin: e.target.value }))}
                  placeholder="0.00"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Precio máximo (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precioMax}
                  onChange={(e) => setForm((f) => ({ ...f, precioMax: e.target.value }))}
                  placeholder="0.00"
                  className={INPUT}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Detalles, condiciones, referencias..."
                className={`${INPUT} resize-none h-20`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.pdvId || !form.tipo}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Detalle de Cotización</h2>
              <button
                onClick={() => setDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {detail.puntos_de_venta ? (
                    <>
                      <p className="font-semibold text-gray-800">
                        PDV #{detail.puntos_de_venta.numeroPdv}
                      </p>
                      <p className="text-xs text-gray-500">{detail.puntos_de_venta.cadena}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 text-xs">PDV eliminado</p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    tipoBadge[detail.tipo] ?? "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {tipoLabel[detail.tipo] ?? detail.tipo}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Precio mínimo</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {formatCurrency(detail.precioMin)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Precio máximo</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {formatCurrency(detail.precioMax)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rango</p>
                  <p className="font-mono font-semibold text-blue-700">
                    {detail.precioMin !== null && detail.precioMax !== null
                      ? formatCurrency(Number(detail.precioMax) - Number(detail.precioMin))
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creada por</p>
                  <p className="font-medium text-gray-800">{detail.creadaPor}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Fecha de creación</p>
                  <p className="font-medium text-gray-800">
                    {new Date(detail.createdAt).toLocaleString("es-PA")}
                  </p>
                </div>
                {detail.notas && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Notas</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detail.notas}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDelete(detail.id)}
                className="flex items-center gap-1.5 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
              <button
                onClick={openEditFromDetail}
                className="flex items-center gap-1.5 px-4 py-2 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Edit3 size={14} />
                Editar
              </button>
              <button
                onClick={() => setDetail(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
