"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, X, FileText } from "lucide-react";
import { BadgeEstadoSolicitud } from "@/components/ui/Badge";
import { MARCA_LABELS, ESTADO_SOLICITUD_LABELS } from "@/types";

type Solicitud = {
  id: string;
  tipo: string;
  estado: string;
  marca: string;
  notas: string | null;
  createdAt: string;
  puntos_de_venta: { numeroPdv: number; cadena: string; mallZona: string; provincia: string } | null;
  usuarios: { nombre: string; rol: string } | null;
};

const TIPOS = [
  { value: "disenio", label: "Diseño", color: "bg-blue-50 text-blue-700" },
  { value: "cotizacion", label: "Cotización", color: "bg-yellow-50 text-yellow-700" },
  { value: "retiro", label: "Retiro", color: "bg-red-50 text-red-700" },
];

const ESTADOS_FLUJO = [
  "BORRADOR", "APROBADA", "EN_MEDICION", "EN_DISENIO",
  "APROBACION_MERCADEO", "APROBACION_CLIENTE",
  "ABONO_PENDIENTE", "EN_INSTALACION", "COMPLETADA",
];

const MARCAS = [
  { value: "JohnnyCotton", label: "Johnny Cotton" },
  { value: "ChessKing", label: "Chess King" },
  { value: "RAFFINE", label: "RAFFINE" },
  { value: "JCX", label: "JCX" },
  { value: "JCB", label: "JCB" },
];

const CREADORES = ["Ventas", "ilad", "Yarrisa", "Yovanni", "Mercadeo"];

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

function tipoColor(tipo: string) {
  return TIPOS.find(t => t.value === tipo)?.color ?? "bg-gray-50 text-gray-700";
}
function tipoLabel(tipo: string) {
  return TIPOS.find(t => t.value === tipo)?.label ?? tipo;
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  // Modal nueva solicitud
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    tipo: "disenio",
    pdvNumero: "",
    marca: "JohnnyCotton",
    notas: "",
    creadoPorNombre: "Ventas",
  });

  // Modal cambio de estado
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);
  const [newEstado, setNewEstado] = useState("");
  const [changingEstado, setChangingEstado] = useState(false);

  const fetchSolicitudes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filtroEstado) params.set("estado", filtroEstado);
    if (filtroTipo) params.set("tipo", filtroTipo);
    const res = await fetch(`/api/solicitudes?${params}`);
    const json = await res.json();
    setSolicitudes(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [q, filtroEstado, filtroTipo]);

  useEffect(() => {
    const t = setTimeout(fetchSolicitudes, 300);
    return () => clearTimeout(t);
  }, [fetchSolicitudes]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error al guardar");
      }
      setShowModal(false);
      setForm({ tipo: "disenio", pdvNumero: "", marca: "JohnnyCotton", notas: "", creadoPorNombre: "Ventas" });
      fetchSolicitudes();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEstado() {
    if (!selectedSolicitud || !newEstado) return;
    setChangingEstado(true);
    try {
      const res = await fetch(`/api/solicitudes/${selectedSolicitud.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error al cambiar estado");
        return;
      }
      setSelectedSolicitud(null);
      setNewEstado("");
      fetchSolicitudes();
    } catch (e) {
      alert(String(e));
    } finally {
      setChangingEstado(false);
    }
  }

  // Contar por estado para el kanban
  const counts = ESTADOS_FLUJO.reduce((acc, e) => {
    acc[e] = solicitudes.filter(s => s.estado === e).length;
    return acc;
  }, {} as Record<string, number>);

  const pdvLabel = (s: Solicitud) =>
    s.puntos_de_venta
      ? `PDV-${String(s.puntos_de_venta.numeroPdv).padStart(3, "0")} — ${s.puntos_de_venta.cadena} ${s.puntos_de_venta.mallZona}`
      : "—";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Renders</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Cargando..." : `${total} solicitud${total !== 1 ? "es" : ""} registrada${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nueva Solicitud
        </button>
      </div>

      {/* Kanban de estados */}
      {!loading && solicitudes.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {ESTADOS_FLUJO.slice(0, 6).map((estado) => (
              <div
                key={estado}
                className="w-52 bg-white rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => setFiltroEstado(filtroEstado === estado ? "" : estado)}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-600 leading-tight">
                    {ESTADO_SOLICITUD_LABELS[estado as keyof typeof ESTADO_SOLICITUD_LABELS]}
                  </p>
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold ${counts[estado] > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                    {counts[estado]}
                  </span>
                </div>
                <div className="space-y-2">
                  {solicitudes.filter(s => s.estado === estado).slice(0, 3).map(s => (
                    <div key={s.id} className="border border-gray-100 rounded-lg p-2 text-xs bg-gray-50 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${tipoColor(s.tipo)}`}>{tipoLabel(s.tipo)}</span>
                        <span className="text-gray-400 font-mono text-xs">{s.id.slice(0, 6)}</span>
                      </div>
                      <p className="text-gray-500 truncate mt-1">{pdvLabel(s)}</p>
                      <p className="text-indigo-600 font-medium mt-0.5">
                        {MARCA_LABELS[s.marca as keyof typeof MARCA_LABELS] ?? s.marca}
                      </p>
                    </div>
                  ))}
                  {counts[estado] > 3 && (
                    <p className="text-xs text-gray-400 text-center">+{counts[estado] - 3} más</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros + tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-gray-800 text-sm">Todas las solicitudes</h2>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Buscar..."
                className="bg-transparent text-sm outline-none w-32"
              />
            </div>
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_FLUJO.map(e => (
                <option key={e} value={e}>{ESTADO_SOLICITUD_LABELS[e as keyof typeof ESTADO_SOLICITUD_LABELS]}</option>
              ))}
            </select>
            {(q || filtroEstado || filtroTipo) && (
              <button onClick={() => { setQ(""); setFiltroEstado(""); setFiltroTipo(""); }} className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5">Limpiar</button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PDV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Creado por</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Notas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No hay solicitudes registradas.</p>
                    <button onClick={() => setShowModal(true)} className="mt-3 text-blue-600 text-sm font-medium hover:underline">
                      Crear la primera solicitud
                    </button>
                  </td>
                </tr>
              ) : (
                solicitudes.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedSolicitud(s); setNewEstado(s.estado); }}>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoColor(s.tipo)}`}>
                        {tipoLabel(s.tipo)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{pdvLabel(s)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                        {MARCA_LABELS[s.marca as keyof typeof MARCA_LABELS] ?? s.marca}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <BadgeEstadoSolicitud estado={s.estado as never} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.usuarios?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate" title={s.notas ?? ""}>
                      {s.notas ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(s.createdAt).toLocaleDateString("es-PA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalle / Cambiar Estado */}
      {selectedSolicitud && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Detalle de Solicitud</h2>
              <button onClick={() => setSelectedSolicitud(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Tipo</p>
                  <p className={`inline-block px-2 py-0.5 rounded-full font-medium ${tipoColor(selectedSolicitud.tipo)}`}>
                    {tipoLabel(selectedSolicitud.tipo)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Punto de Venta</p>
                  <p className="font-medium">{pdvLabel(selectedSolicitud)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs">Marca</p>
                    <p className="font-medium">{MARCA_LABELS[selectedSolicitud.marca as keyof typeof MARCA_LABELS] ?? selectedSolicitud.marca}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Creado por</p>
                    <p className="font-medium">{selectedSolicitud.usuarios?.nombre ?? "—"}</p>
                  </div>
                </div>
                {selectedSolicitud.notas && (
                  <div>
                    <p className="text-gray-500 text-xs">Notas</p>
                    <p className="text-gray-700">{selectedSolicitud.notas}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar Estado</label>
                <select
                  value={newEstado}
                  onChange={(e) => setNewEstado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ESTADOS_FLUJO.map((e) => (
                    <option key={e} value={e}>
                      {ESTADO_SOLICITUD_LABELS[e as keyof typeof ESTADO_SOLICITUD_LABELS]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedSolicitud(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleChangeEstado}
                  disabled={changingEstado || newEstado === selectedSolicitud.estado}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {changingEstado ? "Guardando..." : "Guardar Cambio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Solicitud */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Tipo de solicitud</label>
                <div className="flex gap-2">
                  {TIPOS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: t.value }))}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${form.tipo === t.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}># PDV</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.pdvNumero}
                    onChange={e => setForm(f => ({ ...f, pdvNumero: e.target.value }))}
                    className={INPUT}
                    placeholder="Ej: 23"
                  />
                </div>
                <div>
                  <label className={LABEL}>Marca</label>
                  <select value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} className={INPUT}>
                    {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Creado por</label>
                <select value={form.creadoPorNombre} onChange={e => setForm(f => ({ ...f, creadoPorNombre: e.target.value }))} className={INPUT}>
                  {CREADORES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Notas / Descripción (opcional)</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  className={INPUT + " resize-none"}
                  rows={3}
                  placeholder="Descripción del trabajo, referencias, medidas, etc."
                />
              </div>
              {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {saving ? "Creando..." : "Crear solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
