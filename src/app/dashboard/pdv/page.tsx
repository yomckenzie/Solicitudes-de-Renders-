"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, MapPin, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
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

const INPUT = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const LABEL = "block text-xs font-medium text-gray-600 mb-1";

export default function PdvPage() {
  const router = useRouter();
  const [pdvs, setPdvs] = useState<Pdv[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [q, setQ] = useState("");
  const [provincia, setProvincia] = useState("");
  const [estado, setEstado] = useState("");
  const [marca, setMarca] = useState("");
  const [sortEstado, setSortEstado] = useState(false);

  // Modal nuevo PDV
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState({
    numeroPdv: "",
    espacio: "2",
    provincia: "Panamá",
    cadena: "",
    mallZona: "",
    marca: "JohnnyCotton",
    impulsador: "",
    estado: "Normal",
  });

  // Modal editar PDV
  const [editingPdv, setEditingPdv] = useState<Pdv | null>(null);
  const [editForm, setEditForm] = useState<Partial<Pdv>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Modal detalle completo PDV
  const [detailPdv, setDetailPdv] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPdvs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (provincia) params.set("provincia", provincia);
    if (estado) params.set("estado", estado);
    if (marca) params.set("marca", marca);
    params.set("page", page.toString());
    const res = await fetch(`/api/pdv?${params}`);
    const json = await res.json();
    setPdvs(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [q, provincia, estado, marca, page]);

  useEffect(() => {
    const t = setTimeout(fetchPdvs, 300);
    return () => clearTimeout(t);
  }, [fetchPdvs]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/pdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numeroPdv: parseInt(form.numeroPdv),
          espacio: parseInt(form.espacio),
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Error al guardar");
      }
      setShowModal(false);
      setForm({ numeroPdv: "", espacio: "2", provincia: "Panamá", cadena: "", mallZona: "", marca: "JohnnyCotton", impulsador: "", estado: "Normal" });
      fetchPdvs();
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editingPdv) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/pdv/${editingPdv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const j = await res.json();
        alert(j.error || "Error al guardar");
        return;
      }
      setEditingPdv(null);
      setEditForm({});
      fetchPdvs();
    } catch (e) {
      alert(String(e));
    } finally {
      setEditSaving(false);
    }
  }

  function openEdit(pdv: Pdv) {
    setEditingPdv(pdv);
    setEditForm({ ...pdv });
  }

  async function openDetail(pdv: Pdv) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/pdv/${pdv.id}/detalle`);
      if (res.ok) {
        const data = await res.json();
        setDetailPdv(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Venta</h1>
          <p className="text-gray-500 mt-1">
            {loading ? "Cargando..." : `${total} espacios en tiendas de Panamá`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
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
          <select value={provincia} onChange={(e) => { setProvincia(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las provincias</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select value={marca} onChange={(e) => { setMarca(e.target.value); setPage(1); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            <option value="">Todas las marcas</option>
            {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button
            onClick={() => setSortEstado(!sortEstado)}
            className={`border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              sortEstado
                ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            ⚠️ Críticos Primero
          </button>
          {(q || provincia || estado || marca) && (
            <button onClick={() => { setQ(""); setProvincia(""); setEstado(""); setMarca(""); setPage(1); }} className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Limpiar
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Esp.</th>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Cargando...</td></tr>
              ) : pdvs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No se encontraron PDVs.</td></tr>
              ) : (sortEstado ? [...pdvs].sort((a, b) => {
                const orden = { "Critico": 0, "Desactualizado": 1, "Normal": 2, "Actualizado": 3 };
                return (orden[a.estado as keyof typeof orden] ?? 99) - (orden[b.estado as keyof typeof orden] ?? 99);
              }) : pdvs).map((pdv) => (
                <tr key={pdv.id} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/pdv/${pdv.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900">PDV-{String(pdv.numeroPdv).padStart(3, "0")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">{pdv.espacio}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pdv.provincia}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{pdv.cadena}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={pdv.mallZona}>{pdv.mallZona}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {MARCA_LABELS[pdv.marca as keyof typeof MARCA_LABELS] ?? pdv.marca}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pdv.impulsador ?? "—"}</td>
                  <td className="px-4 py-3"><BadgeEstadoEspacio estado={pdv.estado as never} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {total === 0 ? "0 resultados" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <span className="text-xs text-gray-600 px-2">Pág. {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detalle Completo PDV */}
      {detailPdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  PDV-{String(detailPdv.pdv.numeroPdv).padStart(3, "0")} — {detailPdv.pdv.cadena}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">{detailPdv.pdv.provincia} • {detailPdv.pdv.mallZona}</p>
              </div>
              <button onClick={() => setDetailPdv(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-96 overflow-y-auto">
              {/* Info básica - Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold">MARCA</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">{MARCA_LABELS[detailPdv.pdv.marca as keyof typeof MARCA_LABELS] ?? detailPdv.pdv.marca}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-purple-600 font-semibold">ESTADO</p>
                  <div className="mt-1"><BadgeEstadoEspacio estado={detailPdv.pdv.estado} /></div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs text-amber-600 font-semibold">ESPACIO</p>
                  <p className="font-bold text-gray-800 text-sm mt-1">{detailPdv.pdv.espacio === 1 ? "Básico" : detailPdv.pdv.espacio === 2 ? "Medio" : "Premium"}</p>
                </div>
              </div>

              {/* Mobiliarios */}
              {detailLoading ? (
                <p className="text-gray-400 text-sm">Cargando...</p>
              ) : (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">🛋️ Mobiliarios</h3>
                      <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{detailPdv.totalMobiliarios}</span>
                    </div>
                    {detailPdv.mobiliarios.length === 0 ? (
                      <p className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg text-center">Sin muebles registrados</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                        {detailPdv.mobiliarios.map((m: any) => (
                          <div key={m.id} className="border-l-4 border-l-blue-500 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-sm font-bold text-gray-900">{m.tipo.replace(/_/g, " ").split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{m.categoria === "casual" ? "👕 Casual" : "👗 Interior"} • Cant: <strong>{m.cantidad}</strong></p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                m.estado === "Actualizado" ? "bg-green-100 text-green-700" :
                                m.estado === "Critico" ? "bg-red-100 text-red-700" :
                                m.estado === "Desactualizado" ? "bg-yellow-100 text-yellow-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {m.estado}
                              </span>
                            </div>
                            {m.medidas && (
                              <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded mb-3 inline-block">
                                📏 {m.medidas}
                              </p>
                            )}
                            {m.imagenes && m.imagenes.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2 font-semibold">Fotos ({m.imagenes.length})</p>
                                <div className="flex gap-2 flex-wrap">
                                  {m.imagenes.slice(0, 4).map((img: string, i: number) => (
                                    <img key={i} src={img} alt={`mueble ${i}`} className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-105 transition-transform" />
                                  ))}
                                  {m.imagenes.length > 4 && (
                                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-dashed border-blue-300 flex items-center justify-center">
                                      <span className="text-xs font-bold text-blue-600">+{m.imagenes.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Última visita */}
                  {detailPdv.ultimaVisita && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-3">👁️ Última Visita</h3>
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold">📅 {new Date(detailPdv.ultimaVisita.fecha).toLocaleDateString("es-PA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                            {detailPdv.ultimaVisita.observacion && (
                              <p className="text-xs text-gray-700 mt-2 bg-white rounded px-2 py-1">{detailPdv.ultimaVisita.observacion}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            detailPdv.ultimaVisita.estadoEspacio === "Actualizado" ? "bg-green-100 text-green-700" :
                            detailPdv.ultimaVisita.estadoEspacio === "Critico" ? "bg-red-100 text-red-700" :
                            detailPdv.ultimaVisita.estadoEspacio === "Desactualizado" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {detailPdv.ultimaVisita.estadoEspacio}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Costos y pagos */}
                  {(detailPdv.cotizaciones.length > 0 || detailPdv.pagos.length > 0) && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-3">💰 Información de Costos</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {detailPdv.cotizaciones.length > 0 && (
                          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200">
                            <p className="text-xs text-yellow-600 font-semibold">Rango Presupuesto</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">
                              ${detailPdv.cotizaciones[0]?.cotizacion?.precioMin?.toLocaleString()} - ${detailPdv.cotizaciones[0]?.cotizacion?.precioMax?.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {detailPdv.pagos.length > 0 && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                            <p className="text-xs text-green-600 font-semibold">Total Pagado</p>
                            <p className="font-bold text-gray-900 text-sm mt-1">
                              ${detailPdv.pagos.reduce((sum: number, p: any) => sum + (p.pago?.monto || 0), 0).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Solicitudes recientes */}
                  {detailPdv.solicitudes.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Solicitudes Recientes</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {detailPdv.solicitudes.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                            <span className="font-medium">{s.tipo} • {s.estado}</span>
                            <span className="text-gray-500">{new Date(s.createdAt).toLocaleDateString("es-PA")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between gap-3">
              <button
                onClick={() => openEdit(detailPdv.pdv)}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Editar
              </button>
              <button
                onClick={() => setDetailPdv(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar PDV */}
      {editingPdv && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Editar PDV-{String(editingPdv.numeroPdv).padStart(3, "0")}</h2>
              <button onClick={() => setEditingPdv(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Espacio (1-3)</label>
                  <select value={editForm.espacio || 2} onChange={e => setEditForm(f => ({ ...f, espacio: parseInt(e.target.value) }))} className={INPUT}>
                    <option value="1">1 — Básico</option>
                    <option value="2">2 — Medio</option>
                    <option value="3">3 — Premium</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Provincia</label>
                  <select value={editForm.provincia || "Panamá"} onChange={e => setEditForm(f => ({ ...f, provincia: e.target.value }))} className={INPUT}>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Cadena / Tienda</label>
                  <input type="text" value={editForm.cadena || ""} onChange={e => setEditForm(f => ({ ...f, cadena: e.target.value }))} className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Zona / Mall</label>
                  <input type="text" value={editForm.mallZona || ""} onChange={e => setEditForm(f => ({ ...f, mallZona: e.target.value }))} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Marca</label>
                  <select value={editForm.marca || "JohnnyCotton"} onChange={e => setEditForm(f => ({ ...f, marca: e.target.value }))} className={INPUT}>
                    {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Estado</label>
                  <select value={editForm.estado || "Normal"} onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))} className={INPUT}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Impulsador</label>
                <input type="text" value={editForm.impulsador || ""} onChange={e => setEditForm(f => ({ ...f, impulsador: e.target.value }))} className={INPUT} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingPdv(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button onClick={handleEditSave} disabled={editSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo PDV */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Punto de Venta</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}># PDV</label>
                  <input required type="number" min="1" value={form.numeroPdv} onChange={e => setForm(f => ({ ...f, numeroPdv: e.target.value }))} className={INPUT} placeholder="180" />
                </div>
                <div>
                  <label className={LABEL}>Espacio (1-3)</label>
                  <select value={form.espacio} onChange={e => setForm(f => ({ ...f, espacio: e.target.value }))} className={INPUT}>
                    <option value="1">1 — Básico</option>
                    <option value="2">2 — Medio</option>
                    <option value="3">3 — Premium</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Provincia</label>
                  <select value={form.provincia} onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} className={INPUT}>
                    {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Marca</label>
                  <select value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} className={INPUT}>
                    {MARCAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={LABEL}>Cadena / Tienda</label>
                <input required type="text" value={form.cadena} onChange={e => setForm(f => ({ ...f, cadena: e.target.value }))} className={INPUT} placeholder="Stevens" />
              </div>
              <div>
                <label className={LABEL}>Zona / Mall</label>
                <input required type="text" value={form.mallZona} onChange={e => setForm(f => ({ ...f, mallZona: e.target.value }))} className={INPUT} placeholder="Albrook" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Impulsador</label>
                  <input type="text" value={form.impulsador} onChange={e => setForm(f => ({ ...f, impulsador: e.target.value }))} className={INPUT} placeholder="Lorena Pinto" />
                </div>
                <div>
                  <label className={LABEL}>Estado</label>
                  <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={INPUT}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              {saveError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{saveError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar PDV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
