import { Plus, Camera } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { EstadoEspacio } from "@/types";

type Visita = {
  id: string;
  pdv: string;
  cadena: string;
  impulsador: string;
  fecha: string;
  estadoEspacio: EstadoEspacio;
  observacion: string;
  fotos: number;
};

const visitasEjemplo: Visita[] = [
  { id: "V-001", pdv: "PDV-001 — Stevens Albrook", cadena: "Stevens", impulsador: "Lorena Pinto", fecha: "2026-06-14", estadoEspacio: "Critico", observacion: "Corner dañado, requiere reparación urgente.", fotos: 3 },
  { id: "V-002", pdv: "PDV-002 — Stevens Alta Plaza", cadena: "Stevens", impulsador: "Lorena Pinto", fecha: "2026-06-14", estadoEspacio: "Actualizado", observacion: "Todo en orden.", fotos: 2 },
  { id: "V-003", pdv: "PDV-005 — Stevens Metromall", cadena: "Stevens", impulsador: "Alcibiades Tenorio", fecha: "2026-06-13", estadoEspacio: "Normal", observacion: "Falta cambiar fascia de la góndola.", fotos: 1 },
  { id: "V-004", pdv: "PDV-023 — Madison Albrook", cadena: "Madison", impulsador: "Lorena Pinto", fecha: "2026-06-12", estadoEspacio: "Normal", observacion: "Racks con buena carga de producto.", fotos: 4 },
  { id: "V-005", pdv: "PDV-027 — Conway Los Pueblos", cadena: "Conway", impulsador: "Lorena Pinto", fecha: "2026-06-10", estadoEspacio: "Desactualizado", observacion: "Muebles con diseño antiguo, se recomienda renovar.", fotos: 2 },
];

export default function VisitasPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Visitas</h1>
          <p className="text-gray-500 mt-1">Visitas de impulsadores a puntos de venta</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Registrar Visita
        </button>
      </div>

      {/* Resumen de impulsadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Lorena Pinto", "Isis Ramirez", "Alcibiades Tenorio"].map((nombre) => {
          const total = visitasEjemplo.filter(v => v.impulsador === nombre).length;
          return (
            <div key={nombre} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {nombre.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{nombre}</p>
                <p className="text-xs text-gray-400">{total} visitas registradas</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla de visitas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Fotos</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitasEjemplo.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-gray-700 text-xs">{v.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{v.pdv}</td>
                  <td className="px-4 py-3 text-gray-700">{v.impulsador}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{v.fecha}</td>
                  <td className="px-4 py-3">
                    <BadgeEstadoEspacio estado={v.estadoEspacio} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{v.observacion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-500 text-xs">
                      <Camera size={13} />
                      {v.fotos}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">Ver</button>
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
