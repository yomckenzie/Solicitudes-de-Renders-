import { Search, Filter, Plus, MapPin } from "lucide-react";
import { BadgeEstadoEspacio } from "@/components/ui/Badge";
import { EstadoEspacio, Marca, MARCA_LABELS } from "@/types";

// Datos de ejemplo basados en el Excel real
const pdvEjemplos = [
  { id: "1", numeroPdv: 1, espacio: 2, provincia: "Panamá", cadena: "Stevens", mallZona: "Albrook", marca: "JohnnyCotton" as Marca, impulsador: "Lorena Pinto", estado: "Critico" as EstadoEspacio },
  { id: "2", numeroPdv: 2, espacio: 2, provincia: "Panamá", cadena: "Stevens", mallZona: "Alta Plaza", marca: "JohnnyCotton" as Marca, impulsador: "Lorena Pinto", estado: "Actualizado" as EstadoEspacio },
  { id: "3", numeroPdv: 5, espacio: 2, provincia: "Panamá", cadena: "Stevens", mallZona: "Metromall", marca: "JohnnyCotton" as Marca, impulsador: "Alcibiades Tenorio", estado: "Normal" as EstadoEspacio },
  { id: "4", numeroPdv: 6, espacio: 2, provincia: "Panamá", cadena: "Campeon", mallZona: "Albrook", marca: "JohnnyCotton" as Marca, impulsador: "Lorena Pinto", estado: "Normal" as EstadoEspacio },
  { id: "5", numeroPdv: 15, espacio: 2, provincia: "Panamá", cadena: "Titan", mallZona: "Albrook", marca: "ChessKing" as Marca, impulsador: "Lorena Pinto", estado: "Actualizado" as EstadoEspacio },
  { id: "6", numeroPdv: 23, espacio: 3, provincia: "Panamá", cadena: "Madison", mallZona: "Albrook", marca: "JohnnyCotton" as Marca, impulsador: "Lorena Pinto", estado: "Normal" as EstadoEspacio },
  { id: "7", numeroPdv: 27, espacio: 1, provincia: "Panamá", cadena: "Conway", mallZona: "Los Pueblos", marca: "ChessKing" as Marca, impulsador: "Lorena Pinto", estado: "Desactualizado" as EstadoEspacio },
  { id: "8", numeroPdv: 62, espacio: 2, provincia: "Chiriquí", cadena: "City Mall", mallZona: "David", marca: "JohnnyCotton" as Marca, impulsador: "—", estado: "Critico" as EstadoEspacio },
];

const provincias = ["Todas", "Panamá", "Chorrera", "Chiriquí", "Veraguas", "Colón", "Coclé", "Herrera", "Arraijan"];
const cadenas = ["Todas", "Stevens", "Conway", "Titan", "Campeon", "Madison", "Machetazo", "La Onda", "Fuerte"];
const estados = ["Todos", "Actualizado", "Normal", "Critico", "Desactualizado"];

export default function PdvPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Venta</h1>
          <p className="text-gray-500 mt-1">Inventario de espacios en tiendas de Panamá</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
              placeholder="Buscar por PDV, tienda o zona..."
              className="bg-transparent text-sm flex-1 outline-none"
            />
          </div>

          <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {provincias.map(p => <option key={p}>{p}</option>)}
          </select>

          <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {cadenas.map(c => <option key={c}>{c}</option>)}
          </select>

          <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
            {estados.map(e => <option key={e}>{e}</option>)}
          </select>

          <button className="flex items-center gap-2 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
            <Filter size={16} />
            Más filtros
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600"># PDV</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Espacio</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Provincia</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadena</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Zona / CC</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Marca</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Impulsador</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pdvEjemplos.map((pdv) => (
                <tr key={pdv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900">PDV-{String(pdv.numeroPdv).padStart(3, "0")}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                      {pdv.espacio}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pdv.provincia}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{pdv.cadena}</td>
                  <td className="px-4 py-3 text-gray-600">{pdv.mallZona}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                      {MARCA_LABELS[pdv.marca]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pdv.impulsador}</td>
                  <td className="px-4 py-3">
                    <BadgeEstadoEspacio estado={pdv.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Mostrando {pdvEjemplos.length} de 100+ puntos de venta
        </div>
      </div>
    </div>
  );
}
