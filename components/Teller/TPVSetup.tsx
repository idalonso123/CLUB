import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";

interface SetupStatus {
  electronInstalled: boolean;
  dependenciesConfigured: boolean;
  canRunElectron: boolean;
  message: string;
  needsSetup: boolean;
  protocolRegistered?: boolean;
}

interface TPVSetupProps {
  onSetupComplete?: () => void;
}

/**
 * Componente para configurar y gestionar el TPV
 * Detecta si está corriendo dentro de Electron o en el navegador
 * y muestra la interfaz apropiada en cada caso
 */
const TPVSetup: React.FC<TPVSetupProps> = ({ onSetupComplete }) => {
  const router = useRouter();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installMessage, setInstallMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Estado para detectar si estamos dentro de Electron
  const [isRunningInElectron, setIsRunningInElectron] = useState(false);
  const [windowsOpen, setWindowsOpen] = useState(false);

  useEffect(() => {
    // Detectar si estamos dentro de Electron
    const checkIfInElectron = () => {
      const inElectron = typeof window !== 'undefined' && 
        (window as any).electronAPI !== undefined;
      setIsRunningInElectron(inElectron);
      return inElectron;
    };
    
    checkIfInElectron();
    checkSetupStatus();
  }, []);

  /**
   * Verificar estado de configuración del TPV
   */
  const checkSetupStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const resp = await fetch("/api/tpv/setup?action=status");
      const data = await resp.json();
      setStatus(data);
      
      // Si ya está listo, redirigir automáticamente
      if (data.canRunElectron) {
        setTimeout(() => {
          onSetupComplete?.();
        }, 1500);
      }
    } catch (err) {
      setError("Error al verificar el estado del sistema");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verifica si el protocolo clubviveverde:// está registrado en Windows
   */
  const checkProtocolRegistered = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'clubviveverde://status';
      
      let timeoutId: NodeJS.Timeout;
      let resolved = false;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      };
      
      const handleResult = (registered: boolean) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(registered);
      };
      
      timeoutId = setTimeout(() => {
        handleResult(false);
      }, 2000);
      
      iframe.onload = () => {
        handleResult(true);
      };
      
      iframe.onerror = () => {
        handleResult(false);
      };
      
      document.body.appendChild(iframe);
    });
  }, []);

  /**
   * Descarga el script de instalación
   */
  const downloadInstallerScript = async () => {
    try {
      setIsInstalling(true);
      setInstallProgress(10);
      setInstallMessage("Preparando script...");

      const response = await fetch("/api/tpv/install-script");
      
      if (!response.ok) {
        throw new Error("No se pudo descargar el instalador");
      }

      setInstallProgress(50);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'install-tpv-windows.ps1';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setInstallProgress(100);
      setInstallMessage("Descarga completada. Ejecuta el archivo como Administrador.");
      setIsInstalling(false);

    } catch (err: any) {
      setError(err.message || "Error al descargar el instalador");
      setIsInstalling(false);
    }
  };

  /**
   * Abrir las ventanas flotantes del TPV desde Electron
   */
  const openTPVWindows = async () => {
    if (!isRunningInElectron) {
      setError("Esta función solo está disponible en la aplicación Electron");
      return;
    }

    try {
      const electronAPI = (window as any).electronAPI;
      
      setInstallProgress(20);
      setInstallMessage("Abriendo ventanas del TPV...");
      
      // Abrir ventana de búsqueda
      await electronAPI.openSearchWindow();
      setInstallProgress(50);
      
      // Abrir ventana de usuarios
      await electronAPI.openUsersWindow();
      setInstallProgress(100);
      
      setInstallMessage("Ventanas abiertas correctamente");
      setWindowsOpen(true);
      
      // Esperar un momento y luego completar
      setTimeout(() => {
        setIsInstalling(false);
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || "Error al abrir las ventanas del TPV");
      setIsInstalling(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Verificando sistema TPV...</p>
        </div>
      </div>
    );
  }

  // Sistema listo - mostrar según contexto
  if (status?.canRunElectron) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl text-green-700 font-semibold">¡Sistema listo!</p>
          <p className="text-gray-600 mt-2">Cargando TPV...</p>
        </div>
      </div>
    );
  }

  // ====================
  // MODO ELECTRON
  // ====================
  if (isRunningInElectron) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🖥️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">TPV - Club ViveVerde</h2>
          <p className="text-gray-600 mb-6">
            La aplicación Electron está corriendo correctamente.
          </p>

          {status && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Estado actual:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={status.electronInstalled ? "text-green-600" : "text-red-600"}>
                  {status.electronInstalled ? "✅" : "❌"} Aplicación Electron
                </li>
                <li className={status.dependenciesConfigured ? "text-green-600" : "text-red-600"}>
                  {status.dependenciesConfigured ? "✅" : "❌"} Dependencias configuradas
                </li>
              </ul>
            </div>
          )}

          {windowsOpen ? (
            <div className="space-y-4">
              <div className="bg-green-100 rounded-lg p-4">
                <p className="text-green-700 font-medium">✅ Ventanas abiertas</p>
                <p className="text-sm text-green-600 mt-1">
                  Las ventanas flotantes están disponibles en tu escritorio
                </p>
              </div>
              
              <button
                onClick={openTPVWindows}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Abrir ventanas de nuevo
              </button>
            </div>
          ) : (
            <button
              onClick={openTPVWindows}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 text-lg"
            >
              <span className="mr-2">🪟</span>
              Abrir ventanas flotantes arrastrables
            </button>
          )}

          <p className="text-xs text-gray-500 mt-4">
            Las ventanas flotantes te permiten arrastrarlas por la pantalla y mantenerlas siempre visibles
          </p>
        </div>
      </div>
    );
  }

  // ====================
  // MODO NAVEGADOR WEB
  // ====================
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">🖥️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Primera configuración</h2>
        <p className="text-gray-600 mb-6">
          Para usar el TPV necesitas instalar la aplicación de escritorio.
          Haz clic en el botón para descargar e instalar automáticamente.
        </p>

        {status && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-2">Estado actual:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className={status.dependenciesConfigured ? "text-green-600" : "text-red-600"}>
                {status.dependenciesConfigured ? "✅" : "❌"} Dependencias configuradas
              </li>
              <li className={status.electronInstalled ? "text-green-600" : "text-red-600"}>
                {status.electronInstalled ? "✅" : "❌"} Aplicación Electron instalada
              </li>
              <li className={status.protocolRegistered ? "text-green-600" : "text-red-600"}>
                {status.protocolRegistered ? "✅" : "❌"} Protocolo clubviveverde://
              </li>
            </ul>
          </div>
        )}

        {error && (
          <div className="bg-red-100 rounded-lg p-4 mb-4 text-left">
            <p className="text-red-700 font-medium">⚠️ Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={downloadInstallerScript}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 text-lg mb-4 flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          Descargar e instalar automáticamente
        </button>

        <p className="text-xs text-gray-500">
          Después de descargar, ejecuta el archivo como Administrador.
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={checkSetupStatus}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Verificar estado de nuevo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TPVSetup;