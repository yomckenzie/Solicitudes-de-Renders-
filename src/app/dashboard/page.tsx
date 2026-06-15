import {
  MapPin,
  FileText,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { PanamaMapa, type PdvMapaItem } from "@/components/PanamaMapa";

type PdvRow = {
  id: string;
  provincia: string;
  estado: string;
  cadena: string;
  numeroPdv: number;
  mallZona: string | null;
  marca: string | null;
};
type VisitaRow = {
  id: string;
  fecha: string;
  estadoEspacio: string;
  puntos_de_venta: { numeroPdv: number; cadena: string } | null;
};
type SolicitudRow = {
  id: string;
  tipo: string;
  estado: string;
  marca: string;
  createdAt: string;
  puntos_de_venta: { numeroPdv: number; cadena: string } | null;
};
type CriticoPdv = { id: string; numeroPdv: number; cadena: string; mallZona: string; provincia: string };

const estadoSolicitudColor: Record<string, string> = {
  BORRADOR: "bg-gray-100 text-gray-600",
  APROBADA: "bg-blue-100 text-blue-700",
  EN_MEDICION: "bg-purple-100 text-purple-700",
  EN_DISENIO: "bg-indigo-100 text-indigo-700",
  APROBACION_MERCADEO: "bg-cyan-100 text-cyan-700",
  APROBACION_CLIENTE: "bg-teal-100 text-teal-700",
  ABONO_PENDIENTE: "bg-pink-100 text-pink-700",
  EN_INSTALACION: "bg-orange-100 text-orange-700",
  COMPLETADA: "bg-green-100 text-green-700",
};

async function getDashboardData() {
  try {
    const firstOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    const [
      pdvRes,
      criticoRes,
      solicitudRes,
      visitaRes,
      allPdvsRes,
      recentVisitasRes,
      recentSolicitudesRes,
      criticoPdvsRes,
    ] = await Promise.all([
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("puntos_de_venta").select("*", { count: "exact", head: true }).eq("estado", "Critico"),
      supabaseAdmin.from("solicitudes_de_render").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("visitas").select("*", { count: "exact", head: true }).gte("createdAt", firstOfMonth),
      supabaseAdmin.from("puntos_de_venta").select("id, provincia, estado, cadena, numeroPdv, mallZona, marca"),
      supabaseAdmin
        .from("visitas")
        .select("id, fecha, estadoEspacio, puntos_de_venta(numeroPdv, cadena)")
        .order("fecha", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("solicitudes_de_render")
        .select("id, tipo, estado, marca, createdAt, puntos_de_venta(numeroPdv, cadena)")
        .order("createdAt", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("puntos_de_venta")
        .select("id, numeroPdv, cadena, mallZona, provincia")
        .eq("estado", "Critico")
        .limit(6),
    ]);

    const allPdvs: PdvRow[] = allPdvsRes.data || [];
    const provinciaMap: Record<string, { total: number; critico: number; normal: number }> = {};
    for (const p of allPdvs) {
      const key = p.provincia || "Sin provincia";
      if (!provinciaMap[key]) provinciaMap[key] = { total: 0, critico: 0, normal: 0 };
      provinciaMap[key].total++;
      if (p.estado === "Critico") provinciaMap[key].critico++;
      else provinciaMap[key].normal++;
    }

    const pdvsMapa: PdvMapaItem[] = allPdvs.map((p) => ({
      id: p.id,
      numeroPdv: p.numeroPdv,
      cadena: p.cadena,
      mallZona: p.mallZona,
      provincia: p.provincia,
      marca: p.marca,
      estado: p.estado,
    }));

    return {
      totalPdv: pdvRes.count ?? 0,
      criticos: criticoRes.count ?? 0,
      solicitudesActivas: solicitudRes.count ?? 0,
      visitasMes: visitaRes.count ?? 0,
      provinciaMap,
      pdvsMapa,
      recentVisitas: (recentVisitasRes.data || []) as unknown as VisitaRow[],
      recentSolicitudes: (recentSolicitudesRes.data || []) as unknown as SolicitudRow[],
      criticoPdvs: (criticoPdvsRes.data || []) as unknown as CriticoPdv[],
    };
  } catch {
    return {
      totalPdv: 0,
      criticos: 0,
      solicitudesActivas: 0,
      visitasMes: 0,
      provinciaMap: {},
      pdvsMapa: [] as PdvMapaItem[],
      recentVisitas: [],
      recentSolicitudes: [],
      criticoPdvs: [],
    };
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
  const {
    totalPdv,
    criticos,
    solicitudesActivas,
    visitasMes,
    provinciaMap,
    pdvsMapa,
    recentVisitas,
    recentSolicitudes,
    criticoPdvs,
  } = await getDashboardData();

  const kpis = [
    {
      label: "Puntos de Venta",
      value: totalPdv.toString(),
      icon: MapPin,
      color: "bg-blue-500",
      desc: "En toda Panamá",
      href: "/dashboard/pdv",
    },
    {
      label: "Solicitudes",
      value: solicitudesActivas > 0 ? solicitudesActivas.toString() : "—",
      icon: FileText,
      color: "bg-indigo-500",
      desc: "Total registradas",
      href: "/dashboard/solicitudes",
    },
    {
      label: "Visitas este mes",
      value: visitasMes > 0 ? visitasMes.toString() : "—",
      icon: Eye,
      color: "bg-purple-500",
      desc: "Registradas",
      href: "/dashboard/visitas",
    },
    {
      label: "PDV Críticos",
      value: criticos.toString(),
      icon: AlertTriangle,
      color: criticos > 0 ? "bg-red-500" : "bg-green-500",
      desc: criticos > 0 ? "Requieren atención" : "Todo en orden",
      href: "/dashboard/pdv",
    },
  ];

  const estadoVisitaColor: Record<string, string> = {
    Actualizado: "bg-green-100 text-green-700",
    Normal: "bg-blue-100 text-blue-700",
    Critico: "bg-red-100 text-red-700",
    Desactualizado: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen general del sistema — {new Date().toLocaleDateString("es-PA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/solicitudes"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <FileText size={15} />
            Nueva Solicitud
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, desc, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:shadow-md hover:border-gray-300 transition-all group"
          >
            <div className={`${color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mapa de PDV */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mapa de Puntos de Venta — Panamá</h2>
          <span className="ml-auto text-xs text-gray-400">Click en un marcador para ver el PDV</span>
        </div>

        <PanamaMapa pdvs={pdvsMapa} />

        {/* Resumen por provincia */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mt-5 pt-5 border-t border-gray-100">
          {Object.entries(provinciaMap)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([prov, info]) => (
              <Link
                key={prov}
                href={`/dashboard/pdv?provincia=${encodeURIComponent(prov)}`}
                className="text-center rounded-lg border border-gray-200 p-2 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <p className="text-lg font-bold text-gray-800">{info.total}</p>
                <p className="text-[10px] font-medium text-gray-500 leading-tight truncate">{prov}</p>
                {info.critico > 0 && (
                  <p className="text-[10px] text-red-500 font-medium">⚠ {info.critico}</p>
                )}
              </Link>
            ))}
        </div>
      </div>

      {/* Activity + Critical PDVs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Actividad Reciente</h3>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Últimas Visitas</p>
            {recentVisitas.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No hay visitas registradas</p>
            ) : (
              recentVisitas.slice(0, 3).map(v => (
                <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      PDV-{v.puntos_de_venta?.numeroPdv} · {v.puntos_de_venta?.cadena}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(v.fecha).toLocaleDateString("es-PA")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoVisitaColor[v.estadoEspacio] || "bg-gray-100 text-gray-600"}`}>
                    {v.estadoEspacio}
                  </span>
                </div>
              ))
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2">Solicitudes Recientes</p>
            {recentSolicitudes.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No hay solicitudes registradas</p>
            ) : (
              recentSolicitudes.slice(0, 3).map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">
                      {s.tipo} · {s.marca}
                    </p>
                    <p className="text-xs text-gray-400">
                      PDV-{s.puntos_de_venta?.numeroPdv} · {new Date(s.createdAt).toLocaleDateString("es-PA")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoSolicitudColor[s.estado] || "bg-gray-100 text-gray-600"}`}>
                    {s.estado.replace(/_/g, " ")}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Link href="/dashboard/visitas" className="flex-1 text-center text-xs text-blue-600 hover:underline py-1">Ver visitas →</Link>
            <Link href="/dashboard/solicitudes" className="flex-1 text-center text-xs text-blue-600 hover:underline py-1">Ver solicitudes →</Link>
          </div>
        </div>

        {/* Critical PDVs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-semibold text-gray-900">PDV Críticos</h3>
            {criticos > 0 && (
              <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {criticos} total
              </span>
            )}
          </div>

          {criticoPdvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle size={32} className="text-green-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">Todo en orden</p>
              <p className="text-xs text-gray-400 mt-1">No hay puntos de venta críticos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticoPdvs.map(p => (
                <Link
                  key={p.id}
                  href={`/dashboard/pdv/${p.id}`}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-red-800">PDV-{p.numeroPdv}</p>
                    <p className="text-xs text-red-600">{p.cadena} · {p.mallZona}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-500 font-medium">{p.provincia}</p>
                    <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">Crítico</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4">
            <Link href="/dashboard/pdv" className="text-xs text-blue-600 hover:underline">Ver todos los PDV →</Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/pdv", icon: MapPin, label: "Ver PDV", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
          { href: "/dashboard/inventario", icon: ClipboardList, label: "Inventario", color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" },
          { href: "/dashboard/visitas", icon: Eye, label: "Registrar Visita", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
          { href: "/dashboard/tareas", icon: CheckCircle, label: "Ver Tareas", color: "text-green-600 bg-green-50 hover:bg-green-100" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent transition-colors font-medium text-sm ${color}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </div>

      {/* Proceso de Diseño */}
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
    </div>
  );
}
