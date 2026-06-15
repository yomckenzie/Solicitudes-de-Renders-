export type EstadoEspacio = "Actualizado" | "Normal" | "Critico" | "Desactualizado";

export type EstadoSolicitud =
  | "BORRADOR"
  | "APROBADA"
  | "EN_MEDICION"
  | "EN_DISENIO"
  | "APROBACION_MERCADEO"
  | "APROBACION_CLIENTE"
  | "ABONO_PENDIENTE"
  | "EN_INSTALACION"
  | "COMPLETADA"
  | "RECHAZADA";

export type TipoSolicitud = "cotizacion" | "disenio" | "retiro";

export type Marca = "JohnnyCotton" | "ChessKing" | "RAFFINE" | "JCX" | "JCB";

export type Rol =
  | "admin"
  | "ventas"
  | "aprobador"
  | "coordinadora"
  | "disenador"
  | "mercadeo"
  | "proveedor"
  | "impulsador"
  | "contabilidad";

export const MARCA_LABELS: Record<Marca, string> = {
  JohnnyCotton: "Johnny Cotton",
  ChessKing: "Chess King",
  RAFFINE: "RAFFINE",
  JCX: "JCX",
  JCB: "JCB",
};

export const ESTADO_ESPACIO_COLORS: Record<EstadoEspacio, string> = {
  Actualizado: "bg-green-100 text-green-800",
  Normal: "bg-blue-100 text-blue-800",
  Critico: "bg-red-100 text-red-800",
  Desactualizado: "bg-yellow-100 text-yellow-800",
};

export const ESTADO_SOLICITUD_LABELS: Record<EstadoSolicitud, string> = {
  BORRADOR: "Borrador",
  APROBADA: "Aprobada",
  EN_MEDICION: "En Medición",
  EN_DISENIO: "En Diseño",
  APROBACION_MERCADEO: "Aprobación Mercadeo",
  APROBACION_CLIENTE: "Aprobación Cliente",
  ABONO_PENDIENTE: "Abono Pendiente",
  EN_INSTALACION: "En Instalación",
  COMPLETADA: "Completada",
  RECHAZADA: "Rechazada",
};

export const ESTADO_SOLICITUD_COLORS: Record<EstadoSolicitud, string> = {
  BORRADOR: "bg-gray-100 text-gray-700",
  APROBADA: "bg-blue-100 text-blue-700",
  EN_MEDICION: "bg-purple-100 text-purple-700",
  EN_DISENIO: "bg-indigo-100 text-indigo-700",
  APROBACION_MERCADEO: "bg-orange-100 text-orange-700",
  APROBACION_CLIENTE: "bg-yellow-100 text-yellow-700",
  ABONO_PENDIENTE: "bg-pink-100 text-pink-700",
  EN_INSTALACION: "bg-cyan-100 text-cyan-700",
  COMPLETADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
};

export const ROL_LABELS: Record<Rol, string> = {
  admin: "Administrador",
  ventas: "Ventas",
  aprobador: "Aprobador",
  coordinadora: "Coordinadora",
  disenador: "Diseñador",
  mercadeo: "Mercadeo",
  proveedor: "Proveedor",
  impulsador: "Impulsador",
  contabilidad: "Contabilidad",
};
