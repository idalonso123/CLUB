import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CarnetNotification {
  id: number;
  rewardCarnetId: number;
  petCardId: number;
  petName: string;
  petType: string;
  nombrePienso: string;
  productPvp: number;
  rewardName: string;
  imageUrl: string | null;
  isExpired: boolean;
  fechaExpiracion: string | null;
  fechaCreacion: string;
}

/**
 * Modal de notificación para recompensas de carnets completados
 * Muestra una notificación cuando el usuario completa un carnet de mascota
 * y obtiene una recompensa de pienso gratis.
 */
const CarnetNotificationModal: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const userId = user?.id;
  
  // Estados simples
  const [notifications, setNotifications] = useState<CarnetNotification[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  // Ref para evitar múltiples llamadas simultáneas
  const isLoadingRef = useRef(false);

  console.log('[CarnetNotificationModal] Render:', {
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
      console.log('[CarnetNotificationModal] Skipping - auth loading or no user');
      setNotifications([]);
      setIsVisible(false);
      isLoadingRef.current = false;
      return;
    }

    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('[CarnetNotificationModal] Already loading, skipping');
      return;
    }

    console.log('[CarnetNotificationModal] Loading notifications for userId:', userId);
    
    // Marcar como cargando
    isLoadingRef.current = true;
    
    // Función para obtener notificaciones
    const fetchNotifications = async () => {
      // CAPTURAR el userId actual para usar en toda la operación async
      // Esto evita problemas de desincronización durante la navegación
      const currentUserId = userId;
      
      try {
        console.log('[CarnetNotificationModal] Fetching from API for userId:', currentUserId);
        const response = await fetch('/api/rewards/carnet-notifications', {
          credentials: 'include'
        });
        
        const data = await response.json();
        console.log('[CarnetNotificationModal] API response:', data);
        
        // Verificar que el userId capturado aún coincide con el estado actual
        // Esto es solo una verificación de seguridad adicional
        if (currentUserId !== userId) {
          console.log('[CarnetNotificationModal] UserId changed during fetch, ignoring response');
          return;
        }
        
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          console.log('[CarnetNotificationModal] Found', data.notifications.length, 'notifications');
          setNotifications(data.notifications);
          setIsVisible(true);
        } else {
          console.log('[CarnetNotificationModal] No notifications');
          setNotifications([]);
          setIsVisible(false);
        }
      } catch (error) {
        console.error('[CarnetNotificationModal] Fetch error:', error);
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
      console.log('[CarnetNotificationModal] No notifications to dismiss');
      return;
    }
    
    console.log('[CarnetNotificationModal] Dismissing notifications:', notifications.map(n => n.id));
    
    // Guardar los IDs antes de limpiar
    const idsToDismiss = notifications.map(n => n.id);
    
    // Limpiar UI inmediatamente
    setIsVisible(false);
    
    try {
      const response = await fetch('/api/rewards/carnet-notifications/dismiss', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds: idsToDismiss })
      });
      
      const result = await response.json();
      console.log('[CarnetNotificationModal] Dismiss API response:', result);
      
      if (result.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('[CarnetNotificationModal] Dismiss error:', error);
    }
  };

  // Calcular si debe mostrar el modal
  const shouldShow = isVisible && notifications.length > 0;

  console.log('[CarnetNotificationModal] shouldShow:', shouldShow);

  // No mostrar nada si no debe mostrar
  if (!shouldShow) {
    return null;
  }

  const count = notifications.length;
  const title = count === 1 
    ? '¡Carnet completado! Premio disponible'
    : `¡${count} carnets completados! Premios disponibles`;
  const message = count === 1
    ? 'Tienes 1 saco de pienso gratis para recoger'
    : `Tienes ${count} sacos de pienso gratis para recoger`;
  const buttonText = count === 1 ? '¡Genial!' : `¡Genial! Ver ${count} premios`;

  // Función para obtener el icono del tipo de mascota
  const getPetIcon = (petType: string) => {
    switch (petType?.toLowerCase()) {
      case 'perro':
        return (
          <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'gato':
        return (
          <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 999998,
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
          zIndex: 999999,
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

        {/* Header con gradiente naranja/marrón */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-center">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              {getPetIcon(notifications[0]?.petType)}
            </div>
            {count > 1 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">
                {count}
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-sm">{title}</h2>
          <p className="text-orange-100 mt-1">{message}</p>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg mb-2">
              ¡Has completado un carnet de mascota!
            </p>
            <p className="text-gray-500 text-sm">
              Tienes un saco de pienso gratis para recoger en tienda
            </p>
          </div>

          {/* Lista de recompensas */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
            <ul className="space-y-3">
              {notifications.map((n, i) => (
                <li key={n.id} className="flex items-center text-sm text-gray-700 bg-white rounded-lg p-2 shadow-sm">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">{n.rewardName}</span>
                    <span className="text-xs text-gray-500 block truncate">
                      Para {n.petName} ({n.petType})
                    </span>
                  </div>
                  <span className="ml-auto text-green-600 font-bold text-sm flex-shrink-0">
                    {n.productPvp > 0 ? `${n.productPvp.toFixed(2)}€` : 'GRATIS'}
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
            className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg"
          >
            {buttonText}
          </button>

          <p className="text-xs text-gray-500 text-center mt-3">
            Ve a la sección de carnets para ver los detalles y canjear
          </p>
        </div>
      </div>
    </div>
  );
};

export default CarnetNotificationModal;