import React from 'react';
import { motion } from 'framer-motion';
import useRecentActivity from './hooks/useRecentActivity';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import { useRouter } from 'next/router';

interface RecentActivityProps {
  limit?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ limit = 5 }) => {
  const { activities, loading, error, refresh } = useRecentActivity(limit);
  const router = useRouter();

  // Función simplificada para navegar a logs
  const handleViewAllActivity = () => {
    // Usar el router para navegar a la página admin con la sección logs
    router.push('/admin?section=logs');
  };

  // Variantes de animación para los elementos de la lista
  const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  // Función para formatear una fecha en formato relativo (ej: "hace 5 horas")
  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true }) as string;
    } catch {
      return 'fecha desconocida';
    }
  };

  // Función para convertir JSON string a objeto (si es necesario)
  const parseDetails = (details: string | any) => {
    if (typeof details === 'object' && details !== null) {
      return details;
    }
    
    try {
      if (typeof details === 'string' && details.startsWith('{')) {
        return JSON.parse(details);
      }
      return details;
    } catch {
      return typeof details === 'string' ? details : 'Detalles no disponibles';
    }
  };

  // Función para renderizar una descripción amigable basada en el tipo de actividad
  const renderActivityDescription = (activity: any) => {
    // Si la descripción es un objeto, evitar renderizarlo directamente
    if (typeof activity.description === 'object' && activity.description !== null) {
      // Caso especial para redenciones de recompensas
      if (activity.description.rewardId && activity.description.rewardName) {
        return (
          <>
            <span className="font-medium">Recompensa canjeada:</span>{' '}
            {activity.description.rewardName} ({activity.description.pointsSpent} puntos)
          </>
        );
      }
      
      // Caso especial para creación o actualización de recompensas
      if (activity.description.name && activity.description.points !== undefined) {
        return (
          <>
            <span className="font-medium">Recompensa {activity.type === 'reward_create' ? 'creada' : 'actualizada'}:</span>{' '}
            {activity.description.name} ({activity.description.points} puntos)
          </>
        );
      }
      
      // Caso general: mostrar un resumen en lugar del objeto
      return <span className="font-medium">Actividad del sistema: {activity.type || 'acción desconocida'}</span>;
    }
    
    // Para la descripción que ya está procesada como string
    const details = parseDetails(activity.description);
    
    switch (activity.type) {
      case 'user_create':
        return <><span className="font-medium">Nuevo usuario</span> registrado</>;
      
      case 'user_update':
        return <><span className="font-medium">Usuario actualizado</span> {activity.entityName || ''}</>;
      
      case 'user_delete':
        return <><span className="font-medium">Usuario eliminado</span> {activity.entityName || ''}</>;
      
      case 'points_adjustment':
        if (typeof details === 'object' && details !== null) {
          const pointsChange = details.adjustment || details.pointsDifference || 0;
          return (
            <>
              <span className="font-medium">
                {pointsChange > 0 ? 'Puntos asignados' : 'Puntos restados'}
              </span> 
              <span className="ml-1">
                ({Math.abs(pointsChange)} pts) - {details.reason || ''}
              </span>
            </>
          );
        }
        return <><span className="font-medium">Ajuste de puntos</span></>;
      
      case 'reward_redeem':
        // Si tenemos detalles específicos como objeto, mostrarlos de forma legible
        if (typeof details === 'object' && details !== null && details.rewardName) {
          return (
            <>
              <span className="font-medium">Recompensa canjeada:</span>{' '}
              {details.rewardName} ({details.pointsSpent || 0} puntos)
            </>
          );
        }
        return <><span className="font-medium">Recompensa canjeada</span> {activity.entityName || ''}</>;
      
      case 'login':
        return <><span className="font-medium">Inicio de sesión</span> en el sistema</>;
      
      default:
        // Esto asegura que nunca se renderice un objeto directamente
        if (typeof activity.description === 'object') {
          return <>Actividad del sistema: {activity.type || ''}</>;
        }
        
        // Si es un string, lo mostramos directamente
        if (typeof activity.description === 'string') {
          // Verificar si es un JSON stringificado
          if (activity.description.startsWith('{') && activity.description.endsWith('}')) {
            try {
              const parsedObj = JSON.parse(activity.description);
              
              // Interpretar objetos JSON stringificados según su contenido
              if (parsedObj.rewardName) {
                return (
                  <>
                    <span className="font-medium">Recompensa:</span>{' '}
                    {parsedObj.rewardName}
                  </>
                );
              }
              
              if (parsedObj.name && parsedObj.points !== undefined) {
                return (
                  <>
                    <span className="font-medium">Recompensa:</span>{' '}
                    {parsedObj.name} ({parsedObj.points} puntos)
                  </>
                );
              }
              
              // Si no podemos interpretar específicamente, mostramos genérico
              return <>Actividad del sistema</>;
            } catch {
              // Si falla el parseo, simplemente mostramos el texto
              return <>{activity.description}</>;
            }
          }
          
          return <>{activity.description}</>;
        }
        
        return <>Actividad del sistema</>;
    }
  };

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">Error: {error}</p>
        <button 
          onClick={refresh}
          className="mt-2 text-sm text-green-600 hover:text-green-800"
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-lg text-gray-800">Actividad reciente</h2>
        <button 
          onClick={refresh} 
          className="text-xs text-green-600 hover:text-green-800"
          disabled={loading}
        >
          <i className="fas fa-sync-alt mr-1"></i> Actualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-1">
          <LoadingSpinner size="md" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <motion.div 
              key={activity.id} 
              className="flex items-start pb-3 border-b border-gray-100"
              custom={index}
              initial="hidden"
              animate="visible"
              variants={listItemVariants}
            >
              <div className={`w-8 h-8 rounded-full ${activity.iconBg || 'bg-green-100'} flex items-center justify-center mr-3`}>
                <i className={`fas ${activity.icon || 'fa-circle-info'} ${activity.iconColor || 'text-green-600'} text-sm`}></i>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  {/* Renderización segura de la descripción */}
                  {(() => {
                    try {
                      return renderActivityDescription(activity);
                    } catch (error) {
                      console.error("Error rendering activity description:", error);
                      return "Actividad del sistema";
                    }
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      <button 
        onClick={handleViewAllActivity}
        className="mt-2 text-sm text-green-600 hover:text-green-800 flex items-center"
      >
        Ver toda la actividad 
        <i className="fas fa-arrow-right ml-1"></i>
      </button>
    </div>
  );
};

export default RecentActivity;