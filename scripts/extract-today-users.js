/**
 * Script para extraer usuarios creados en el día de hoy (versión JavaScript)
 * Uso: node scripts/extract-today-users.js
 * 
 * Requiere: npm install mysql2 dotenv
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || ''
};

async function extractTodayUsers() {
  let connection;
  
  try {
    // Obtener la fecha actual
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;

    console.log('='.repeat(60));
    console.log('EXTRACCIÓN DE USUARIOS CREADOS HOY');
    console.log('='.repeat(60));
    console.log(`Fecha actual: ${todayDate}`);
    console.log('');

    // Crear conexión
    connection = await mysql.createConnection(dbConfig);

    // Consulta para obtener usuarios creados hoy
    const [rows] = await connection.execute(
      `SELECT 
        codigo,
        cif,
        apellidos,
        nombres,
        fecha_nacimiento,
        mail,
        telefono,
        rol,
        creado_en,
        status,
        puntos
      FROM personas
      WHERE DATE(creado_en) = ?
      ORDER BY creado_en DESC`,
      [todayDate]
    );

    if (rows.length === 0) {
      console.log('No se encontraron usuarios creados en el día de hoy.');
    } else {
      console.log(`Se encontraron ${rows.length} usuario(s) creado(s) hoy:`);
      console.log('-'.repeat(60));
      
      rows.forEach((user, index) => {
        console.log(`\n📋 USUARIO #${index + 1}`);
        console.log(`   Código: ${user.codigo}`);
        console.log(`   CIF/NIF: ${user.cif}`);
        console.log(`   Nombre completo: ${user.nombres || ''} ${user.apellidos || ''}`.trim());
        console.log(`   Email: ${user.mail || 'No disponible'}`);
        console.log(`   Teléfono: ${user.telefono || 'No disponible'}`);
        console.log(`   Rol: ${user.rol}`);
        console.log(`   Fecha creación: ${user.creado_en}`);
        console.log(`   Estado: ${user.status === 1 ? 'Activo' : 'Inactivo'}`);
        console.log(`   Puntos: ${user.puntos}`);
        console.log('-'.repeat(40));
      });

      // Generar CSV
      const fs = require('fs');
      const csvHeader = 'codigo,cif,apellidos,nombres,email,telefono,rol,creado_en,status,puntos';
      const csvRows = rows.map(user => 
        `"${user.codigo}","${user.cif}","${user.apellidos || ''}","${user.nombres || ''}","${user.mail || ''}","${user.telefono || ''}","${user.rol}","${user.creado_en}",${user.status},${user.puntos}`
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');

      const csvFileName = `usuarios_hoy_${todayDate.replace(/-/g, '')}.csv`;
      fs.writeFileSync(csvFileName, csvContent, 'utf8');
      console.log(`\n✅ Archivo CSV generado: ${csvFileName}`);
    }

    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error al extraer usuarios:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar
extractTodayUsers()
  .then(() => {
    console.log('Script completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en la ejecución:', error.message);
    process.exit(1);
  });
