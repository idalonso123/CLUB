/**
 * Script para exportar los datos del Excel a sentencias SQL INSERT
 * Útil si LOAD DATA LOCAL INFILE no está disponible en el servidor
 *
 * Uso: node export_productos_sql.js
 *
 * Requiere:
 * - pandas (pip install pandas) o xlsx (npm install xlsx)
 */

const fs = require('fs');
const path = require('path');

// Intentar leer con pandas (Python) o xlsx (Node.js)
async function readExcelFile(filePath) {
  try {
    // Intentar con xlsx de Node.js
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (e) {
    console.log('xlsx no disponible, intentando con pandas...');
    // Intentar con pandas
    const { execSync } = require('child_process');
    const pythonScript = `
import pandas as pd
import sys
import json

try:
    df = pd.read_excel('${filePath}')
    # Convertir a lista de diccionarios
    records = df.to_dict('records')
    print(json.dumps(records))
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
    const result = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
      encoding: 'utf-8'
    });
    return JSON.parse(result);
  }
}

function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  const escaped = String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '\\"');
  return `'${escaped}'`;
}

function formatNumber(num) {
  if (num === null || num === undefined || num === '') return 'NULL';
  const parsed = parseFloat(num);
  if (isNaN(parsed)) return 'NULL';
  return parsed.toFixed(2);
}

async function main() {
  const excelPath = path.join(__dirname, '..', 'user_input_files', 'Alimento_mascota_2026-04-07.xlsx');

  if (!fs.existsSync(excelPath)) {
    console.error('No se encontró el archivo Excel en:', excelPath);
    console.log('\nAsegúrate de que el archivo Alimento_mascota_2026-04-07.xlsx esté en la carpeta user_input_files');
    process.exit(1);
  }

  console.log('Leyendo archivo Excel...');
  const data = await readExcelFile(excelPath);

  console.log(`Encontrados ${data.length} productos.\n`);

  // Generar SQL
  const sqlStatements = [];

  sqlStatements.push('-- =====================================================');
  sqlStatements.push('-- Sentencias SQL para importar productos de carnet');
  sqlStatements.push(`-- Generado el: ${new Date().toISOString()}`);
  sqlStatements.push(`-- Total de productos: ${data.length}`);
  sqlStatements.push('-- =====================================================');
  sqlStatements.push('');
  sqlStatements.push('-- NOTA: Ejecutar estas sentencias después de crear la tabla');
  sqlStatements.push('-- usando el script create_productos_carnet_mascota.sql');
  sqlStatements.push('');
  sqlStatements.push('-- Desactivar temporalmente las foreign keys y unique checks si es necesario');
  sqlStatements.push('-- SET FOREIGN_KEY_CHECKS = 0;');
  sqlStatements.push('-- SET UNIQUE_CHECKS = 0;');
  sqlStatements.push('');
  sqlStatements.push('-- TRUNCATE TABLE para reemplazar datos existentes');
  sqlStatements.push('TRUNCATE TABLE productos_carnet_mascota;');
  sqlStatements.push('');
  sqlStatements.push('-- =====================================================');
  sqlStatements.push('-- DATOS');
  sqlStatements.push('-- =====================================================');
  sqlStatements.push('');

  let batchSize = 50;
  let insertStatements = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];

    // Manejar diferentes nombres de columnas
    const articulo = String(row.Articulo || row.Artículo || row.articulo || '').trim();
    const nombre = String(row.Nombre || row.nombre || '').trim();
    const talla = String(row.Talla || row.talla || row.Talla || '').trim();
    const color = String(row.Color || row.color || '').trim();
    const cBarras = String(row.C_Barras || row['C_Barras'] || row.c_barras || row['Código de barras'] || '').trim();
    const pvp = parseFloat(row.PVP || row.pvp || row.Pvp || 0);

    // Saltar filas sin código de barras
    if (!cBarras) {
      console.warn(`Saltando fila ${i + 1}: Sin código de barras`);
      continue;
    }

    // Saltar filas sin nombre
    if (!nombre) {
      console.warn(`Saltando fila ${i + 1}: Sin nombre`);
      continue;
    }

    const values = [
      escapeSQL(articulo),
      escapeSQL(nombre),
      escapeSQL(talla || null),
      escapeSQL(color || null),
      escapeSQL(cBarras),
      formatNumber(pvp)
    ];

    insertStatements.push(`(${values.join(', ')})`);

    // Generar INSERT cuando raggiungiamo batchSize o è l'ultimo
    if (insertStatements.length >= batchSize || i === data.length - 1) {
      sqlStatements.push(
        `INSERT INTO productos_carnet_mascota (Articulo, Nombre, Talla, Color, C_Barras, PVP) VALUES\n` +
        insertStatements.join(',\n') +
        ';'
      );
      sqlStatements.push('');
      insertStatements = [];
    }

    // Mostrar progreso
    if ((i + 1) % 500 === 0 || i === data.length - 1) {
      console.log(`Procesados ${i + 1}/${data.length} productos...`);
    }
  }

  sqlStatements.push('-- =====================================================');
  sqlStatements.push('-- Fin de datos');
  sqlStatements.push('-- =====================================================');
  sqlStatements.push('');
  sqlStatements.push('-- Reactivar checks');
  sqlStatements.push('-- SET FOREIGN_KEY_CHECKS = 1;');
  sqlStatements.push('-- SET UNIQUE_CHECKS = 1;');

  // Guardar archivo SQL
  const outputPath = path.join(__dirname, 'productos_carnet_mascota_data.sql');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');

  console.log(`\n¡Exportación completada!`);
  console.log(`Archivo generado: ${outputPath}`);
  console.log(`Total de productos exportados: ${data.length - insertStatements.length}`);
  console.log(`\nPara importar en MySQL:`);
  console.log(`  mysql -u usuario -p base_datos < ${outputPath}`);
}

main().catch(console.error);
