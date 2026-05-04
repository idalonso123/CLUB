import React from "react";

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  label, 
  value, 
  className = "" 
}) => {
  return (
    <div className={`bg-gray-50 p-3 rounded ${className}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value || "No disponible"}</p>
    </div>
  );
};

export default InfoCard;