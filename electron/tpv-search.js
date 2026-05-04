/**
 * Club ViveVerde TPV - Ventana de Búsqueda (SearchForm Standalone)
 * 
 * Esta aplicación Electron standalone muestra una ventana flotante
 * con el campo de búsqueda del sistema TPV.
 * 
 * Características:
 * - Ventana pequeña y compacta
 * - Siempre visible sobre otras ventanas (alwaysOnTop)
 * - Sin bordes de ventana para máxima integración con el ERP
 * - Buscador de clientes con autocompletado
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// Configurar logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Iniciando ventana de búsqueda TPV...');

// Almacenar referencia a la ventana
let searchWindow = null;

// Determinar si estamos en modo desarrollo
const isDev = !app.isPackaged;

/**
 * Obtener la URL base de la aplicación Next.js
 */
function getNextjsUrl() {
  if (isDev) {
    return 'http://localhost:3000';
  }
  return `file://${path.join(__dirname, '..')}`;
}

/**
 * Crear la ventana de búsqueda
 */
function createSearchWindow() {
  log.info('Creando ventana de búsqueda...');

  searchWindow = new BrowserWindow({
    width: 500,
    height: 150,
    minWidth: 400,
    minHeight: 120,
    maxWidth: 800,
    maxHeight: 200,
    resizable: true,
    maximizable: false,
    minimizable: true,
    closable: true,
    alwaysOnTop: true, // Siempre visible sobre el ERP
    frame: false, // Sin bordes de ventana
    transparent: false,
    skipTaskbar: false,
    title: 'Club ViveVerde - Búsqueda Rápida',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-search.js')
    },
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png')
  });

  // Posición inicial (esquina superior derecha)
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  searchWindow.setPosition(width - 520, 20);

  // Cargar la página de búsqueda standalone
  searchWindow.loadURL(`${getNextjsUrl()}/tpv-search`);

  // Permitir arrastrar la ventana
  searchWindow.setMovable(true);

  // En macOS, mantener visible en todos los espacios de trabajo
  if (process.platform === 'darwin') {
    searchWindow.setVisibleOnAllWorkspaces(true);
  }

  // Manejar el cierre de la ventana
  searchWindow.on('closed', () => {
    log.info('Ventana de búsqueda cerrada');
    searchWindow = null;
  });

  // Log cuando la ventana está lista
  searchWindow.webContents.on('did-finish-load', () => {
    log.info('Contenido de búsqueda cargado correctamente');
  });

  log.info('Ventana de búsqueda creada correctamente');
}

// Eventos de la aplicación
app.whenReady().then(() => {
  log.info('Aplicación de búsqueda lista');
  createSearchWindow();

  app.on('activate', () => {
    // En macOS, recrear ventana cuando se hace clic en el icono del dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createSearchWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('Todas las ventanas cerradas');
  // En macOS, las aplicaciones generalmente permanecen activas hasta que el usuario las cierra explícitamente
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('Aplicación de búsqueda cerrándose...');
});

// IPC Handlers
ipcMain.handle('minimize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.minimize();
  }
});

ipcMain.handle('close-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.close();
  }
});

ipcMain.handle('toggle-always-on-top', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const current = win.isAlwaysOnTop();
    win.setAlwaysOnTop(!current);
    return !current;
  }
  return false;
});

ipcMain.handle('select-user', (event, user) => {
  // Reenviar la selección de usuario a otras ventanas
  const { BrowserWindow } = require('electron');
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(win => {
    if (win !== event.sender) {
      win.webContents.send('user-selected-from-search', user);
    }
  });
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  log.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Promesa rechazada no manejada:', reason);
});

log.info('Proceso de búsqueda inicializado');
