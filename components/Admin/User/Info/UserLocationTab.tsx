import React from "react";
import InfoCard from "@/components/Common/InfoCard";

interface UserLocationTabProps {
  user: {
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

const UserLocationTab: React.FC<UserLocationTabProps> = ({ user }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InfoCard label="Teléfono" value={user.phone} />
      <InfoCard label="Dirección" value={user.address} />
      <InfoCard label="Ciudad" value={user.city} />
      <InfoCard label="Código Postal" value={user.postalCode} />
      <InfoCard label="País" value={user.country} />
    </div>
  );
};

export default UserLocationTab;