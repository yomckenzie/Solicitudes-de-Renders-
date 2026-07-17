// Catálogos cerrados del sistema. Si en el futuro hace falta agregar
// marcas/estados, se modifican acá y se regenera el type de `Corner`.

export const MARCAS = ["JC", "JCX", "CK", "JCB"] as const;
export type Marca = (typeof MARCAS)[number];

export const CATEGORIAS = ["Casual", "Interior"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ESTADOS = [
  "actualizado",
  "pendiente",
  "requiere_inversion",
  "sin_mobiliario",
  "en_mantenimiento",
] as const;
export type Estado = (typeof ESTADOS)[number];

export const ROLES = ["superadmin", "gerente", "proyectos", "supervisor"] as const;
export type Role = (typeof ROLES)[number];

export const ESTADO_META: Record<
  Estado,
  { label: string; color: string; bg: string; ring: string }
> = {
  actualizado: {
    label: "Actualizado",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    ring: "ring-emerald-200",
  },
  pendiente: {
    label: "Pendiente",
    color: "text-amber-700",
    bg: "bg-amber-100",
    ring: "ring-amber-200",
  },
  requiere_inversion: {
    label: "Requiere Inversión",
    color: "text-rose-700",
    bg: "bg-rose-100",
    ring: "ring-rose-200",
  },
  sin_mobiliario: {
    label: "Sin Mobiliario",
    color: "text-slate-700",
    bg: "bg-slate-200",
    ring: "ring-slate-300",
  },
  en_mantenimiento: {
    label: "En Mantenimiento",
    color: "text-sky-700",
    bg: "bg-sky-100",
    ring: "ring-sky-200",
  },
};
