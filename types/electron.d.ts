/**
 * Club ViveVerde TPV - Definiciones de Tipos para Electron API
 * 
 * Este archivo define los tipos para la comunicación entre el
 * renderer y el proceso principal de Electron.
 */

export interface ProtocolStatus {
  registered: boolean;
  installed: boolean;
  version: string;
}

export interface ElectronAPI {
  // ========================================
  // APIs de Ventana
  // ========================================
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  toggleAlwaysOnTop: () => Promise<boolean>;
  
  // Abrir ventanas
  openUsersWindow?: () => Promise<void>;
  openSearchWindow?: () => Promise<void>;
  
  // Abrir URL externa (para protocolos)
  openExternal?: (url: string) => Promise<void>;
  
  // ========================================
  // APIs de Protocolo Personalizado
  // ========================================
  
  /**
   * Verificar si el protocolo clubviveverde:// está registrado en el sistema
   */
  getProtocolStatus?: () => Promise<ProtocolStatus>;
  
  /**
   * Escuchar cuando se necesita mostrar ayuda de instalación
   */
  onShowInstallHelp?: (callback: () => void) => void;
  
  // ========================================
  // APIs de Actualización
  // ========================================
  getUpdateStatus?: () => Promise<any>;
  checkForUpdates?: () => Promise<any>;
  applyUpdate?: () => Promise<any>;
  forceUpdate?: () => Promise<any>;
  onUpdateStatus?: (callback: (status: any) => void) => void;
  onUpdateAvailable?: (callback: (info: { version: string }) => void) => void;
  onUpdateReady?: (callback: () => void) => void;
  
  // ========================================
  // Eventos de Usuario desde otras ventanas
  // ========================================
  selectUser?: (user: TPVUser) => Promise<void>;
  userAction?: (action: string, data: any) => Promise<void>;
  onUserSelected?: (callback: (user: TPVUser) => void) => void;
  onUserSelectedFromSearch?: (callback: (user: TPVUser) => void) => void;
  onUserAction?: (callback: (data: { action: string; data: any }) => void) => void;
  
  // Limpiar listeners
  removeAllListeners: (channel: string) => void;
}

export interface TPVUser {
  id: number;
  firstName: string;
  lastName: string;
  points?: number;
  email?: string;
  phone?: string;
}

// Extender el objeto window para incluir la API de Electron
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
