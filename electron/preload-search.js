/**
 * Club ViveVerde TPV - Preload Script para Ventana de Búsqueda
 * 
 * Este script expone APIs seguras al renderer para la comunicación
 * con el proceso principal de Electron.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Funciones de ventana
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  
  // Funciones de usuario
  selectUser: (user) => ipcRenderer.invoke('select-user', user),
  
  // Escuchar eventos del proceso principal
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
console.log('Preload de búsqueda cargado correctamente');
