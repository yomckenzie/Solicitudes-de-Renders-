import { MapPin, FileText, Eye, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

async function getStats() {
  try {
    const firstOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const [pdvRes, criticoRes, solicitudRes, visitaRes] = await Promise.all([
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }).eq("estado", "Critico"),
      supabaseAdmin.from("solicitudes_de_render").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("visitas").select("*", { count: "exact", head: true }).gte("createdAt", firstOfMonth),
    ]);

    return {
      totalPdv: pdvRes.count ?? 0,
      criticos: criticoRes.count ?? 0,
      solicitudesActivas: solicitudRes.count ?? 0,
      visitasMes: visitaRes.count ?? 0,
    };
  } catch {
    return { totalPdv: 0, criticos: 0, solicitudesActivas: 0, visitasMes: 0 };
  }
}

const flujoSolicitud = [
  { paso: 1, rol: "Ventas", accion: "Crea la solicitud", estado: "inicio" },
  { paso: 2, rol: "ilad", accion: "Aprueba la solicitud", estado: "aprobacion" },
  { paso: 3, rol: "Yarrisa", accion: "Coordina medición", estado: "medicion" },
  { paso: 4, rol: "Proveedor", accion: "Envía medidas", estado: "medicion" },
  { paso: 5, rol: "Yovanni", accion: "Crea propuesta de diseño (3 días)", estado: "disenio" },
  { paso: 6, rol: "Mercadeo", accion: "Aprueba el diseño", estado: "aprobacion" },
  { paso: 7, rol: "Cliente", accion: "Aprueba → asigna fecha", estado: "aprobacion" },
  { paso: 8, rol: "Yarrisa", accion: "Registra abono 70%", estado: "pago" },
  { paso: 9, rol: "Proveedor", accion: "Propone fechas de instalación", estado: "instalacion" },
  { paso: 10, rol: "Yarrisa", accion: "Confirma fecha con proveedor", estado: "instalacion" },
  { paso: 11, rol: "Yarrisa", accion: "Visita la instalación", estado: "instalacion" },
  { paso: 12, rol: "Mercadeo", accion: "Crea video publicitario", estado: "completado" },
];

const stepColors: Record<string, string> = {
  inicio: "bg-gray-100 border-gray-300 text-gray-700",
  aprobacion: "bg-blue-50 border-blue-300 text-blue-700",
  medicion: "bg-purple-50 border-purple-300 text-purple-700",
  disenio: "bg-indigo-50 border-indigo-300 text-indigo-700",
  pago: "bg-pink-50 border-pink-300 text-pink-700",
  instalacion: "bg-cyan-50 border-cyan-300 text-cyan-700",
  completado: "bg-green-50 border-green-300 text-green-700",
};

export default async function DashboardPage() {
  const { totalPdv, criticos, solicitudesActivas, visitasMes } = await getStats();

  const stats = [
    {
      label: "Puntos de Venta",
      value: totalPdv.toString(),
      icon: MapPin,
      color: "bg-blue-500",
      desc: "En toda Panamá",
    },
    {
      label: "Solicitudes Activas",
      value: solicitudesActivas > 0 ? solicitudesActivas.toString() : "—",
      icon: FileText,
      color: "bg-indigo-500",
      desc: "En proceso",
    },
    {
      label: "Visitas este mes",
      value: visitasMes > 0 ? visitasMes.toString() : "—",
      icon: Eye,
      color: "bg-purple-500",
      desc: "Registradas",
    },
    {
      label: "PDV Críticos",
      value: criticos.toString(),
      icon: AlertTriangle,
      color: criticos > 0 ? "bg-red-500" : "bg-green-500",
      desc: criticos > 0 ? "Requieren atención" : "Todo en orden",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`${color} p-3 rounded-lg`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Flujo del proceso de diseño */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Clock size={20} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Proceso 3 — Diseño de Cero
          </h2>
          <span className="ml-auto text-xs text-gray-400">Flujo principal de solicitud de render</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {flujoSolicitud.map(({ paso, rol, accion, estado }) => (
            <div
              key={paso}
              className={`border rounded-lg p-3 ${stepColors[estado]}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold w-5 h-5 rounded-full bg-white/60 flex items-center justify-center">
                  {paso}
                </span>
                <span className="text-xs font-semibold">{rol}</span>
              </div>
              <p className="text-xs">{accion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de procesos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Proceso 1</h3>
          </div>
          <p className="text-sm font-medium text-gray-700">Cotización de Precios</p>
          <p className="text-xs text-gray-500 mt-1">
            Corners, Cabezales y Cornes con rango Mínimo / Máximo
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-orange-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Proceso 2</h3>
          </div>
          <p className="text-sm font-medium text-gray-700">Retiro de Muebles</p>
          <p className="text-xs text-gray-500 mt-1">
            Cadena avisa → vendedor gestiona el retiro del PDV
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 text-sm">Proceso 3</h3>
          </div>
          <p className="text-sm font-medium text-gray-700">Diseño de Cero</p>
          <p className="text-xs text-gray-500 mt-1">
            12 pasos desde solicitud hasta video publicitario
          </p>
        </div>
      </div>
    </div>
  );
}
