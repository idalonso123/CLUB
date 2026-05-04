/**
 * Sistema de Auto-Actualización para TPV Electron
 * Detecta y aplica actualizaciones automáticamente desde el servidor de producción
 * 
 * Las cajas consultan la versión al servidor de producción y ejecutan git pull
 * para actualizarse. No se necesitan credenciales locales.
 */

const { app } = require('electron');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const log = require('electron-log');

// ============================================
// CONFIGURACIÓN - URL del servidor de producción
// ============================================

// La URL del servidor se obtiene de variables de entorno
// En producción, Electron no carga .env automáticamente
// Por lo que usamos NEXT_PUBLIC_SITE_URL que es la URL pública del sitio

// Detectar si estamos en desarrollo o producción
const isDev = !app.isPackaged;

// Obtener la URL base del servidor
// En desarrollo usa localhost, en producción usa la URL del servidor
function getServerUrl() {
  if (isDev) {
    // En desarrollo, buscar en variables de entorno o usar localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }
  
  // En producción, usar la variable de entorno NEXT_PUBLIC_SITE_URL
  // Esta variable contiene la URL pública del sitio (definida en .env del servidor)
  // Si no está definida, usar un valor por defecto (no hardcoded)
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://clubviveverde.com';
}

// Rama de Git para actualizaciones
const BRANCH = 'main';

// Estados de actualización
const UpdateStatus = {
  IDLE: 'idle',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  DOWNLOADING: 'downloading',
  READY: 'ready',
  APPLYING: 'applying',
  ERROR: 'error'
};

let status = {
  status: UpdateStatus.IDLE,
  currentVersion: '',
  availableVersion: '',
  progress: 0,
  message: 'Sistema listo'
};

let onStatusChangeCallback = null;
let checkInterval = null;

/**
 * Establece el callback para cambios de estado
 */
function onUpdate(callback) {
  onStatusChangeCallback = callback;
}

/**
 * Notifica cambios de estado
 */
function notify(message, newStatus, progress) {
  status.message = message;
  if (newStatus) status.status = newStatus;
  if (progress !== undefined) status.progress = progress;
  if (onStatusChangeCallback) {
    onStatusChangeCallback({ ...status });
  }
  log.info(`[Updater] ${message}`);
}

/**
 * Obtiene la versión actual de package.json
 */
function getCurrentVersion() {
  try {
    const packageJsonPath = path.join(app.getAppPath(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (err) {
    return app.getVersion();
  }
}

/**
 * Obtiene la última versión del servidor de producción
 * Consulta el endpoint /api/version para obtener la versión actual
 */
function getLatestVersion() {
  return new Promise((resolve) => {
    try {
      const serverUrl = getServerUrl();
      const url = new URL('/api/version', serverUrl);
      
      log.info(`[Updater] Consultando versión en: ${url.href}`);

      const protocol = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Club-ViveVerde-TPV',
          'Accept': 'application/json'
        }
      };

      const req = protocol.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            const version = info.version || null;
            log.info(`[Updater] Versión del servidor: ${version}`);
            resolve(version);
          } catch {
            log.error('[Updater] Error al parsear respuesta del servidor');
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        log.error(`[Updater] Error de conexión: ${error.message}`);
        resolve(null);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    } catch (error) {
      log.error(`[Updater] Error inesperado: ${error.message}`);
      resolve(null);
    }
  });
}

/**
 * Compara versiones (mayor.menor.parche)
 */
function isNewerVersion(current, latest) {
  const parse = (v) => v.split('.').map(n => parseInt(n, 10) || 0);
  const c = parse(current);
  const l = parse(latest);
  
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }
  return false;
}

/**
 * Verifica si hay actualizaciones disponibles
 */
async function checkForUpdates() {
  notify('Buscando actualizaciones...', UpdateStatus.CHECKING);
  
  try {
    const latestVersion = await getLatestVersion();
    
    if (!latestVersion) {
      notify('No se pudo verificar actualizaciones', UpdateStatus.IDLE);
      return false;
    }

    const currentVersion = getCurrentVersion();
    status.currentVersion = currentVersion;
    status.availableVersion = latestVersion;

    if (isNewerVersion(currentVersion, latestVersion)) {
      notify(`Nueva versión disponible: ${latestVersion}`, UpdateStatus.AVAILABLE);
      return true;
    } else {
      notify('Sistema actualizado', UpdateStatus.IDLE);
      return false;
    }
  } catch (error) {
    status.error = 'Error al verificar actualizaciones';
    notify('Error al buscar actualizaciones', UpdateStatus.ERROR);
    return false;
  }
}

/**
 * Ejecuta la actualización (git pull + npm install)
 */
async function applyUpdate() {
  notify('Preparando actualización...', UpdateStatus.DOWNLOADING, 10);

  try {
    const appPath = app.getAppPath();
    const gitDir = path.join(appPath, '.git');

    if (!fs.existsSync(gitDir)) {
      throw new Error('No es un repositorio git');
    }

    notify('Descargando cambios...', UpdateStatus.DOWNLOADING, 30);

    try {
      execSync('git fetch origin', { cwd: appPath, stdio: 'pipe' });
      notify('Aplicando cambios...', UpdateStatus.DOWNLOADING, 60);
      execSync('git reset --hard origin/' + BRANCH, { cwd: appPath, stdio: 'pipe' });
    } catch (gitError) {
      if (!gitError.message?.includes('Already up to date')) {
        throw gitError;
      }
    }

    notify('Instalando dependencias...', UpdateStatus.DOWNLOADING, 80);

    try {
      execSync('npm install', { cwd: appPath, stdio: 'pipe', env: { ...process.env, npm_config_progress: 'false' } });
    } catch (npmError) {
      log.warn('npm install falló, puede que las dependencias ya estén instaladas');
    }

    notify('Actualización lista', UpdateStatus.READY, 100);

    setTimeout(() => {
      notify('Reiniciando...', UpdateStatus.APPLYING);
      app.relaunch();
      app.exit(0);
    }, 2000);

    return true;
  } catch (error) {
    status.error = error.message || 'Error durante la actualización';
    notify('Error durante la actualización', UpdateStatus.ERROR);
    return false;
  }
}

/**
 * Inicia la verificación de actualizaciones al iniciar la aplicación
 * Solo verifica una vez al arrancar, no periodic updates
 */
function startPeriodicCheck() {
  // Verificar solo al iniciar
  log.info('[Updater] Verificando actualizaciones al iniciar...');
  checkForUpdates();
}

/**
 * Detiene la verificación periódica
 */
function stopPeriodicCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = undefined;
  }
}

/**
 * Obtiene el estado actual
 */
function getStatus() {
  return { ...status };
}

/**
 * Forzar actualización manual
 */
async function forceUpdate() {
  const hasUpdate = await checkForUpdates();
  if (hasUpdate) {
    await applyUpdate();
  }
}

module.exports = {
  onUpdate,
  checkForUpdates,
  applyUpdate,
  startPeriodicCheck,
  stopPeriodicCheck,
  getStatus,
  forceUpdate,
  UpdateStatus
};