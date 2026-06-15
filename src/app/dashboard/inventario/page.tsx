import { Plus, Package } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { EstadoEspacio, Marca, MARCA_LABELS } from "@/types";

type MuebleRow = {
  id: string;
  pdv: string;
  cadena: string;
  marca: Marca;
  tipo: string;
  categoria: "Casual" | "Interior";
  cantidad: number;
  medidas: string;
  estado: EstadoEspacio;
  fechaInstalacion: string;
};

const inventarioEjemplo: MuebleRow[] = [
  { id: "1", pdv: "PDV-001 — Stevens Albrook", cadena: "Stevens", marca: "JohnnyCotton", tipo: "Corner", categoria: "Casual", cantidad: 1, medidas: "—", estado: "Critico", fechaInstalacion: "—" },
  { id: "2", pdv: "PDV-001 — Stevens Albrook", cadena: "Stevens", marca: "JohnnyCotton", tipo: "Góndola", categoria: "Interior", cantidad: 1, medidas: "—", estado: "Critico", fechaInstalacion: "—" },
  { id: "3", pdv: "PDV-002 — Stevens Alta Plaza", cadena: "Stevens", marca: "JohnnyCotton", tipo: "Corner", categoria: "Casual", cantidad: 1, medidas: "1.20m × 0.60m × 2.00m", estado: "Actualizado", fechaInstalacion: "2025-03-15" },
  { id: "4", pdv: "PDV-002 — Stevens Alta Plaza", cadena: "Stevens", marca: "JohnnyCotton", tipo: "Rack", categoria: "Casual", cantidad: 2, medidas: "—", estado: "Actualizado", fechaInstalacion: "2025-03-15" },
  { id: "5", pdv: "PDV-023 — Madison Albrook", cadena: "Madison", marca: "JohnnyCotton", tipo: "Corner", categoria: "Casual", cantidad: 1, medidas: "1.40m × 0.70m × 2.10m", estado: "Normal", fechaInstalacion: "2024-11-20" },
  { id: "6", pdv: "PDV-023 — Madison Albrook", cadena: "Madison", marca: "JohnnyCotton", tipo: "Góndola", categoria: "Interior", cantidad: 1, medidas: "—", estado: "Normal", fechaInstalacion: "—" },
  { id: "7", pdv: "PDV-062 — City Mall David", cadena: "City Mall", marca: "JohnnyCotton", tipo: "Corner", categoria: "Casual", cantidad: 1, medidas: "—", estado: "Critico", fechaInstalacion: "—" },
  { id: "8", pdv: "PDV-062 — City Mall David", cadena: "City Mall", marca: "JohnnyCotton", tipo: "Rack", categoria: "Casual", cantidad: 2, medidas: "—", estado: "Critico", fechaInstalacion: "—" },
];

export default function InventarioPage() {
  const sinMedidas = inventarioEjemplo.filter(m => m.medidas === "—").length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Mobiliario</h1>
          <p className="text-gray-500 mt-1">Corners, góndolas, racks, cabezales y más por punto de venta</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Agregar Mueble
        </button>
      </div>

      {/* Alerta medidas pendientes */}
      {sinMedidas > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Package size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {sinMedidas} muebles sin medidas registradas
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              Completa las medidas físicas de cada mueble para facilitar los diseños de renders.
            </p>
          </div>
        </div>
      )}

      {/* Resumen por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["Corner", "Góndola", "Rack", "Cabezal"].map((tipo) => {
          const total = inventarioEjemplo.filter(m => m.tipo === tipo).reduce((a, b) => a + b.cantidad, 0);
          return (
            <div key={tipo} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{total || "—"}</p>
              <p className="text-xs text-gray-500 mt-1">{tipo}s registrados</p>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Punto de Venta</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoría</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cantidad</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Medidas</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Instalación</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventarioEjemplo.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-600">{m.pdv}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {MARCA_LABELS[m.marca]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.tipo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.categoria === "Casual" ? "bg-orange-50 text-orange-700" : "bg-pink-50 text-pink-700"}`}>
                      {m.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{m.cantidad}</td>
                  <td className="px-4 py-3">
                    {m.medidas === "—" ? (
                      <span className="text-xs text-red-400 font-medium">Sin medidas</span>
                    ) : (
                      <span className="text-xs text-gray-600 font-mono">{m.medidas}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BadgeEstadoEspacio estado={m.estado} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{m.fechaInstalacion}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Editar
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
