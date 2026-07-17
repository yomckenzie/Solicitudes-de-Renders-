import type { Categoria, Estado, Marca, Role } from "./constants";

export interface Mall {
  id: string;
  nombre: string;
  ciudad: string;
  created_at: string;
}

export interface Tienda {
  id: string;
  mall_id: string;
  nombre: string;
  created_at: string;
}

export interface Corner {
  id: string;
  corner_id: string; // código legible: CRN-XXXXXX
  mall_id: string;
  tienda_id: string;
  marca: Marca;
  categoria: Categoria;
  estado: Estado;
  fecha_ultima_actualizacion: string;
  responsable: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CornerFoto {
  id: string;
  corner_id: string;
  url: string;
  thumbnail_url: string | null;
  fecha: string;
  subido_por: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface CornerAuditLog {
  id: string;
  corner_id: string;
  user_id: string | null;
  accion: string;
  estado_anterior: Estado | null;
  estado_nuevo: Estado | null;
  notas: string | null;
  created_at: string;
}

// Tipos enriquecidos con joins
export interface CornerCompleto extends Corner {
  mall: Mall | null;
  tienda: Tienda | null;
  fotos: CornerFoto[];
}
