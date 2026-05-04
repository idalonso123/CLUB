/**
 * Club ViveVerde TPV - Preload Script Principal
 * 
 * Este script expone APIs seguras al renderer para la comunicación
 * con el proceso principal de Electron.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // ========================================
  // APIs de Ventana
  // ========================================
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  
  // Abrir ventanas
  openUsersWindow: () => ipcRenderer.invoke('open-users-window'),
  openSearchWindow: () => ipcRenderer.invoke('open-search-window'),
  
  // Seleccionar usuario
  selectUser: (user) => ipcRenderer.invoke('select-user', user),
  
  // Abrir URL externa (para protocolos)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // ========================================
  // APIs de Protocolo Personalizado
  // ========================================
  
  /**
   * Verificar si el protocolo clubviveverde:// está registrado en el sistema
   */
  getProtocolStatus: () => ipcRenderer.invoke('get-protocol-status'),
  
  /**
   * Escuchar cuando se necesita mostrar ayuda de instalación
   */
  onShowInstallHelp: (callback) => {
    ipcRenderer.on('show-install-help', (event) => callback());
  },
  
  // ========================================
  // APIs de Actualización
  // ========================================
  
  /**
   * Obtener el estado actual de la actualización
   */
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  
  /**
   * Verificar si hay actualizaciones disponibles
   */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  /**
   * Aplicar la actualización descargada
   */
  applyUpdate: () => ipcRenderer.invoke('apply-update'),
  
  /**
   * Forzar actualización (check + apply)
   */
  forceUpdate: () => ipcRenderer.invoke('force-update'),
  
  /**
   * Escuchar eventos de actualización
   */
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, status) => callback(status));
  },
  
  /**
   * Escuchar cuando hay una actualización disponible
   */
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  
  /**
   * Escuchar cuando la actualización está lista para aplicar
   */
  onUpdateReady: (callback) => {
    ipcRenderer.on('update-ready', (event) => callback());
  },
  
  // ========================================
  // Eventos de Usuario desde otras ventanas
  // ========================================
  onUserSelected: (callback) => {
    ipcRenderer.on('user-selected', (event, user) => callback(user));
  },
  
  onUserSelectedFromSearch: (callback) => {
    ipcRenderer.on('user-selected-from-search', (event, user) => callback(user));
  },
  
  onUserAction: (callback) => {
    ipcRenderer.on('user-action-from-users', (event, data) => callback(data));
  },
  
  // Limpiar listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log para confirmar que el preload se ha cargado
console.log('Preload principal cargado correctamente');