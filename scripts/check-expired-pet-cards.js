const https = require('https');
const http = require('http');

const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://clubviveverde.com' 
    : 'http://localhost:3000',
  endpoint: '/api/cron/check-expired-pet-cards',
  timeout: 30000
};

async function checkExpiredPetCards() {
  console.log(`[${new Date().toISOString()}] Iniciando verificación de carnets de mascota caducados...`);
  const url = `${config.baseUrl}${config.endpoint}`;
  const isHttps = url.startsWith('https');
  const client = isHttps ? https : http;
  
  const options = {
    hostname: url.replace(/https?:\/\//, '').split(':')[0],
    port: isHttps ? 443 : 3000,
    path: config.endpoint,
    method: 'GET',
    timeout: config.timeout
  };
  
  return new Promise((resolve, reject) => {
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[${new Date().toISOString()}] Verificación completada con éxito.`);
            console.log(`Carnets de mascota eliminados: ${response.deletedCount || 0}`);
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
      console.error(`[${new Date().toISOString()}] Timeout al verificar carnets caducados`);
      reject(new Error('Timeout al verificar carnets caducados'));
    });
    
    req.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Error al verificar carnets caducados:`, error.message);
      reject(error);
    });
    
    req.end();
  });
}

checkExpiredPetCards()
  .then((result) => {
    console.log(`[${new Date().toISOString()}] Script finalizado correctamente.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] Error en el script:`, error.message);
    process.exit(1);
  });
