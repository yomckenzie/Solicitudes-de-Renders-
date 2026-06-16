"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, DollarSign, AlertCircle, Copy, Check, Trash2, CreditCard, Edit2, Save } from "lucide-react";

type SolicitudLite = {
  id: string;
  tipo: string;
  estado: string;
  marca: string;
  puntos_de_venta: { numeroPdv: number; cadena: string; mallZona: string } | null;
};

type Pago = {
  id: string;
  solicitudId: string;
  monto: number;
  porcentaje: number;
  registradoPor: string;
  fecha: string;
  createdAt: string;
  solicitudes_de_render: {
    id: string;
    tipo: string;
    estado: string;
    marca: string;
    puntos_de_venta: { numeroPdv: number; cadena: string; mallZona: string } | null;
  } | null;
};

const PORCENTAJES = [30, 50, 70, 100] as const;
const REGISTRADORES = ["Yarrisa", "Contabilidad", "Admin"] as const;

const SETUP_SQL = `-- Ejecuta este SQL en Supabase Studio → SQL Editor
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "solicitudId" UUID NOT NULL REFERENCES solicitudes_de_render(id) ON DELETE CASCADE,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  porcentaje INTEGER NOT NULL CHECK (porcentaje BETWEEN 1 AND 100),
  "registradoPor" TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_solicitud ON pagos("solicitudId");
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos(fecha);`;

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

function porcentajeBadge(p: number): string {
  if (p === 70) return "bg-green-100 text-green-700 border border-green-200";
  if (p === 100) return "bg-blue-100 text-blue-700 border border-blue-200";
  return "bg-yellow-100 text-yellow-700 border border-yellow-200";
}

function formatMonto(m: number): string {
  return `$${Number(m).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pagoPdvLabel(p: Pago): string {
  const pdv = p.solicitudes_de_render?.puntos_de_venta;
  if (!pdv) return "—";
  return `PDV-${String(pdv.numeroPdv).padStart(3, "0")} — ${pdv.cadena} ${pdv.mallZona}`;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // filtros
  const [filtroSolicitud, setFiltroSolicitud] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  // modal crear
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    solicitudId: "",
    monto: "",
    porcentaje: 70 as 30 | 50 | 70 | 100,
    registradoPor: "Yarrisa" as (typeof REGISTRADORES)[number],
    fecha: todayISO(),
  });

  // modal detalle
  const [detail, setDetail] = useState<Pago | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    solicitudId: "",
    monto: "",
    porcentaje: 70 as 30 | 50 | 70 | 100,
    registradoPor: "Yarrisa" as (typeof REGISTRADORES)[number],
    fecha: todayISO(),
  });
  const [updating, setUpdating] = useState(false);

  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos");
      const json = await res.json();
      if (json.needsSetup) {
        setNeedsSetup(true);
        setPagos([]);
      } else if (json.error) {
        setError(json.error);
        setPagos([]);
      } else {
        setPagos(json.data || []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch("/api/solicitudes");
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        setSolicitudes(json.data);
      }
    } catch {
      // Silently fail — filter will just be empty
    }
  };

  useEffect(() => {
    fetchPagos();
    fetchSolicitudes();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtros aplicados en cliente
  const filtered = useMemo(() => {
    return pagos.filter(p => {
      if (filtroSolicitud && p.solicitudId !== filtroSolicitud) return false;
      if (filtroDesde && p.fecha < filtroDesde) return false;
      if (filtroHasta && p.fecha > filtroHasta) return false;
      return true;
    });
  }, [pagos, filtroSolicitud, filtroDesde, filtroHasta]);

  // KPIs
  const totalPagos = filtered.length;
  const montoTotal = filtered.reduce((acc, p) => acc + Number(p.monto), 0);
  const abonos70 = filtered.filter(p => p.porcentaje === 70).length;

  const handleCreate = async () => {
    if (!form.solicitudId || !form.monto) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: form.solicitudId,
          monto: Number(form.monto),
          porcentaje: form.porcentaje,
          registradoPor: form.registradoPor,
          fecha: form.fecha,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Error al registrar el pago");
        return;
      }
      setShowCreate(false);
      setForm({ solicitudId: "", monto: "", porcentaje: 70, registradoPor: "Yarrisa", fecha: todayISO() });
      fetchPagos();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (p: Pago) => {
    setDetail(p);
    setEditing(false);
    setEditForm({
      solicitudId: p.solicitudId,
      monto: String(p.monto),
      porcentaje: p.porcentaje as 30 | 50 | 70 | 100,
      registradoPor: (REGISTRADORES.includes(p.registradoPor as (typeof REGISTRADORES)[number])
        ? p.registradoPor
        : "Yarrisa") as (typeof REGISTRADORES)[number],
      fecha: p.fecha,
    });
  };

  const handleUpdate = async () => {
    if (!detail) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/pagos/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: editForm.solicitudId,
          monto: Number(editForm.monto),
          porcentaje: editForm.porcentaje,
          registradoPor: editForm.registradoPor,
          fecha: editForm.fecha,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Error al actualizar el pago");
        return;
      }
      setEditing(false);
      fetchPagos();
      // Update the detail view with the saved data
      if (json.data) {
        setDetail(json.data as Pago);
      }
    } catch (e) {
      alert(String(e));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este pago? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/pagos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Error al eliminar");
        return;
      }
      setDetail(null);
      fetchPagos();
    } catch (e) {
      alert(String(e));
    }
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
            La tabla <code className="bg-amber-100 px-1 rounded font-mono">pagos</code> no existe aún en la base de datos.
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
              onClick={fetchPagos}
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
          <h1 className="text-2xl font-bold text-gray-900">Pagos / Abonos</h1>
          <p className="text-gray-500 mt-1">Registro de abonos (típicamente 70%) por solicitud de render</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Registrar Pago
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalPagos}</p>
            <p className="text-xs text-gray-500">Total Pagos</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{formatMonto(montoTotal)}</p>
            <p className="text-xs text-gray-500">Monto Total Acumulado</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{abonos70}</p>
            <p className="text-xs text-gray-500"># Abonos del 70%</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className={LABEL}>Solicitud</label>
          <select
            value={filtroSolicitud}
            onChange={e => setFiltroSolicitud(e.target.value)}
            className={INPUT}
          >
            <option value="">Todas las solicitudes</option>
            {solicitudes.map(s => {
              const pdv = s.puntos_de_venta;
              const label = pdv
                ? `PDV-${String(pdv.numeroPdv).padStart(3, "0")} — ${pdv.cadena} ${pdv.mallZona}`
                : s.id.slice(0, 8);
              return (
                <option key={s.id} value={s.id}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className={LABEL}>Desde</label>
          <input
            type="date"
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL}>Hasta</label>
          <input
            type="date"
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            className={INPUT}
          />
        </div>
        {(filtroSolicitud || filtroDesde || filtroHasta) && (
          <button
            onClick={() => { setFiltroSolicitud(""); setFiltroDesde(""); setFiltroHasta(""); }}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Solicitud</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Monto</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Porcentaje</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Registrado Por</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando pagos...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                    <AlertCircle size={20} className="inline-block mr-2" />
                    {error}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <CreditCard size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No hay pagos registrados.</p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                    >
                      Registrar el primer pago
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-gray-700">{pagoPdvLabel(p)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatMonto(Number(p.monto))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${porcentajeBadge(p.porcentaje)}`}>
                        {p.porcentaje}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.registradoPor}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(p.fecha + "T00:00:00").toLocaleDateString("es-PA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Pago */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Registrar Pago</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Solicitud *</label>
                <select
                  value={form.solicitudId}
                  onChange={e => setForm(f => ({ ...f, solicitudId: e.target.value }))}
                  className={INPUT}
                >
                  <option value="">— Seleccionar solicitud —</option>
                  {solicitudes.map(s => {
                    const pdv = s.puntos_de_venta;
                    const label = pdv
                      ? `PDV-${String(pdv.numeroPdv).padStart(3, "0")} — ${pdv.cadena} ${pdv.mallZona} (${s.estado})`
                      : s.id.slice(0, 8);
                    return (
                      <option key={s.id} value={s.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
                {solicitudes.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No hay solicitudes disponibles. Crea una primero.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Monto (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    placeholder="0.00"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Porcentaje</label>
                  <select
                    value={form.porcentaje}
                    onChange={e => setForm(f => ({ ...f, porcentaje: Number(e.target.value) as 30 | 50 | 70 | 100 }))}
                    className={INPUT}
                  >
                    {PORCENTAJES.map(p => (
                      <option key={p} value={p}>{p}%</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Registrado Por</label>
                  <select
                    value={form.registradoPor}
                    onChange={e => setForm(f => ({ ...f, registradoPor: e.target.value as (typeof REGISTRADORES)[number] }))}
                    className={INPUT}
                  >
                    {REGISTRADORES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Fecha</label>
                  <input
                    type="date"
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={saving || !form.solicitudId || !form.monto}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Registrando..." : "Registrar Pago"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Editar Pago" : "Detalle del Pago"}
              </h2>
              <button
                onClick={() => { setDetail(null); setEditing(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {!editing ? (
              <div className="px-6 py-5 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Solicitud</p>
                    <p className="font-medium text-gray-800">{pagoPdvLabel(detail)}</p>
                    {detail.solicitudes_de_render && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tipo: {detail.solicitudes_de_render.tipo} · Estado: {detail.solicitudes_de_render.estado}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Monto</p>
                      <p className="font-bold text-lg text-gray-800">{formatMonto(Number(detail.monto))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Porcentaje</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${porcentajeBadge(detail.porcentaje)}`}>
                        {detail.porcentaje}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Registrado Por</p>
                      <p className="font-medium text-gray-800">{detail.registradoPor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fecha</p>
                      <p className="font-medium text-gray-800">
                        {new Date(detail.fecha + "T00:00:00").toLocaleDateString("es-PA")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registrado el</p>
                    <p className="text-xs text-gray-400">
                      {new Date(detail.createdAt).toLocaleString("es-PA")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleDelete(detail.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Edit2 size={14} />
                    Editar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className={LABEL}>Solicitud *</label>
                  <select
                    value={editForm.solicitudId}
                    onChange={e => setEditForm(f => ({ ...f, solicitudId: e.target.value }))}
                    className={INPUT}
                  >
                    <option value="">— Seleccionar solicitud —</option>
                    {solicitudes.map(s => {
                      const pdv = s.puntos_de_venta;
                      const label = pdv
                        ? `PDV-${String(pdv.numeroPdv).padStart(3, "0")} — ${pdv.cadena} ${pdv.mallZona} (${s.estado})`
                        : s.id.slice(0, 8);
                      return (
                        <option key={s.id} value={s.id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Monto (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.monto}
                      onChange={e => setEditForm(f => ({ ...f, monto: e.target.value }))}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Porcentaje</label>
                    <select
                      value={editForm.porcentaje}
                      onChange={e => setEditForm(f => ({ ...f, porcentaje: Number(e.target.value) as 30 | 50 | 70 | 100 }))}
                      className={INPUT}
                    >
                      {PORCENTAJES.map(p => (
                        <option key={p} value={p}>{p}%</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Registrado Por</label>
                    <select
                      value={editForm.registradoPor}
                      onChange={e => setEditForm(f => ({ ...f, registradoPor: e.target.value as (typeof REGISTRADORES)[number] }))}
                      className={INPUT}
                    >
                      {REGISTRADORES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Fecha</label>
                    <input
                      type="date"
                      value={editForm.fecha}
                      onChange={e => setEditForm(f => ({ ...f, fecha: e.target.value }))}
                      className={INPUT}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={updating || !editForm.solicitudId || !editForm.monto}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                  >
                    <Save size={14} />
                    {updating ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
