/**
 * Script para extraer usuarios creados en el día de hoy
 * Exporta a formato .xlsx (Excel) y envía por email
 * 
 * Uso: node scripts/extract-today-users-xlsx.js
 */

const path = require('path');

// Cargar variables de entorno desde archivo .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Bandera global para evitar envío duplicado
let emailYaEnviado = false;

// Configuración de la base de datos
const dbConfig = {
  host: process.env.MYSQL_HOST || '2.59.133.246',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'AxXkkhqoT9GDHvKgebKIyfnuGuoq94S6'
};

// Configuración de email
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.serviciodecorreo.es',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@viveverde.es',
    pass: process.env.EMAIL_PASSWORD || ''
  }
};

// Email de destino para el reporte
const EMAIL_DESTINATARIO = process.env.EMAIL_DESTINATARIO || 'administracion@viveverde.es';

// Lista de características de vivienda
const VIVIENDA_OPTIONS = ['terraza', 'balcón', 'huerto', 'césped', 'jardín', 'estanque', 'marquesina', 'piscina'];

// Lista de tipos de animales
const ANIMALES_OPTIONS = ['sin animales', 'perro(s)', 'gato(s)', 'pájaro(s)', 'pez (peces)', 'roedor(es)', 'otros', 'animales de corral'];

/**
 * Convierte un valor SET de MySQL a un objeto con propiedades booleanas
 * @param {string|null} setValue - Valor almacenado en el campo SET
 * @param {string[]} options - Lista de opciones posibles
 * @returns {Object} Objeto con cada opción como propiedad booleana
 */
function parseSetValue(setValue, options) {
  const result = {};
  options.forEach(opt => {
    result[opt] = false;
  });
  
  if (setValue && setValue.trim()) {
    const values = setValue.split(',').map(v => v.trim());
    values.forEach(val => {
      if (result.hasOwnProperty(val)) {
        result[val] = true;
      }
    });
  }
  
  return result;
}

/**
 * Función para enviar el archivo Excel por email o notificación de SIN usuarios
 * Esta función solo se ejecuta UNA vez, gracias a la bandera emailYaEnviado
 * @param {string|null} filePath - Ruta del archivo Excel (null si no hay usuarios)
 * @param {string|null} fileName - Nombre del archivo (null si no hay usuarios)
 * @param {number} totalUsuarios - Total de usuarios encontrados
 * @param {string} formattedDate - Fecha formateada del reporte
 */
async function enviarEmailReporte(filePath, fileName, totalUsuarios, formattedDate) {
  // ============================================================
  // PROTECCIÓN ANTI-DUPLICADO: Esta función solo se ejecuta una vez
  // ============================================================
  if (emailYaEnviado) {
    console.log('');
    console.log('================================================================================');
    console.log('  [ADVERTENCIA] El email ya fue enviado en esta ejecución. Omitiendo...');
    console.log('================================================================================');
    return { success: true, messageId: 'duplicate-prevented', warning: 'Email ya enviado' };
  }
  
  // Marcar como enviado ANTES de enviar (para evitar condiciones de carrera)
  emailYaEnviado = true;

  try {
    console.log('');
    console.log('--------------------------------------------------------------------------------');
    console.log('                        ENVIANDO EMAIL DEL REPORTE');
    console.log('--------------------------------------------------------------------------------');

    // Crear transporter
    const transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass
      }
    });

    // Determinar si hay usuarios para enviar
    const hayUsuarios = totalUsuarios > 0 && filePath && fs.existsSync(filePath);

    console.log(`  [DEBUG] hayUsuarios: ${hayUsuarios}`);
    console.log(`  [DEBUG] totalUsuarios: ${totalUsuarios}`);
    console.log(`  [DEBUG] filePath existe: ${filePath ? fs.existsSync(filePath) : 'filePath es null'}`);

    // Configurar el email
    const mailOptions = {
      from: `"Club ViveVerde" <${emailConfig.auth.user}>`,
      to: EMAIL_DESTINATARIO
    };

    if (hayUsuarios) {
      // Email con archivo Excel adjunto
      mailOptions.subject = `Reporte Diario - Usuarios Registrados ${formattedDate} - Club ViveVerde`;
      mailOptions.html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00A651; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Club ViveVerde</h1>
            <p style="color: white; margin: 5px 0 0 0;">Reporte de Usuarios Diarios</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">Resumen del Reporte</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: #555;">Fecha de Extracción:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; color: #555;">Total Usuarios:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; font-size: 18px; color: #00A651; font-weight: bold;">${totalUsuarios}</td>
              </tr>
            </table>
            
            <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #2e7d32;">
                <strong>✓ Archivo Excel adjunto</strong><br>
                El reporte contiene todos los usuarios registrados en el día de hoy con sus datos completos.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Este es un reporte automático generado por el sistema Club ViveVerde.
              No responda a este correo.
            </p>
          </div>
          
          <div style="background-color: #333; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              Club ViveVerde - Sistema de Gestión de Usuarios<br>
              <a href="https://clubviveverde.com" style="color: #81c784;">clubviveverde.com</a>
            </p>
          </div>
        </div>
      `;
      mailOptions.attachments = [
        {
          filename: fileName,
          path: filePath
        }
      ];
    } else {
      // Email sin usuarios (sin archivo adjunto)
      mailOptions.subject = `Reporte Diario - Sin usuarios registrados ${formattedDate} - Club ViveVerde`;
      mailOptions.html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00A651; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Club ViveVerde</h1>
            <p style="color: white; margin: 5px 0 0 0;">Reporte de Usuarios Diarios</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <h2 style="color: #333; margin-top: 0;">Reporte del Día</h2>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>ℹ Información</strong><br>
                No se han registrado nuevos usuarios en el día de hoy (${formattedDate}).
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Este es un reporte automático generado por el sistema Club ViveVerde.
              No responda a este correo.
            </p>
          </div>
          
          <div style="background-color: #333; padding: 15px; text-align: center;">
            <p style="color: white; margin: 0; font-size: 12px;">
              Club ViveVerde - Sistema de Gestión de Usuarios<br>
              <a href="https://clubviveverde.com" style="color: #81c784;">clubviveverde.com</a>
            </p>
          </div>
        </div>
      `;
    }

    // Enviar el email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('');
    console.log(`✓ Email enviado exitosamente a: ${EMAIL_DESTINATARIO}`);
    console.log(`  ID del mensaje: ${info.messageId}`);
    console.log(`  Tipo: ${hayUsuarios ? 'CON usuarios (archivo adjunto)' : 'SIN usuarios'}`);
    console.log('--------------------------------------------------------------------------------');
    
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('');
    console.error('✗ Error al enviar el email:');
    console.error(`  Mensaje: ${error.message}`);
    console.error('--------------------------------------------------------------------------------');
    return { success: false, error: error.message };
  }
}

async function extractTodayUsersToExcel() {
  let connection;
  let filePath = null;
  let fileName = null;
  let totalUsuarios = 0;
  
  try {
    // Obtener la fecha actual
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    const formattedDate = `${day}/${month}/${year}`;

    console.log('================================================================================');
    console.log('  EXTRACCIÓN DE USUARIOS CREADOS EN EL DÍA DE HOY - CLUB VIVEVERDE');
    console.log('================================================================================');
    console.log(`Fecha de consulta: ${formattedDate}`);
    console.log(`Hora: ${today.toLocaleTimeString()}`);
    console.log('');

    // Crear conexión a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión a la base de datos establecida.');

    // Consulta para obtener usuarios creados hoy con todos los datos incluyendo vivienda y animales
    const [rows] = await connection.execute(
      `SELECT 
        p.codigo AS id_usuario,
        p.nombres AS nombre,
        p.apellidos AS apellido,
        p.fecha_nacimiento AS fecha_nac,
        p.mail AS correo_electronico,
        p.telefono AS telefono,
        d.pais AS pais,
        d.codpostal AS codigo_postal,
        d.ciudad AS ciudad,
        d.provincia AS provincia,
        pr.caracteristicas_vivienda AS caracteristicas_vivienda,
        pr.animales AS animales,
        p.rol AS rol_usuario,
        p.creado_en AS fecha_creacion,
        CASE p.status 
          WHEN 1 THEN 'Activo' 
          WHEN 0 THEN 'Inactivo' 
          ELSE 'Desconocido' 
        END AS estado,
        p.puntos AS puntos_actuales
      FROM personas p
      LEFT JOIN direcciones d ON p.codigo = d.codigo
      LEFT JOIN propiedades pr ON p.codigo = pr.codigo
      WHERE DATE(p.creado_en) = ?
      ORDER BY p.creado_en DESC`,
      [todayDate]
    );

    console.log(`Se encontraron ${rows.length} usuario(s) registrado(s) en el día de hoy.`);
    console.log('');

    // Procesar los datos para expandir las características de vivienda y animales
    const processedRows = rows.map(row => {
      const vivienda = parseSetValue(row.caracteristicas_vivienda, VIVIENDA_OPTIONS);
      const animales = parseSetValue(row.animales, ANIMALES_OPTIONS);
      
      return {
        ...row,
        // Datos básicos
        id_usuario: row.id_usuario,
        nombre: row.nombre || '',
        apellido: row.apellido || '',
        fecha_nac: row.fecha_nac || '',
        correo_electronico: row.correo_electronico || '',
        telefono: row.telefono || '',
        // Datos de dirección
        pais: row.pais || '',
        codigo_postal: row.codigo_postal || '',
        ciudad: row.ciudad || '',
        provincia: row.provincia || '',
        // Características de vivienda
        terraza: vivienda['terraza'] ? 'Sí' : 'No',
        balcon: vivienda['balcón'] ? 'Sí' : 'No',
        huerto: vivienda['huerto'] ? 'Sí' : 'No',
        cesped: vivienda['césped'] ? 'Sí' : 'No',
        jardin: vivienda['jardín'] ? 'Sí' : 'No',
        estanque: vivienda['estanque'] ? 'Sí' : 'No',
        marquesina: vivienda['marquesina'] ? 'Sí' : 'No',
        piscina: vivienda['piscina'] ? 'Sí' : 'No',
        // Animales
        sin_animales: animales['sin animales'] ? 'Sí' : 'No',
        perro: animales['perro(s)'] ? 'Sí' : 'No',
        gato: animales['gato(s)'] ? 'Sí' : 'No',
        pajaro: animales['pájaro(s)'] ? 'Sí' : 'No',
        pez: animales['pez (peces)'] ? 'Sí' : 'No',
        roedor: animales['roedor(es)'] ? 'Sí' : 'No',
        otros: animales['otros'] ? 'Sí' : 'No',
        animales_corral: animales['animales de corral'] ? 'Sí' : 'No',
        // Datos de usuario
        rol_usuario: row.rol_usuario || '',
        fecha_creacion: row.fecha_creacion || '',
        estado: row.estado || '',
        puntos_actuales: row.puntos_actuales || 0
      };
    });

    totalUsuarios = processedRows.length;

    if (processedRows.length > 0) {
      // Crear libro de trabajo Excel
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Club ViveVerde';
      workbook.created = new Date();
      
      // Crear hoja principal
      const worksheet = workbook.addWorksheet('Usuarios del Día', {
        properties: {
          tabColor: { argb: 'FF00A651' }
        }
      });

      // Definir columnas - exactamente como indico el usuario
      worksheet.columns = [
        { header: 'ID Usuario', key: 'id_usuario', width: 12 },
        { header: 'Nombre', key: 'nombre', width: 25 },
        { header: 'Apellido', key: 'apellido', width: 25 },
        { header: 'Fecha Nacimiento', key: 'fecha_nac', width: 15 },
        { header: 'Correo Electrónico', key: 'correo_electronico', width: 35 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'País', key: 'pais', width: 15 },
        { header: 'Código Postal', key: 'codigo_postal', width: 12 },
        { header: 'Ciudad', key: 'ciudad', width: 20 },
        { header: 'Provincia', key: 'provincia', width: 20 },
        // Características de vivienda
        { header: 'Terraza', key: 'terraza', width: 10 },
        { header: 'Balcón', key: 'balcon', width: 10 },
        { header: 'Huerto', key: 'huerto', width: 10 },
        { header: 'Césped', key: 'cesped', width: 10 },
        { header: 'Jardín', key: 'jardin', width: 10 },
        { header: 'Estanque', key: 'estanque', width: 10 },
        { header: 'Marquesina', key: 'marquesina', width: 10 },
        { header: 'Piscina', key: 'piscina', width: 10 },
        // Animales
        { header: 'Sin animales', key: 'sin_animales', width: 12 },
        { header: 'Perro(s)', key: 'perro', width: 10 },
        { header: 'Gato(s)', key: 'gato', width: 10 },
        { header: 'Pájaro(s)', key: 'pajaro', width: 10 },
        { header: 'Pez(peces)', key: 'pez', width: 10 },
        { header: 'Roedor(es)', key: 'roedor', width: 10 },
        { header: 'Otros', key: 'otros', width: 10 },
        { header: 'Animales de corral', key: 'animales_corral', width: 15 },
        // Datos de usuario
        { header: 'Rol', key: 'rol_usuario', width: 15 },
        { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
        { header: 'Estado', key: 'estado', width: 12 },
        { header: 'Puntos Actuales', key: 'puntos_actuales', width: 15 }
      ];

      // Estilo para la fila de encabezado
      worksheet.getRow(1).font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00A651' }
      };
      worksheet.getRow(1).alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      worksheet.getRow(1).height = 30;

      // Agregar datos
      processedRows.forEach((user, index) => {
        const row = worksheet.addRow({
          id_usuario: user.id_usuario,
          nombre: user.nombre || '',
          apellido: user.apellido || '',
          fecha_nac: user.fecha_nac || '',
          correo_electronico: user.correo_electronico || '',
          telefono: user.telefono || '',
          pais: user.pais || '',
          codigo_postal: user.codigo_postal || '',
          ciudad: user.ciudad || '',
          provincia: user.provincia || '',
          // Características de vivienda
          terraza: user.terraza,
          balcon: user.balcon,
          huerto: user.huerto,
          cesped: user.cesped,
          jardin: user.jardin,
          estanque: user.estanque,
          marquesina: user.marquesina,
          piscina: user.piscina,
          // Animales
          sin_animales: user.sin_animales,
          perro: user.perro,
          gato: user.gato,
          pajaro: user.pajaro,
          pez: user.pez,
          roedor: user.roedor,
          otros: user.otros,
          animales_corral: user.animales_corral,
          // Datos de usuario
          rol_usuario: user.rol_usuario || '',
          fecha_creacion: user.fecha_creacion || '',
          estado: user.estado || '',
          puntos_actuales: user.puntos_actuales || 0
        });

        // Alternar colores de fila
        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          };
        }

        // Centrar celdas específicas
        row.getCell('id_usuario').alignment = { horizontal: 'center' };
        row.getCell('ciudad').alignment = { horizontal: 'center' };
        row.getCell('estado').alignment = { horizontal: 'center' };
        row.getCell('puntos_actuales').alignment = { horizontal: 'right' };
        
        // Centrar las columnas de Sí/No
        const yesNoColumns = ['terraza', 'balcon', 'huerto', 'cesped', 'jardin', 'estanque', 'marquesina', 'piscina', 
                              'sin_animales', 'perro', 'gato', 'pajaro', 'pez', 'roedor', 'otros', 'animales_corral'];
        yesNoColumns.forEach(col => {
          row.getCell(col).alignment = { horizontal: 'center' };
        });
      });

      // Agregar fila de totales
      worksheet.addRow([]);
      const totalRow = worksheet.addRow({
        id_usuario: 'TOTAL:',
        puntos_actuales: processedRows.reduce((sum, user) => sum + (user.puntos_actuales || 0), 0)
      });
      totalRow.font = { bold: true, size: 12 };
      totalRow.getCell('puntos_actuales').font = { bold: true };

      // Agregar hoja de resumen
      const summarySheet = workbook.addWorksheet('Resumen', {
        properties: {
          tabColor: { argb: 'FF00A651' }
        }
      });

      summarySheet.columns = [
        { header: 'Métrica', key: 'metrica', width: 30 },
        { header: 'Valor', key: 'valor', width: 20 }
      ];

      summarySheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FF00A651' } };

      summarySheet.addRow({ metrica: 'Club ViveVerde', valor: '' });
      summarySheet.addRow({ metrica: 'Reporte de Usuarios Diarios', valor: '' });
      summarySheet.addRow({ metrica: '', valor: '' });
      summarySheet.addRow({ metrica: 'Fecha de Extracción', valor: formattedDate });
      summarySheet.addRow({ metrica: 'Hora de Extracción', valor: today.toLocaleTimeString() });
      summarySheet.addRow({ metrica: '', valor: '' });
      summarySheet.addRow({ metrica: 'Total Usuarios Registrados Hoy', valor: processedRows.length });
      summarySheet.addRow({ metrica: 'Total Puntos Acumulados', valor: processedRows.reduce((sum, user) => sum + (user.puntos_actuales || 0), 0) });
      summarySheet.addRow({ metrica: '', valor: '' });

      // Desglose por rol
      summarySheet.addRow({ metrica: 'Desglose por Rol:', valor: '' });
      const rolesCount = {};
      processedRows.forEach(user => {
        const rol = user.rol_usuario || 'Sin especificar';
        rolesCount[rol] = (rolesCount[rol] || 0) + 1;
      });
      Object.entries(rolesCount).forEach(([rol, count]) => {
        summarySheet.addRow({ metrica: `  - ${rol}`, valor: count });
      });

      summarySheet.addRow({ metrica: '', valor: '' });
      summarySheet.addRow({ metrica: 'Desglose por Estado:', valor: '' });
      const statusCount = { 'Activo': 0, 'Inactivo': 0 };
      processedRows.forEach(user => {
        const estado = user.estado || 'Desconocido';
        if (statusCount.hasOwnProperty(estado)) {
          statusCount[estado]++;
        } else {
          statusCount['Desconocido'] = (statusCount['Desconocido'] || 0) + 1;
        }
      });
      Object.entries(statusCount).forEach(([estado, count]) => {
        if (count > 0) {
          summarySheet.addRow({ metrica: `  - ${estado}`, valor: count });
        }
      });

      // Guardar archivo
      const outputDir = path.join(__dirname, '..', 'exports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fileName = `usuarios_hoy_${todayDate.replace(/-/g, '')}.xlsx`;
      filePath = path.join(outputDir, fileName);

      await workbook.xlsx.writeFile(filePath);

      console.log('--------------------------------------------------------------------------------');
      console.log(`Archivo Excel generado exitosamente:`);
      console.log(`  Ruta: ${filePath}`);
      console.log(`  Nombre: ${fileName}`);
      console.log(`  Total registros: ${processedRows.length}`);
      console.log('--------------------------------------------------------------------------------');
      console.log('');
      console.log('RESUMEN:');
      console.log(`  - Usuarios activos: ${statusCount['Activo']}`);
      console.log(`  - Usuarios inactivos: ${statusCount['Inactivo']}`);
      console.log(`  - Roles diferentes: ${Object.keys(rolesCount).length}`);
      console.log(`  - Puntos totales: ${processedRows.reduce((sum, user) => sum + (user.puntos_actuales || 0), 0)}`);
      console.log('');
      
    } else {
      console.log('No se encontraron usuarios creados en el día de hoy.');
      console.log('');
    }

    console.log('================================================================================');
    console.log('                    Extracción completada exitosamente.');
    console.log('================================================================================');
    
    // ============================================================
    // UNICO ENVIO DE EMAIL - AL FINAL DEL PROCESO
    // Esta es la ÚNICA llamada a enviarEmailReporte en todo el script
    // La bandera emailYaEnviado garantiza que solo se envíe una vez
    // ============================================================
    await enviarEmailReporte(filePath, fileName, totalUsuarios, formattedDate);

  } catch (error) {
    console.error('');
    console.error('================================================================================');
    console.error('                         ERROR EN LA EXTRACCIÓN');
    console.error('================================================================================');
    console.error(`Mensaje de error: ${error.message}`);
    console.error('');
    console.error('Posibles causas:');
    console.error('  - La base de datos no está accesible');
    console.error('  - Las credenciales son incorrectas');
    console.error('  - El host/puerto son incorrectos');
    console.error('  - No hay usuarios registrados hoy');
    console.error('================================================================================');
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión a la base de datos cerrada.');
    }
  }
}

// Ejecutar el script
extractTodayUsersToExcel()
  .then(() => {
    console.log('');
    console.log(`[INFO] Bandera emailYaEnviado: ${emailYaEnviado}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    process.exit(1);
  });
