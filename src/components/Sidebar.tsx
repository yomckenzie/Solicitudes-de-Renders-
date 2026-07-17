import Link from "next/link";
import { LayoutDashboard, MapPin, Users, Settings, LogOut, Boxes } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

const NAV = [
  { href: "/dashboard",            label: "Resumen",      icon: LayoutDashboard, roles: ["superadmin", "gerente", "proyectos", "supervisor"] as Role[] },
  { href: "/dashboard/corners",    label: "Corners",      icon: Boxes,           roles: ["superadmin", "gerente", "proyectos", "supervisor"] as Role[] },
  { href: "/dashboard/malls",      label: "Malls/Tiendas",icon: MapPin,          roles: ["superadmin", "gerente"] as Role[] },
  { href: "/dashboard/users",      label: "Usuarios",     icon: Users,           roles: ["superadmin"] as Role[] },
  { href: "/dashboard/settings",   label: "Configuración",icon: Settings,        roles: ["superadmin"] as Role[] },
];

export function Sidebar({
  role,
  userName,
  userEmail,
}: {
  role: Role;
  userName: string;
  userEmail: string;
}) {
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-200 md:bg-white">
      <div className="px-6 py-5 border-b border-slate-200">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 grid place-items-center text-white font-bold text-sm">
            CM
          </div>
          <span className="font-semibold text-slate-900">CornerMaster</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-slate-900 truncate">{userName}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          <p className={cn(
            "mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
            role === "superadmin" && "bg-amber-100 text-amber-800",
            role === "gerente"    && "bg-sky-100 text-sky-800",
            role === "proyectos"  && "bg-violet-100 text-violet-800",
            role === "supervisor" && "bg-emerald-100 text-emerald-800",
          )}>
            {role}
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
