"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Plus, Package, ChevronLeft, ChevronRight, X, Search, MapPin, Camera, AlertCircle, Copy, Check } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { MARCA_LABELS } from "@/types";
import MedidasEditor from "@/components/formularios/MedidasEditor";
import { type Medida, parseMedidas, serializeMedidas, medidasResumen } from "@/lib/medidas";

type MuebleRow = {
  id: string;
  pdvId: string | null;
  tipo: string;
  categoria: string;
  cantidad: number;
  medidas: string | null;
  estado: string;
  imagenes: string[] | null;
  propiedad: string | null;
  material: string | null;
  puntos_de_venta: {
    numeroPdv: number;
    cadena: string;
    mallZona: string;
    marca: string;
    provincia: string;
  } | null;
};

type PdvOption = {
  id: string;
  numeroPdv: number;
  cadena: string;
  mallZona: string;
  marca: string;
  provincia: string;
  estado: string;
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
const MARCAS = [
  { value: "JohnnyCotton", label: "Johnny Cotton" },
  { value: "ChessKing", label: "Chess King" },
  { value: "RAFFINE", label: "RAFFINE" },
  { value: "JCX", label: "JCX" },
  { value: "JCB", label: "JCB" },
];
const CADENAS = [
  "Stevens", "Conway", "Titan", "Campeon", "Machetazo", "Costo", "La Onda",
  "Madison", "Picadilly", "Sacks", "DDP", "Ecomoda", "OCA Loca", "Xtra",
  "Jumbo", "Maestro", "Punto Mayorista", "Punto Poderoso", "Shopping Center",
  "Amani", "Jordania", "El Fuerte",
];
const PROVINCIAS = ["Panamá", "Chorrera", "Arraijan", "Colón", "Chiriquí", "Veraguas", "Coclé", "Herrera"];

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

const MATERIALES = ["MDF", "Melamina", "Madera", "Metal", "PVC", "Acrílico", "Mixto"];

const COLUMNS_SQL = `ALTER TABLE mobiliario ADD COLUMN IF NOT EXISTS "propiedad" TEXT DEFAULT 'Propio';
ALTER TABLE mobiliario ADD COLUMN IF NOT EXISTS "material" TEXT;`;

const MARCA_COLORS: Record<string, string> = {
  JohnnyCotton: "bg-blue-100 text-blue-800",
  ChessKing: "bg-purple-100 text-purple-800",
  RAFFINE: "bg-pink-100 text-pink-800",
  JCX: "bg-amber-100 text-amber-800",
  JCB: "bg-green-100 text-green-800",
};

export default function InventarioPage() {
  const [muebles, setMuebles] = useState<MuebleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Filtros
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [filtroCadena, setFiltroCadena] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroProvincia, setFiltroProvincia] = useState("");

  // Modal agregar mueble
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    tipo: "corner",
    categoria: "casual",
    cantidad: "1",
    medidas: "",
    estado: "Normal",
  });

  // PDV picker
  const [allPdvs, setAllPdvs] = useState<PdvOption[]>([]);
  const [pdvSearch, setPdvSearch] = useState("");
  const [selectedPdv, setSelectedPdv] = useState<PdvOption | null>(null);
  const [pdvPickerOpen, setPdvPickerOpen] = useState(false);
  const pdvPickerRef = useRef<HTMLInputElement>(null);

  // Modal editar mueble
  const [editTarget, setEditTarget] = useState<MuebleRow | null>(null);
  const [editMedidas, setEditMedidas] = useState<Medida[]>([]);
  const [editCantidad, setEditCantidad] = useState("1");
  const [editEstado, setEditEstado] = useState("Normal");
  const [editPropiedad, setEditPropiedad] = useState("Propio");
  const [editMaterial, setEditMaterial] = useState("");
  const [editImagenes, setEditImagenes] = useState<string[]>([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [needsColumns, setNeedsColumns] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const fetchInventario = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tipo) params.set("tipo", tipo);
    if (categoria) params.set("categoria", categoria);
    if (estado) params.set("estado", estado);
    if (filtroCadena) params.set("cadena", filtroCadena);
    if (filtroMarca) params.set("marca", filtroMarca);
    if (filtroProvincia) params.set("provincia", filtroProvincia);
    params.set("page", page.toString());

    const res = await fetch(`/api/inventario?${params}`);
    const json = await res.json();
    setMuebles(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [q, tipo, categoria, estado, filtroCadena, filtroMarca, filtroProvincia, page]);

  useEffect(() => {
    const t = setTimeout(fetchInventario, 300);
    return () => clearTimeout(t);
  }, [fetchInventario]);

  async function openAddModal() {
    setShowModal(true);
    if (allPdvs.length === 0) {
      const res = await fetch("/api/pdv?pageSize=500");
      const json = await res.json();
      setAllPdvs(json.data ?? []);
    }
  }

  function closeAddModal() {
    setShowModal(false);
    setSelectedPdv(null);
    setPdvSearch("");
    setPdvPickerOpen(false);
    setForm({ tipo: "corner", categoria: "casual", cantidad: "1", medidas: "", estado: "Normal" });
    setSaveError("");
  }

  const filteredPdvs = allPdvs.filter(p => {
    if (!pdvSearch) return true;
    const q = pdvSearch.toLowerCase();
    return (
      p.cadena.toLowerCase().includes(q) ||
      p.mallZona.toLowerCase().includes(q) ||
      p.provincia.toLowerCase().includes(q) ||
      String(p.numeroPdv).includes(q) ||
      (MARCA_LABELS[p.marca as keyof typeof MARCA_LABELS] ?? p.marca).toLowerCase().includes(q)
    );
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPdv) {
      setSaveError("Debes seleccionar un Punto de Venta");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdvId: selectedPdv.id,
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
      closeAddModal();
      fetchInventario();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !editTarget) return;
    setUploadingFotos(true);
    const uploaded: string[] = [];
    const pdv = editTarget.puntos_de_venta;
    const cadena = pdv?.cadena ?? "General";
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "inventario");
        fd.append("cadena", cadena);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) continue;
        const j = await res.json();
        uploaded.push(j.url);
      }
      setEditImagenes(prev => [...prev, ...uploaded]);
    } finally {
      setUploadingFotos(false);
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
        body: JSON.stringify({
          medidas: serializeMedidas(editMedidas),
          estado: editEstado,
          cantidad: parseInt(editCantidad) || editTarget.cantidad,
          imagenes: editImagenes,
          propiedad: editPropiedad,
          material: editMaterial || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al guardar");
      if (json.needsColumns) setNeedsColumns(true);
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
    setEditMedidas(parseMedidas(m.medidas));
    setEditEstado(m.estado);
    setEditCantidad(String(m.cantidad));
    setEditPropiedad(m.propiedad ?? "Propio");
    setEditMaterial(m.material ?? "");
    setEditImagenes(m.imagenes ?? []);
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

  function clearFilters() {
    setQ(""); setTipo(""); setCategoria(""); setEstado("");
    setFiltroCadena(""); setFiltroMarca(""); setFiltroProvincia("");
    setPage(1);
  }

  const hasFilters = !!(q || tipo || categoria || estado || filtroCadena || filtroMarca || filtroProvincia);
  const sinMedidas = muebles.filter(m => !m.medidas).length;
  const totalPages = Math.ceil(total / pageSize);

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
          onClick={openAddModal}
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
          <p className="text-sm font-semibold text-yellow-800">
            {sinMedidas} mueble{sinMedidas !== 1 ? "s" : ""} sin medidas en esta página
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Fila 1: búsqueda de texto */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={e => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar por cadena, zona, mall..."
            className="bg-transparent text-sm flex-1 outline-none"
          />
          {q && <button onClick={() => { setQ(""); setPage(1); }} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>

        {/* Fila 2: dropdowns de PDV */}
        <div className="flex flex-wrap gap-3">
          <select value={filtroMarca} onChange={e => { setFiltroMarca(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las marcas</option>
            {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={filtroCadena} onChange={e => { setFiltroCadena(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las cadenas</option>
            {CADENAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtroProvincia} onChange={e => { setFiltroProvincia(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Fila 3: dropdowns de mueble */}
        <div className="flex flex-wrap gap-3">
          <select value={tipo} onChange={e => { setTipo(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todos los tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
          </select>
          <select value={categoria} onChange={e => { setCategoria(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las categorías</option>
            <option value="casual">Casual</option>
            <option value="interior">Interior</option>
          </select>
          <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Limpiar todo
            </button>
          )}
        </div>

        {/* Chips de filtros activos */}
        {(filtroMarca || filtroCadena || filtroProvincia) && (
          <div className="flex flex-wrap gap-2">
            {filtroMarca && (
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-3 py-1 text-xs font-medium">
                {MARCAS.find(m => m.value === filtroMarca)?.label ?? filtroMarca}
                <button onClick={() => { setFiltroMarca(""); setPage(1); }}><X size={12} /></button>
              </span>
            )}
            {filtroCadena && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
                {filtroCadena}
                <button onClick={() => { setFiltroCadena(""); setPage(1); }}><X size={12} /></button>
              </span>
            )}
            {filtroProvincia && (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
                {filtroProvincia}
                <button onClick={() => { setFiltroProvincia(""); setPage(1); }}><X size={12} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sucursal / PDV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Zona / Mall</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Provincia</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cat.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cant.</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Medidas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Cargando inventario...</td></tr>
              ) : muebles.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No se encontraron muebles con los filtros aplicados.</td></tr>
              ) : (
                muebles.map((m) => {
                  const pdv = m.puntos_de_venta;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs">
                        {pdv && m.pdvId ? (
                          <Link href={`/dashboard/pdv/${m.pdvId}`} className="text-blue-600 hover:text-blue-800 hover:underline font-medium">
                            PDV-{String(pdv.numeroPdv).padStart(3, "0")} — {pdv.cadena}
                          </Link>
                        ) : pdv ? (
                          <span className="font-medium text-gray-700">PDV-{String(pdv.numeroPdv).padStart(3, "0")} — {pdv.cadena}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[130px] truncate" title={pdv?.mallZona}>
                        {pdv?.mallZona ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{pdv?.provincia ?? "—"}</td>
                      <td className="px-4 py-3">
                        {pdv && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MARCA_COLORS[pdv.marca] ?? "bg-gray-100 text-gray-700"}`}>
                            {MARCA_LABELS[pdv.marca as keyof typeof MARCA_LABELS] ?? pdv.marca}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 text-xs">{TIPO_LABELS[m.tipo] ?? m.tipo}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.categoria === "casual" ? "bg-orange-50 text-orange-700" : "bg-pink-50 text-pink-700"}`}>
                          {m.categoria === "casual" ? "Casual" : "Interior"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium text-center">{m.cantidad}</td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {m.medidas ? (
                          <span className="text-xs text-gray-600 truncate block" title={medidasResumen(m.medidas)}>{medidasResumen(m.medidas)}</span>
                        ) : (
                          <span className="text-xs text-red-400 font-medium">Sin medidas</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><BadgeEstadoEspacio estado={m.estado as never} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap">
                            {m.medidas ? "Editar" : "+ Medidas"}
                          </button>
                          <button onClick={() => handleDelete(m)} disabled={deleting} className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {total === 0 ? "0 resultados" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} piezas`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-gray-600 px-2">Pág. {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Mueble */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Editar mueble</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TIPO_LABELS[editTarget.tipo] ?? editTarget.tipo} — {editTarget.categoria}
                  {editTarget.puntos_de_venta && ` · PDV-${String(editTarget.puntos_de_venta.numeroPdv).padStart(3,"0")} ${editTarget.puntos_de_venta.cadena}`}
                </p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleEditSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Banner SQL si faltan columnas */}
                {needsColumns && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-amber-800">
                        Faltan columnas en la base de datos. Ejecuta este SQL en Supabase Studio:
                      </p>
                    </div>
                    <pre className="bg-amber-100 rounded-lg p-3 text-xs font-mono text-amber-900 overflow-x-auto whitespace-pre-wrap">{COLUMNS_SQL}</pre>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(COLUMNS_SQL); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2000); }}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900"
                    >
                      {sqlCopied ? <Check size={13} /> : <Copy size={13} />}
                      {sqlCopied ? "¡Copiado!" : "Copiar SQL"}
                    </button>
                  </div>
                )}

                {/* Cantidad y Estado en fila */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Cantidad</label>
                    <input type="number" min="1" value={editCantidad} onChange={e => setEditCantidad(e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Estado</label>
                    <select value={editEstado} onChange={e => setEditEstado(e.target.value)} className={INPUT}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>

                {/* Propiedad y Material en fila */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Propiedad</label>
                    <select value={editPropiedad} onChange={e => setEditPropiedad(e.target.value)} className={INPUT}>
                      <option value="Propio">Propio</option>
                      <option value="Almacén">Almacén</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Material</label>
                    <select value={editMaterial} onChange={e => setEditMaterial(e.target.value)} className={INPUT}>
                      <option value="">Sin especificar</option>
                      {MATERIALES.map(mat => <option key={mat} value={mat}>{mat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Medidas por sección */}
                <div>
                  <label className={LABEL}>Medidas por sección</label>
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <MedidasEditor value={editMedidas} onChange={setEditMedidas} />
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <label className={LABEL}>Fotos del mueble</label>

                  {/* Previews de fotos existentes */}
                  {editImagenes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {editImagenes.map((url, i) => (
                        <div key={i} className="relative group">
                          <img src={url} alt={`Foto ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <button
                            type="button"
                            onClick={() => setEditImagenes(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón subir fotos */}
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <Camera size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {uploadingFotos ? "Subiendo fotos..." : "Agregar fotos"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingFotos}
                      className="hidden"
                      onChange={handleFotoUpload}
                    />
                  </label>
                  {uploadingFotos && (
                    <p className="text-xs text-blue-600 mt-1 animate-pulse">Subiendo imágenes...</p>
                  )}
                </div>

                {editError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={editSaving || uploadingFotos} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar cambios"}
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
              <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

              {/* Selector visual de PDV */}
              <div>
                <label className={LABEL}>Punto de Venta *</label>
                {selectedPdv ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        PDV-{String(selectedPdv.numeroPdv).padStart(3,"0")} — {selectedPdv.cadena}
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">{selectedPdv.mallZona} · {selectedPdv.provincia}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${MARCA_COLORS[selectedPdv.marca] ?? "bg-gray-100 text-gray-700"}`}>
                        {MARCA_LABELS[selectedPdv.marca as keyof typeof MARCA_LABELS] ?? selectedPdv.marca}
                      </span>
                    </div>
                    <button type="button" onClick={() => { setSelectedPdv(null); setPdvSearch(""); }} className="text-green-600 hover:text-green-800 mt-1"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input
                        ref={pdvPickerRef}
                        type="text"
                        value={pdvSearch}
                        onChange={e => { setPdvSearch(e.target.value); setPdvPickerOpen(true); }}
                        onFocus={() => setPdvPickerOpen(true)}
                        onBlur={() => setTimeout(() => setPdvPickerOpen(false), 150)}
                        placeholder="Buscar por cadena, mall, zona, marca..."
                        className="bg-transparent text-sm flex-1 outline-none"
                      />
                    </div>
                    {pdvPickerOpen && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                        {filteredPdvs.length === 0 ? (
                          <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
                        ) : (
                          filteredPdvs.slice(0, 30).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => { setSelectedPdv(p); setPdvSearch(""); setPdvPickerOpen(false); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    PDV-{String(p.numeroPdv).padStart(3,"0")} — {p.cadena}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    <MapPin size={10} className="inline mr-1" />
                                    {p.mallZona} · {p.provincia}
                                  </p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${MARCA_COLORS[p.marca] ?? "bg-gray-100 text-gray-700"}`}>
                                  {MARCA_LABELS[p.marca as keyof typeof MARCA_LABELS] ?? p.marca}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                <button type="button" onClick={closeAddModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
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
