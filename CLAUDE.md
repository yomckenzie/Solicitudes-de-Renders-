# CLAUDE.md — Solicitudes de Renders

Guía de referencia para asistentes de IA y el equipo de desarrollo. Actualizar este archivo cuando cambien procesos, roles o convenciones.

---

## Descripción del proyecto

**Solicitudes de Renders** es una aplicación web interna para gestionar solicitudes de ventas, diseños, inventario e instalaciones de una empresa de muebles y diseño de interiores.

Permite que cada área (Ventas, Diseño, Mercadeo, Contabilidad) tenga visibilidad del estado de cada solicitud y sepa qué le toca hacer en cada momento.

---

## Glosario de términos del negocio

Usar estos términos en nombres de entidades, rutas y UI para mantener consistencia con el lenguaje del equipo.

| Término | Significado |
|---------|-------------|
| `solicitud` | Pedido de diseño o render iniciado por Ventas |
| `cotización` | Presupuesto de precio para un producto |
| `render` | Propuesta visual / diseño del producto |
| `proveedor` | Empresa externa que fabrica e instala |
| `instalación` | Visita de montaje del mueble en casa del cliente |
| `abono` | Pago anticipado (normalmente 70%) |
| `cabezal` | Cabecera de cama (producto del catálogo) |
| `corner` | Mueble esquinero (producto del catálogo) |
| `retiro` | Devolución o recogida de mueble de la cadena |
| `cadena` | Tienda de la red de distribución |
| `medición` | Visita para tomar medidas del espacio del cliente |

---

## Procesos de negocio

### Proceso 1 — Cotización de precios

1. **Ventas** solicita cotización de Corners, Cabezales o Cornes
   - Referencia: Cabezales ×10 unidades, Cornes ×20 unidades
2. Se registra rango de precio: Mínimo y Máximo
3. Cotización queda disponible para el equipo de ventas

### Proceso 2 — Retiro de muebles de cadena

1. La **cadena** notifica que hay muebles para retirar
2. Se avisa al **Vendedor** responsable
3. El vendedor gestiona el retiro

### Proceso 3 — Diseño de cero (flujo principal)

| Paso | Responsable | Acción | SLA |
|------|------------|--------|-----|
| 1 | Ventas | Crea la solicitud de diseño | — |
| 2 | ilad | Aprueba la solicitud | — |
| 3 | Yarrisa | Coordina medición con el cliente | — |
| 4 | Proveedor | Envía las medidas tomadas | — |
| 5 | Yovanni | Crea propuesta de diseño (render) | **3 días** |
| 6 | Mercadeo | Aprueba el diseño | — |
| 7 | Cliente | Aprueba el diseño → asigna fecha de entrega | — |
| 7b | Yovanni | Si el cliente rechaza → ajusta y repite desde paso 6 | — |
| 8 | Yarrisa | Registra abono del 70% → Contabilidad | — |
| 9 | Proveedor | Propone fecha de instalación (mínimo 2 opciones) | — |
| 10 | Yarrisa | Confirma la fecha de instalación con el proveedor | — |
| 11 | Yarrisa | Visita la instalación | — |
| 12 | Mercadeo | Crea video publicitario del resultado | — |

---

## Roles y permisos

| Rol | Persona/Área | Puede hacer |
|-----|-------------|-------------|
| `ventas` | Equipo de ventas | Crear solicitudes, ver cotizaciones |
| `aprobador` | ilad | Aprobar/rechazar solicitudes de diseño |
| `coordinadora` | Yarrisa | Gestionar mediciones, confirmar instalaciones, registrar abonos |
| `diseñador` | Yovanni | Subir propuestas de diseño/renders |
| `mercadeo` | Equipo de marketing | Aprobar diseños, subir videos |
| `proveedor` | Externo | Ver medidas, proponer fechas de instalación |
| `contabilidad` | Área contable | Ver registros de pagos y abonos |
| `admin` | Administrador | Acceso completo al sistema |

---

## Tecnología sugerida

> El stack no está definido aún. Se sugiere lo siguiente como punto de partida:

| Capa | Tecnología sugerida | Motivo |
|------|---------------------|--------|
| Frontend | Next.js (React) | Rutas por rol, SSR, buena experiencia de usuario |
| Backend / API | Node.js + API Routes de Next.js | Mismo lenguaje en todo el stack |
| Base de datos | PostgreSQL | Relacional, ideal para workflows con múltiples estados |
| ORM | Prisma | Esquema declarativo, migraciones sencillas |
| Autenticación | NextAuth.js | Fácil integración de roles y sesiones |
| Estilos | Tailwind CSS | Rápido para UI interna |
| Hosting | Vercel + Supabase | Despliegue simple, PostgreSQL gestionado |

---

## Estructura esperada del repositorio

Cuando empiece el desarrollo, se organizará así:

```
solicitudes-de-renders/
├── app/                    # Rutas y páginas (Next.js App Router)
│   ├── (dashboard)/        # Área privada por rol
│   ├── api/                # Endpoints de API
│   └── login/
├── components/             # Componentes de UI reutilizables
├── lib/                    # Lógica de negocio y utilidades
│   ├── db.ts               # Cliente de base de datos (Prisma)
│   └── auth.ts             # Configuración de autenticación
├── prisma/
│   └── schema.prisma       # Modelos de datos
├── public/                 # Archivos estáticos
├── types/                  # Tipos TypeScript globales
├── .env.example            # Variables de entorno requeridas
├── CLAUDE.md               # Este archivo
└── README.md
```

---

## Modelos de datos principales (borrador)

```
Solicitud
  id, tipo (cotización | diseño | retiro), estado, creadoPor, fechaCreación

EstadoSolicitud
  BORRADOR → APROBADA → EN_MEDICIÓN → EN_DISEÑO → APROBACIÓN_MERCADEO
  → APROBACIÓN_CLIENTE → ABONO_PENDIENTE → EN_INSTALACIÓN → COMPLETADA

Render
  id, solicitudId, archivoUrl, version, aprobadoPorMercadeo, aprobadoPorCliente

Instalación
  id, solicitudId, fechaPropuesta[], fechaConfirmada, visitaRealizada

Pago
  id, solicitudId, monto, porcentaje (70%), registradoPor, fecha
```

---

## Flujo de trabajo en Git

```
main                    → rama de producción (no tocar directamente)
claude/<descripción>    → ramas generadas por Claude AI
feature/<descripción>   → ramas de nuevas funcionalidades
fix/<descripción>       → ramas de corrección de errores
```

**Formato de commits:**
```
tipo: descripción corta en español o inglés

Ejemplos:
  feat: agregar formulario de solicitud de diseño
  fix: corregir validación de fecha de instalación
  docs: actualizar CLAUDE.md con nuevos roles
```

---

## Convenciones para asistentes IA (Claude)

1. **Idioma del UI:** toda la interfaz va en **español** — etiquetas, mensajes de error, placeholders
2. **Idioma del código:** nombres de funciones, variables y comentarios técnicos en **inglés**
3. **Nomenclatura de entidades:** usar los términos del Glosario (ej: `solicitud`, no `request`; `proveedor`, no `supplier`)
4. **Roles:** antes de agregar lógica de permisos, consultar la tabla de roles de este archivo
5. **Procesos:** al agregar un nuevo paso en un flujo, actualizar la tabla del Proceso correspondiente en este archivo
6. **No crear archivos .md** adicionales sin que se pida explícitamente
7. **Priorizar editar archivos existentes** en lugar de crear archivos nuevos
8. **No agregar comentarios** en el código salvo que el "por qué" no sea obvio

---

## Estado actual del proyecto

- [x] Repositorio creado
- [x] Procesos de negocio documentados (este archivo)
- [ ] Stack tecnológico confirmado
- [ ] Base de datos y esquema definidos
- [ ] Autenticación y roles implementados
- [ ] Flujo de solicitud de diseño (Proceso 3)
- [ ] Flujo de cotización (Proceso 1)
- [ ] Flujo de retiro de muebles (Proceso 2)
- [ ] Dashboard por rol
- [ ] Notificaciones entre áreas
