import { Plus, Search } from "lucide-react";
import { BadgeEstadoSolicitud } from "@/components/ui/Badge";
import { EstadoSolicitud, TipoSolicitud, Marca, MARCA_LABELS, ESTADO_SOLICITUD_LABELS } from "@/types";

type Solicitud = {
  id: string;
  tipo: TipoSolicitud;
  estado: EstadoSolicitud;
  pdv: string;
  marca: Marca;
  creadoPor: string;
  fechaCreacion: string;
  responsableActual: string;
};

const solicitudesEjemplo: Solicitud[] = [
  {
    id: "SOL-001",
    tipo: "disenio",
    estado: "EN_DISENIO",
    pdv: "PDV-023 — Madison Albrook",
    marca: "JohnnyCotton",
    creadoPor: "Ventas",
    fechaCreacion: "2026-06-10",
    responsableActual: "Yovanni",
  },
  {
    id: "SOL-002",
    tipo: "disenio",
    estado: "APROBACION_MERCADEO",
    pdv: "PDV-005 — Stevens Metromall",
    marca: "ChessKing",
    creadoPor: "Ventas",
    fechaCreacion: "2026-06-08",
    responsableActual: "Mercadeo",
  },
  {
    id: "SOL-003",
    tipo: "cotizacion",
    estado: "APROBADA",
    pdv: "PDV-015 — Titan Albrook",
    marca: "JohnnyCotton",
    creadoPor: "Ventas",
    fechaCreacion: "2026-06-12",
    responsableActual: "Yarrisa",
  },
  {
    id: "SOL-004",
    tipo: "retiro",
    estado: "BORRADOR",
    pdv: "PDV-027 — Conway Los Pueblos",
    marca: "ChessKing",
    creadoPor: "Ventas",
    fechaCreacion: "2026-06-14",
    responsableActual: "Ventas",
  },
  {
    id: "SOL-005",
    tipo: "disenio",
    estado: "ABONO_PENDIENTE",
    pdv: "PDV-062 — City Mall David",
    marca: "JohnnyCotton",
    creadoPor: "Ventas",
    fechaCreacion: "2026-06-01",
    responsableActual: "Yarrisa",
  },
];

const TIPO_LABELS: Record<TipoSolicitud, string> = {
  cotizacion: "Cotización",
  disenio: "Diseño",
  retiro: "Retiro",
};

const TIPO_COLORS: Record<TipoSolicitud, string> = {
  cotizacion: "bg-yellow-50 text-yellow-700",
  disenio: "bg-blue-50 text-blue-700",
  retiro: "bg-red-50 text-red-700",
};

const estadosFlujo: EstadoSolicitud[] = [
  "BORRADOR", "APROBADA", "EN_MEDICION", "EN_DISENIO",
  "APROBACION_MERCADEO", "APROBACION_CLIENTE",
  "ABONO_PENDIENTE", "EN_INSTALACION", "COMPLETADA",
];

export default function SolicitudesPage() {
  const counts = estadosFlujo.reduce((acc, estado) => {
    acc[estado] = solicitudesEjemplo.filter(s => s.estado === estado).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Renders</h1>
          <p className="text-gray-500 mt-1">Seguimiento del flujo de diseño por etapa</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nueva Solicitud
        </button>
      </div>

      {/* Kanban de estados */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {estadosFlujo.slice(0, 5).map((estado) => (
            <div key={estado} className="w-52 bg-white rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-600">{ESTADO_SOLICITUD_LABELS[estado]}</p>
                <span className="text-xs bg-gray-100 text-gray-600 w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {counts[estado] ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {solicitudesEjemplo
                  .filter((s) => s.estado === estado)
                  .map((s) => (
                    <div key={s.id} className="border border-gray-100 rounded-lg p-2.5 text-xs bg-gray-50 hover:bg-white cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-700">{s.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${TIPO_COLORS[s.tipo]}`}>{TIPO_LABELS[s.tipo]}</span>
                      </div>
                      <p className="text-gray-500 truncate">{s.pdv}</p>
                      <p className="text-indigo-600 font-medium mt-1">{MARCA_LABELS[s.marca]}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla completa */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <h2 className="font-semibold text-gray-800 text-sm">Todas las solicitudes</h2>
          <div className="ml-auto flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <Search size={14} className="text-gray-400" />
            <input type="text" placeholder="Buscar..." className="bg-transparent text-sm outline-none w-40" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PDV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Responsable</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudesEjemplo.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{s.id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[s.tipo]}`}>
                      {TIPO_LABELS[s.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.pdv}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {MARCA_LABELS[s.marca]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstadoSolicitud estado={s.estado} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.responsableActual}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{s.fechaCreacion}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
