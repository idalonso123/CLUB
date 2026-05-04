import React from "react";
import ConfirmationModal from "@/components/Common/ConfirmationModal";
import { User } from "@/types/user"; // Importar la interfaz User compartida

interface ActivationModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (user: User) => void;
}

const ActivationModal: React.FC<ActivationModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!user) return null;

  // Verificar si la cuenta está desactivada (enabled puede ser 0, false, undefined)
  const isActivating = user.enabled === 0 || user.enabled === false;
  const actionText = isActivating ? "Activar" : "Desactivar";

  // Crear el ícono para el modal
  const icon = isActivating ? (
    <div className="bg-green-100 p-4 rounded-full">
      <i className="fas fa-user-check text-2xl text-green-700"></i>
    </div>
  ) : (
    <div className="bg-red-100 p-4 rounded-full">
      <i className="fas fa-user-slash text-2xl text-red-700"></i>
    </div>
  );

  // Texto de advertencia para desactivación
  const warningText = !isActivating ? `
    <p class="font-medium">Consecuencias de desactivar una cuenta:</p>
    <p>El usuario no podrá iniciar sesión ni acceder a sus datos hasta que se active nuevamente.</p>
  ` : undefined;

  // Asegurarse de pasar un objeto de usuario válido
  const handleConfirm = () => {
    // Crear un nuevo objeto para asegurarnos de que tenga el id correcto
    const preparedUser = {
      ...user,
      id: Number(user.id), // Convertir a número en caso de que sea string
      // No alteramos el valor de enabled, eso lo hará el backend
    };
    
    // console.loglog("Usuario enviado desde ActivationModal:", preparedUser);
    onConfirm(preparedUser);
  };

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm} // Usar nuestra función preparada
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

export default ActivationModal;