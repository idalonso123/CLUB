import React, { useState } from "react";
import { motion } from "framer-motion";
import Modal from "@/components/Common/Modal/Modal";
import TabGroup from "@/components/Admin/User/Info/Components/TabGroup";
import Button from "@/components/Common/Button";
import UserHeaderInfo from "@/components/Admin/User/Info/UserHeaderInfo";
import UserInfoTab from "@/components/Admin/User/Info/UserInfoTab";
import UserLocationTab from "@/components/Admin/User/Info/UserLocationTab";
import UserPropertyPetTab from "@/components/Admin/User/Info/UserPropertyPetTab";
import UserPointsExpirationTab from "@/components/Admin/User/Info/UserPointsExpirationTab";
import { User } from "@/types/user";

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onEdit: (user: User) => void;
  onAdjustPoints: (user: User) => void;
  onUpdateStatus: (user: User) => void;
  onDelete: (user: User) => void;
  onManagePetCards?: (user: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  onClose,
  onEdit,
  onAdjustPoints,
  onUpdateStatus,
  onDelete,
  onManagePetCards,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) return null;

  // Determinar si la cuenta está desactivada usando ambas propiedades
  // Consideramos que está activa si status=1 o enabled=true
  const isActive = user.status === 1 || user.enabled === true || user.enabled === 1;
  const isDisabled = !isActive;

  // Definir las pestañas para el componente TabGroup
  const tabs = [
    {
      id: "info",
      label: "Información",
      icon: "fas fa-user",
      content: <UserInfoTab user={user} />
    },
    {
      id: "location",
      label: "Ubicación",  
      icon: "fas fa-map-marker-alt",
      content: <UserLocationTab user={user} />
    },
    {
      id: "property-pet",
      label: "Características",
      icon: "fas fa-home",
      content: <UserPropertyPetTab user={user} />
    },
    {
      id: "points-expiration",
      label: "Vencimiento de Puntos",
      icon: "fas fa-calendar-alt",
      content: <UserPointsExpirationTab user={user} />
    }
  ];

  return (
    <Modal isOpen={!!user} onClose={onClose} title="Detalles del Usuario">
      {/* Información de perfil del usuario */}
      <UserHeaderInfo user={user} />

      {/* Pestañas de navegación */}
      <TabGroup tabs={tabs} defaultActiveTab="info" className="mb-6" />

      {/* Botones de acción */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium mb-3">Acciones</h4>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => onEdit(user)} 
            variant="success" 
            icon="fas fa-edit"
          >
            Editar Usuario
          </Button>
          
          <Button 
            onClick={() => onAdjustPoints(user)} 
            variant="warning" 
            icon="fas fa-star"
          >
            Ajustar Puntos
          </Button>
          
          <Button 
            onClick={() => onUpdateStatus(user)}
            variant={isDisabled ? "success" : "danger"}
            icon={`fas ${isDisabled ? 'fa-user-check' : 'fa-user-slash'}`}
            disabled={isProcessing}
            highlight={isDisabled} // Destacar solo cuando está desactivado (para activar)
          >
            {isDisabled ? "Activar Cuenta" : "Desactivar Cuenta"}
          </Button>
          
          {onManagePetCards && (
            <Button 
              onClick={() => onManagePetCards(user)}
              className="bg-purple-700 hover:bg-purple-800 text-white"
              icon="fas fa-paw"
              disabled={isProcessing}
            >
              Carnet de mascota
            </Button>
          )}
          
          <Button 
            onClick={() => onDelete(user)}
            variant="danger"
            icon="fas fa-trash-alt"
            disabled={isProcessing}
          >
            Eliminar Usuario
          </Button>
        </div>
        
        {/* Mostrar advertencia si la cuenta está desactivada */}
        {isDisabled && (
          <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
            <div className="flex">
              <i className="fas fa-exclamation-triangle mt-0.5 mr-2"></i>
              <div>
                <p className="font-medium">Esta cuenta está desactivada</p>
                <p>El usuario no puede iniciar sesión hasta que se active nuevamente.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserDetailsModal;