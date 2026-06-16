"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  X,
  Wrench,
  CheckCircle2,
  XCircle,
  Calendar,
  ClipboardList,
  Pencil,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Filter,
} from "lucide-react";

type SolicitudRef = {
  id: string;
  marca: string;
  estado: string;
  puntos_de_venta: {
    numeroPdv: number;
    cadena: string;
    mallZona: string;
  } | null;
};

type Instalacion = {
  id: string;
  solicitudId: string;
  fechasPropuestas: string[];
  fechaConfirmada: string | null;
  visitaRealizada: boolean;
  notas: string | null;
  createdAt: string;
  solicitudes_de_render: SolicitudRef | null;
};

type EstadoFiltro = "todas" | "pendientes" | "confirmadas" | "realizadas";

const SETUP_SQL = `-- Ejecuta este SQL en Supabase Studio → SQL Editor
CREATE TABLE IF NOT EXISTS instalaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "solicitudId" UUID NOT NULL,
  "fechasPropuestas" DATE[] NOT NULL DEFAULT '{}',
  "fechaConfirmada" DATE,
  "visitaRealizada" BOOLEAN NOT NULL DEFAULT FALSE,
  notas TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`;

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  // El driver devuelve DATE como 'YYYY-MM-DD' o 'YYYY-MM-DDT00:00:00+00:00'
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" });
}

function pdvLabel(s: SolicitudRef | null): string {
  if (!s?.puntos_de_venta) return "Solicitud sin PDV";
  return `PDV-${String(s.puntos_de_venta.numeroPdv).padStart(3, "0")} — ${s.puntos_de_venta.cadena} ${s.puntos_de_venta.mallZona}`;
}

export default function InstalacionesPage() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("todas");
  const [filtroSolicitud, setFiltroSolicitud] = useState("");

  // Modal crear
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    solicitudId: "",
    fecha1: "",
    fecha2: "",
    fecha3: "",
    notas: "",
  });
  const [formError, setFormError] = useState("");

  // Modal detalle
  const [selected, setSelected] = useState<Instalacion | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    fecha1: "",
    fecha2: "",
    fecha3: "",
    fechaConfirmada: "",
    visitaRealizada: false,
    notas: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchAll = async () => {
    const [instRes, solRes] = await Promise.all([
      fetch("/api/instalaciones"),
      fetch("/api/solicitudes"),
    ]);
    const instJson = await instRes.json();
    const solJson = await solRes.json();
    if (instJson.needsSetup || solJson.needsSetup) {
      setNeedsSetup(true);
    } else {
      setInstalaciones(instJson.data ?? []);
      setSolicitudes(solJson.data ?? []);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchAll();
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Crear ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ solicitudId: "", fecha1: "", fecha2: "", fecha3: "", notas: "" });
    setFormError("");
  };

  const handleCreate = async () => {
    setFormError("");
    if (!form.solicitudId) {
      setFormError("Selecciona una solicitud");
      return;
    }
    const fechas = [form.fecha1, form.fecha2, form.fecha3]
      .map(f => f.trim())
      .filter(f => f.length > 0);
    if (fechas.length === 0) {
      setFormError("Debes proponer al menos una fecha");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/instalaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: form.solicitudId,
          fechasPropuestas: fechas,
          notas: form.notas || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Error al guardar");
      }
      setShowCreate(false);
      resetForm();
      fetchAll();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  // ─── Detalle / Editar ────────────────────────────────────────────────────
  const openDetail = (inst: Instalacion) => {
    setSelected(inst);
    setEditMode(false);
    const fechas = inst.fechasPropuestas ?? [];
    setEditForm({
      fecha1: fechas[0] ?? "",
      fecha2: fechas[1] ?? "",
      fecha3: fechas[2] ?? "",
      fechaConfirmada: inst.fechaConfirmada ? inst.fechaConfirmada.slice(0, 10) : "",
      visitaRealizada: inst.visitaRealizada,
      notas: inst.notas ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const fechas = [editForm.fecha1, editForm.fecha2, editForm.fecha3]
      .map(f => f.trim())
      .filter(f => f.length > 0);
    if (fechas.length === 0) {
      alert("Debe quedar al menos una fecha propuesta");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`/api/instalaciones/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechasPropuestas: fechas,
          fechaConfirmada: editForm.fechaConfirmada || null,
          visitaRealizada: editForm.visitaRealizada,
          notas: editForm.notas || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Error al actualizar");
      }
      setEditMode(false);
      fetchAll();
      // Refrescar el selected con los nuevos datos
      const refreshed = await fetch("/api/instalaciones").then(r => r.json());
      const fresh = (refreshed.data ?? []).find((i: Instalacion) => i.id === selected.id);
      if (fresh) setSelected(fresh);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleVisita = async () => {
    if (!selected) return;
    const newValue = !selected.visitaRealizada;
    const res = await fetch(`/api/instalaciones/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitaRealizada: newValue }),
    });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Error al actualizar");
      return;
    }
    setSelected(prev => prev ? { ...prev, visitaRealizada: newValue } : prev);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm("¿Eliminar esta instalación? Esta acción no se puede deshacer.")) return;
    const res = await fetch(`/api/instalaciones/${selected.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j.error || "Error al eliminar");
      return;
    }
    setSelected(null);
    fetchAll();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Derivados: filtros, KPIs ───────────────────────────────────────────
  const filtered = useMemo(() => {
    return instalaciones.filter(i => {
      if (filtroEstado === "pendientes" && i.fechaConfirmada) return false;
      if (filtroEstado === "confirmadas" && (!i.fechaConfirmada || i.visitaRealizada)) return false;
      if (filtroEstado === "realizadas" && !i.visitaRealizada) return false;
      if (filtroSolicitud && i.solicitudId !== filtroSolicitud) return false;
      return true;
    });
  }, [instalaciones, filtroEstado, filtroSolicitud]);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const en7Dias = new Date(hoy);
  en7Dias.setDate(en7Dias.getDate() + 7);

  const totalInstalaciones = instalaciones.length;
  const totalPendientes = instalaciones.filter(i => !i.fechaConfirmada).length;
  const totalRealizadas = instalaciones.filter(i => i.visitaRealizada).length;
  const totalProximas7 = instalaciones.filter(i => {
    if (!i.fechaConfirmada) return false;
    const d = new Date(i.fechaConfirmada.length === 10 ? i.fechaConfirmada + "T00:00:00" : i.fechaConfirmada);
    return d >= hoy && d <= en7Dias;
  }).length;

  // ─── Render: needsSetup ──────────────────────────────────────────────────
  if (needsSetup) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Configuración inicial requerida</h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            La tabla <code className="bg-amber-100 px-1 rounded font-mono">instalaciones</code> no existe aún en la base de datos.
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
              onClick={fetchAll}
              className="px-4 py-2 border border-amber-300 text-amber-800 text-sm rounded-lg font-medium hover:bg-amber-100 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: principal ───────────────────────────────────────────────────
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench size={22} className="text-blue-600" />
            Instalaciones
          </h1>
          <p className="text-gray-500 mt-1">
            {loading
              ? "Cargando..."
              : `${totalInstalaciones} instalación${totalInstalaciones !== 1 ? "es" : ""} registrada${totalInstalaciones !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); resetForm(); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nueva Instalación
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ClipboardList size={14} />
            Total
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalInstalaciones}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-yellow-700 mb-1">
            <Calendar size={14} />
            Pendientes
          </div>
          <p className="text-2xl font-bold text-yellow-700">{totalPendientes}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Sin fecha confirmada</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-green-700 mb-1">
            <CheckCircle2 size={14} />
            Realizadas
          </div>
          <p className="text-2xl font-bold text-green-700">{totalRealizadas}</p>
          <p className="text-xs text-green-600 mt-0.5">Visita completada</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-blue-700 mb-1">
            <Calendar size={14} />
            Próximas 7 días
          </div>
          <p className="text-2xl font-bold text-blue-700">{totalProximas7}</p>
          <p className="text-xs text-blue-600 mt-0.5">{formatDisplayDate(formatISODate(hoy))} → {formatDisplayDate(formatISODate(en7Dias))}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
          <Filter size={14} />
          Filtros:
        </div>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["todas", "pendientes", "confirmadas", "realizadas"] as EstadoFiltro[]).map(op => (
            <button
              key={op}
              onClick={() => setFiltroEstado(op)}
              className={`px-3 py-1.5 capitalize transition-colors ${
                filtroEstado === op
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {op}
            </button>
          ))}
        </div>

        <select
          value={filtroSolicitud}
          onChange={e => setFiltroSolicitud(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 max-w-xs"
        >
          <option value="">Todas las solicitudes</option>
          {solicitudes.map(s => (
            <option key={s.id} value={s.id}>
              {pdvLabel(s)}
            </option>
          ))}
        </select>

        {(filtroEstado !== "todas" || filtroSolicitud) && (
          <button
            onClick={() => { setFiltroEstado("todas"); setFiltroSolicitud(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
          >
            Limpiar filtros
          </button>
        )}

        <div className="ml-auto text-xs text-gray-500">
          Mostrando {filtered.length} de {totalInstalaciones}
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Error: {error}
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500 py-12">Cargando instalaciones...</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Solicitud (PDV)</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600"># Fechas Propuestas</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha Confirmada</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Visita Realizada</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Wrench size={32} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-gray-400 text-sm">No hay instalaciones con los filtros actuales.</p>
                      <button
                        onClick={() => { setShowCreate(true); resetForm(); }}
                        className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                      >
                        Crear la primera instalación
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map(inst => (
                    <tr
                      key={inst.id}
                      onClick={() => openDetail(inst)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm">
                          {pdvLabel(inst.solicitudes_de_render)}
                        </p>
                        {inst.solicitudes_de_render?.marca && (
                          <p className="text-xs text-gray-500 mt-0.5">{inst.solicitudes_de_render.marca}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          {inst.fechasPropuestas?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDisplayDate(inst.fechaConfirmada)}
                      </td>
                      <td className="px-4 py-3">
                        {inst.visitaRealizada ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle size={12} />
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={inst.notas ?? ""}>
                        {inst.notas || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                Nueva Instalación
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Solicitud *</label>
              <select
                value={form.solicitudId}
                onChange={e => setForm(f => ({ ...f, solicitudId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Selecciona una solicitud —</option>
                {solicitudes.map(s => (
                  <option key={s.id} value={s.id}>
                    {pdvLabel(s)} · {s.marca}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fechas Propuestas *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                El proveedor debe proponer mínimo 2 opciones de fecha.
              </p>
              <div className="space-y-2">
                <input
                  type="date"
                  value={form.fecha1}
                  onChange={e => setForm(f => ({ ...f, fecha1: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opción 1"
                />
                <input
                  type="date"
                  value={form.fecha2}
                  onChange={e => setForm(f => ({ ...f, fecha2: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opción 2"
                />
                <input
                  type="date"
                  value={form.fecha3}
                  onChange={e => setForm(f => ({ ...f, fecha3: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opción 3 (opcional)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
              <textarea
                value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones, condiciones especiales..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {formError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowCreate(false); resetForm(); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wrench size={18} className="text-blue-600" />
                {editMode ? "Editar Instalación" : "Detalle de Instalación"}
              </h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">Solicitud</p>
              <p className="font-semibold text-gray-800 text-sm mt-0.5">
                {pdvLabel(selected.solicitudes_de_render)}
              </p>
            </div>

            {!editMode ? (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Fechas Propuestas</p>
                  <ul className="space-y-1">
                    {(selected.fechasPropuestas ?? []).map((f, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                      >
                        <Calendar size={14} className="text-gray-400" />
                        Opción {idx + 1}: <span className="font-medium">{formatDisplayDate(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Fecha Confirmada</p>
                  {selected.fechaConfirmada ? (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={14} />
                      {formatDisplayDate(selected.fechaConfirmada)}
                    </span>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Pendiente de confirmar</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Notas</p>
                  <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3">
                    {selected.notas || <span className="text-gray-400 italic">Sin notas</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Visita Realizada</p>
                    <p className="text-xs text-gray-500">Yarrisa confirmó la visita al PDV</p>
                  </div>
                  <button
                    onClick={handleToggleVisita}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      selected.visitaRealizada ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        selected.visitaRealizada ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fechas Propuestas *</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={editForm.fecha1}
                      onChange={e => setEditForm(f => ({ ...f, fecha1: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={editForm.fecha2}
                      onChange={e => setEditForm(f => ({ ...f, fecha2: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={editForm.fecha3}
                      onChange={e => setEditForm(f => ({ ...f, fecha3: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Confirmada</label>
                  <input
                    type="date"
                    value={editForm.fechaConfirmada}
                    onChange={e => setEditForm(f => ({ ...f, fechaConfirmada: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Selecciona una de las fechas propuestas que Yarrisa confirmó.
                  </p>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Visita Realizada</p>
                    <p className="text-xs text-gray-500">Yarrisa confirmó la visita al PDV</p>
                  </div>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, visitaRealizada: !f.visitaRealizada }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editForm.visitaRealizada ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editForm.visitaRealizada ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={editForm.notas}
                    onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={editSaving}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {editSaving ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
