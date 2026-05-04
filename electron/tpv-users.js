/**
 * Club ViveVerde TPV - Ventana de Gestión de Usuarios (UsersTable Standalone)
 * 
 * Esta aplicación Electron standalone muestra una ventana flotante
 * con la tabla de usuarios del sistema TPV.
 * 
 * Características:
 * - Ventana flotante pequeña
 * - Siempre visible sobre el ERP (alwaysOnTop)
 * - Bordes mínimos
 * - Copia exacta de UsersTable con toda su funcionalidad
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// Configurar logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Iniciando ventana de usuarios TPV...');

// Almacenar referencia a la ventana
let usersWindow = null;

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
 * Crear la ventana de usuarios
 */
function createUsersWindow() {
  log.info('Creando ventana de usuarios...');

  usersWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 400,
    maxWidth: 1400,
    maxHeight: 900,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    alwaysOnTop: true, // Siempre visible sobre el ERP
    frame: true,
    title: 'Club ViveVerde - Gestión de Usuarios',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-users.js')
    },
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png')
  });

  // Posición inicial (centro de la pantalla)
  usersWindow.center();

  // Cargar la página de usuarios standalone
  usersWindow.loadURL(`${getNextjsUrl()}/tpv-users`);

  // En macOS, mantener visible en todos los espacios de trabajo
  if (process.platform === 'darwin') {
    usersWindow.setVisibleOnAllWorkspaces(true);
  }

  // Manejar el cierre de la ventana
  usersWindow.on('closed', () => {
    log.info('Ventana de usuarios cerrada');
    usersWindow = null;
  });

  // Log cuando la ventana está lista
  usersWindow.webContents.on('did-finish-load', () => {
    log.info('Contenido de usuarios cargado correctamente');
  });

  log.info('Ventana de usuarios creada correctamente');
}

// Eventos de la aplicación
app.whenReady().then(() => {
  log.info('Aplicación de usuarios lista');
  createUsersWindow();

  app.on('activate', () => {
    // En macOS, recrear ventana cuando se hace clic en el icono del dock
    if (BrowserWindow.getAllWindows().length === 0) {
      createUsersWindow();
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
  log.info('Aplicación de usuarios cerrándose...');
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

ipcMain.handle('user-action', (event, action, data) => {
  // Manejar acciones de usuario (añadir saldo, ver recompensas, etc.)
  log.info(`Acción de usuario: ${action}`, data);
  
  // Reenviar a otras ventanas si es necesario
  const { BrowserWindow } = require('electron');
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(win => {
    if (win !== event.sender) {
      win.webContents.send('user-action-from-users', { action, data });
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

log.info('Proceso de usuarios inicializado');
