const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuración de multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Autenticación con Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Configuración de nodemailer para correos
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Base de datos en memoria para sesiones (en producción usar base de datos real)
const sessions = new Map();
const solicitudes = new Map();

// Función para calcular SLA
function calcularSLA(tipoMueble, complejidad) {
  if (complejidad === 'grande' || tipoMueble.includes('especial')) {
    return { dias: 7, horas: 168 };
  } else if (complejidad === 'media') {
    return { dias: 3, horas: 72 };
  } else {
    return { dias: 1, horas: 24 }; // Default 24 horas
  }
}

// Función para enviar correo
async function enviarCorreo(destinatario, asunto, mensaje, adjuntos = []) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: destinatario,
      subject: asunto,
      html: mensaje,
      attachments: adjuntos,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return false;
  }
}

// Función para guardar en Google Sheets
async function guardarEnGoogleSheet(datos) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    // Preparar fila de datos
    const rowData = [
      datos.idSolicitud,
      datos.correo,
      datos.nombre,
      datos.departamento,
      datos.fechaSolicitud,
      datos.tipoMueble,
      datos.complejidad,
      datos.anchoFascia || 'N/A',
      datos.anchoTotal || 'N/A',
      datos.altoTotal || 'N/A',
      datos.profundidadTotal || 'N/A',
      datos.medidaPolo || 'No aplica',
      datos.grosorLaterales || 'N/A',
      datos.grosorFrente || 'N/A',
      datos.instruccionesCliente,
      datos.slaHoras,
      datos.fechaEntregaEstimada,
      datos.estado,
      datos.archivosAdjuntos ? datos.archivosAdjuntos.join(', ') : 'Sin archivos',
      datos.respuestaAdmin || 'Pendiente',
      datos.archivoRender || 'Pendiente',
      datos.fechaRespuesta || 'Pendiente',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Hoja 1!A:V',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [rowData],
      },
    });

    console.log('Datos guardados en Google Sheet');
    return true;
  } catch (error) {
    console.error('Error guardando en Google Sheet:', error);
    return false;
  }
}

// Función para actualizar Google Sheet
async function actualizarEnGoogleSheet(idSolicitud, campo, valor, columna) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    // Obtener todos los datos para encontrar la fila
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Hoja 1!A:A',
    });

    const filas = response.data.values || [];
    let filaEncontrada = -1;

    for (let i = 1; i < filas.length; i++) {
      if (filas[i][0] === idSolicitud) {
        filaEncontrada = i + 1; // +1 porque las filas de Google Sheets empiezan en 1
        break;
      }
    }

    if (filaEncontrada === -1) {
      console.error('Solicitud no encontrada');
      return false;
    }

    // Mapeo de campos a columnas (A=1, B=2, etc.)
    const columnasMap = {
      'estado': 'T',
      'respuestaAdmin': 'U',
      'archivoRender': 'V',
      'fechaRespuesta': 'W',
    };

    const columnaLetra = columnasMap[campo] || columna;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Hoja 1!${columnaLetra}${filaEncontrada}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[valor]],
      },
    });

    console.log(`Google Sheet actualizado: ${campo} = ${valor}`);
    return true;
  } catch (error) {
    console.error('Error actualizando Google Sheet:', error);
    return false;
  }
}

// Rutas

// Página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Página del formulario
app.get('/formulario', (req, res) => {
  if (!sessions.has(req.query.correo)) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views', 'formulario.html'));
});

// Página de seguimiento
app.get('/seguimiento', (req, res) => {
  if (!sessions.has(req.query.correo)) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'views', 'seguimiento.html'));
});

// Panel de administración
app.get('/admin', (req, res) => {
  // En producción, verificar si el usuario es admin
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Login
app.post('/api/login', async (req, res) => {
  const { correo } = req.body;

  // Validar que sea correo corporativo (ejemplo básico)
  if (!correo || !correo.includes('@')) {
    return res.status(400).json({ success: false, message: 'Correo inválido' });
  }

  // Crear sesión
  const token = Math.random().toString(36).substring(2);
  sessions.set(token, { correo, fecha: new Date() });

  res.json({ success: true, token, correo });
});

// Enviar solicitud
app.post('/api/solicitudes', upload.array('archivos', 5), async (req, res) => {
  try {
    const datos = req.body;
    const archivos = req.files || [];

    // Validar datos requeridos
    const camposRequeridos = ['correo', 'nombre', 'tipoMueble', 'anchoTotal', 'altoTotal', 'profundidadTotal'];
    for (const campo of camposRequeridos) {
      if (!datos[campo]) {
        return res.status(400).json({ success: false, message: `Campo requerido: ${campo}` });
      }
    }

    // Generar ID único
    const idSolicitud = 'SOL-' + Date.now();
    const fechaSolicitud = new Date().toISOString();

    // Calcular SLA
    const sla = calcularSLA(datos.tipoMueble, datos.complejidad || 'normal');
    const fechaEntrega = new Date(Date.now() + sla.horas * 60 * 60 * 1000);

    // Procesar archivos
    const archivosNombres = archivos.map(f => f.filename);

    // Preparar datos completos
    const solicitudCompleta = {
      idSolicitud,
      correo: datos.correo,
      nombre: datos.nombre,
      departamento: datos.departamento || 'No especificado',
      fechaSolicitud,
      tipoMueble: datos.tipoMueble,
      complejidad: datos.complejidad || 'normal',
      anchoFascia: datos.anchoFascia,
      anchoTotal: datos.anchoTotal,
      altoTotal: datos.altoTotal,
      profundidadTotal: datos.profundidadTotal,
      medidaPolo: datos.medidaPolo,
      grosorLaterales: datos.grosorLaterales,
      grosorFrente: datos.grosorFrente,
      instruccionesCliente: datos.instruccionesCliente || 'Sin instrucciones adicionales',
      slaHoras: sla.horas,
      fechaEntregaEstimada: fechaEntrega.toISOString(),
      estado: 'Pendiente',
      archivosAdjuntos: archivosNombres,
      respuestaAdmin: '',
      archivoRender: '',
      fechaRespuesta: '',
    };

    // Guardar en memoria
    solicitudes.set(idSolicitud, solicitudCompleta);

    // Guardar en Google Sheets
    await guardarEnGoogleSheet(solicitudCompleta);

    // Enviar correo de confirmación
    const mensajeCorreo = `
      <h2>Solicitud Recibida</h2>
      <p>Hola ${datos.nombre},</p>
      <p>Tu solicitud ha sido recibida exitosamente.</p>
      <p><strong>ID de Solicitud:</strong> ${idSolicitud}</p>
      <p><strong>Tipo de Mueble:</strong> ${datos.tipoMueble}</p>
      <p><strong>Tiempo estimado de entrega:</strong> ${sla.dias} días (${sla.horas} horas)</p>
      <p><strong>Fecha estimada de entrega:</strong> ${fechaEntrega.toLocaleDateString()}</p>
      <p>Puedes hacer seguimiento de tu solicitud en: <a href="http://localhost:${PORT}/seguimiento?correo=${encodeURIComponent(datos.correo)}">Ver Seguimiento</a></p>
      <p>Saludos,<br>Equipo de Diseño de Corners</p>
    `;

    await enviarCorreo(datos.correo, 'Solicitud de Diseño Recibida - ' + idSolicitud, mensajeCorreo);

    res.json({ 
      success: true, 
      message: 'Solicitud enviada exitosamente',
      idSolicitud,
      fechaEntregaEstimada: fechaEntrega,
      slaHoras: sla.horas
    });

  } catch (error) {
    console.error('Error procesando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error procesando solicitud' });
  }
});

// Obtener solicitudes de un usuario
app.get('/api/solicitudes/:correo', (req, res) => {
  const { correo } = req.params;
  
  const solicitudesUsuario = Array.from(solicitudes.values())
    .filter(s => s.correo === correo)
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

  res.json({ success: true, solicitudes: solicitudesUsuario });
});

// Obtener todas las solicitudes (admin)
app.get('/api/admin/solicitudes', (req, res) => {
  const todasSolicitudes = Array.from(solicitudes.values())
    .sort((a, b) => new Date(b.fechaSolicitud) - new Date(a.fechaSolicitud));

  res.json({ success: true, solicitudes: todasSolicitudes });
});

// Actualizar solicitud (admin)
app.post('/api/admin/solicitudes/:id/responder', upload.array('archivosRender', 2), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, respuesta, correoUsuario } = req.body;
    const archivos = req.files || [];

    const solicitud = solicitudes.get(id);
    if (!solicitud) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }

    // Actualizar datos
    solicitud.estado = estado;
    solicitud.respuestaAdmin = respuesta;
    solicitud.fechaRespuesta = new Date().toISOString();

    // Procesar archivos de render
    if (archivos.length > 0) {
      solicitud.archivoRender = archivos.map(f => f.filename).join(', ');
    }

    // Actualizar en memoria
    solicitudes.set(id, solicitud);

    // Actualizar en Google Sheets
    await actualizarEnGoogleSheet(id, 'estado', estado, 'T');
    await actualizarEnGoogleSheet(id, 'respuestaAdmin', respuesta, 'U');
    if (archivos.length > 0) {
      await actualizarEnGoogleSheet(id, 'archivoRender', solicitud.archivoRender, 'V');
    }
    await actualizarEnGoogleSheet(id, 'fechaRespuesta', solicitud.fechaRespuesta, 'W');

    // Preparar adjuntos para correo
    const adjuntos = archivos.map(f => ({
      path: path.join(__dirname, 'uploads', f.filename),
      filename: f.originalname,
    }));

    // Enviar correo de notificación
    const mensajeCorreo = `
      <h2>Actualización de tu Solicitud</h2>
      <p>Hola ${solicitud.nombre},</p>
      <p>Tu solicitud <strong>${id}</strong> ha sido actualizada.</p>
      <p><strong>Estado:</strong> ${estado}</p>
      <p><strong>Respuesta:</strong> ${respuesta}</p>
      ${archivos.length > 0 ? '<p>Se han adjuntado los archivos del diseño (PDF e imagen de preview).</p>' : ''}
      <p>Puedes ver los detalles en: <a href="http://localhost:${PORT}/seguimiento?correo=${encodeURIComponent(solicitud.correo)}">Ver Seguimiento</a></p>
      <p>Saludos,<br>Equipo de Diseño de Corners</p>
    `;

    await enviarCorreo(solicitud.correo, 'Actualización de Solicitud - ' + id, mensajeCorreo, adjuntos);

    res.json({ success: true, message: 'Respuesta enviada exitosamente' });

  } catch (error) {
    console.error('Error respondiendo solicitud:', error);
    res.status(500).json({ success: false, message: 'Error respondiendo solicitud' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`  - GET  /                    (Login)`);
  console.log(`  - GET  /formulario          (Formulario de solicitud)`);
  console.log(`  - GET  /seguimiento         (Seguimiento de solicitudes)`);
  console.log(`  - GET  /admin               (Panel de administración)`);
  console.log(`  - POST /api/login           (Autenticación)`);
  console.log(`  - POST /api/solicitudes     (Crear solicitud)`);
  console.log(`  - GET  /api/solicitudes/:correo (Obtener solicitudes por correo)`);
  console.log(`  - GET  /api/admin/solicitudes (Obtener todas las solicitudes)`);
  console.log(`  - POST /api/admin/solicitudes/:id/responder (Responder solicitud)`);
});
