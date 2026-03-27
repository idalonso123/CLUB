import mysql from 'serverless-mysql';

// Validar que las variables de entorno estén definidas
const mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'Club ViveVerde',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || ''
};

const db = mysql({
  config: mysqlConfig
});

export default async function executeQuery({ query, values = [] }: { query: string, values?: any[] }) {
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