import React from "react";
import Badge from "@/components/Admin/User/Info/Components/Badge";
import ProgressBar from "@/components/Admin/User/Info/Components/ProgressBar";
import UserAvatar from "@/components/Admin/User/Info/Components/UserAvatar";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  points: number;
  photo?: string;
  photoUrl?: string;
  enabled?: boolean | number;
}

interface UserHeaderInfoProps {
  user: User;
}

const UserHeaderInfo: React.FC<UserHeaderInfoProps> = ({ user }) => {
  // Lógica para calcular nivel de fidelidad del usuario
  const calculateLoyaltyLevel = (points: number) => {
    if (points >= 1000) return "Usuario Tulipán";
    if (points >= 500) return "Usuario Girasol";
    if (points >= 200) return "Usuario Amapola";
    return "Usuario Semilla";
  };

  const loyaltyLevel = calculateLoyaltyLevel(user.points);
  const loyaltyProgress = Math.min((user.points / 1000) * 100, 100);

  // Determinar la variante del badge de rol
  const getRoleBadgeVariant = () => {
    switch (user.role) {
      case "Administrador":
        return "success";
      case "Usuario Girasol":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6">
      <UserAvatar
        photoUrl={user.photo || user.photoUrl}
        firstName={user.firstName}
        lastName={user.lastName}
        size="lg"
        className="mr-0 sm:mr-6 mb-4 sm:mb-0"
      />
      
      <div className="flex-grow text-center sm:text-left">
        <h4 className="text-lg sm:text-xl font-semibold">
          {user.firstName} {user.lastName}
        </h4>
        <p className="text-gray-600">{user.email}</p>
        <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1 flex-wrap">
          <Badge variant={getRoleBadgeVariant()}>
            {user.role}
          </Badge>
          <Badge variant="purple">
            {loyaltyLevel}
          </Badge>
          
          {/* Indicador de estado de cuenta */}
          {(user.enabled === 0 || user.enabled === false) && (
            <Badge variant="danger">
              Cuenta Desactivada
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <ProgressBar
            label="Nivel de Fidelidad"
            value={`${user.points} puntos`}
            progress={loyaltyProgress}
          />
        </div>
      </div>
    </div>
  );
};

export default UserHeaderInfo;