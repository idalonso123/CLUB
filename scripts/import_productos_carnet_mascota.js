/**
 * Script para importar los datos del Excel a la tabla productos_carnet_mascota
 * 
 * Uso: node import_productos_carnet_mascota.js
 * 
 * Requiere:
 * - mysql2 (npm install mysql2)
 * - pandas (pip install pandas) o usar el archivo CSV exportado
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'viveverde',
  multipleStatements: true
};

async function importData() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Primero crear la tabla si no existe
    console.log('Creando tabla productos_carnet_mascota...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS productos_carnet_mascota (
        id INT AUTO_INCREMENT PRIMARY KEY,
        Articulo VARCHAR(20) NOT NULL COMMENT 'Código de artículo',
        Nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del artículo',
        Talla VARCHAR(50) DEFAULT NULL COMMENT 'Talla del artículo',
        Color VARCHAR(50) DEFAULT NULL COMMENT 'Color del artículo',
        C_Barras VARCHAR(20) NOT NULL COMMENT 'Código de barras (único)',
        PVP DECIMAL(10,2) NOT NULL COMMENT 'Precio de venta al público',
        activo TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Si el producto está activo',
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
        UNIQUE KEY c_barras_unique (C_Barras),
        INDEX idx_articulo (Articulo),
        INDEX idx_nombre (Nombre),
        INDEX idx_buscar (Articulo, Nombre, C_Barras)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `);
    
    console.log('Tabla creada correctamente.');
    
    // Verificar si ya hay datos
    const [existingRows] = await connection.query('SELECT COUNT(*) as count FROM productos_carnet_mascota');
    if (existingRows[0].count > 0) {
      console.log(`Ya existen ${existingRows[0].count} productos en la tabla.`);
      console.log('¿Deseas borrar los datos existentes e importar de nuevo? (s/n)');
      // En modo batch, simplemente continuamos
    }
    
    // Leer el archivo Excel
    const excelPath = path.join(__dirname, '..', 'user_input_files', 'Alimento_mascota_2026-04-07.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      console.error('No se encontró el archivo Excel. Asegúrate de que el archivo existe en:');
      console.error(excelPath);
      console.log('\nAlternativamente, puedes exportar el Excel a CSV y usar load_data_from_csv.js');
      return;
    }
    
    console.log('Leyendo archivo Excel...');
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Encontrados ${data.length} productos en el archivo Excel.`);
    
    // Truncar la tabla si tiene datos
    await connection.query('TRUNCATE TABLE productos_carnet_mascota');
    
    // Preparar los datos para bulk insert
    const values = data.map(row => {
      const articulo = String(row.Articulo || row.Artículo || '').trim();
      const nombre = String(row.Nombre || '').trim();
      const talla = String(row.Talla || '').trim();
      const color = String(row.Color || '').trim();
      const cBarras = String(row.C_Barras || row['C_Barras'] || row['Código de barras'] || '').trim();
      const pvp = parseFloat(row.PVP) || 0;
      
      // Saltar filas sin código de barras
      if (!cBarras) return null;
      
      return [articulo, nombre, talla, color, cBarras, pvp];
    }).filter(row => row !== null);
    
    if (values.length === 0) {
      console.error('No se encontraron datos válidos para importar.');
      return;
    }
    
    console.log(`Insertando ${values.length} productos...`);
    
    // Bulk insert usando placeholders
    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();
    
    const query = `
      INSERT INTO productos_carnet_mascota (Articulo, Nombre, Talla, Color, C_Barras, PVP)
      VALUES ${placeholders}
    `;
    
    await connection.query(query, flatValues);
    
    console.log(`\n¡Importación completada!`);
    console.log(`Total de productos importados: ${values.length}`);
    
    // Verificar
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM productos_carnet_mascota');
    console.log(`Productos en la base de datos: ${finalCount[0].count}`);
    
  } catch (error) {
    console.error('Error durante la importación:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  importData()
    .then(() => {
      console.log('\nScript completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nError en el script:', error);
      process.exit(1);
    });
}

module.exports = { importData };
