# Aplicación Web de Solicitudes para Renders de Corners

Aplicación web completa para gestionar solicitudes de diseño de renders de corners para almacenes de ropa.

## Características Principales

### Para Solicitantes
- **Login con correo corporativo**: Acceso sencillo usando solo el correo electrónico
- **Formulario completo**: Todos los datos técnicos necesarios para el diseño
  - Datos del solicitante (nombre, correo, departamento)
  - Tipo de mueble (ropa interior, casual, deportiva, accesorios, calzado, etc.)
  - Dimensiones completas (ancho, alto, profundidad, fascia, grosores)
  - Medidas especiales (mueble de polo si aplica)
  - Instrucciones y requisitos del cliente
  - Archivos adjuntos de referencia (imágenes, croquis, planos)
- **Cálculo automático de SLA**: 
  - Normal: 24 horas
  - Media: 2-3 días (72 horas)
  - Grande: 5-7 días (168 horas)
- **Seguimiento en tiempo real**: Visualiza el estado de todas tus solicitudes
- **Notificaciones por correo**: Recibe alertas cuando hay actualizaciones

### Para Administradores/Diseñadores
- **Panel de administración**: Vista completa de todas las solicitudes
- **Filtros y búsqueda**: Filtra por estado, busca por ID o correo
- **Estadísticas**: Conteo de solicitudes pendientes, en proceso y completadas
- **Respuesta con archivos**: Envía el render en PDF y preview en imagen
- **Actualización automática de Google Sheets**: Los datos se sincronizan en tiempo real
- **Notificaciones automáticas**: El solicitante recibe correo con la respuesta y archivos

## Integración con Google Sheets

La aplicación se conecta automáticamente a tu Google Sheet para:
- Guardar cada nueva solicitud como una fila
- Actualizar el estado, respuesta y archivos cuando se responde
- Mantener un registro histórico de todas las solicitudes

### Columnas del Google Sheet
1. ID Solicitud
2. Correo
3. Nombre
4. Departamento
5. Fecha Solicitud
6. Tipo de Mueble
7. Complejidad
8. Ancho Fascia
9. Ancho Total
10. Alto Total
11. Profundidad Total
12. Medida Polo
13. Grosor Laterales
14. Grosor Frente
15. Instrucciones Cliente
16. SLA Horas
17. Fecha Entrega Estimada
18. Estado
19. Archivos Adjuntos
20. Respuesta Admin
21. Archivo Render
22. Fecha Respuesta

## Configuración

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto
3. Habilita la API de Google Sheets
4. Crea una cuenta de servicio (Service Account)
5. Descarga el archivo JSON de credenciales
6. Copia el `client_email` y `private_key`

### 2. Compartir Google Sheet

1. Abre tu Google Sheet
2. Haz clic en "Compartir"
3. Agrega el correo de la service account (ej: tu-proyecto@xxx.iam.gserviceaccount.com)
4. Dale permisos de **Editor**

### 3. Configurar Variables de Entorno

Edita el archivo `.env`:

```env
PORT=3000
GOOGLE_SHEET_ID=1YO_CIGc3wkXbrq8lBXmYAJGbOOL9AOAyE0cejVVzDEw
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-email-de-service-account@tu-proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"

# Configuración de correo (Gmail recomendado)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

### 4. Configurar Gmail para Notificaciones

Para usar Gmail:
1. Activa la verificación en dos pasos en tu cuenta de Google
2. Genera una "Contraseña de aplicación":
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y tu dispositivo
   - Copia la contraseña generada
   - Úsala en `EMAIL_PASS`

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
```

La aplicación estará disponible en: http://localhost:3000

## Estructura de Archivos

```
/workspace
├── server.js              # Servidor backend (Node.js + Express)
├── package.json           # Dependencias y configuración
├── .env                   # Variables de entorno (configuración)
├── views/                 # Páginas HTML
│   ├── login.html         # Página de inicio de sesión
│   ├── formulario.html    # Formulario de nueva solicitud
│   ├── seguimiento.html   # Página de seguimiento de solicitudes
│   └── admin.html         # Panel de administración
├── public/                # Archivos estáticos
└── uploads/               # Archivos subidos (renders, referencias)
```

## Flujo de Trabajo

1. **Solicitante**:
   - Ingresa con su correo corporativo
   - Llena el formulario con todos los datos del mueble
   - Adjunta imágenes de referencia si tiene
   - Envía la solicitud
   - Recibe correo de confirmación con SLA estimado

2. **Administrador/Diseñador**:
   - Ve todas las solicitudes en el panel
   - Revisa los detalles y dimensiones
   - Crea el diseño/render
   - Responde la solicitud con:
     - Nuevo estado (En proceso, Completado, etc.)
     - Comentarios/instrucciones
     - Archivos del render (PDF + imagen preview)
   - El sistema actualiza Google Sheets automáticamente
   - El solicitante recibe correo con la respuesta

3. **Seguimiento**:
   - El solicitante puede ver en todo momento el estado de sus solicitudes
   - Barra de progreso del SLA muestra tiempo restante
   - Historial completo de respuestas y archivos

## URLs de la Aplicación

- **Login**: http://localhost:3000/
- **Formulario**: http://localhost:3000/formulario
- **Seguimiento**: http://localhost:3000/seguimiento
- **Admin**: http://localhost:3000/admin

## APIs Disponibles

```
POST /api/login                    - Autenticación con correo
POST /api/solicitudes              - Crear nueva solicitud
GET  /api/solicitudes/:correo      - Obtener solicitudes de un usuario
GET  /api/admin/solicitudes        - Obtener todas las solicitudes (admin)
POST /api/admin/solicitudes/:id/responder - Responder solicitud (admin)
```

## Notas Importantes

- Los archivos se guardan en la carpeta `uploads/`
- El SLA se calcula automáticamente según la complejidad seleccionada
- Las notificaciones por correo incluyen los archivos adjuntos del render
- Google Sheets se actualiza en tiempo real con cada cambio de estado
- La aplicación usa sesiones en memoria (para producción considerar base de datos)

## Soporte

Para cualquier duda o ajuste adicional, revisa la documentación de cada módulo o contacta al equipo de desarrollo.
