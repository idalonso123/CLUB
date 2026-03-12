import React from "react";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import { User } from "@/types/user";

interface StatusChangeModalProps {
  user: User;
  onConfirm: (user: User) => void;
  onCancel: () => void;
}

// Función para activar/desactivar un usuario
export const toggleUserStatus = async (userId: number): Promise<{status: number, enabled: boolean}> => {
  if (!userId || isNaN(userId)) {
    throw new Error("ID de usuario no válido");
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`Estado cambiado exitosamente. Nuevo estado: ${data.status}`);
      return {
        status: data.status, // Valor numérico (0 o 1)
        enabled: Boolean(data.status) // Valor booleano
      };
    } else {
      console.error("Error en respuesta del servidor:", data.message);
      throw new Error(data.message || 'Error al cambiar el estado del usuario');
    }
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
};

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({ 
  user, 
  onConfirm, 
  onCancel 
}) => {
  // Determinar si la cuenta está activada o desactivada
  // Verificamos ambas propiedades, asegurándonos de hacer comparaciones de tipo adecuadas
  const isActivating = (
    user.status === 0 || 
    (typeof user.enabled === 'number' && user.enabled === 0) || 
    user.enabled === false
  );
  const actionText = isActivating ? "Activar" : "Desactivar";
  
  // Preparar el usuario correctamente antes de pasarlo a onConfirm
  const handleConfirmClick = () => {
    // Asegurarse de que el ID es numérico y preparar el usuario con ambas propiedades
    const preparedUser = {
      ...user,
      id: Number(user.id),
      // Aseguramos que tanto status como enabled estén presentes
      status: typeof user.status === 'number' ? user.status : (user.enabled ? 1 : 0),
      enabled: Boolean(user.status) || Boolean(user.enabled)
    };
    
    onConfirm(preparedUser);
  };
  
  const icon = isActivating ? (
    <div className="bg-green-100 p-4 rounded-full">
      <i className="fas fa-user-check text-2xl text-green-700"></i>
    </div>
  ) : (
    <div className="bg-red-100 p-4 rounded-full">
      <i className="fas fa-user-slash text-2xl text-red-700"></i>
    </div>
  );
  
  const warningText = !isActivating ? `
    <p class="font-medium">Consecuencias de desactivar una cuenta:</p>
    <p>El usuario no podrá iniciar sesión ni acceder a sus datos hasta que se active nuevamente.</p>
  ` : undefined;
  
  return (
    <ConfirmationModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={handleConfirmClick}
      title={`${actionText} cuenta`}
      message={`¿Estás seguro de que quieres ${actionText.toLowerCase()} la cuenta de ${user.firstName} ${user.lastName}?`}
      confirmText={`${actionText} cuenta`}
      confirmButtonClass={
        isActivating ? "bg-green-700 hover:bg-green-800" : "bg-red-700 hover:bg-red-800"
      }
      icon={icon}
      warningText={warningText}
    />
  );
};

export default StatusChangeModal;