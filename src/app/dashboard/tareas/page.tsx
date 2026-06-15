"use client";

import { useEffect, useState } from "react";
import { Plus, X, ClipboardList, AlertCircle, Copy, Check } from "lucide-react";

type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  asignadaA: string;
  creadaPor: string;
  estado: "Pendiente" | "En Progreso" | "Completada";
  prioridad: "Alta" | "Media" | "Baja";
  fechaLimite: string | null;
  solicitudId: string | null;
  createdAt: string;
};

const ESTADOS = ["Pendiente", "En Progreso", "Completada"] as const;
const PRIORIDADES = ["Alta", "Media", "Baja"] as const;
const ASIGNADOS = ["Yovanni", "Yarrisa", "Lorena Pinto", "Isis Ramirez", "Alcibiades Tenorio"];
const CREADORES = ["Yarrisa", "Admin", "ilad", "Mercadeo"];

const prioridadColor: Record<string, string> = {
  Alta: "bg-red-100 text-red-700 border border-red-200",
  Media: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Baja: "bg-green-100 text-green-700 border border-green-200",
};

const estadoColHeader: Record<string, string> = {
  Pendiente: "bg-gray-100 text-gray-700 border-gray-200",
  "En Progreso": "bg-blue-50 text-blue-700 border-blue-200",
  Completada: "bg-green-50 text-green-700 border-green-200",
};

const SETUP_SQL = `-- Ejecuta este SQL en Supabase Studio → SQL Editor
CREATE TABLE IF NOT EXISTS tareas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  "asignadaA" TEXT NOT NULL DEFAULT 'Yovanni',
  "creadaPor" TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente'
    CHECK (estado IN ('Pendiente', 'En Progreso', 'Completada')),
  prioridad TEXT NOT NULL DEFAULT 'Media'
    CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
  "fechaLimite" DATE,
  "solicitudId" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);`;

export default function TareasPage() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailTarea, setDetailTarea] = useState<Tarea | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    asignadaA: "Yovanni",
    creadaPor: "Yarrisa",
    prioridad: "Media" as "Alta" | "Media" | "Baja",
    fechaLimite: "",
  });

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tareas");
      const json = await res.json();
      if (json.needsSetup) {
        setNeedsSetup(true);
      } else {
        setTareas(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.titulo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al guardar");
        return;
      }
      setShowModal(false);
      setForm({ titulo: "", descripcion: "", asignadaA: "Yovanni", creadaPor: "Yarrisa", prioridad: "Media", fechaLimite: "" });
      fetchTareas();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEstado = async (id: string, estado: string) => {
    await fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setDetailTarea(prev => prev ? { ...prev, estado: estado as Tarea["estado"] } : null);
    fetchTareas();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await fetch(`/api/tareas/${id}`, { method: "DELETE" });
    setDetailTarea(null);
    fetchTareas();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const byEstado = (estado: string) => tareas.filter(t => t.estado === estado);

  const totalPendiente = byEstado("Pendiente").length;
  const totalEnProgreso = byEstado("En Progreso").length;
  const totalCompletada = byEstado("Completada").length;

  if (needsSetup) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">Configuración inicial requerida</h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            La tabla <code className="bg-amber-100 px-1 rounded font-mono">tareas</code> no existe aún en la base de datos.
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
              onClick={fetchTareas}
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
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-gray-500 mt-1">Gestión de tareas asignadas al equipo de diseño</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nueva Tarea
        </button>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{totalPendiente}</p>
          <p className="text-xs text-gray-500 mt-1">Pendientes</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalEnProgreso}</p>
          <p className="text-xs text-blue-500 mt-1">En Progreso</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{totalCompletada}</p>
          <p className="text-xs text-green-500 mt-1">Completadas</p>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Cargando tareas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ESTADOS.map(estado => (
            <div key={estado} className="space-y-3">
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${estadoColHeader[estado]}`}>
                <span className="text-sm font-semibold">{estado}</span>
                <span className="text-xs font-bold">{byEstado(estado).length}</span>
              </div>

              {byEstado(estado).length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-xs text-gray-400">
                  Sin tareas
                </div>
              ) : (
                byEstado(estado).map(tarea => (
                  <button
                    key={tarea.id}
                    onClick={() => setDetailTarea(tarea)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{tarea.titulo}</p>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${prioridadColor[tarea.prioridad]}`}>
                        {tarea.prioridad}
                      </span>
                    </div>
                    {tarea.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2">{tarea.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                      <span className="flex items-center gap-1">
                        <ClipboardList size={11} />
                        {tarea.asignadaA}
                      </span>
                      {tarea.fechaLimite && (
                        <span>{new Date(tarea.fechaLimite).toLocaleDateString("es-PA")}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Nueva Tarea */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Nueva Tarea</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Ej: Diseño corner PDV-23 Conway"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles de la tarea..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignada a</label>
                <select
                  value={form.asignadaA}
                  onChange={e => setForm(f => ({ ...f, asignadaA: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ASIGNADOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creada por</label>
                <select
                  value={form.creadaPor}
                  onChange={e => setForm(f => ({ ...f, creadaPor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CREADORES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={form.prioridad}
                  onChange={e => setForm(f => ({ ...f, prioridad: e.target.value as "Alta" | "Media" | "Baja" }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <input
                  type="date"
                  value={form.fechaLimite}
                  onChange={e => setForm(f => ({ ...f, fechaLimite: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.titulo}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle Tarea */}
      {detailTarea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Detalle de Tarea</h2>
              <button onClick={() => setDetailTarea(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800">{detailTarea.titulo}</p>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${prioridadColor[detailTarea.prioridad]}`}>
                  {detailTarea.prioridad}
                </span>
              </div>
              {detailTarea.descripcion && (
                <p className="text-sm text-gray-600">{detailTarea.descripcion}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Asignada a</p>
                  <p className="font-medium text-gray-800">{detailTarea.asignadaA}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Creada por</p>
                  <p className="font-medium text-gray-800">{detailTarea.creadaPor}</p>
                </div>
                {detailTarea.fechaLimite && (
                  <div>
                    <p className="text-xs text-gray-500">Fecha límite</p>
                    <p className="font-medium text-gray-800">
                      {new Date(detailTarea.fechaLimite).toLocaleDateString("es-PA")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Estado actual</p>
                  <p className="font-medium text-gray-800">{detailTarea.estado}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Cambiar estado:</p>
              <div className="flex gap-2">
                {ESTADOS.map(e => (
                  <button
                    key={e}
                    onClick={() => handleEstado(detailTarea.id, e)}
                    className={`flex-1 py-2 text-xs rounded-lg font-medium border transition-colors ${
                      detailTarea.estado === e
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-gray-600 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleDelete(detailTarea.id)}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDetailTarea(null)}
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
