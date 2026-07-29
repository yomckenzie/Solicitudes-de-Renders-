import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Rol } from "@/types";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  rol: Rol;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      rol: session.user.rol,
    };
  } catch {
    return null;
  }
}

export async function hasRole(allowed: Rol | Rol[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  return allowedList.includes(user.rol);
}

export async function requireRole(allowed: Rol | Rol[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const allowedList = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedList.includes(user.rol)) throw new Error("FORBIDDEN");
  return user;
}

// Matriz de permisos por módulo
// Cada módulo declara qué roles pueden acceder
export const MODULE_PERMISSIONS: Record<string, Rol[]> = {
  pdv: ["admin", "ventas", "coordinadora", "impulsador"],
  inventario: ["admin", "ventas", "coordinadora", "impulsador"],
  solicitudes: ["admin", "ventas", "aprobador", "coordinadora", "disenador", "mercadeo", "proveedor", "contabilidad"],
  cotizaciones: ["admin", "ventas", "coordinadora"],
  pagos: ["admin", "coordinadora", "contabilidad"],
  instalaciones: ["admin", "coordinadora", "proveedor"],
  renders: ["admin", "disenador", "mercadeo", "coordinadora"],
  visitas: ["admin", "impulsador", "coordinadora"],
  tareas: ["admin", "coordinadora", "disenador"],
  reportes: ["admin", "coordinadora", "contabilidad"],
  usuarios: ["admin"],
};

export async function canAccessModule(module: keyof typeof MODULE_PERMISSIONS): Promise<boolean> {
  return hasRole(MODULE_PERMISSIONS[module]);
}

// Personas que pueden CREAR/ASIGNAR tareas (independiente del rol del módulo):
// admins + Andrea + Yarrisa
export const TAREA_CREATOR_NAMES = ["Andrea", "Yarrisa"] as const;

// Asignados válidos para una tarea (solo Yovanni y Javier).
export const TAREA_VALID_ASSIGNEES = ["Yovanni", "Javier"] as const;

export async function canCreateTarea(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.rol === "admin") return user;
  if ((TAREA_CREATOR_NAMES as readonly string[]).includes(user.name)) return user;
  return null;
}

export function isValidTareaAssignee(name: string): boolean {
  return (TAREA_VALID_ASSIGNEES as readonly string[]).includes(name);
}
