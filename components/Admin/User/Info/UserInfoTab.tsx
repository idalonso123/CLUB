import React from "react";
import InfoCard from "@/components/Common/InfoCard";

interface UserInfoTabProps {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    registrationDate?: string;
  };
}

const UserInfoTab: React.FC<UserInfoTabProps> = ({ user }) => {
  // Formato para la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoCard label="ID de Usuario" value={user.id} />
      <InfoCard 
        label="Fecha de Registro" 
        value={formatDate(user.registrationDate)} 
      />
      <InfoCard 
        label="Nombre" 
        value={`${user.firstName} ${user.lastName}`} 
      />
      <InfoCard label="Email" value={user.email} />
      <InfoCard label="Teléfono" value={user.phone} />
      <InfoCard 
        label="Fecha Nac." 
        value={user.birthDate ? formatDate(user.birthDate) : 'No disponible'} 
      />
    </div>
  );
};

export default UserInfoTab;