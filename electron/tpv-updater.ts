/**
 * Sistema de Auto-Actualización para TPV Electron
 * Detecta y aplica actualizaciones automáticamente
 */

import { app, autoUpdater } from 'electron';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Configuración
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutos
const GITHUB_REPO = 'idalonso123/CLUB';
const BRANCH = 'main';

// Estados de actualización
export enum UpdateStatus {
  IDLE = 'idle',
  CHECKING = 'checking',
  AVAILABLE = 'available',
  DOWNLOADING = 'downloading',
  READY = 'ready',
  APPLYING = 'applying',
  ERROR = 'error'
}

export interface UpdateInfo {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion: string;
  progress: number;
  message: string;
  error?: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  created_at: string;
  html_url: string;
}

// Clase para manejar actualizaciones
class TPVUpdater {
  private status: UpdateInfo;
  private onStatusChange?: (status: UpdateInfo) => void;
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    this.status = this.getInitialStatus();
  }

  private getInitialStatus(): UpdateInfo {
    return {
      status: UpdateStatus.IDLE,
      currentVersion: app.getVersion(),
      availableVersion: '',
      progress: 0,
      message: 'Sistema listo'
    };
  }

  /**
   * Establece el callback para cambios de estado
   */
  onUpdate(callback: (status: UpdateInfo) => void) {
    this.onStatusChange = callback;
  }

  /**
   * Notifica cambios de estado
   */
  private notify(message: string, status?: UpdateStatus, progress?: number) {
    this.status.message = message;
    if (status) this.status.status = status;
    if (progress !== undefined) this.status.progress = progress;
    this.onStatusChange?.(this.status);
  }

  /**
   * Obtiene la versión actual de package.json
   */
  private getCurrentVersion(): string {
    try {
      const packageJsonPath = path.join(app.getAppPath(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return app.getVersion();
    }
  }

  /**
   * Obtiene la última versión del repositorio GitHub
   */
  async getLatestVersion(): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const options = {
          hostname: 'api.github.com',
          path: `/repos/${GITHUB_REPO}/releases/latest`,
          method: 'GET',
          headers: {
            'User-Agent': 'Club-ViveVerde-TPV',
            'Accept': 'application/vnd.github.v3+json'
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            try {
              const release: GitHubRelease = JSON.parse(data);
              resolve(release.tag_name?.replace(/^v/, '') || null);
            } catch {
              resolve(null);
            }
          });
        });

        req.on('error', () => {
          resolve(null);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          resolve(null);
        });

        req.end();
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Compara versiones (mayor.menor.parche)
   */
  private isNewerVersion(current: string, latest: string): boolean {
    const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
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
  async checkForUpdates(): Promise<boolean> {
    this.notify('Buscando actualizaciones...', UpdateStatus.CHECKING);
    
    try {
      const latestVersion = await this.getLatestVersion();
      
      if (!latestVersion) {
        this.notify('No se pudo verificar actualizaciones', UpdateStatus.IDLE);
        return false;
      }

      const currentVersion = this.getCurrentVersion();
      this.status.currentVersion = currentVersion;
      this.status.availableVersion = latestVersion;

      if (this.isNewerVersion(currentVersion, latestVersion)) {
        this.notify(`Nueva versión disponible: ${latestVersion}`, UpdateStatus.AVAILABLE);
        return true;
      } else {
        this.notify('Sistema actualizado', UpdateStatus.IDLE);
        return false;
      }
    } catch (error) {
      this.status.error = 'Error al verificar actualizaciones';
      this.notify('Error al buscar actualizaciones', UpdateStatus.ERROR);
      return false;
    }
  }

  /**
   * Ejecuta la actualización (git pull + npm install)
   */
  async applyUpdate(): Promise<boolean> {
    this.notify('Preparando actualización...', UpdateStatus.DOWNLOADING, 10);

    try {
      // Verificar que es un repositorio git
      const appPath = app.getAppPath();
      const gitDir = path.join(appPath, '.git');

      if (!fs.existsSync(gitDir)) {
        throw new Error('No es un repositorio git');
      }

      this.notify('Descargando cambios...', UpdateStatus.DOWNLOADING, 30);

      // Git pull
      try {
        execSync('git fetch origin', { cwd: appPath, stdio: 'pipe' });
        this.notify('Aplicando cambios...', UpdateStatus.DOWNLOADING, 60);
        execSync('git reset --hard origin/' + BRANCH, { cwd: appPath, stdio: 'pipe' });
      } catch (gitError: any) {
        // Si git pull falla, puede que no haya cambios
        if (!gitError.message?.includes('Already up to date')) {
          throw gitError;
        }
      }

      this.notify('Instalando dependencias...', UpdateStatus.DOWNLOADING, 80);

      // NPM install
      try {
        execSync('npm install', { cwd: appPath, stdio: 'pipe', env: { ...process.env, npm_config_progress: 'false' } });
      } catch (npmError) {
        // No es crítico si npm install falla
        console.warn('npm install falló, puede que las dependencias ya estén instaladas');
      }

      this.notify('Actualización lista', UpdateStatus.READY, 100);

      // Reiniciar la aplicación
      setTimeout(() => {
        this.notify('Reiniciando...', UpdateStatus.APPLYING);
        app.relaunch();
        app.exit(0);
      }, 2000);

      return true;
    } catch (error: any) {
      this.status.error = error.message || 'Error durante la actualización';
      this.notify('Error durante la actualización', UpdateStatus.ERROR);
      return false;
    }
  }

  /**
   * Inicia la verificación periódica de actualizaciones
   */
  startPeriodicCheck(interval: number = UPDATE_CHECK_INTERVAL) {
    // Verificar inmediatamente
    this.checkForUpdates();

    // Programar verificaciones periódicas
    this.checkInterval = setInterval(() => {
      this.checkForUpdates();
    }, interval);
  }

  /**
   * Detiene la verificación periódica
   */
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Obtiene el estado actual
   */
  getStatus(): UpdateInfo {
    return { ...this.status };
  }
}

// Exportar instancia singleton
export const updater = new TPVUpdater();
export default updater;