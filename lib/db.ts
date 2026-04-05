import mysql from 'serverless-mysql';

/**
 * Configuración de la base de datos MySQL
 * Optimizada para producción con pool de conexiones
 */
const mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  // Configuración del pool de conexiones
  pool: {
    min: 2,
    max: 10,
  },
  // Configuración de timeouts
  connectTimeout: 10000,
  // Configuración de reintentos
  retries: 3,
};

// Crear instancia de conexión con configuración optimizada
const db = mysql({
  config: mysqlConfig
});

/**
 * Ejecuta una consulta SQL con manejo de errores
 * @param params - Parámetros de la consulta
 * @param params.query - Consulta SQL a ejecutar
 * @param params.values - Valores para la consulta preparada
 * @returns Resultados de la consulta
 */
export default async function executeQuery({ 
  query, 
  values = [] 
}: { 
  query: string; 
  values?: any[] 
}) {
  try {
    const results = await db.query(query, values);
    // NO cerrar la conexión después de cada consulta en Next.js
    // serverless-mysql reutiliza las conexiones automáticamente
    return results;
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    throw error;
  }
}

/**
 * Ejecuta múltiples consultas en una transacción
 * @param queries - Array de consultas con sus valores
 * @returns Resultados de todas las consultas
 */
export async function executeTransaction(queries: Array<{ query: string; values?: any[] }>) {
  // Importar mysql2 dinámicamente para transacciones
  const mysql = await import('mysql2/promise');
  
  const connection = await mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  }).getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, values } of queries) {
      const [result] = await connection.query(query, values);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Error en la transacción SQL:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Verifica la salud de la conexión a la base de datos
 * @returns true si la conexión está saludable
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Health check falló:', error);
    return false;
  }
}