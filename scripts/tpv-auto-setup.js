/**
 * Script de auto-instalación para TPV
 * Detecta si Electron está instalado y lo instala automáticamente
 * Diseñado para usuarios sin conocimientos informáticos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ELECTRON_PACKAGES = [
  'electron@^28.1.0',
  'electron-builder@^24.9.1',
  'electron-log@^5.0.3'
];

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠽', '⠾', '⠿'];

function log(message, type = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    progress: '🔄'
  };
  console.log(`${icons[type]} ${message}`);
}

function checkElectronInstalled() {
  try {
    execSync('npx electron --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkDependenciesInstalled() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const devDeps = packageJson.devDependencies || {};
    
    return (
      devDeps.electron &&
      devDeps['electron-builder'] &&
      devDeps['electron-log']
    );
  } catch (error) {
    return false;
  }
}

function installDependencies(progressCallback = null) {
  return new Promise((resolve, reject) => {
    let frameIndex = 0;
    
    log('🔍 Verificando entorno...', 'progress');
    
    if (checkDependenciesInstalled() && checkElectronInstalled()) {
      log('✅ Electron ya está instalado y configurado', 'success');
      resolve({ alreadyInstalled: true });
      return;
    }
    
    log('📦 Iniciando instalación automática...', 'progress');
    
    // Create a simple spinner animation
    const spinnerInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
      process.stdout.write(`\r${SPINNER_FRAMES[frameIndex]} Instalando dependencias... `);
    }, 100);
    
    try {
      // Step 1: Install npm packages
      log('📥 Descargando Electron (puede tardar unos minutos)...', 'progress');
      
      execSync('npm install', {
        stdio: 'pipe',
        env: { ...process.env, npm_config_progress: 'false' }
      });
      
      // Step 2: Install Electron packages
      execSync(`npm install ${ELECTRON_PACKAGES.join(' ')} --save-dev`, {
        stdio: 'pipe',
        env: { ...process.env, npm_config_progress: 'false' }
      });
      
      clearInterval(spinnerInterval);
      process.stdout.write('\n');
      
      log('✅ Instalación completada con éxito', 'success');
      resolve({ alreadyInstalled: false });
      
    } catch (error) {
      clearInterval(spinnerInterval);
      process.stdout.write('\n');
      log('❌ Error durante la instalación', 'error');
      reject(error);
    }
  });
}

function runSetup() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Club ViveVerde - Configurador TPV       ║');
  console.log('║  Instalación automática                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  
  installDependencies()
    .then(result => {
      console.log('');
      console.log('═══════════════════════════════════════════════');
      if (result.alreadyInstalled) {
        log('El sistema TPV ya está listo para usar', 'success');
      } else {
        log('El sistema TPV se ha configurado correctamente', 'success');
      }
      console.log('═══════════════════════════════════════════════');
      console.log('');
      console.log('Para iniciar las aplicaciones TPV, ejecuta:');
      console.log('  • npm run electron:search  (Ventana de búsqueda)');
      console.log('  • npm run electron:users   (Gestión de usuarios)');
      console.log('  • npm run electron:start   (Panel completo)');
      console.log('');
    })
    .catch(error => {
      log('La instalación ha fallado', 'error');
      console.log('Por favor, contacta con el administrador del sistema.');
      process.exit(1);
    });
}

// If run directly, execute setup
if (require.main === module) {
  runSetup();
}

module.exports = {
  checkElectronInstalled,
  checkDependenciesInstalled,
  installDependencies
};
