"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, X, ClipboardList, AlertCircle, Copy, Check, MapPin, Search } from "lucide-react";
import type { Tarea } from "@/types";

type PdvLite = {
  id: string;
  numeroPdv: number | null;
  cadena: string | null;
  mallZona: string | null;
  provincia: string | null;
};

const ESTADOS = ["Pendiente", "En Progreso", "Completada"] as const;
const PRIORIDADES = ["Alta", "Media", "Baja"] as const;

// Solo coordinadoras y administradores pueden crear / reasignar / eliminar tareas.
// Cuando entra o sale gente del equipo, basta con ajustar el rol en `usuarios` —
// este UI ya no depende de nombres propios.
const TAREA_ASSIGNEE_ROLES_CLIENT = ["disenador"] as const;
type SessionRolLike = string | undefined;
const canCreateTareaRolClient = (rol: SessionRolLike): boolean =>
  rol === "admin" || rol === "coordinadora";

// Filtra la lista de usuarios activos según el rol del actor:
//   admin        → todos los usuarios activos
//   coordinadora → solo diseñadores (TAREA_ASSIGNEE_ROLES)
//   otros        → ninguno
function computeAssignable(
  usuarios: { nombre: string; rol: string; activo: boolean }[],
  rol: SessionRolLike
): string[] {
  const activos = usuarios.filter(u => u.activo);
  if (rol === "admin") {
    return activos.map(u => u.nombre).sort();
  }
  if (rol === "coordinadora") {
    return activos
      .filter(u => (TAREA_ASSIGNEE_ROLES_CLIENT as readonly string[]).includes(u.rol))
      .map(u => u.nombre)
      .sort();
  }
  return [];
}

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
  const { data: session, status } = useSession();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailTarea, setDetailTarea] = useState<Tarea | null>(null);
  const [solicitudes, setSolicitudes] = useState<{ id: string; label: string }[]>([]);
  const [pdvs, setPdvs] = useState<PdvLite[]>([]);
  const [usuarios, setUsuarios] = useState<{ nombre: string; rol: string; activo: boolean }[]>([]);
  const [filtroCadena, setFiltroCadena] = useState("");
  const [filtroProvincia, setFiltroProvincia] = useState("");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const sessionName = session?.user?.name;
  const sessionRol = session?.user?.rol;
  const canCreate = canCreateTareaRolClient(sessionRol);
  const assignable = useMemo(
    () => computeAssignable(usuarios, sessionRol),
    [usuarios, sessionRol]
  );
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    asignadaA: "",
    creadaPor: "",
    prioridad: "Media" as "Alta" | "Media" | "Baja",
    fechaLimite: "",
    solicitudId: "",
    pdvId: "",
  });

  useEffect(() => {
    if (status === "authenticated" && sessionName) {
      setForm(f => ({ ...f, creadaPor: sessionName }));
    }
  }, [status, sessionName]);

  // Cuando carga la lista de usuarios, pre-seleccionar el primer asignable válido
  useEffect(() => {
    if (assignable.length > 0) {
      setForm(f => (f.asignadaA && assignable.includes(f.asignadaA) ? f : { ...f, asignadaA: assignable[0] }));
    }
  }, [assignable]);

  useEffect(() => {
    fetchTareas();
    fetch("/api/solicitudes?limit=100")
      .then(r => r.json())
      .then(j => {
        const list = (j.data || []).map((s: Record<string, unknown>) => ({
          id: s.id as string,
          label: `Sol. ${String(s.id as string).slice(0, 6)} — ${s.tipo} ${s.marca ?? ""}`.trim(),
        }));
        setSolicitudes(list);
      })
      .catch(() => {});
    fetch("/api/pdv?lite=true")
      .then(r => r.json())
      .then(j => {
        const list: PdvLite[] = (j.data || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          numeroPdv: (p.numeroPdv as number | null) ?? null,
          cadena: (p.cadena as string | null) ?? null,
          mallZona: (p.mallZona as string | null) ?? null,
          provincia: (p.provincia as string | null) ?? null,
        }));
        setPdvs(list);
      })
      .catch(() => {});
    fetch("/api/usuarios")
      .then(r => r.json())
      .then(j => {
        const list: { nombre: string; rol: string; activo: boolean }[] = (j.data || []).map(
          (u: Record<string, unknown>) => ({
            nombre: u.nombre as string,
            rol: (u.rol as string) ?? "",
            activo: (u.activo as boolean) ?? false,
          })
        );
        setUsuarios(list);
      })
      .catch(() => {});
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
    if (!form.pdvId) {
      alert("Debes seleccionar un punto de venta para la tarea.");
      return;
    }
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
      setForm({
        titulo: "",
        descripcion: "",
        asignadaA: assignable[0] ?? "",
        creadaPor: sessionName ?? "",
        prioridad: "Media",
        fechaLimite: "",
        solicitudId: "",
        pdvId: "",
      });
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

  const handleChangePdv = async (id: string, pdvId: string) => {
    await fetch(`/api/tareas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdvId: pdvId || null }),
    });
    setDetailTarea(prev => prev ? { ...prev, pdvId: pdvId || null } : null);
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

  // Opciones únicas derivadas de los PDVs cargados (declaradas ANTES de byEstado para evitar TDZ)
  const cadenasUnicas = useMemo(
    () => Array.from(new Set(pdvs.map(p => p.cadena).filter(Boolean))).sort() as string[],
    [pdvs]
  );
  const provinciasUnicas = useMemo(
    () => Array.from(new Set(pdvs.map(p => p.provincia).filter(Boolean))).sort() as string[],
    [pdvs]
  );
  const almacenesUnicos = useMemo(() => {
    const filtradosPorCadenaYProv = pdvs.filter(p => {
      if (filtroCadena && p.cadena !== filtroCadena) return false;
      if (filtroProvincia && p.provincia !== filtroProvincia) return false;
      return true;
    });
    return Array.from(new Set(filtradosPorCadenaYProv.map(p => p.mallZona).filter(Boolean))).sort() as string[];
  }, [pdvs, filtroCadena, filtroProvincia]);

  // Tareas filtradas (cruza tarea.pdvId con el PDV para aplicar cadena / provincia / almacén)
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      const pdv = t.pdvId ? pdvs.find(p => p.id === t.pdvId) : null;
      // Si la tarea no tiene PDV y hay algún filtro activo, la ocultamos
      if (!pdv && (filtroCadena || filtroProvincia || filtroAlmacen || busqueda)) return false;
      if (filtroCadena && pdv?.cadena !== filtroCadena) return false;
      if (filtroProvincia && pdv?.provincia !== filtroProvincia) return false;
      if (filtroAlmacen && pdv?.mallZona !== filtroAlmacen) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        const matchTitulo = t.titulo.toLowerCase().includes(q);
        const matchDesc = t.descripcion?.toLowerCase().includes(q);
        const matchPdv = pdv
          ? `PDV-${pdv.numeroPdv}`.toLowerCase().includes(q) ||
            pdv.cadena?.toLowerCase().includes(q) ||
            pdv.mallZona?.toLowerCase().includes(q)
          : false;
        if (!matchTitulo && !matchDesc && !matchPdv) return false;
      }
      return true;
    });
  }, [tareas, pdvs, filtroCadena, filtroProvincia, filtroAlmacen, busqueda]);

  const byEstado = (estado: string) => tareasFiltradas.filter(t => t.estado === estado);

  const totalPendiente = byEstado("Pendiente").length;
  const totalEnProgreso = byEstado("En Progreso").length;
  const totalCompletada = byEstado("Completada").length;

  const limpiarFiltros = () => {
    setFiltroCadena("");
    setFiltroProvincia("");
    setFiltroAlmacen("");
    setBusqueda("");
  };

  const filtrosActivos =
    !!filtroCadena || !!filtroProvincia || !!filtroAlmacen || !!busqueda;

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
        {canCreate ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Nueva Tarea
          </button>
        ) : (
          <span className="text-xs text-gray-500 italic">
            Solo coordinadoras o administradores pueden asignar tareas.
          </span>
        )}
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

      {/* Barra de filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
          <Search size={14} className="text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por título, descripción, PDV..."
            className="text-sm outline-none bg-transparent flex-1"
          />
        </div>
        <select
          value={filtroCadena}
          onChange={e => { setFiltroCadena(e.target.value); setFiltroAlmacen(""); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Todas las cadenas</option>
          {cadenasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filtroProvincia}
          onChange={e => { setFiltroProvincia(e.target.value); setFiltroAlmacen(""); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Todas las provincias</option>
          {provinciasUnicas.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filtroAlmacen}
          onChange={e => setFiltroAlmacen(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="">Todos los almacenes</option>
          {almacenesUnicos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {filtrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="text-xs text-gray-600 hover:text-red-600 px-2 py-1.5 border border-gray-200 rounded-lg"
          >
            Limpiar filtros
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          Mostrando {tareasFiltradas.length} de {tareas.length}
        </span>
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
                byEstado(estado).map(tarea => {
                  const pdvVinculado = tarea.pdvId
                    ? pdvs.find(p => p.id === tarea.pdvId)
                    : null;
                  return (
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
                      {pdvVinculado && (
                        <Link
                          href={`/dashboard/pdv/${tarea.pdvId}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5 max-w-full truncate"
                          title={`PDV-${pdvVinculado.numeroPdv} · ${pdvVinculado.cadena} (${pdvVinculado.mallZona})`}
                        >
                          <MapPin size={10} />
                          {`PDV-${pdvVinculado.numeroPdv} · ${pdvVinculado.cadena ?? ""}`}
                        </Link>
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
                  );
                })
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
                {assignable.length === 0 ? (
                  <p className="text-xs text-gray-500 italic px-1 py-2">
                    No hay usuarios disponibles para asignar.
                  </p>
                ) : (
                  <select
                    value={form.asignadaA}
                    onChange={e => setForm(f => ({ ...f, asignadaA: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {assignable.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Creada por</label>
                <input
                  type="text"
                  value={form.creadaPor}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                  title="El creador siempre es el usuario autenticado"
                />
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

            {solicitudes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solicitud vinculada (opcional)</label>
                <select
                  value={form.solicitudId}
                  onChange={e => setForm(f => ({ ...f, solicitudId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin solicitud</option>
                  {solicitudes.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            {pdvs.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punto de venta <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.pdvId}
                  onChange={e => setForm(f => ({ ...f, pdvId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un PDV…</option>
                  {pdvs.map(p => (
                    <option key={p.id} value={p.id}>{`PDV-${p.numeroPdv} · ${p.cadena ?? ""}${p.mallZona ? ` (${p.mallZona})` : ""}`}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.titulo || !form.pdvId}
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
                {detailTarea.solicitudId && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Solicitud vinculada</p>
                    <Link
                      href={`/dashboard/solicitudes/${detailTarea.solicitudId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      Ver solicitud →
                    </Link>
                  </div>
                )}
                {detailTarea.pdvId && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Punto de venta</p>
                    <Link
                      href={`/dashboard/pdv/${detailTarea.pdvId}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                    >
                      <MapPin size={12} />
                      Ver PDV →
                    </Link>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">
                    Reasignar PDV
                  </label>
                  <select
                    value={detailTarea.pdvId ?? ""}
                    onChange={e => handleChangePdv(detailTarea.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un PDV…</option>
                    {pdvs.map(p => (
                      <option key={p.id} value={p.id}>{`PDV-${p.numeroPdv} · ${p.cadena ?? ""}${p.mallZona ? ` (${p.mallZona})` : ""}`}</option>
                    ))}
                  </select>
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
