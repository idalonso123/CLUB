import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, PropertyData } from '@/types/user';

interface PropertyPetFormProps {
  userId: number;
  onPropertyDataChange?: (propertyData: PropertyData) => void;
}

const PropertyPetForm: React.FC<PropertyPetFormProps> = ({ userId, onPropertyDataChange }) => {
  const [error, setError] = useState<string | null>(null);
  // Inicializar con datos vacíos para que se muestre el formulario inmediatamente
  const defaultData: PropertyData = {
    characteristics: [],
    animals: [],
    description: '',
    surfaceArea: 0
  };
  const [propertyData, setPropertyData] = useState<PropertyData>(defaultData);
  const [editData, setEditData] = useState<PropertyData>(defaultData);
  
  // Opciones para los select de características y animales
  const viviendaOptions = [
    "terraza", "balcón", "huerto", "césped", "jardín", "estanque", "marquesina", "piscina"
  ];
  
  const animalesOptions = [
    "sin animales", "perro(s)", "gato(s)", "pájaro(s)", "pez (peces)", "roedor(es)", "otros", "animales de corral"
  ];
  
  // Valores por defecto para superficie y descripción (los mantenemos en el objeto aunque no se muestran)
  const defaultSurfaceArea = 0;
  const defaultDescription = '';

  useEffect(() => {
    async function fetchPropertyData() {
      if (!userId) return;
      
      try {
        const response = await fetch(`/api/admin/users/${userId}/property`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPropertyData(data.propertyData);
            setEditData(data.propertyData);
            // Notificar al componente padre sobre los datos iniciales
            if (onPropertyDataChange) {
              onPropertyDataChange(data.propertyData);
            }
          } else {
            console.error("Error en la respuesta:", data.message);
            // Inicializar con datos vacíos si no hay datos existentes
            const emptyData = {
              characteristics: [],
              animals: [],
              description: defaultDescription,
              surfaceArea: defaultSurfaceArea
            };
            setPropertyData(emptyData);
            setEditData(emptyData);
          }
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
        // Inicializar con datos vacíos en caso de error
        const emptyData = {
          characteristics: [],
          animals: [],
          description: defaultDescription,
          surfaceArea: defaultSurfaceArea
        };
        setPropertyData(emptyData);
        setEditData(emptyData);
      }
    }
    
    fetchPropertyData();
  }, [userId]);
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'characteristics' | 'animals') => {
    const { value, checked } = e.target;
    
    if (!editData) {
      return;
    }
    
    let updatedItems = [...(editData[category] || [])];
    
    if (checked) {
      updatedItems.push(value);
    } else {
      updatedItems = updatedItems.filter(item => item !== value);
    }
    
    const updatedData = {
      ...editData,
      [category]: updatedItems
    };
    
    setEditData(updatedData);
    
    // Notificar al componente padre sobre el cambio
    if (onPropertyDataChange) {
      onPropertyDataChange(updatedData);
    }
  };
  
  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  };

  // Se eliminó el spinner de carga

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
      className="grid grid-cols-1 gap-4 mb-6"
    >

      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md mb-4">
          <div className="flex">
            <i className="fas fa-exclamation-circle mr-2 mt-1"></i>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Características de Vivienda</p>
          <div className="grid grid-cols-2 gap-2">
            {viviendaOptions.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`vivienda-${option}`}
                  value={option}
                  checked={editData?.characteristics?.includes(option) || false}
                  onChange={(e) => handleCheckboxChange(e, 'characteristics')}
                  className="mr-2 h-4 w-4 accent-green-600"
                />
                <label htmlFor={`vivienda-${option}`} className="text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 mb-2">Animales</p>
          <div className="grid grid-cols-2 gap-2">
            {animalesOptions.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`animal-${option}`}
                  value={option}
                  checked={editData?.animals?.includes(option) || false}
                  onChange={(e) => handleCheckboxChange(e, 'animals')}
                  className="mr-2 h-4 w-4 accent-green-600"
                />
                <label htmlFor={`animal-${option}`} className="text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyPetForm;
