import React from "react";
import { User } from "@/types/user";

interface UserTableRowProps {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onAdjustPoints: (user: User) => void;
  onDelete: (user: User) => void;
  onUpdateStatus: (user: User) => void;
  onManagePetCards?: (user: User) => void;
  onSubscriptionChange?: (user: User, subscribe: boolean) => void;
}

const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  onView,
  onEdit,
  onAdjustPoints,
  onDelete,
  onUpdateStatus,
  onManagePetCards,
  onSubscriptionChange,
}) => {

  // Verificar el estado usando ambas propiedades: status y enabled
  // Consideramos que el usuario está activo si status=1 o enabled=true
  const isActive = user.status === 1 || user.enabled === true || user.enabled === 1;
  const isDisabled = !isActive;

  // Verificar si el usuario está suscrito al sistema de emails
  // El campo emailSubscribed indica si está suscrito (true) o no (false)
  const isSubscribed = user.emailSubscribed !== false; // Por defecto true si no está definido

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        {user.id}
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        <div className="flex items-center">
          {isDisabled && (
            <span
              className="w-2 h-2 rounded-full bg-red-500 mr-2"
              title="Cuenta desactivada"
            ></span>
          )}
          {user.firstName} {user.lastName}
        </div>
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        {user.email}
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap capitalize">
        {user.role}
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        {user.points}
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        {/* Checkbox de suscripción */}
        {onSubscriptionChange && (
          <div className="flex items-center justify-center" title={isSubscribed ? "Suscrito al sistema de correos" : "No suscrito"}>
            <input
              type="checkbox"
              checked={isSubscribed}
              onChange={(e) => {
                e.stopPropagation();
                onSubscriptionChange(user, e.target.checked);
              }}
              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
              disabled={isDisabled}
            />
          </div>
        )}
      </td>
      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
        <div className="flex space-x-2">
          <button
            onClick={() => onView(user)}
            className="text-green-800 hover:text-green-900"
            title="Ver detalles"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button
            onClick={() => onEdit(user)}
            className="text-blue-600 hover:text-blue-700"
            title="Editar usuario"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => onAdjustPoints(user)}
            className="text-yellow-600 hover:text-yellow-700"
            title="Reajustar puntos"
          >
            <i className="fas fa-coins"></i>
          </button>
          {/* Botón para gestionar carnets animales */}
          {onManagePetCards && (
            <button
              onClick={() => onManagePetCards(user)}
              className="text-purple-600 hover:text-purple-700"
              title="Carnet de mascota"
            >
              <i className="fas fa-paw"></i>
            </button>
          )}
          <button
            onClick={() => onDelete(user)}
            className="text-red-600 hover:text-red-700"
            title="Eliminar usuario"
          >
            <i className="fas fa-trash"></i>
          </button>

          {/* Mostrar botón de activar cuenta solo si está desactivada */}
          {isDisabled && (
            <button
              onClick={() => onUpdateStatus(user)}
              className="text-green-600 hover:bg-green-100 p-1 rounded-full"
              title="Activar cuenta"
            >
              <i className="fas fa-user-check"></i>
            </button>
          )}


        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
