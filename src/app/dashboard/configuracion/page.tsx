"use client";

import { useEffect, useState } from "react";
import { Users, Database, CheckCircle, AlertCircle } from "lucide-react";
import { ROL_LABELS } from "@/types";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
};

type DbStatus = {
  tabla: string;
  count: number | null;
  ok: boolean;
  error?: string;
};

export default function ConfiguracionPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    // Cargar usuarios
    fetch("/api/usuarios")
      .then(r => r.json())
      .then(d => setUsuarios(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingUsers(false));

    // Verificar tablas
    Promise.all([
      fetch("/api/pdv?page=1").then(r => r.json()).then(d => ({ tabla: "puntos_de_venta", count: d.total, ok: !d.error })).catch(() => ({ tabla: "puntos_de_venta", count: null, ok: false })),
      fetch("/api/inventario?page=1").then(r => r.json()).then(d => ({ tabla: "mobiliario", count: d.total, ok: !d.error })).catch(() => ({ tabla: "mobiliario", count: null, ok: false })),
      fetch("/api/solicitudes").then(r => r.json()).then(d => ({ tabla: "solicitudes_de_render", count: d.total, ok: !d.error })).catch(() => ({ tabla: "solicitudes_de_render", count: null, ok: false })),
      fetch("/api/visitas").then(r => r.json()).then(d => ({ tabla: "visitas", count: (d.data ?? []).length, ok: !d.error })).catch(() => ({ tabla: "visitas", count: null, ok: false })),
    ]).then(results => {
      setDbStatus(results);
      setLoadingDb(false);
    });
  }, []);

  const ROL_BADGE: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    ventas: "bg-blue-100 text-blue-700",
    aprobador: "bg-purple-100 text-purple-700",
    coordinadora: "bg-pink-100 text-pink-700",
    disenador: "bg-indigo-100 text-indigo-700",
    mercadeo: "bg-orange-100 text-orange-700",
    impulsador: "bg-green-100 text-green-700",
    contabilidad: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Estado del sistema y usuarios</p>
      </div>

      {/* Estado de la base de datos */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Estado de la Base de Datos</h2>
        </div>
        {loadingDb ? (
          <p className="text-gray-400 text-sm">Verificando tablas...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dbStatus.map((s) => (
              <div
                key={s.tabla}
                className={`rounded-lg p-4 border ${s.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {s.ok ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <AlertCircle size={14} className="text-red-600" />
                  )}
                  <p className={`text-xs font-semibold ${s.ok ? "text-green-700" : "text-red-700"}`}>
                    {s.ok ? "OK" : "Error"}
                  </p>
                </div>
                <p className="text-sm font-mono text-gray-700 break-all">{s.tabla}</p>
                {s.count !== null && (
                  <p className="text-xs text-gray-500 mt-1">{s.count} registros</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usuarios del sistema */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Users size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Usuarios del Sistema</h2>
          {!loadingUsers && (
            <span className="ml-auto text-xs text-gray-400">{usuarios.length} usuarios</span>
          )}
        </div>
        {loadingUsers ? (
          <div className="p-5 text-gray-400 text-sm">Cargando usuarios...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-5 text-gray-400 text-sm">No hay usuarios registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_BADGE[u.rol] ?? "bg-gray-100 text-gray-700"}`}>
                      {ROL_LABELS[u.rol as keyof typeof ROL_LABELS] ?? u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString("es-PA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
