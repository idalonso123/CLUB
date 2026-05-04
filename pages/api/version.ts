/**
 * API endpoint para gestión de versiones y actualizaciones
 * 
 * Este endpoint permite a las aplicaciones TPV Electron verificar
 * si hay actualizaciones disponibles en el servidor de producción.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Leer versión actual del package.json
function getCurrentVersion(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '0.0.1';
  } catch (error) {
    return '0.0.1';
  }
}

// Leer fecha de última modificación del proyecto
function getLastBuildDate(): string {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const stats = fs.statSync(packageJsonPath);
    return stats.mtime.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Método no permitido',
      message: 'Solo se acepta GET'
    });
  }

  const action = req.query.action as string;
  const version = getCurrentVersion();
  const buildDate = getLastBuildDate();

  // Endpoint principal: devolver información de versión
  if (!action || action === 'info') {
    return res.status(200).json({
      success: true,
      version: version,
      buildDate: buildDate,
      buildNumber: process.env.BUILD_NUMBER || '1',
      environment: process.env.NODE_ENV || 'production',
      server: 'avoro',
      release: {
        version: version,
        date: buildDate,
        notes: 'Actualización disponible'
      },
      updateUrl: '/api/version',
      checksums: {
        // Aquí podrías añadir checksums para verificación de integridad
      }
    });
  }

  // Endpoint para verificar actualizaciones (para TPV Electron)
  if (action === 'check') {
    const currentVersion = req.query.v as string;
    
    if (!currentVersion) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro v (versión actual) requerido'
      });
    }

    const needsUpdate = compareVersions(currentVersion, version) < 0;

    return res.status(200).json({
      success: true,
      currentVersion: currentVersion,
      availableVersion: version,
      needsUpdate: needsUpdate,
      updateAvailable: needsUpdate,
      changelog: needsUpdate ? getChangelog() : null,
      downloadUrl: needsUpdate ? '/api/version?action=download' : null
    });
  }

  // Endpoint para descargar actualización
  if (action === 'download') {
    // En un sistema real, esto podría:
    // 1. Generar un ZIP con los archivos actualizados
    // 2. Apuntar a una carpeta con archivos listos para descargar
    // 3. Usar rsync/scp para transferir archivos
    
    return res.status(200).json({
      success: true,
      message: 'Para actualizar, las cajas usan git pull desde el servidor',
      alternative: 'Las cajas ejecutan: git pull origin main',
      instructions: [
        '1. El servidor de producción tiene el repositorio Git',
        '2. Las cajas verifican la versión con este endpoint',
        '3. Si hay actualización, las cajas ejecutan git pull',
        '4. Luego npm install para actualizar dependencias'
      ]
    });
  }

  // Endpoint de estado del servidor
  if (action === 'status') {
    return res.status(200).json({
      success: true,
      status: 'online',
      server: 'avoro',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: version
    });
  }

  // Si la acción no se reconoce
  return res.status(404).json({
    success: false,
    error: 'Acción no reconocida',
    availableActions: ['info', 'check', 'download', 'status']
  });
}

/**
 * Compara dos versiones (mayor.menor.parche)
 * Retorna:
 *   < 0 si v1 < v2 (v1 es más antiguo)
 *   = 0 si v1 == v2
 *   > 0 si v1 > v2 (v1 es más nuevo)
 */
function compareVersions(v1: string, v2: string): number {
  const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
  
  const parts1 = parse(v1);
  const parts2 = parse(v2);
  
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Obtener changelog (en una aplicación real, esto vendría de un archivo CHANGELOG.md)
 */
function getChangelog(): string[] {
  return [
    'Mejoras en el sistema TPV',
    'Corrección de errores',
    'Nuevas funcionalidades'
  ];
}