/**
 * Componente de Notificación de Actualización para TPV
 * Muestra notificaciones de actualización y permite al usuario aplicar updates
 */

import React, { useState, useEffect } from 'react';

interface UpdateStatus {
  status: string;
  currentVersion: string;
  availableVersion: string;
  progress: number;
  message: string;
}

interface UpdateNotificationProps {
  onUpdateComplete?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdateComplete }) => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado inicial
    checkUpdateStatus();

    // Escuchar eventos de actualización
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const api = (window as any).electronAPI;
      
      api.onUpdateStatus((newStatus: UpdateStatus) => {
        setStatus(newStatus);
        setIsUpdating(newStatus.status === 'downloading' || newStatus.status === 'applying');
      });

      api.onUpdateAvailable((info: { version: string }) => {
        setShowUpdateDialog(true);
      });

      api.onUpdateReady(() => {
        onUpdateComplete?.();
      });
    }

    // Verificar periódicamente
    const interval = setInterval(checkUpdateStatus, 5 * 60 * 1000); // Cada 5 minutos
    return () => clearInterval(interval);
  }, []);

  const checkUpdateStatus = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const api = (window as any).electronAPI;
        const currentStatus = await api.getUpdateStatus();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Error checking update status:', error);
      }
    }
  };

  const handleCheckUpdates = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        const api = (window as any).electronAPI;
        const hasUpdate = await api.checkForUpdates();
        
        if (hasUpdate) {
          setShowUpdateDialog(true);
        } else {
          alert('Ya tienes la última versión instalada.');
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
        setUpdateError('Error al verificar actualizaciones');
      }
    }
  };

  const handleApplyUpdate = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        setIsUpdating(true);
        setUpdateError(null);
        
        const api = (window as any).electronAPI;
        await api.applyUpdate();
        
        setShowUpdateDialog(false);
      } catch (error) {
        console.error('Error applying update:', error);
        setUpdateError('Error durante la actualización');
        setIsUpdating(false);
      }
    }
  };

  const handleDismissDialog = () => {
    setShowUpdateDialog(false);
  };

  // Mostrar indicador de actualización en progreso
  if (isUpdating && status) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          <div>
            <p className="font-medium">{status.message}</p>
            {status.progress > 0 && (
              <div className="mt-2">
                <div className="w-32 h-2 bg-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1 opacity-75">{status.progress}% completado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mostrar notificación de actualización disponible
  if (showUpdateDialog && status) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-5xl mb-4">🔄</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Actualización disponible
            </h2>
            <p className="text-gray-600 mb-4">
              Hay una nueva versión del sistema TPV disponible.
            </p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Versión actual:</span>
                <span className="font-medium">{status.currentVersion}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-green-600">Nueva versión:</span>
                <span className="font-bold text-green-600">{status.availableVersion}</span>
              </div>
            </div>

            {updateError && (
              <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 mb-4">
                {updateError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDismissDialog}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={isUpdating}
              >
                Más tarde
              </button>
              <button
                onClick={handleApplyUpdate}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                disabled={isUpdating}
              >
                {isUpdating ? 'Actualizando...' : 'Actualizar ahora'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar nada si no hay actualización disponible
  return null;
};

/**
 * Componente pequeño para mostrar en la barra de estado
 */
export const UpdateStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
          const api = (window as any).electronAPI;
          const currentStatus = await api.getUpdateStatus();
          setStatus(currentStatus);
        } catch (error) {
          console.error('Error getting update status:', error);
        }
      }
    };

    checkStatus();

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      const api = (window as any).electronAPI;
      api.onUpdateStatus((newStatus: UpdateStatus) => {
        setStatus(newStatus);
      });
    }
  }, []);

  if (!status) return null;

  // Mostrar solo si hay actualización disponible
  if (status.status === 'available') {
    return (
      <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
        <span>🔄</span>
        <span>Actualización disponible: {status.availableVersion}</span>
      </div>
    );
  }

  return null;
};

export default UpdateNotification;