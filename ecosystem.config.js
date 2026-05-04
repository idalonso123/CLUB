// ==============================================================================
// CONFIGURACIÓN PM2 - CLUB VIVE VERDE
// ==============================================================================
// Archivo de configuración para PM2 que permite gestionar la aplicación
// Next.js como un servicio de producción con características avanzadas.
//
// Uso: pm2 start ecosystem.config.js
//        pm2 start ecosystem.config.js --env production
//        pm2 start ecosystem.config.js --env development
//
// Variables de entorno configurables (desde .env):
//   APP_NAME            - Nombre de la aplicación (default: club-viveverde)
//   PM2_SERVICE_NAME    - Nombre del servicio en PM2
//   PORT                - Puerto de la aplicación (default: 3000)
//   HOSTNAME            - Host donde escuchar (default: 0.0.0.0)
//   NODE_ENV            - Entorno (production/development)
//   MAX_MEMORY          - Memoria máxima para reinicio (default: 1G)
//   LOG_DIR             - Directorio de logs (default: /var/log/pm2)
// ==============================================================================

const path = require('path');

// ==============================================================================
// CONFIGURACIÓN BASE
// ==============================================================================

// Detectar directorio del proyecto (donde está este archivo)
const PROJECT_DIR = __dirname;

// Cargar variables de entorno desde .env si existe
const fs = require('fs');
const dotenvPath = path.join(PROJECT_DIR, '.env');

if (fs.existsSync(dotenvPath)) {
    const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
    dotenvContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        // Ignorar comentarios y líneas vacías
        if (!trimmedLine || trimmedLine.startsWith('#')) return;
        
        const match = trimmedLine.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (match) {
            const key = match[1];
            let value = match[2];
            // Eliminar comillas
            value = value.replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
    });
}

// ==============================================================================
// VARIABLES CONFIGURABLES
// ==============================================================================

const APP_NAME = process.env.APP_NAME || 
                 process.env.PM2_SERVICE_NAME || 
                 'club-viveverde';

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
const MAX_MEMORY = process.env.MAX_MEMORY || '1G';
const LOG_DIR = process.env.LOG_DIR || '/var/log/pm2';
const INSTANCES = parseInt(process.env.PM2_INSTANCES, 10) || 1;
const EXEC_MODE = process.env.PM2_EXEC_MODE || 'cluster';

// Nombre de la empresa para logs
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Club ViveVerde';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://clubviveverde.com';

// ==============================================================================
// CONFIGURACIÓN DE PM2
// ==============================================================================

module.exports = {
  apps: [
    {
      // Nombre de la aplicación
      name: APP_NAME,
      
      // Script principal de Next.js
      script: 'node_modules/next/dist/bin/next',
      args: `start -p ${PORT}`,
      
      // Directorio de trabajo
      cwd: PROJECT_DIR,
      
      // Número de instancias (1 para evitar conflictos de puerto)
      instances: INSTANCES,
      
      // Reinicio automático
      autorestart: true,
      
      // No vigilar cambios en producción
      watch: false,
      
      // Reiniciar si supera esta memoria
      max_memory_restart: MAX_MEMORY,
      
      // Variables de entorno para PRODUCCIÓN
      env: {
        NODE_ENV: 'production',
        PORT: PORT,
        HOSTNAME: HOSTNAME,
        APP_NAME: APP_NAME,
        SITE_URL: SITE_URL,
      },
      
      // Variables de entorno para DESARROLLO
      env_development: {
        NODE_ENV: 'development',
        PORT: PORT,
        HOSTNAME: HOSTNAME,
        APP_NAME: APP_NAME,
        SITE_URL: 'http://localhost:' + PORT,
      },
      
      // Archivos de log
      log_file: path.join(LOG_DIR, `${APP_NAME}.log`),
      out_file: path.join(LOG_DIR, `${APP_NAME}-out.log`),
      error_file: path.join(LOG_DIR, `${APP_NAME}-error.log`),
      
      // Formato de fecha en logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Combinar logs de diferentes instancias
      merge_logs: true,
      
      // Configuración de reinicio
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: 5000,
      
      // Modo de ejecución
      exec_mode: EXEC_MODE,
      
      // Notificaciones
      notify: true,
      notify_label: COMPANY_NAME,
      
      // Fuente de métricas
      source: './',
    },
  ],
};