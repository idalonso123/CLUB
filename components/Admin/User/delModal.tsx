import React from "react";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import { User } from "@/types/user"; // Importar la interfaz User compartida

interface DeleteConfirmationModalProps {
  user: User;
  onConfirm: (user: User) => void;
  onCancel: () => void;
}

// Asegúrate de que esta función esté validando y procesando el ID correctamente
export const toggleUserStatus = async (userId: number): Promise<boolean> => {
  if (!userId || isNaN(userId)) {
    throw new Error("ID de usuario no válido");
  }

  try {
    // console.log(`Enviando solicitud para cambiar estado del usuario ID: ${userId}`);
    
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // console.log(`Estado cambiado exitosamente. Nuevo estado: ${data.enabled}`);
      return Boolean(data.enabled);
    } else {
      console.error("Error en respuesta del servidor:", data.message);
      throw new Error(data.message || 'Error al cambiar el estado del usuario');
    }
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    throw error;
  }
};

// Función para eliminar permanentemente un usuario
export const deleteUser = async (userId: number): Promise<boolean> => {
  if (!userId || isNaN(userId)) {
    throw new Error("ID de usuario no válido");
  }

  try {
    // console.log(`Enviando solicitud para eliminar el usuario ID: ${userId}`);
    
    const response = await fetch(`/api/admin/users/${userId}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // console.log(`Usuario eliminado exitosamente.`);
      return true;
    } else {
      console.error("Error en respuesta del servidor:", data.message);
      throw new Error(data.message || 'Error al eliminar el usuario');
    }
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    throw error;
  }
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  user, 
  onConfirm, 
  onCancel 
}) => {
  // Preparar el usuario correctamente antes de pasarlo a onConfirm
  const handleConfirmClick = () => {
    // Asegurarse de que el ID es numérico
    const preparedUser = {
      ...user,
      id: Number(user.id)
    };
    
    // console.log("Usuario enviado para eliminación:", preparedUser);
    onConfirm(preparedUser);
  };
  
  // Icono de eliminación
  const icon = (
    <div className="bg-red-100 p-4 rounded-full">
      <i className="fas fa-trash-alt text-2xl text-red-700"></i>
    </div>
  );
  
  // Texto de advertencia sobre la eliminación
  const warningText = `
    <p class="font-medium">Advertencia: Esta acción no se puede deshacer</p>
    <p>Se eliminarán permanentemente todos los datos del usuario, incluyendo:</p>
    <ul class="list-disc ml-5 mt-2">
      <li>Información personal y de contacto</li>
      <li>Historial de actividad y compras</li>
      <li>Puntos y beneficios acumulados</li>
    </ul>
  `;
  
  return (
    <ConfirmationModal
      isOpen={true}
      onClose={onCancel}
      onConfirm={handleConfirmClick}
      title="Eliminar usuario"
      message={`¿Estás seguro de que quieres eliminar permanentemente al usuario ${user.firstName} ${user.lastName}?`}
      confirmText="Eliminar usuario"
      confirmButtonClass="bg-red-700 hover:bg-red-800"
      icon={icon}
      warningText={warningText}
    />
  );
};

export default DeleteConfirmationModal;