const https = require('https');
const http = require('http');

const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://clubviveverde.com' 
    : 'http://localhost:3000',
  endpoint: '/api/cron/check-expired-points',
  timeout: 30000
};

async function checkExpiredPoints() {
  console.log(`[${new Date().toISOString()}] Iniciando verificación de puntos caducados...`);
  const url = `${config.baseUrl}${config.endpoint}`;
  const isHttps = url.startsWith('https');
  const client = isHttps ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[${new Date().toISOString()}] Verificación completada con éxito.`);
            console.log(`Puntos caducados procesados: ${response.processed || 0}`);
            resolve(response);
          } else {
            console.error(`[${new Date().toISOString()}] Error en la verificación:`, response.message || 'Error desconocido');
            reject(new Error(response.message || `Error HTTP ${res.statusCode}`));
          }
        } catch (error) {
          console.error(`[${new Date().toISOString()}] Error al procesar la respuesta:`, error.message);
          reject(error);
        }
      });
    });
    req.setTimeout(config.timeout, () => {
      req.abort();
      console.error(`[${new Date().toISOString()}] Timeout al verificar puntos caducados`);
      reject(new Error('Timeout al verificar puntos caducados'));
    });
    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Error al verificar puntos caducados:`, error.message);
      reject(error);
    });
  });
}

checkExpiredPoints()
  .then((result) => {
    console.log(`[${new Date().toISOString()}] Script finalizado correctamente.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] Error en el script:`, error.message);
    process.exit(1);
  });