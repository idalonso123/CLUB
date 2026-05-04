import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationReward {
  id: number;
  reward_id: number;
  reward_name: string;
  reward_description: string;
  reward_image_url: string;
  reward_points: number;
  unlocked_at: string;
}

const RewardNotificationModal: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id;
  
  // Estados simples
  const [notifications, setNotifications] = useState<NotificationReward[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Ref para evitar múltiples llamadas simultáneas
  const isLoadingRef = useRef(false);

  console.log('[RewardNotificationModal] Render:', {
    userId,
    isAuthenticated,
    authLoading,
    notificationsCount: notifications.length,
    isVisible
  });

  // Efecto para cargar notificaciones cuando cambia el usuario
  useEffect(() => {
    // No hacer nada si:
    // - Está cargando la autenticación
    // - No hay usuario
    // - No está autenticado
    if (authLoading || !userId || !isAuthenticated) {
      console.log('[RewardNotificationModal] Skipping - auth loading or no user');
      setNotifications([]);
      setIsVisible(false);
      isLoadingRef.current = false;
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('[RewardNotificationModal] Already loading, skipping');
      return;
    }

    console.log('[RewardNotificationModal] Loading notifications for userId:', userId);
    
    // Marcar como cargando
    isLoadingRef.current = true;
    
    // Función para obtener notificaciones
    const fetchNotifications = async () => {
      // CAPTURAR el userId actual para usar en toda la operación async
      // Esto evita problemas de desincronización durante la navegación
      const currentUserId = userId;
      
      try {
        console.log('[RewardNotificationModal] Fetching from API for userId:', currentUserId);
        const response = await fetch('/api/rewards/notifications', {
          credentials: 'include'
        });
        
        const data = await response.json();
        console.log('[RewardNotificationModal] API response:', data);
        
        // Verificar que el userId capturado aún coincide con el estado actual
        // Esto es solo una verificación de seguridad adicional
        if (currentUserId !== userId) {
          console.log('[RewardNotificationModal] UserId changed during fetch, ignoring response');
          return;
        }
        
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          console.log('[RewardNotificationModal] Found', data.notifications.length, 'notifications');
          setNotifications(data.notifications);
          setIsVisible(true);
        } else {
          console.log('[RewardNotificationModal] No notifications');
          setNotifications([]);
          setIsVisible(false);
        }
      } catch (error) {
        console.error('[RewardNotificationModal] Fetch error:', error);
        setNotifications([]);
        setIsVisible(false);
      } finally {
        isLoadingRef.current = false;
      }
    };

    // Ejecutar inmediatamente sin delay
    fetchNotifications();
    
  }, [userId, isAuthenticated, authLoading]);

  // Función para cerrar el modal
  const handleDismiss = async () => {
    if (notifications.length === 0) {
      console.log('[RewardNotificationModal] No notifications to dismiss');
      return;
    }
    
    console.log('[RewardNotificationModal] Dismissing notifications:', notifications.map(n => n.id));
    
    // Guardar los IDs antes de limpiar
    const idsToDismiss = notifications.map(n => n.id);
    
    // Limpiar UI inmediatamente
    setIsVisible(false);
    
    try {
      const response = await fetch('/api/rewards/notifications/dismiss', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: idsToDismiss })
      });
      
      const result = await response.json();
      console.log('[RewardNotificationModal] Dismiss API response:', result);
      
      if (result.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('[RewardNotificationModal] Dismiss error:', error);
    }
  };

  // Calcular si debe mostrar el modal
  const shouldShow = isVisible && notifications.length > 0;

  console.log('[RewardNotificationModal] shouldShow:', shouldShow);

  // No mostrar nada si no debe mostrar
  if (!shouldShow) {
    return null;
  }

  const count = notifications.length;
  const title = count === 1 
    ? '¡Felicidades! Nueva recompensa disponible'
    : `¡Felicidades! ${count} nuevas recompensas`;
  const message = count === 1
    ? 'Tienes 1 recompensa lista para canjear'
    : `Tienes ${count} recompensas listas para canjear`;
  const buttonText = count === 1 ? '¡Genial!' : `¡Genial! Ver ${count} recompensas`;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ 
          position: 'relative', 
          zIndex: 1000000,
          cursor: 'default'
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all z-10"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5 text-center">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            {count > 1 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                {count}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h2>
          <p className="text-green-100 mt-1">{message}</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-2">
              ¡Han desbloqueado nuevas recompensas por puntos!
            </p>
            <p className="text-gray-500 text-sm">
              Revisarlas y canjearlas antes de que caduquen
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-32 overflow-y-auto">
            <ul className="space-y-2">
              {notifications.map((n, i) => (
                <li key={n.id} className="flex items-center text-sm text-gray-700">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mr-2">
                    {i + 1}
                  </span>
                  <span className="font-medium">{n.reward_name}</span>
                  <span className="ml-auto text-yellow-600 font-semibold text-xs">
                    {n.reward_points} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-600 transition-all shadow-lg"
          >
            {buttonText}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Ve a la sección de recompensas para ver los detalles
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardNotificationModal;
