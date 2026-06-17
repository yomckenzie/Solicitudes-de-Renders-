"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";
import { ROL_LABELS, type Rol } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Rol[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "ventas", "aprobador", "coordinadora", "disenador", "mercadeo", "proveedor", "impulsador", "contabilidad"] },
  { href: "/dashboard/pdv", label: "Puntos de Venta", icon: MapPin, roles: ["admin", "ventas", "coordinadora", "impulsador"] },
  { href: "/dashboard/inventario", label: "Inventario", icon: Package, roles: ["admin", "ventas", "coordinadora", "impulsador"] },
  { href: "/dashboard/solicitudes", label: "Solicitudes", icon: FileText, roles: ["admin", "ventas", "aprobador", "coordinadora", "disenador", "mercadeo", "proveedor", "contabilidad"] },
  { href: "/dashboard/cotizaciones", label: "Cotizaciones", icon: Calculator, roles: ["admin", "ventas", "coordinadora"] },
  { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard, roles: ["admin", "coordinadora", "contabilidad"] },
  { href: "/dashboard/instalaciones", label: "Instalaciones", icon: Wrench, roles: ["admin", "coordinadora", "proveedor"] },
  { href: "/dashboard/renders", label: "Renders", icon: ImageIcon, roles: ["admin", "disenador", "mercadeo", "coordinadora"] },
  { href: "/dashboard/visitas", label: "Visitas", icon: Eye, roles: ["admin", "impulsador", "coordinadora"] },
  { href: "/dashboard/tareas", label: "Tareas", icon: ClipboardList, roles: ["admin", "disenador", "coordinadora"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart2, roles: ["admin", "coordinadora", "contabilidad"] },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const visibleItems = user
    ? navItems.filter((item) => item.roles.includes(user.rol))
    : [];

  return (
    <>
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold leading-tight">Solicitudes</h1>
          <p className="text-xs text-gray-400 mt-0.5">de Renders</p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
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

      <div className="px-3 py-3 border-t border-gray-700 space-y-2">
        {user?.rol === "admin" && (
          <Link
            href="/dashboard/configuracion"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Settings size={18} />
            Configuración
          </Link>
        )}

        {user && (
          <div className="px-3 py-2 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase() || <UserIcon size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{ROL_LABELS[user.rol]}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700 py-1.5 rounded transition-colors"
            >
              <LogOut size={12} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </>
  );
}
