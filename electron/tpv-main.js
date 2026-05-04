/**
 * Club ViveVerde TPV - Proceso Principal de Electron
 * 
 * Este archivo gestiona las ventanas del sistema TPV como aplicaciones
 * Electron Standalone independientes para los cajeros.
 * 
 * Incluye sistema de auto-actualización automática.
 * Incluye protocolo personalizado clubviveverde:// para comunicación con navegador.
 */

const { app, BrowserWindow, ipcMain, Menu, Tray, shell, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');

// Importar sistema de auto-actualización
const updater = require('./tpv-updater');

// Configurar logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Iniciando Club ViveVerde TPV...');

// Protocolo personalizado para comunicación con navegador
const PROTOCOL_NAME = 'clubviveverde';

// Registrar protocolo personalizado ANTES de que la app esté lista
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_NAME);
}

// Almacenar referencias a las ventanas
let mainWindow = null;
let searchWindow = null;
let usersWindow = null;
let tray = null;
let isLaunchingFromProtocol = false;

// Determinar si estamos en modo desarrollo
const isDev = !app.isPackaged;

/**
 * Función para verificar si Electron está registrado como handler del protocolo
 * Devuelve true si la aplicación puede recibir comandos via clubviveverde://
 */
function isProtocolRegistered() {
  return app.isDefaultProtocolClient(PROTOCOL_NAME);
}

/**
 * Manejar comandos recibidos via protocolo clubviveverde://
 * Comandos soportados:
 * - clubviveverde://status -> Devuelve información de estado
 * - clubviveverde://open/dashboard -> Abre dashboard completo
 * - clubviveverde://open/search -> Abre ventana de búsqueda
 * - clubviveverde://open/users -> Abre ventana de usuarios
 * - clubviveverde://open/all -> Abre todas las ventanas
 * - clubviveverde://install -> Muestra pantalla de instalación
 */
function handleProtocolCommand(url) {
  log.info(`[Protocol] Comando recibido: ${url}`);
  
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.replace(/^\/+/, '');
    const command = parsedUrl.hostname || pathname;
    
    switch (command) {
      case 'status':
        // Devolver estado de la aplicación
        return {
          installed: true,
          running: mainWindow !== null || searchWindow !== null || usersWindow !== null,
          version: updater.getStatus().currentVersion || '1.0.0',
          windows: {
            main: mainWindow !== null,
            search: searchWindow !== null,
            users: usersWindow !== null
          }
        };
      
      case 'open':
        const target = parsedUrl.hostname || parsedUrl.pathname.replace(/^\/+/, '');
        if (target === 'dashboard' || parsedUrl.pathname.includes('dashboard')) {
          createMainWindow();
        } else if (target === 'search' || parsedUrl.pathname.includes('search')) {
          createSearchWindow();
        } else if (target === 'users' || parsedUrl.pathname.includes('users')) {
          createUsersWindow();
        } else if (target === 'all' || parsedUrl.pathname.includes('all')) {
          createMainWindow();
          createSearchWindow();
          createUsersWindow();
        }
        return { success: true, action: 'open', target: target };
      
      case 'install':
        // Abrir instrucciones de instalación (mostrar mensaje en la ventana principal)
        if (mainWindow) {
          mainWindow.webContents.send('show-install-help');
        } else {
          createMainWindow();
        }
        return { success: true, action: 'install' };
      
      default:
        log.warn(`[Protocol] Comando desconocido: ${command}`);
        return { success: false, error: 'Comando desconocido' };
    }
  } catch (error) {
    log.error('[Protocol] Error al procesar comando:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener la URL base de la aplicación Next.js
 * En desarrollo usa el puerto 3000, en producción usa la carpeta .next/build
 */
function getNextjsUrl() {
  if (isDev) {
    return 'http://localhost:3000';
  }
  return `file://${path.join(__dirname, '..')}`;
}

/**
 * Crear la ventana principal del TPV (Dashboard completo)
 */
function createMainWindow() {
  log.info('Creando ventana principal del TPV...');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Club ViveVerde - TPV',
    backgroundColor: '#f3f4f6',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png')
  });

  // Cargar la página TPV
  mainWindow.loadURL(`${getNextjsUrl()}/tpv`);
  
  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    log.info('Ventana principal cerrada');
    mainWindow = null;
    if (searchWindow) {
      searchWindow.close();
    }
    if (usersWindow) {
      usersWindow.close();
    }
    app.quit();
  });

  log.info('Ventana principal creada correctamente');
}

/**
 * Crear la ventana flotante de búsqueda (SearchForm Standalone)
 */
function createSearchWindow() {
  if (searchWindow) {
    searchWindow.focus();
    return;
  }

  log.info('Creando ventana de búsqueda TPV...');

  searchWindow = new BrowserWindow({
    width: 500,
    height: 150,
    minWidth: 400,
    minHeight: 120,
    resizable: true,
    maximizable: false,
    minimizable: true,
    closable: true,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    skipTaskbar: false,
    title: 'Club ViveVerde - Búsqueda',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-search.js')
    },
    icon: path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png')
  });

  searchWindow.loadURL(`${getNextjsUrl()}/tpv-search`);
  searchWindow.setMovable(true);

  if (process.platform === 'darwin') {
    searchWindow.setVisibleOnAllWorkspaces(true);
  }

  searchWindow.on('closed', () => {
    log.info('Ventana de búsqueda cerrada');
    searchWindow = null;
  });

  log.info('Ventana de búsqueda creada correctamente');
}

/**
 * Crear la ventana de usuarios (UsersTable Standalone)
 */
function createUsersWindow() {
  if (usersWindow) {
    usersWindow.focus();
    return;
  }

  log.info('Creando ventana de usuarios TPV...');

  usersWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 400,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,
    alwaysOnTop: true,
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

  usersWindow.loadURL(`${getNextjsUrl()}/tpv-users`);
  usersWindow.setVisibleOnAllWorkspaces(true);

  usersWindow.on('closed', () => {
    log.info('Ventana de usuarios cerrada');
    usersWindow = null;
  });

  log.info('Ventana de usuarios creada correctamente');
}

/**
 * Crear el menú de la aplicación con opciones de actualización
 */
function createMenu() {
  const template = [
    {
      label: 'Club ViveVerde',
      submenu: [
        {
          label: 'Abrir Dashboard TPV',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            if (!mainWindow) {
              createMainWindow();
            } else {
              mainWindow.focus();
            }
          }
        },
        {
          label: 'Ventana de Búsqueda',
          accelerator: 'CmdOrCtrl+B',
          click: () => createSearchWindow()
        },
        {
          label: 'Ventana de Usuarios',
          accelerator: 'CmdOrCtrl+U',
          click: () => createUsersWindow()
        },
        { type: 'separator' },
        {
          label: 'Buscar actualizaciones',
          accelerator: 'CmdOrCtrl+Shift+U',
          click: async () => {
            const hasUpdate = await updater.checkForUpdates();
            if (hasUpdate) {
              const result = await dialog.showMessageBox({
                type: 'question',
                buttons: ['Actualizar ahora', 'Más tarde'],
                defaultId: 0,
                title: 'Actualización disponible',
                message: `Hay una nueva versión disponible: ${updater.getStatus().availableVersion}`,
                detail: '¿Deseas actualizar ahora? La aplicación se reiniciará.'
              });
              if (result.response === 0) {
                updater.applyUpdate();
              }
            } else {
              dialog.showMessageBox({
                type: 'info',
                title: 'Sin actualizaciones',
                message: 'Ya tienes la última versión.'
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ventanas',
      submenu: [
        {
          label: 'Minimizar',
          role: 'minimize'
        },
        {
          label: 'Cerrar',
          role: 'close'
        },
        { type: 'separator' },
        {
          label: 'Siempre Visible',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.setAlwaysOnTop(menuItem.checked);
            }
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de Club ViveVerde',
          click: () => {
            const currentVersion = updater.getStatus().currentVersion || '1.0.0';
            dialog.showMessageBox({
              type: 'info',
              title: 'Acerca de Club ViveVerde',
              message: 'Club ViveVerde TPV',
              detail: `Versión ${currentVersion}\n\nSistema de Terminal Punto de Venta para el Club ViveVerde.\n\n© 2024 Club ViveVerde\n\nAuto-actualización: Activada`
            });
          }
        },
        {
          label: 'Verificar actualizaciones',
          click: async () => {
            await updater.checkForUpdates();
            const status = updater.getStatus();
            dialog.showMessageBox({
              type: 'info',
              title: 'Estado de actualizaciones',
              message: status.message,
              detail: `Versión actual: ${status.currentVersion}\nVersión disponible: ${status.availableVersion || 'Ninguna'}`
            });
          }
        }
      ]
    }
  ];

  if (isDev) {
    template[1].submenu.push(
      { type: 'separator' },
      { role: 'toggleDevTools' }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Crear icono de bandeja del sistema (System Tray)
 */
function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'public', 'icons', 'icon-512x512.png');
    const fs = require('fs');
    if (!fs.existsSync(iconPath)) {
      log.warn('Icono de bandeja no encontrado');
      return;
    }

    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir TPV',
        click: () => {
          if (!mainWindow) {
            createMainWindow();
          } else {
            mainWindow.show();
          }
        }
      },
      {
        label: 'Búsqueda Rápida',
        click: () => createSearchWindow()
      },
      {
        label: 'Gestión de Usuarios',
        click: () => createUsersWindow()
      },
      { type: 'separator' },
      {
        label: 'Buscar actualizaciones',
        click: async () => {
          const hasUpdate = await updater.checkForUpdates();
          if (hasUpdate) {
            tray.displayBalloon({
              title: 'Actualización disponible',
              content: `Nueva versión: ${updater.getStatus().availableVersion}`,
              iconType: 'info'
            });
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Salir',
        click: () => app.quit()
      }
    ]);

    tray.setToolTip('Club ViveVerde TPV');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
      }
    });

    log.info('Icono de bandeja creado correctamente');
  } catch (error) {
    log.error('Error al crear icono de bandeja:', error);
  }
}

/**
 * Manejar la creación de ventanas basada en argumentos de línea de comandos
 */
function handleCommandLineWindows() {
  const args = process.argv.slice(isDev ? 2 : 1);
  
  if (args.includes('--search')) {
    createSearchWindow();
  } else if (args.includes('--users')) {
    createUsersWindow();
  } else if (args.includes('--main')) {
    createMainWindow();
  }
}

/**
 * Iniciar el sistema de auto-actualización
 */
function initAutoUpdater() {
  log.info('Iniciando sistema de auto-actualización...');

  updater.onUpdate((status) => {
    log.info(`[Updater] Estado: ${status.status} - ${status.message}`);
    
    // Notificar a la ventana principal si existe
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', status);
    }

    // Si hay actualización disponible, mostrar notificación
    if (status.status === 'available') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', {
          version: status.availableVersion
        });
      }
    }
  });

  // Iniciar verificación de actualizaciones al arrancar
  updater.startPeriodicCheck();

  log.info('Sistema de auto-actualización iniciado');
}

// Eventos de la aplicación
app.whenReady().then(() => {
  log.info('Aplicación lista');
  
  createMenu();
  initAutoUpdater();
  
  // Si se lanzó desde protocolo, procesar comando
  if (isLaunchingFromProtocol && process.argv.length > 1) {
    const protocolUrl = process.argv.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (protocolUrl) {
      log.info(`[App] Lanzamiento desde protocolo: ${protocolUrl}`);
      handleProtocolCommand(protocolUrl);
    }
  }
  
  // Si no hay ventanas abiertas, crear dashboard principal
  if (!mainWindow && !searchWindow && !usersWindow) {
    createMainWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Manejar apertura de protocolo en macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  log.info(`[macOS] URL recibida: ${url}`);
  
  // Si la aplicación ya está corriendo, procesar inmediatamente
  if (mainWindow || searchWindow || usersWindow) {
    handleProtocolCommand(url);
  } else {
    // Guardar URL para procesar cuando la app esté lista
    isLaunchingFromProtocol = true;
    // Procesar después de un pequeño delay para asegurar que las ventanas están creadas
    setTimeout(() => {
      handleProtocolCommand(url);
    }, 1000);
  }
});

// Windows: manejar protocolo desde línea de comandos
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    log.info('[Windows] Segunda instancia detectada');
    
    // Buscar URL de protocolo en los argumentos
    const protocolUrl = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (protocolUrl) {
      log.info(`[Windows] Procesando URL: ${protocolUrl}`);
      handleProtocolCommand(protocolUrl);
    }
    
    // Enfocar ventana principal si existe
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  log.info('Todas las ventanas cerradas');
  updater.stopPeriodicCheck();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('Aplicación cerrándose...');
  updater.stopPeriodicCheck();
});

// IPC Handlers para protocolo personalizado
ipcMain.handle('get-protocol-status', () => {
  return {
    registered: isProtocolRegistered(),
    installed: true,
    version: updater.getStatus().currentVersion || '1.0.0'
  };
});

ipcMain.handle('open-external', (event, url) => {
  log.info(`[IPC] Abrir URL externa: ${url}`);
  return shell.openExternal(url);
});

// IPC Handlers para comunicación entre procesos
ipcMain.handle('open-users-window', () => {
  createUsersWindow();
});

ipcMain.handle('open-search-window', () => {
  createSearchWindow();
});

ipcMain.handle('select-user', (event, user) => {
  if (usersWindow) {
    usersWindow.webContents.send('user-selected', user);
  }
  if (mainWindow) {
    mainWindow.webContents.send('user-selected', user);
  }
});

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

// IPC Handlers para actualizaciones
ipcMain.handle('get-update-status', () => {
  return updater.getStatus();
});

ipcMain.handle('check-for-updates', async () => {
  return await updater.checkForUpdates();
});

ipcMain.handle('apply-update', async () => {
  return await updater.applyUpdate();
});

ipcMain.handle('force-update', async () => {
  return await updater.forceUpdate();
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  log.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Promesa rechazada no manejada:', reason);
});

log.info('Proceso principal inicializado');