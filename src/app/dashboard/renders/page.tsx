"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Eye,
  Copy,
  Filter,
} from "lucide-react";

type Render = {
  id: string;
  solicitudId: string;
  archivoUrl: string;
  version: number;
  aprobadoMercadeo: boolean;
  aprobadoCliente: boolean;
  notas: string | null;
  subidoPor: string | null;
  createdAt: string;
};

type Solicitud = {
  id: string;
  tipo: string;
  estado: string;
  marca: string;
  puntos_de_venta: { numeroPdv: number; cadena: string; mallZona: string } | null;
};

const APROBACION_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "approved", label: "Aprobados (ambos)" },
  { value: "pending_mercadeo", label: "Pendiente Mercadeo" },
  { value: "pending_cliente", label: "Pendiente Cliente" },
  { value: "pending", label: "Sin aprobaciones" },
] as const;

const SETUP_SQL = `-- Ejecuta este SQL en Supabase Studio → SQL Editor
CREATE TABLE IF NOT EXISTS renders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "solicitudId" UUID,
  "archivoUrl" TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  "aprobadoMercadeo" BOOLEAN DEFAULT FALSE,
  "aprobadoCliente" BOOLEAN DEFAULT FALSE,
  notas TEXT,
  "subidoPor" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);`;

const INPUT =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}
function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

function fileNameFromUrl(url: string) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").pop() ?? "";
    return last || url;
  } catch {
    return url;
  }
}

function pdvLabel(s: Solicitud) {
  if (!s.puntos_de_venta) return "—";
  const n = String(s.puntos_de_venta.numeroPdv).padStart(3, "0");
  return `PDV-${n} — ${s.puntos_de_venta.cadena} ${s.puntos_de_venta.mallZona}`;
}

export default function RendersPage() {
  const [renders, setRenders] = useState<Render[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [copied, setCopied] = useState(false);

  const [filtroSolicitudId, setFiltroSolicitudId] = useState("");
  const [filtroAprobacion, setFiltroAprobacion] =
    useState<(typeof APROBACION_FILTERS)[number]["value"]>("all");

  // Modal subir
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({
    solicitudId: "",
    notas: "",
    subidoPor: "Yovanni",
  });
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal detalle
  const [detail, setDetail] = useState<Render | null>(null);
  const [savingDetail, setSavingDetail] = useState(false);
  const [detailNotas, setDetailNotas] = useState("");

  const fetchRenders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroSolicitudId) params.set("solicitudId", filtroSolicitudId);
    try {
      const res = await fetch(`/api/renders?${params}`);
      const json = await res.json();
      if (json.needsSetup) {
        setNeedsSetup(true);
        setRenders([]);
      } else {
        setNeedsSetup(false);
        setRenders(json.data ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filtroSolicitudId]);

  const fetchSolicitudes = useCallback(async () => {
    try {
      const res = await fetch("/api/solicitudes");
      const json = await res.json();
      setSolicitudes(json.data ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchRenders();
  }, [fetchRenders]);
  useEffect(() => {
    fetchSolicitudes();
  }, [fetchSolicitudes]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileObj(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview("");
    }
  };

  const resetUploadModal = () => {
    setShowUpload(false);
    setFileObj(null);
    setFilePreview("");
    setUploadProgress(0);
    setUploadError("");
    setForm({ solicitudId: "", notas: "", subidoPor: "Yovanni" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!form.solicitudId) {
      setUploadError("Selecciona una solicitud");
      return;
    }
    if (!fileObj) {
      setUploadError("Selecciona un archivo");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadProgress(10);
    try {
      // Paso 1: subir el archivo a /api/upload
      const fd = new FormData();
      fd.append("file", fileObj);
      fd.append("bucket", "photos");
      fd.append("folder", "renders");

      setUploadProgress(35);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      setUploadProgress(65);
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || "Error subiendo archivo");
      }

      // Paso 2: crear el registro del render con la URL
      setUploadProgress(85);
      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: form.solicitudId,
          archivoUrl: uploadJson.url,
          notas: form.notas || null,
          subidoPor: form.subidoPor,
        }),
      });
      setUploadProgress(100);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error creando render");
      }

      resetUploadModal();
      fetchRenders();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleToggleAprobacion = async (
    r: Render,
    field: "aprobadoMercadeo" | "aprobadoCliente",
    value: boolean
  ) => {
    try {
      const res = await fetch(`/api/renders/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error actualizando");
        return;
      }
      const json = await res.json();
      if (detail?.id === r.id) {
        setDetail(json.data);
      }
      fetchRenders();
    } catch (e) {
      alert(String(e));
    }
  };

  const handleSaveNotas = async () => {
    if (!detail) return;
    setSavingDetail(true);
    try {
      const res = await fetch(`/api/renders/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: detailNotas }),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error guardando notas");
        return;
      }
      const json = await res.json();
      setDetail(json.data);
      fetchRenders();
    } catch (e) {
      alert(String(e));
    } finally {
      setSavingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este render? Esta acción no se puede deshacer.")) {
      return;
    }
    try {
      const res = await fetch(`/api/renders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error eliminando");
        return;
      }
      setDetail(null);
      fetchRenders();
    } catch (e) {
      alert(String(e));
    }
  };

  const openDetail = (r: Render) => {
    setDetail(r);
    setDetailNotas(r.notas ?? "");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const solicitudMap = new Map(solicitudes.map(s => [s.id, s]));

  const filteredRenders = renders.filter(r => {
    if (filtroAprobacion === "all") return true;
    if (filtroAprobacion === "approved")
      return r.aprobadoMercadeo && r.aprobadoCliente;
    if (filtroAprobacion === "pending_mercadeo")
      return !r.aprobadoMercadeo;
    if (filtroAprobacion === "pending_cliente")
      return !r.aprobadoCliente;
    if (filtroAprobacion === "pending")
      return !r.aprobadoMercadeo && !r.aprobadoCliente;
    return true;
  });

  const total = renders.length;
  const totalMercadeo = renders.filter(r => r.aprobadoMercadeo).length;
  const totalCliente = renders.filter(r => r.aprobadoCliente).length;
  const totalPendiente = renders.filter(
    r => !r.aprobadoMercadeo || !r.aprobadoCliente
  ).length;

  if (needsSetup) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-amber-600" />
            <h2 className="text-lg font-bold text-amber-900">
              Configuración inicial requerida
            </h2>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            La tabla <code className="bg-amber-100 px-1 rounded font-mono">renders</code>{" "}
            no existe aún en la base de datos. Copia el siguiente SQL y ejecútalo
            en <strong>Supabase Studio → SQL Editor</strong>:
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
              onClick={fetchRenders}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Renders</h1>
          <p className="text-gray-500 mt-1">
            Propuestas visuales de diseño subidas por el equipo
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Subir Render
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Renders</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalMercadeo}</p>
          <p className="text-xs text-blue-500 mt-1">Aprobados por Mercadeo</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-indigo-700">{totalCliente}</p>
          <p className="text-xs text-indigo-500 mt-1">Aprobados por Cliente</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{totalPendiente}</p>
          <p className="text-xs text-amber-500 mt-1">Pendientes de Aprobación</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-500">
          <Filter size={14} />
          <span className="text-xs font-medium">Filtros</span>
        </div>
        <select
          value={filtroSolicitudId}
          onChange={e => setFiltroSolicitudId(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
        >
          <option value="">Todas las solicitudes</option>
          {solicitudes.map(s => (
            <option key={s.id} value={s.id}>
              {pdvLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={filtroAprobacion}
          onChange={e => setFiltroAprobacion(e.target.value as never)}
          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700"
        >
          {APROBACION_FILTERS.map(f => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        {(filtroSolicitudId || filtroAprobacion !== "all") && (
          <button
            onClick={() => {
              setFiltroSolicitudId("");
              setFiltroAprobacion("all");
            }}
            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5"
          >
            Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {loading ? "Cargando..." : `${filteredRenders.length} resultado${filteredRenders.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Solicitud</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Versión</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Archivo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Aprobado Mercadeo</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Aprobado Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Subido Por</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <Loader2 size={18} className="inline animate-spin mr-2" />
                    Cargando renders...
                  </td>
                </tr>
              ) : filteredRenders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ImageIcon size={32} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-gray-400 text-sm">No hay renders.</p>
                    <button
                      onClick={() => setShowUpload(true)}
                      className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                    >
                      Subir el primer render
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRenders.map(r => {
                  const sol = solicitudMap.get(r.solicitudId);
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-700">
                        {sol ? pdvLabel(sol) : (
                          <span className="text-gray-400 text-xs font-mono">
                            {r.solicitudId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-mono font-medium">
                          v{r.version}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={r.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-xs"
                        >
                          {isImageUrl(r.archivoUrl) ? (
                            <ImageIcon size={13} />
                          ) : (
                            <FileText size={13} />
                          )}
                          {fileNameFromUrl(r.archivoUrl).slice(0, 30)}
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleAprobacion(r, "aprobadoMercadeo", !r.aprobadoMercadeo)
                          }
                          className="inline-flex items-center justify-center"
                          title={r.aprobadoMercadeo ? "Quitar aprobación" : "Marcar aprobado"}
                        >
                          {r.aprobadoMercadeo ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <XCircle size={20} className="text-red-400 hover:text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleAprobacion(r, "aprobadoCliente", !r.aprobadoCliente)
                          }
                          className="inline-flex items-center justify-center"
                          title={r.aprobadoCliente ? "Quitar aprobación" : "Marcar aprobado"}
                        >
                          {r.aprobadoCliente ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <XCircle size={20} className="text-red-400 hover:text-red-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {r.subidoPor ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString("es-PA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openDetail(r)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          <Eye size={13} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Subir Render */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Subir Render</h2>
              <button
                onClick={resetUploadModal}
                disabled={uploading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Solicitud *</label>
                <select
                  value={form.solicitudId}
                  onChange={e => setForm(f => ({ ...f, solicitudId: e.target.value }))}
                  disabled={uploading}
                  className={INPUT}
                >
                  <option value="">Selecciona una solicitud…</option>
                  {solicitudes.map(s => (
                    <option key={s.id} value={s.id}>
                      {pdvLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={LABEL}>Archivo * (imagen o PDF)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {fileObj && (
                  <p className="mt-1 text-xs text-gray-500">
                    {fileObj.name} ({(fileObj.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {filePreview && (
                  <div className="mt-3 border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <p className="text-xs text-gray-500 mb-2">Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={LABEL}>Notas</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  disabled={uploading}
                  rows={3}
                  placeholder="Detalles de la propuesta…"
                  className={`${INPUT} resize-none`}
                />
              </div>

              <div>
                <label className={LABEL}>Subido por</label>
                <input
                  type="text"
                  value={form.subidoPor}
                  onChange={e => setForm(f => ({ ...f, subidoPor: e.target.value }))}
                  disabled={uploading}
                  className={INPUT}
                />
              </div>

              {uploading && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Subiendo…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={resetUploadModal}
                disabled={uploading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !form.solicitudId || !fileObj}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Subiendo…
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                Detalle del Render
              </h2>
              <button
                onClick={() => setDetail(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Preview grande */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {isImageUrl(detail.archivoUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.archivoUrl}
                    alt="Render"
                    className="w-full max-h-[400px] object-contain"
                  />
                ) : isPdfUrl(detail.archivoUrl) ? (
                  <div className="p-8 text-center">
                    <FileText size={48} className="mx-auto text-red-500 mb-3" />
                    <a
                      href={detail.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                    >
                      Abrir PDF
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText size={48} className="mx-auto text-gray-400 mb-3" />
                    <a
                      href={detail.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium"
                    >
                      Abrir archivo
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Solicitud</p>
                  <p className="font-medium text-gray-800">
                    {solicitudMap.get(detail.solicitudId)
                      ? pdvLabel(solicitudMap.get(detail.solicitudId)!)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Versión</p>
                  <p className="font-medium text-gray-800">v{detail.version}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Subido por</p>
                  <p className="font-medium text-gray-800">{detail.subidoPor ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-800">
                    {new Date(detail.createdAt).toLocaleString("es-PA")}
                  </p>
                </div>
              </div>

              {/* Aprobaciones */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Aprobaciones</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      handleToggleAprobacion(
                        detail,
                        "aprobadoMercadeo",
                        !detail.aprobadoMercadeo
                      )
                    }
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      detail.aprobadoMercadeo
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {detail.aprobadoMercadeo ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    Mercadeo {detail.aprobadoMercadeo ? "Aprobado" : "Pendiente"}
                  </button>
                  <button
                    onClick={() =>
                      handleToggleAprobacion(
                        detail,
                        "aprobadoCliente",
                        !detail.aprobadoCliente
                      )
                    }
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      detail.aprobadoCliente
                        ? "bg-green-50 border-green-500 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {detail.aprobadoCliente ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    Cliente {detail.aprobadoCliente ? "Aprobado" : "Pendiente"}
                  </button>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className={LABEL}>Notas</label>
                <textarea
                  value={detailNotas}
                  onChange={e => setDetailNotas(e.target.value)}
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="Notas sobre esta versión…"
                />
                {detailNotas !== (detail.notas ?? "") && (
                  <button
                    onClick={handleSaveNotas}
                    disabled={savingDetail}
                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1.5 rounded-lg font-medium"
                  >
                    {savingDetail ? "Guardando..." : "Guardar notas"}
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => handleDelete(detail.id)}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Eliminar
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
