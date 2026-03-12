import React, { useEffect, useState } from "react";
import { User, PropertyData } from "@/types/user";
import { motion } from "framer-motion";
import InfoCard from "@/components/Common/InfoCard";

interface UserPropertyPetTabProps {
  user: User;
}

const UserPropertyPetTab: React.FC<UserPropertyPetTabProps> = ({ user }) => {
  // Inicializar con datos vacíos para que se muestre inmediatamente
  const defaultData: PropertyData = {
    characteristics: [],
    animals: [],
    description: '',
    surfaceArea: 0
  };
  const [propertyData, setPropertyData] = useState<PropertyData>(defaultData);
  
  useEffect(() => {
    async function fetchPropertyData() {
      try {
        const response = await fetch(`/api/admin/users/${user.id}/property`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPropertyData(data.propertyData);
          } else {
            console.error("Error en la respuesta:", data.message);
          }
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
      }
    }
    
    fetchPropertyData();
  }, [user.id]);
  
  // Función auxiliar para convertir características en formato de visualización
  const formatCharacteristics = (characteristics: string[] = []) => {
    if (!characteristics.length) return 'No especificado';
    return characteristics.join(', ');
  };
  
  // Función auxiliar para convertir animales en formato de visualización
  const formatAnimals = (animals: string[] = []) => {
    if (!animals.length) return 'No especificado';
    return animals.join(', ');
  };

  const hasPropertyData = propertyData && propertyData.characteristics && propertyData.characteristics.length > 0;
  const hasPetData = propertyData && propertyData.animals && propertyData.animals.length > 0;

  // Se eliminó el spinner de carga
  
  if (!hasPropertyData && !hasPetData) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-gray-50 rounded-lg text-center"
      >
        <i className="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
        <p className="text-gray-600">
          No hay información disponible sobre vivienda o animales para este usuario.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard 
          label="Características de Vivienda" 
          value={formatCharacteristics(propertyData?.characteristics)} 
        />
        <InfoCard 
          label="Animales" 
          value={formatAnimals(propertyData?.animals)} 
        />
      </div>
    </motion.div>
  );
};

export default UserPropertyPetTab;