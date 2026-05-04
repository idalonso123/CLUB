/**
 * Instalador automático del sistema TPV Club ViveVerde
 * Diseñado para usuarios sin conocimientos informáticos
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_NAME = 'Club ViveVerde';
const ELECTRON_PACKAGES = [
  'electron@^28.1.0',
  'electron-builder@^24.9.1',
  'electron-log@^5.0.3'
];

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgGreen: '\x1b[42m',
  bgCyan: '\x1b[46m'
};

function log(message, type = 'info') {
  const symbols = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '🔧'
  };
  console.log(`${symbols[type] || '•'} ${message}`);
}

function logHeader(title) {
  console.log('\n' + colors.bgGreen + colors.white + ' ' + title.padEnd(50) + ' ' + colors.reset + '\n');
}

function logStep(step, total, message) {
  console.log(`\n${colors.cyan}[${step}/${total}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function clearScreen() {
  console.clear();
}

function checkNodeInstalled() {
  try {
    execSync('node --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkGitInstalled() {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkNpmInstalled() {
  try {
    execSync('npm --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkElectronInstalled() {
  try {
    execSync('npx electron --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkDependenciesConfigured() {
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

function printBanner() {
  clearScreen();
  console.log(`
${colors.bgCyan}${colors.white}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ███████╗███████╗██████╗  ██████╗  █████╗ ██████╗ ██████╗███████╗  ║
║     ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝  ║
║     ██████╔╝█████╗  █████╗  ██████╔╝██║   ██║███████║██████╔╝██████╔╝█████╗    ║
║     ██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗██║   ██║██╔══██║██╔══██╗██╔══██╗██╔══╝    ║
║     ██║  ██║███████╗███████╗██║  ██║╚██████╔╝██║  ██║██║  ██║██║  ██║███████╗  ║
║     ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝  ║
║                                                                               ║
║              Sistema TPV - Instalador Automático v1.0                          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
${colors.reset}
`);
}

async function waitForKey(message = 'Pulsa ENTER para continuar...') {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(message, () => {
      rl.close();
      resolve(true);
    });
  });
}

function runNpmInstall() {
  log('Instalando dependencias...', 'step');
  try {
    execSync('npm install', { 
      stdio: 'inherit',
      env: { ...process.env, npm_config_progress: 'false' }
    });
    return true;
  } catch (error) {
    log('Error durante npm install', 'error');
    return false;
  }
}

function installElectron() {
  log('Instalando Electron...', 'step');
  try {
    execSync(`npm install ${ELECTRON_PACKAGES.join(' ')} --save-dev`, {
      stdio: 'inherit',
      env: { ...process.env, npm_config_progress: 'false' }
    });
    return true;
  } catch (error) {
    log('Error durante la instalación de Electron', 'error');
    return false;
  }
}

async function main() {
  printBanner();
  
  logHeader('VERIFICACIÓN DEL SISTEMA');
  
  // Verificar requisitos
  log('Verificando Node.js...', 'info');
  if (!checkNodeInstalled()) {
    log('Node.js no está instalado. Por favor,instálalo desde https://nodejs.org', 'error');
    process.exit(1);
  }
  log('Node.js encontrado', 'success');
  
  log('Verificando npm...', 'info');
  if (!checkNpmInstalled()) {
    log('npm no está instalado. Por favor,instálalo desde https://nodejs.org', 'error');
    process.exit(1);
  }
  log('npm encontrado', 'success');
  
  log('Verificando Git...', 'info');
  if (!checkGitInstalled()) {
    log('Git no está instalado. Por favor,instálalo desde https://git-scm.com', 'warning');
    await waitForKey('Pulsa ENTER para continuar de todas formas o Ctrl+C para cancelar...');
  } else {
    log('Git encontrado', 'success');
  }
  
  await waitForKey();
  
  // Verificar estado actual
  printBanner();
  logHeader('ESTADO ACTUAL');
  
  const depsConfigured = checkDependenciesConfigured();
  const electronInstalled = checkElectronInstalled();
  
  log(`Dependencias configuradas: ${depsConfigured ? 'Sí' : 'No'}`, depsConfigured ? 'success' : 'warning');
  log(`Electron instalado: ${electronInstalled ? 'Sí' : 'No'}`, electronInstalled ? 'success' : 'warning');
  
  if (depsConfigured && electronInstalled) {
    log('\n🎉 El sistema TPV ya está listo para usar!', 'success');
    console.log('\nEjecuta uno de estos comandos para iniciar:');
    console.log('  npm run electron:search  - Ventana de búsqueda');
    console.log('  npm run electron:users   - Gestión de usuarios');
    console.log('  npm run electron:start   - Panel completo');
    process.exit(0);
  }
  
  // Instalación
  printBanner();
  logHeader('INSTALACIÓN DEL SISTEMA TPV');
  
  let step = 0;
  const totalSteps = depsConfigured ? 1 : 2;
  
  if (!depsConfigured) {
    step++;
    logStep(step, totalSteps, 'Instalando dependencias npm...');
    if (!runNpmInstall()) {
      log('La instalación ha fallido. Contacta con el administrador.', 'error');
      process.exit(1);
    }
  }
  
  if (!electronInstalled) {
    step++;
    logStep(step, totalSteps, 'Instalando Electron y herramientas...');
    if (!installElectron()) {
      log('La instalación ha fallido. Contacta con el administrador.', 'error');
      process.exit(1);
    }
  }
  
  // Verificar instalación
  printBanner();
  logHeader('VERIFICACIÓN FINAL');
  
  const finalDepsConfigured = checkDependenciesConfigured();
  const finalElectronInstalled = checkElectronInstalled();
  
  if (finalDepsConfigured && finalElectronInstalled) {
    log('\n🎉 ¡Instalación completada con éxito!', 'success');
    console.log('\nPuedes iniciar las aplicaciones TPV con estos comandos:\n');
    console.log('  ' + colors.cyan + 'npm run electron:search' + colors.reset + '  → Ventana de búsqueda rápida');
    console.log('  ' + colors.cyan + 'npm run electron:users' + colors.reset + '   → Gestión de usuarios');
    console.log('  ' + colors.cyan + 'npm run electron:start' + colors.reset + '   → Panel completo\n');
    
    console.log('Para más información, consulta la documentación en docs/CAJA_INSTALACION.md\n');
  } else {
    log('\n⚠️ La instalación no se ha completado correctamente', 'warning');
    log('Por favor, ejecuta el instalador de nuevo o contacta con el administrador.', 'warning');
    process.exit(1);
  }
}

// Ejecutar el instalador
main().catch((error) => {
  log(`Error inesperado: ${error.message}`, 'error');
  process.exit(1);
});
