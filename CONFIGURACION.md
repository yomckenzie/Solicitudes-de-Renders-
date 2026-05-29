# 📋 GUÍA DE CONFIGURACIÓN PASO A PASO

## Parte 1: Configurar Google Cloud Console

### Paso 1: Crear Proyecto en Google Cloud
1. Ve a https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Haz clic en "Seleccionar proyecto" → "Nuevo Proyecto"
4. Nombre del proyecto: `corners-design-app` (o el que prefieras)
5. Haz clic en "Crear"

### Paso 2: Habilitar API de Google Sheets
1. En el menú lateral, ve a "APIs y servicios" → "Biblioteca"
2. Busca "Google Sheets API"
3. Haz clic en "Habilitar"

### Paso 3: Crear Cuenta de Servicio (Service Account)
1. Ve a "APIs y servicios" → "Credenciales"
2. Haz clic en "+ CREAR CREDENCIALES" → "Cuenta de servicio"
3. Nombre: `corners-app-service`
4. Descripción: `Servicio para aplicación de corners`
5. Haz clic en "Crear y continuar"
6. En "Conceder acceso a esta cuenta de servicio", haz clic en "Continuar"
7. Haz clic en "Listo"

### Paso 4: Generar Clave JSON
1. En la lista de cuentas de servicio, haz clic en la que acabas de crear
2. Ve a la pestaña "Claves"
3. Haz clic en "+ AÑADIR CLAVE" → "Crear nueva clave"
4. Selecciona "JSON"
5. Haz clic en "Crear"
6. **IMPORTANTE**: Se descargará un archivo `.json` - GUÁRDALO EN UN LUGAR SEGURO

### Paso 5: Obtener Credenciales del JSON
Abre el archivo JSON descargado y copia:
- `client_email`: Se verá como `corners-app-service@tu-proyecto.iam.gserviceaccount.com`
- `private_key`: Es una cadena larga que comienza con `-----BEGIN PRIVATE KEY-----`

---

## Parte 2: Configurar Google Sheet

### Paso 1: Preparar tu Google Sheet
1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1YO_CIGc3wkXbrq8lBXmYAJGbOOL9AOAyE0cejVVzDEw/edit
2. Asegúrate de que la primera hoja se llame exactamente: `Hoja 1`

### Paso 2: Crear Encabezados
En la fila 1, crea estos encabezados (en este orden exacto):

| Columna | Encabezado |
|---------|-----------|
| A | ID Solicitud |
| B | Correo |
| C | Nombre |
| D | Departamento |
| E | Fecha Solicitud |
| F | Tipo de Mueble |
| G | Complejidad |
| H | Ancho Fascia |
| I | Ancho Total |
| J | Alto Total |
| K | Profundidad Total |
| L | Medida Polo |
| M | Grosor Laterales |
| N | Grosor Frente |
| O | Instrucciones Cliente |
| P | SLA Horas |
| Q | Fecha Entrega Estimada |
| R | Estado |
| S | Archivos Adjuntos |
| T | Respuesta Admin |
| U | Archivo Render |
| V | Fecha Respuesta |

### Paso 3: Compartir con la Service Account
1. Haz clic en el botón "Compartir" (esquina superior derecha)
2. En "Añadir personas y grupos", pega el `client_email` que copiaste del JSON
3. Selecciona permisos de **Editor**
4. Desmarca "Notificar a las personas"
5. Haz clic en "Hecho"

---

## Parte 3: Configurar Archivo .env

Edita el archivo `.env` en la carpeta del proyecto:

```env
PORT=3000

# ID de tu Google Sheet (ya está configurado con el tuyo)
GOOGLE_SHEET_ID=1YO_CIGc3wkXbrq8lBXmYAJGbOOL9AOAyE0cejVVzDEw

# Email de la service account (COPIAR DEL JSON)
GOOGLE_SERVICE_ACCOUNT_EMAIL=corners-app-service@tu-proyecto.iam.gserviceaccount.com

# Private key del JSON (COPIAR COMPLETA DEL JSON)
# IMPORTANTE: Mantener los \n y las comillas
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Configuración de correo electrónico
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
```

### ⚠️ Importante sobre GOOGLE_PRIVATE_KEY:
- Debe estar entre comillas dobles
- Los saltos de línea deben estar como `\n` (literalmente las letras \ y n)
- Copia TODO el contenido del private_key del JSON, incluyendo BEGIN y END

---

## Parte 4: Configurar Gmail para Notificaciones

### Método Recomendado: Contraseña de Aplicación

1. **Activar verificación en dos pasos**:
   - Ve a https://myaccount.google.com/security
   - Activa "Verificación en dos pasos" si no está activa

2. **Generar contraseña de aplicación**:
   - Ve a https://myaccount.google.com/apppasswords
   - Si no ves esta opción, primero activa la verificación en dos pasos
   - En "Seleccionar app", elige "Correo"
   - En "Seleccionar dispositivo", elige "Otro (nombre personalizado)"
   - Escribe: `Corners App`
   - Haz clic en "Generar"
   - Copia la contraseña de 16 caracteres que aparece

3. **Usar en .env**:
   ```env
   EMAIL_USER=tu-correo@gmail.com
   EMAIL_PASS=abcd efgh ijkl mnop  (la contraseña generada, sin espacios)
   ```

---

## Parte 5: Probar la Aplicación

### Paso 1: Instalar Dependencias
```bash
cd /workspace
npm install
```

### Paso 2: Iniciar Servidor
```bash
npm start
```

Deberías ver:
```
Servidor corriendo en http://localhost:3000
Endpoints disponibles:
  - GET  /                    (Login)
  - GET  /formulario          (Formulario de solicitud)
  ...
```

### Paso 3: Probar en el Navegador
1. Abre http://localhost:3000
2. Ingresa un correo de prueba (ej: test@empresa.com)
3. Haz clic en "Ingresar"

### Paso 4: Verificar Google Sheet
Después de enviar una solicitud de prueba:
1. Abre tu Google Sheet
2. Deberías ver una nueva fila con los datos de la solicitud

---

## Solución de Problemas Comunes

### Error: "Error guardando en Google Sheet"
- ✅ Verifica que el `GOOGLE_SHEET_ID` sea correcto
- ✅ Verifica que la service account tenga permisos de Editor
- ✅ Verifica que la hoja se llame exactamente `Hoja 1`
- ✅ Verifica que el `private_key` esté completo y bien formateado

### Error: "Error enviando correo"
- ✅ Verifica que `EMAIL_USER` sea tu correo de Gmail
- ✅ Usa una contraseña de aplicación, NO tu contraseña normal
- ✅ Verifica que la verificación en dos pasos esté activada

### Error: "Private key no es válido"
- ✅ Asegúrate de incluir `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`
- ✅ Los saltos de línea deben ser `\n` (dos caracteres: backslash y n)
- ✅ Todo debe estar entre comillas dobles

### La aplicación no guarda datos
- ✅ Verifica que todas las columnas existan en el Google Sheet
- ✅ Verifica que los nombres de las columnas coincidan exactamente
- ✅ Revisa la consola del servidor para ver errores específicos

---

## Próximos Pasos

Una vez configurado todo:

1. **Personaliza los tipos de mueble** en `views/formulario.html` si necesitas más opciones
2. **Ajusta los tiempos de SLA** en `server.js` según tus necesidades reales
3. **Configura un dominio** para acceder desde cualquier lugar
4. **Considera hosting** como Heroku, Railway, o Vercel para producción

---

## Soporte

Si tienes problemas:
1. Revisa la consola del servidor (donde ejecutaste `npm start`)
2. Abre la consola del navegador (F12) para ver errores del frontend
3. Verifica que todos los pasos de configuración estén completos

¡Tu aplicación estará lista para usar! 🎉
