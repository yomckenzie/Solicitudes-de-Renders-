import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
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

// ─── Permisos de Tareas ───────────────────────────────────────────────
// Basados en ROL, no en nombres propios: así el sistema sigue funcionando
// cuando entra o sale gente del equipo.

// Quién puede CREAR / EDITAR / ELIMINAR tareas.
export const TAREA_CREATOR_ROLES: Rol[] = ["admin", "coordinadora"];

// A quién puede asignar un creador NO-admin (coordinadoras).
// Los admin pueden asignar a cualquier usuario activo.
export const TAREA_ASSIGNEE_ROLES: Rol[] = ["disenador"];

export function canCreateTareaRol(rol: Rol | undefined): boolean {
  return rol !== undefined && TAREA_CREATOR_ROLES.includes(rol);
}

export async function canCreateTarea(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return canCreateTareaRol(user.rol) ? user : null;
}

/**
 * Lista de nombres a los que `user` puede asignar una tarea.
 * - admin        → todos los usuarios activos
 * - coordinadora → solo los roles de TAREA_ASSIGNEE_ROLES (diseñadores)
 */
export async function getAssignableNames(user: CurrentUser): Promise<string[]> {
  let query = supabaseAdmin
    .from("usuarios")
    .select("nombre, rol, activo")
    .eq("activo", true);

  if (user.rol !== "admin") {
    query = query.in("rol", TAREA_ASSIGNEE_ROLES);
  }

  const { data, error } = await query.order("nombre", { ascending: true });
  if (error || !data) return [];
  return data.map((u) => u.nombre as string);
}

export async function isValidTareaAssignee(
  name: string,
  user: CurrentUser
): Promise<boolean> {
  const allowed = await getAssignableNames(user);
  return allowed.includes(name);
}
