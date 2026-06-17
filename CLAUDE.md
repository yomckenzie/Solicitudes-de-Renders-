# CLAUDE.md — Solicitudes de Renders

Guía de referencia para asistentes de IA y el equipo de desarrollo. Actualizar este archivo cuando cambien procesos, roles o convenciones.

---

## Descripción del proyecto

**Solicitudes de Renders** es una aplicación web interna para gestionar el inventario de mobiliario en puntos de venta, las solicitudes de diseño de nuevos espacios y el seguimiento de instalaciones de una empresa de ropa panameña.

La empresa distribuye sus marcas (**Johnny Cotton, Chess King, RAFFINE, JCX, JCB**) a través de +100 puntos de venta en cadenas de tiendas de toda Panamá. El sistema reemplaza las hojas de Excel actuales y permite que cada área tenga visibilidad del estado de cada espacio y solicitud.

---

## Glosario de términos del negocio

Usar estos términos en nombres de entidades, rutas y UI.

| Término | Significado |
|---------|-------------|
| `punto_de_venta` / `pdv` | Espacio físico en una tienda donde se exhibe el mobiliario |
| `cadena` | Tienda/retailer donde se ubican los PDV (ej: Stevens, Conway, Titan) |
| `mall` / `ubicacion` | Centro comercial o zona donde está la tienda |
| `corner` | Mueble de esquina para exhibición de ropa |
| `cabezal` | Cabecera/cabezal de exhibición de ropa |
| `gondola` | Mueble tipo góndola para colgar ropa |
| `rack` | Perchero/rack de ropa |
| `fascia` | Panel frontal de identificación de marca en el mueble |
| `marca` | Marca de ropa exhibida (Johnny Cotton, Chess King, RAFFINE, etc.) |
| `tipo` | Categoría del producto: Casual o Interior |
| `impulsador` | Persona del equipo que visita y gestiona los PDV |
| `visita` | Registro de visita de un impulsador a un PDV |
| `solicitud` | Pedido de diseño de render para un espacio nuevo o renovación |
| `render` | Propuesta visual / diseño del espacio o mueble |
| `cotización` | Presupuesto de precio para fabricación/instalación |
| `medición` | Toma de medidas físicas del espacio en la tienda |
| `instalación` | Colocación del mueble en el punto de venta |
| `abono` | Pago anticipado (normalmente 70%) |
| `retiro` | Devolución o recogida de mueble de la cadena |
| `estado` | Estado del espacio: Actualizado / Normal / Crítico / Desactualizado |
| `provincia` | División geográfica: Panamá, Chorrera, Chiriquí, Veraguas, Colón, Coclé, Herrera |

---

## Marcas y cadenas

### Marcas propias
- **Johnny Cotton (JC)** — Casual e Interior
- **Chess King (CK)** — Casual e Interior
- **RAFFINE** — Interior
- **JCX** — Casual
- **JCB** — Casual e Interior

### Cadenas principales (retailers)
Stevens, Conway, Titan, Campeon, Machetazo, Costo, La Onda, Madison, Picadilly, Sacks, DDP, Ecomoda, OCA Loca, Xtra, Jumbo, Maestro, Punto Mayorista, Punto Poderoso, Shopping Center, Amani, Jordania, El Fuerte

### Provincias / Zonas geográficas
Panamá ciudad, Chorrera, Arraijan, Colón, Chiriquí (David), Veraguas (Santiago), Coclé (Penonomé, Aguadulce), Herrera (Chitré)

---

## Datos del inventario de mobiliario

Cada punto de venta registra:

| Campo | Descripción |
|-------|-------------|
| `#PDV` | Número único del punto de venta |
| `espacio` | Prioridad del espacio (1=básico, 2=medio, 3=premium) |
| `pais` | País (Panamá) |
| `provincia` | Provincia geográfica |
| `tienda` / `cadena` | Nombre del retailer |
| `zona_cc` | Mall o centro comercial |
| `marca` | Marca de ropa exhibida |
| `corner_casual` | Cantidad de corners de ropa casual |
| `racks_casual` | Cantidad de racks de ropa casual |
| `gondola_casual` | Cantidad de góndolas de ropa casual |
| `cabezales_casual` | Cantidad de cabezales de ropa casual |
| `centro_mesa` | Cantidad de centros de mesa |
| `columna_casual` | Cantidad de columnas de ropa casual |
| `pared_casual` | Paredes en blanco de ropa casual |
| `corner_interior` | Cantidad de corners de ropa interior |
| `gondola_interior` | Cantidad de góndolas de ropa interior |
| `columna_interior` | Cantidad de columnas de ropa interior |
| `pared_interior` | Paredes blancas de ropa interior |
| `fotos_tamanos` | Fotos del espacio y tamaños actuales |
| `categoria_tamano` | Categoría de tamaño del espacio (1/2/3) |
| `impulsador` | Nombre del impulsador asignado |
| `frecuencia_visita` | Frecuencia sugerida de visita por semana |
| `estado` | Estado del espacio: Actualizado / Normal / Crítico / Desactualizado |
| `foto_visita` | Foto tomada en la visita |
| `observacion` | Notas de la visita |
| `fecha_ultima_visita` | Fecha de la última visita registrada |

### Registro de Corners (hoja de moviliario)
Cada corner también registra:
- `medidas` — dimensiones físicas del mueble (campo que actualmente está vacío y hay que completar)
- `imagenes` — fotos del mueble instalado
- `estado` — Actualizado / Normal / Crítico
- `comentarios` — observaciones
- `fecha_instalacion` — cuándo se instaló

---

## Procesos de negocio

### Proceso 1 — Cotización de precios

1. **Ventas** solicita cotización de Corners, Cabezales o Cornes
   - Referencias típicas: Cabezales ×10, Cornes ×20
2. Se registra rango de precio: Mínimo y Máximo
3. Cotización queda disponible para el equipo de ventas

### Proceso 2 — Retiro de muebles de cadena

1. La **cadena** notifica que hay muebles para retirar
2. Se avisa al **Vendedor** responsable
3. El vendedor gestiona el retiro y actualiza el inventario del PDV

### Proceso 3 — Diseño de cero (flujo principal de solicitud de render)

| Paso | Responsable | Acción | SLA |
|------|------------|--------|-----|
| 1 | Ventas | Crea la solicitud de diseño indicando PDV, medidas y marca | — |
| 2 | ilad | Aprueba la solicitud | — |
| 3 | Yarrisa | Coordina medición con el cliente/cadena | — |
| 4 | Proveedor | Envía las medidas tomadas | — |
| 5 | Yovanni | Crea propuesta de diseño (render) | **3 días** |
| 6 | Mercadeo | Aprueba el diseño | — |
| 7 | Cliente | Aprueba el diseño → si SÍ, asigna fecha | — |
| 7b | Yovanni | Si el cliente rechaza → ajusta y repite desde paso 6 | — |
| 8 | Yarrisa | Registra abono del 70% → Contabilidad | — |
| 9 | Proveedor | Propone fecha de instalación (mínimo 2 opciones) | — |
| 10 | Yarrisa | Confirma la fecha con el proveedor | — |
| 11 | Yarrisa | Visita la instalación | — |
| 12 | Mercadeo | Crea video publicitario del resultado | — |

---

## Roles y permisos

| Rol | Persona/Área | Puede hacer |
|-----|-------------|-------------|
| `ventas` | Equipo de ventas | Crear solicitudes, ver cotizaciones, ver estado de PDV |
| `aprobador` | ilad | Aprobar/rechazar solicitudes de diseño |
| `coordinadora` | Yarrisa | Gestionar mediciones, confirmar instalaciones, registrar abonos |
| `diseñador` | Yovanni | Subir propuestas de diseño/renders |
| `mercadeo` | Equipo de marketing | Aprobar diseños, subir videos |
| `proveedor` | Externo | Ver medidas, proponer fechas de instalación |
| `impulsador` | Lorena Pinto, Isis Ramirez, Alcibiades Tenorio, etc. | Registrar visitas, actualizar estado y fotos de PDV |
| `contabilidad` | Área contable | Ver registros de pagos y abonos |
| `admin` | Administrador | Acceso completo: usuarios, reportes, exportaciones |

---

## Tecnología sugerida

> El stack no está definido aún. Se sugiere lo siguiente:

| Capa | Tecnología sugerida | Motivo |
|------|---------------------|--------|
| Frontend | Next.js (React) | Rutas por rol, SSR, subida de fotos, tablas de inventario |
| Backend / API | Node.js + API Routes de Next.js | Mismo lenguaje en todo el stack |
| Base de datos | PostgreSQL | Relacional, ideal para inventario con múltiples entidades |
| ORM | Prisma | Esquema declarativo, migraciones sencillas |
| Autenticación | NextAuth.js | Manejo de roles y sesiones |
| Almacenamiento de fotos | Cloudinary o Supabase Storage | Fotos de PDV, renders, visitas |
| Estilos | Tailwind CSS | Tablas y formularios de inventario rápidos de construir |
| Hosting | Vercel + Supabase | Despliegue simple, PostgreSQL gestionado |

---

## Estructura esperada del repositorio

```
solicitudes-de-renders/
├── app/                          # Rutas y páginas (Next.js App Router)
│   ├── (dashboard)/
│   │   ├── pdv/                  # Gestión de puntos de venta
│   │   ├── inventario/           # Inventario de mobiliario
│   │   ├── solicitudes/          # Solicitudes de renders
│   │   ├── visitas/              # Registro de visitas
│   │   └── reportes/             # Reportes por zona/cadena/marca
│   ├── api/
│   │   ├── pdv/
│   │   ├── solicitudes/
│   │   └── visitas/
│   └── login/
├── components/                   # Componentes de UI reutilizables
│   ├── tablas/                   # Tablas de inventario
│   ├── formularios/              # Formularios de solicitud/visita
│   └── mapas/                    # Vista geográfica de PDV (opcional)
├── lib/
│   ├── db.ts                     # Cliente Prisma
│   └── auth.ts                   # Configuración de sesiones
├── prisma/
│   └── schema.prisma             # Modelos de datos
├── public/
├── types/
├── .env.example
├── CLAUDE.md                     # Este archivo
└── README.md
```

---

## Modelos de datos principales (borrador)

```
PuntoDeVenta
  id, numero_pdv, espacio (1|2|3), pais, provincia, cadena, mall_zona
  marca, impulsador, frecuencia_visita, estado, fecha_ultima_visita

Mobiliario (inventario de muebles en cada PDV)
  id, pdv_id, tipo (corner|gondola|rack|cabezal|columna|pared|centro_mesa)
  categoria (casual|interior), cantidad, medidas, imagenes[], estado

SolicitudDeRender
  id, tipo (cotizacion|disenio|retiro), estado, pdv_id, marca
  creadoPor, fechaCreacion, ...flujo de aprobaciones

EstadoSolicitud (flujo)
  BORRADOR → APROBADA → EN_MEDICION → EN_DISENIO
  → APROBACION_MERCADEO → APROBACION_CLIENTE
  → ABONO_PENDIENTE → EN_INSTALACION → COMPLETADA

Render
  id, solicitud_id, archivo_url, version, aprobado_mercadeo, aprobado_cliente

Visita
  id, pdv_id, impulsador_id, fecha, fotos[], observacion, estado_espacio

Pago
  id, solicitud_id, monto, porcentaje (70%), registrado_por, fecha

Instalacion
  id, solicitud_id, fechas_propuestas[], fecha_confirmada, visita_realizada
```

---

## Vistas clave de la aplicación

1. **Dashboard por rol** — cada usuario ve solo lo relevante a su rol
2. **Mapa / lista de PDV** — filtrable por provincia, cadena, marca, estado
3. **Inventario de mobiliario** — tabla detallada con medidas, fotos y estado por PDV
4. **Solicitudes de renders** — listado con estado del flujo (tipo Kanban o tabla)
5. **Registro de visitas** — formulario de visita con subida de fotos
6. **Reportes** — PDV críticos, solicitudes pendientes, instalaciones próximas

---

## Flujo de trabajo en Git

```
main                    → rama de producción (no tocar directamente)
claude/<descripción>    → ramas generadas por Claude AI
feature/<descripción>   → nuevas funcionalidades
fix/<descripción>       → correcciones de errores
```

**Formato de commits:**
```
feat: agregar formulario de registro de visita
fix: corregir filtro por provincia en tabla de PDV
docs: actualizar CLAUDE.md con nuevos campos de inventario
```

---

## Convenciones para asistentes IA (Claude)

1. **Idioma del UI:** toda la interfaz va en **español** — etiquetas, mensajes, placeholders
2. **Idioma del código:** nombres de funciones, variables y comentarios técnicos en **inglés**
3. **Nomenclatura de entidades:** usar los términos del Glosario (`pdv`, no `store`; `solicitud`, no `request`; `impulsador`, no `promoter`)
4. **Roles:** antes de agregar lógica de permisos, consultar la tabla de roles de este archivo
5. **Inventario:** los campos de mobiliario están documentados en "Datos del inventario" — no inventar nombres nuevos
6. **Fotos:** siempre usar almacenamiento externo (Cloudinary/Supabase Storage), nunca guardar imágenes en el repositorio
7. **No crear archivos .md** adicionales sin que se pida explícitamente
8. **Priorizar editar archivos existentes** en lugar de crear archivos nuevos

---

## Stack tecnológico (confirmado y en producción)

| Capa | Tecnología | Estado |
|------|------------|--------|
| Frontend + Backend | **Next.js 16.2.9** (App Router) | ✅ En producción |
| Base de datos | **Supabase** (PostgreSQL gestionado) | ✅ Con datos reales |
| Cliente DB (servidor) | `@supabase/supabase-js` via `supabaseAdmin` | ✅ API routes |
| Almacenamiento fotos | **Supabase Storage** (bucket `photos/`) | ✅ Funcionando |
| Mapa | **Leaflet + OpenStreetMap** (sin API key) | ✅ Implementado |
| Estilos | **Tailwind CSS v4** | ✅ |
| Despliegue | **Vercel** (auto-deploy desde `main`) | ✅ |
| Iconos | `lucide-react` | ✅ |

---

## Esquema de base de datos (Supabase)

### Tablas existentes con datos

| Tabla | Registros | Columnas clave |
|-------|-----------|----------------|
| `puntos_de_venta` | **179** | id, numeroPdv, espacio, pais, provincia, cadena, mallZona, marca, impulsador, frecuenciaVisita, estado, fechaUltimaVisita |
| `mobiliario` | **227** | id, pdvId, tipo, categoria, cantidad, medidas, imagenes[], estado, comentarios, fechaInstalacion |
| `usuarios` | **5** | id, nombre, email, rol, activo |
| `solicitudes_de_render` | 0 | id, pdvId, tipo, estado, marca, notas, creadoPor, createdAt |
| `cotizaciones` | 0 | id, pdvId, tipo, precioMin, precioMax, notas |
| `pagos` | 0 | id, solicitudId, monto, porcentaje, registradoPor, fecha |
| `instalaciones` | 0 | id, solicitudId, fechasPropuestas[], fechaConfirmada, visitaRealizada |
| `renders` | 0 | id, solicitudId, archivoUrl, version, aprobadoMercadeo, aprobadoCliente |
| `visitas` | 0 | id, pdvId, impulsadorId, fecha, fotos[], observacion, estadoEspacio |

### Tabla pendiente de crear (SQL listo)
- `tareas` — La página `/dashboard/tareas` muestra el SQL para crearla si no existe

### Columna pendiente de agregar
- `mobiliario.costoAdquisicion` — La UI muestra valores calculados como fallback hasta que se agregue

---

## Estado actual del proyecto

### ✅ Completado y funcionando

**Módulos principales:**
- [x] **Dashboard** — KPIs en tiempo real, mapa Leaflet interactivo con 179 PDV ubicados, actividad reciente, PDV críticos, acciones rápidas
- [x] **Puntos de Venta** — Lista filtrable (provincia, cadena, marca, estado, búsqueda), ordenar por críticos, crear/editar/eliminar PDV
- [x] **Detalle PDV** — Página dedicada con header oscuro, métricas, tabla de mobiliario con fotos, costos, estado, zoom de imágenes, última visita
- [x] **Inventario** — Tabla de mobiliario por PDV, editar medidas/estado/cantidad, eliminar mueble, agregar mueble
- [x] **Solicitudes** — Kanban + tabla, filtros por tipo/estado, crear solicitud (modal), cambiar estado del flujo
- [x] **Visitas** — Lista de visitas, registrar visita con subida de múltiples fotos, ver detalle completo
- [x] **Tareas** — Tablero Kanban (Pendiente / En Progreso / Completada), crear/asignar/cambiar estado/eliminar tareas
- [x] **Reportes** — KPIs, gráficos de barras por provincia, cadena, marca, tipo de mueble, estado de solicitudes
- [x] **Configuración** — Estado de tablas en DB, lista de usuarios

**APIs disponibles:**
- [x] `GET/POST /api/pdv` — Lista y crear PDV
- [x] `PATCH/DELETE /api/pdv/[id]` — Editar y eliminar PDV
- [x] `GET /api/pdv/[id]/detalle` — Detalle completo con mobiliario, visitas, solicitudes
- [x] `GET/POST /api/inventario` — Lista y agregar mueble
- [x] `PATCH/DELETE /api/inventario/[id]` — Editar y eliminar mueble
- [x] `GET/POST /api/solicitudes` — Lista y crear solicitud
- [x] `PATCH /api/solicitudes/[id]` — Cambiar estado de solicitud
- [x] `GET/POST /api/visitas` — Lista y registrar visita
- [x] `GET /api/visitas/[id]` — Detalle de visita
- [x] `GET/POST /api/tareas` — Lista y crear tarea
- [x] `PATCH/DELETE /api/tareas/[id]` — Actualizar y eliminar tarea
- [x] `GET/POST /api/cotizaciones` — Lista (filtros: tipo, pdvId) y crear cotización
- [x] `PATCH/DELETE /api/cotizaciones/[id]` — Actualizar y eliminar cotización
- [x] `GET/POST /api/pagos` — Lista (filtro: solicitudId) y registrar pago/abono
- [x] `PATCH/DELETE /api/pagos/[id]` — Actualizar y eliminar pago
- [x] `GET/POST /api/instalaciones` — Lista (filtro: solicitudId) y crear instalación con fechas propuestas
- [x] `PATCH/DELETE /api/instalaciones/[id]` — Actualizar y eliminar instalación, marcar visita realizada
- [x] `GET/POST /api/renders` — Lista (filtro: solicitudId) y subir render (imagen/PDF) con versionado
- [x] `PATCH/DELETE /api/renders/[id]` — Actualizar aprobaciones (mercadeo/cliente) y eliminar
- [x] `POST /api/upload` — Subir foto/archivo a Supabase Storage
- [x] `GET /api/auth/[...nextauth]` — NextAuth (signin/signout/callback/csrf/session)
- [x] `GET /api/reportes` — Datos agregados para gráficos
- [x] `GET /api/usuarios` — Lista de usuarios

**Infraestructura:**
- [x] Geocodificador de Panamá (`src/lib/geo-panama.ts`) — 179/179 PDV ubicados
- [x] Badge de estados (`src/components/ui/Badge.tsx`)
- [x] Sidebar con navegación activa
- [x] Tipos TypeScript centralizados (`src/types/index.ts`)

### ⚠️ Pendiente (requiere acción en Supabase Studio)

1. **Crear tabla `tareas`** — Ir a `/dashboard/tareas`, copiar el SQL y ejecutarlo en Supabase Studio → SQL Editor
2. **Agregar columna `costoAdquisicion`** en tabla `mobiliario`:
   ```sql
   ALTER TABLE mobiliario ADD COLUMN IF NOT EXISTS "costoAdquisicion" DECIMAL(10,2);
   ```

### 🔲 Por desarrollar (próximas funcionalidades)

- [ ] **Dashboard por rol** — Ventas ve solicitudes, Yovanni ve tareas, Yarrisa ve instalaciones
- [ ] **Notificaciones** — Alertas de tareas vencidas, PDV críticos, solicitudes pendientes
- [ ] **Exportar a Excel/PDF** — Reportes descargables
- [ ] **Filtros en el mapa** — Filtrar marcadores por estado/marca/provincia desde el mapa
- [ ] **Historial de cambios (audit log)** — Log de quién cambió qué y cuándo
- [ ] **App móvil (PWA)** — Para que impulsadores registren visitas desde el celular
- [ ] **Módulo de retiro de muebles (Proceso 2)** — No está en ninguna tabla todavía

---

## Configuración de entorno

Variables requeridas (ver `.env.example`):

| Variable | Origen | Notas |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | **NUNCA exponer al cliente** — solo API routes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | **Requerido en producción** — sin esto la auth no funciona |

**Vercel:** Setear las 4 en Project Settings → Environment Variables.

**Crear primer usuario admin (local):**
```bash
NEXTAUTH_SECRET=tu-secret \
NEXT_PUBLIC_SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npx ts-node scripts/create-user.ts tucorreo@dominio.com TuPassword "Tu Nombre" admin
```
