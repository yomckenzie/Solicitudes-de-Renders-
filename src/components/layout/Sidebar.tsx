"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Package,
  FileText,
  Eye,
  BarChart2,
  Settings,
  ClipboardList,
  Calculator,
  CreditCard,
  Wrench,
  Image as ImageIcon,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pdv", label: "Puntos de Venta", icon: MapPin },
  { href: "/dashboard/inventario", label: "Inventario", icon: Package },
  { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: Calculator },
  { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard },
  { href: "/dashboard/instalaciones", label: "Instalaciones", icon: Wrench },
  { href: "/dashboard/renders", label: "Renders", icon: ImageIcon },
  { href: "/dashboard/visitas", label: "Visitas", icon: Eye },
  { href: "/dashboard/tareas", label: "Tareas", icon: ClipboardList },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold leading-tight">Solicitudes</h1>
        <p className="text-xs text-gray-400 mt-0.5">de Renders</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-700">
        <Link
          href="/dashboard/configuracion"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <Settings size={18} />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
