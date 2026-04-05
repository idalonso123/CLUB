/**
 * Script para extraer usuarios creados en el día de hoy
 * Uso: npx ts-node scripts/extract-today-users.ts
 */

import mysql from 'serverless-mysql';

// Configuración de la base de datos (misma que en lib/db.ts)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || ''
};

interface User {
  codigo: number;
  cif: string;
  apellidos: string;
  nombres: string;
  fecha_nacimiento: string | null;
  mail: string | null;
  telefono: string | null;
  rol: string;
  creado_en: string;
  status: number;
  puntos: number;
}

async function extractTodayUsers(): Promise<void> {
  // Crear conexión a la base de datos
  const db = mysql({
    config: mysqlConfig
  });

  try {
    // Obtener la fecha actual en formato YYYY-MM-DD
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

    // Consulta para obtener usuarios creados hoy
    const query = `
      SELECT 
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
      ORDER BY creado_en DESC
    `;

    const results = await db.query(query, [todayDate]) as User[];

    if (results.length === 0) {
      console.log('No se encontraron usuarios creados en el día de hoy.');
      console.log('');
    } else {
      console.log(`Se encontraron ${results.length} usuario(s) creado(s) hoy:`);
      console.log('-'.repeat(60));
      
      results.forEach((user, index) => {
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
      const csvHeader = 'codigo,cif,apellidos,nombres,email,telefono,rol,creado_en,status,puntos';
      const csvRows = results.map(user => 
        `"${user.codigo}","${user.cif}","${user.apellidos || ''}","${user.nombres || ''}","${user.mail || ''}","${user.telefono || ''}","${user.rol}","${user.creado_en}",${user.status},${user.puntos}`
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');

      // Guardar CSV en archivo
      const fs = await import('fs');
      const csvFileName = `usuarios_hoy_${todayDate.replace(/-/g, '')}.csv`;
      fs.writeFileSync(csvFileName, csvContent, 'utf8');
      console.log(`\n✅ Archivo CSV generado: ${csvFileName}`);
    }

    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error al extraer usuarios:', error);
    throw error;
  } finally {
    // Cerrar la conexión
    await db.end();
  }
}

// Ejecutar el script
extractTodayUsers()
  .then(() => {
    console.log('Script completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en la ejecución:', error);
    process.exit(1);
  });
