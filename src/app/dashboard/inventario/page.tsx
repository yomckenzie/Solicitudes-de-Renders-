"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { MARCA_LABELS } from "@/types";

type MuebleRow = {
  id: string;
  pdvId: string | null;
  tipo: string;
  categoria: string;
  cantidad: number;
  medidas: string | null;
  estado: string;
  puntos_de_venta: {
    numeroPdv: number;
    cadena: string;
    mallZona: string;
    marca: string;
    provincia: string;
  } | null;
};

const TIPOS = ["corner", "gondola", "rack", "cabezal", "columna", "pared", "centro_mesa"];
const TIPO_LABELS: Record<string, string> = {
  corner: "Corner",
  gondola: "Góndola",
  rack: "Rack",
  cabezal: "Cabezal",
  columna: "Columna",
  pared: "Pared",
  centro_mesa: "Centro de Mesa",
};
const ESTADOS = ["Actualizado", "Normal", "Critico", "Desactualizado"];

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

export default function InventarioPage() {
  const [muebles, setMuebles] = useState<MuebleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");

  // Modal agregar mueble
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    pdvNumero: "",
    tipo: "corner",
    categoria: "casual",
    cantidad: "1",
    medidas: "",
    estado: "Normal",
  });

  // Modal editar mueble (medidas)
  const [editTarget, setEditTarget] = useState<MuebleRow | null>(null);
  const [editMedidas, setEditMedidas] = useState("");
  const [editEstado, setEditEstado] = useState("Normal");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Eliminar mueble
  const [deleting, setDeleting] = useState(false);

  const fetchInventario = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    if (estado) params.set("estado", estado);
    params.set("page", page.toString());

    const res = await fetch(`/api/inventario?${params}`);
    const json = await res.json();
    setMuebles(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [tipo, categoria, estado, page]);

  useEffect(() => {
    fetchInventario();
  }, [fetchInventario]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdvNumero: parseInt(form.pdvNumero),
          tipo: form.tipo,
          categoria: form.categoria,
          cantidad: parseInt(form.cantidad),
          medidas: form.medidas || null,
          estado: form.estado,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error al guardar");
      }
      setShowModal(false);
      setForm({ pdvNumero: "", tipo: "corner", categoria: "casual", cantidad: "1", medidas: "", estado: "Normal" });
      fetchInventario();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/inventario/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medidas: editMedidas || null, estado: editEstado }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error al guardar");
      }
      setEditTarget(null);
      fetchInventario();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEditSaving(false);
    }
  }

  function openEdit(m: MuebleRow) {
    setEditTarget(m);
    setEditMedidas(m.medidas ?? "");
    setEditEstado(m.estado);
    setEditError("");
  }

  async function handleDelete(m: MuebleRow) {
    if (!confirm(`¿Eliminar este mueble (${TIPO_LABELS[m.tipo]})?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inventario/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error al eliminar");
        return;
      }
      fetchInventario();
    } catch (e) {
      alert(String(e));
    } finally {
      setDeleting(false);
    }
  }

  const sinMedidas = muebles.filter(m => !m.medidas).length;
  const totalPages = Math.ceil(total / pageSize);

  const resumenTipos = TIPOS.slice(0, 4).map(t => ({
    label: TIPO_LABELS[t],
    total: muebles.filter(m => m.tipo === t).reduce((acc, m) => acc + m.cantidad, 0),
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Mobiliario</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Cargando..." : `${total} piezas en puntos de venta`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Agregar Mueble
        </button>
      </div>

      {/* Alerta medidas pendientes */}
      {!loading && sinMedidas > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Package size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {sinMedidas} mueble{sinMedidas !== 1 ? "s" : ""} sin medidas registradas (en esta página)
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              Completa las medidas físicas de cada mueble para facilitar los diseños de renders.
            </p>
          </div>
        </div>
      )}

      {/* Resumen por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {resumenTipos.map(({ label, total: t }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{t || "—"}</p>
            <p className="text-xs text-gray-500 mt-1">{label}s (esta pág.)</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>

          <select
            value={categoria}
            onChange={(e) => { setCategoria(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las categorías</option>
            <option value="casual">Casual</option>
            <option value="interior">Interior</option>
          </select>

          <select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1); }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {(tipo || categoria || estado) && (
            <button
              onClick={() => { setTipo(""); setCategoria(""); setEstado(""); setPage(1); }}
              className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Punto de Venta</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cantidad</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Medidas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Cargando inventario...
                  </td>
                </tr>
              ) : muebles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No se encontraron muebles con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                muebles.map((m) => {
                  const pdv = m.puntos_de_venta;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {pdv && m.pdvId ? (
                          <Link
                            href={`/dashboard/pdv/${m.pdvId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            PDV-{String(pdv.numeroPdv).padStart(3, "0")} — {pdv.cadena} {pdv.mallZona}
                          </Link>
                        ) : pdv ? (
                          `PDV-${String(pdv.numeroPdv).padStart(3, "0")} — ${pdv.cadena} ${pdv.mallZona}`
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {pdv && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            {MARCA_LABELS[pdv.marca as keyof typeof MARCA_LABELS] ?? pdv.marca}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {TIPO_LABELS[m.tipo] ?? m.tipo}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          m.categoria === "casual"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-pink-50 text-pink-700"
                        }`}>
                          {m.categoria === "casual" ? "Casual" : "Interior"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{m.cantidad}</td>
                      <td className="px-4 py-3">
                        {m.medidas ? (
                          <span className="text-xs text-gray-600 font-mono">{m.medidas}</span>
                        ) : (
                          <span className="text-xs text-red-400 font-medium">Sin medidas</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstadoEspacio estado={m.estado as never} />
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          {m.medidas ? "Editar" : "Agregar medidas"}
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={deleting}
                          className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {total === 0 ? "0 resultados" : `Mostrando ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} piezas`}
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

      {/* Modal Editar Medidas */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Editar mueble</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TIPO_LABELS[editTarget.tipo] ?? editTarget.tipo} — {editTarget.categoria}
                  {editTarget.puntos_de_venta && ` · PDV-${String(editTarget.puntos_de_venta.numeroPdv).padStart(3,"0")} ${editTarget.puntos_de_venta.cadena}`}
                </p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSave} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Medidas</label>
                <input
                  type="text"
                  value={editMedidas}
                  onChange={e => setEditMedidas(e.target.value)}
                  className={INPUT}
                  placeholder="Ej: 1.20m × 0.60m × 2.00m"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Formato libre: ancho × fondo × alto</p>
              </div>
              <div>
                <label className={LABEL}>Estado</label>
                <select value={editEstado} onChange={e => setEditEstado(e.target.value)} className={INPUT}>
                  {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={editSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Mueble */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Agregar Mueble</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}># PDV</label>
                <input required type="number" min="1" value={form.pdvNumero} onChange={e => setForm(f => ({ ...f, pdvNumero: e.target.value }))} className={INPUT} placeholder="Ej: 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Tipo de mueble</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={INPUT}>
                    {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className={INPUT}>
                    <option value="casual">Casual</option>
                    <option value="interior">Interior</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cantidad</label>
                  <input required type="number" min="1" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={INPUT}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Medidas (opcional)</label>
                <input type="text" value={form.medidas} onChange={e => setForm(f => ({ ...f, medidas: e.target.value }))} className={INPUT} placeholder="Ej: 1.20m × 0.60m × 2.00m" />
              </div>
              {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar Mueble"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
