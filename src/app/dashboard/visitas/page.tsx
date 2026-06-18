"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Camera, X } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { EstadoEspacio } from "@/types";

type Visita = {
  id: string;
  pdvId: string | null;
  fecha: string;
  observacion: string;
  estadoEspacio: EstadoEspacio;
  puntos_de_venta: {
    numeroPdv: number;
    cadena: string;
    mallZona: string;
    provincia: string;
  } | null;
  usuarios: {
    nombre: string;
  } | null;
};

const IMPULSADORES = ["Lorena Pinto", "Isis Ramirez", "Alcibiades Tenorio"];
const ESTADOS = ["Actualizado", "Normal", "Critico", "Desactualizado"] as const;

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailModal, setDetailModal] = useState<Visita | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pdvNumero: "",
    impulsadorNombre: "Lorena Pinto",
    fecha: new Date().toISOString().split("T")[0],
    estadoEspacio: "Normal" as EstadoEspacio,
    observacion: "",
    fotos: [] as string[],
  });
  const [uploadingFotos, setUploadingFotos] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string[]>([]);

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    try {
      const res = await fetch("/api/visitas");
      const json = await res.json();
      if (res.ok) setVisitas(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingFotos(true);
    const uploadedUrls: string[] = [];
    const previews: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "visitas");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          alert(`Error al subir ${file.name}`);
          continue;
        }

        const json = await res.json();
        uploadedUrls.push(json.url);
        previews.push(json.url);
      }

      setForm(f => ({ ...f, fotos: [...f.fotos, ...uploadedUrls] }));
      setFotoPreview(p => [...p, ...previews]);
    } catch (e) {
      alert("Error al subir fotos: " + String(e));
    } finally {
      setUploadingFotos(false);
    }
  };

  const handleSave = async () => {
    if (!form.pdvNumero || !form.impulsadorNombre) {
      alert("Completa # PDV e Impulsador");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/visitas", {
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
        pdvNumero: "",
        impulsadorNombre: "Lorena Pinto",
        fecha: new Date().toISOString().split("T")[0],
        estadoEspacio: "Normal",
        observacion: "",
        fotos: [],
      });
      setFotoPreview([]);
      fetchVisitas();
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  };

  const pdvCounts = IMPULSADORES.map((nombre) => ({
    nombre,
    total: visitas.filter((v) => v.usuarios?.nombre === nombre).length,
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Visitas</h1>
          <p className="text-gray-500 mt-1">Visitas de impulsadores a puntos de venta</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Registrar Visita
        </button>
      </div>

      {/* Resumen de impulsadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {pdvCounts.map(({ nombre, total }) => (
          <div key={nombre} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {nombre.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{nombre}</p>
              <p className="text-xs text-gray-400">{total} visitas registradas</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de visitas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando visitas...</div>
        ) : visitas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay visitas registradas.{" "}
            <button onClick={() => setShowModal(true)} className="text-blue-600 hover:underline">
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Punto de Venta</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Impulsador</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Observación</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visitas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-700 text-xs">{v.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {v.pdvId ? (
                        <Link
                          href={`/dashboard/pdv/${v.pdvId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          PDV-{v.puntos_de_venta?.numeroPdv} — {v.puntos_de_venta?.cadena}
                        </Link>
                      ) : (
                        `PDV-${v.puntos_de_venta?.numeroPdv} — ${v.puntos_de_venta?.cadena}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{v.usuarios?.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(v.fecha).toLocaleDateString("es-PA")}</td>
                    <td className="px-4 py-3">
                      <BadgeEstadoEspacio estado={v.estadoEspacio} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{v.observacion || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDetailModal(v)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Visita */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Registrar Visita</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1"># PDV</label>
              <input
                type="number"
                value={form.pdvNumero}
                onChange={(e) => setForm((f) => ({ ...f, pdvNumero: e.target.value }))}
                placeholder="Ej: 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impulsador</label>
              <select
                value={form.impulsadorNombre}
                onChange={(e) => setForm((f) => ({ ...f, impulsadorNombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {IMPULSADORES.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado del Espacio</label>
              <select
                value={form.estadoEspacio}
                onChange={(e) => setForm((f) => ({ ...f, estadoEspacio: e.target.value as EstadoEspacio }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
              <textarea
                value={form.observacion}
                onChange={(e) => setForm((f) => ({ ...f, observacion: e.target.value }))}
                placeholder="Notas sobre la visita..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fotos de la Visita</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFotoUpload}
                disabled={uploadingFotos}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadingFotos && <p className="text-xs text-gray-500 mt-1">Subiendo fotos...</p>}
              {fotoPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {fotoPreview.map((url, i) => (
                    <img key={i} src={url} alt={`foto ${i}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  ))}
                </div>
              )}
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
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Visita */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Detalle de Visita</h2>
              <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Punto de Venta</p>
                <p className="font-semibold">
                  PDV-{detailModal.puntos_de_venta?.numeroPdv} — {detailModal.puntos_de_venta?.cadena}
                </p>
                <p className="text-gray-600 text-xs">{detailModal.puntos_de_venta?.mallZona}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Impulsador</p>
                <p className="font-semibold">{detailModal.usuarios?.nombre}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Fecha</p>
                  <p className="font-semibold">{new Date(detailModal.fecha).toLocaleDateString("es-PA")}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Estado</p>
                  <BadgeEstadoEspacio estado={detailModal.estadoEspacio} />
                </div>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Observación</p>
                <p className="text-gray-700">{detailModal.observacion || "Sin observaciones"}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setDetailModal(null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
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
