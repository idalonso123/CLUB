import React from 'react';
import { motion } from 'framer-motion';

interface PropertyData {
  characteristics: string[];
  animals: string[];
  description: string;
  surfaceArea: number;
}

interface PropertyInfoEditorProps {
  userData: { property?: PropertyData };
  tempUserData: { property?: PropertyData };
  isEditing: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  startEditing: () => void;
  saveSection: () => void;
  cancelEdit: () => void;
  itemVariants: any;
}

const PropertyInfoEditor: React.FC<PropertyInfoEditorProps> = ({
  userData,
  tempUserData,
  isEditing,
  handleChange,
  startEditing,
  saveSection,
  cancelEdit,
  itemVariants
}) => {
  // Normalizar los arrays (manejar tanto string como arrays)
  const normalizeArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Si es un string, dividirlo por comas
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

  // Función para normalizar los arrays (case insensitive y sin prefijos "Con")
  const normalizeForComparison = (item: string): string => {
    return item.toLowerCase().replace('con ', '');
  };

  // Garantizar que property existe con valores por defecto
  const safeUserData = {
    property: userData?.property || {
      characteristics: [],
      animals: [],
      description: '',
      surfaceArea: 0
    }
  };

  const safeTempUserData = {
    property: tempUserData?.property || {
      characteristics: [],
      animals: [],
      description: '',
      surfaceArea: 0
    }
  };

  // Normalizar los arrays para asegurar que son arrays y no strings
  safeUserData.property.characteristics = normalizeArray(safeUserData.property.characteristics);
  safeUserData.property.animals = normalizeArray(safeUserData.property.animals);
  safeTempUserData.property.characteristics = normalizeArray(safeTempUserData.property.characteristics);
  safeTempUserData.property.animals = normalizeArray(safeTempUserData.property.animals);

  // Lista de opciones de características de vivienda disponibles - ACTUALIZADAS para coincidir con BD
  const characteristicOptions = [
    'terraza',
    'balcón',
    'huerto',
    'césped',
    'jardín',
    'estanque',
    'marquesina',
    'piscina'
  ];
  
  // Lista de opciones de animales disponibles - ACTUALIZADAS para coincidir con la definición SET de la BD
  const animalOptions = [
    'sin animales',
    'perro(s)',
    'gato(s)',
    'pájaro(s)',
    'pez (peces)',
    'roedor(es)',
    'otros',
    'animales de corral'
  ];

  // Función para mapear valores no permitidos a valores permitidos en BD
  const normalizeToDbValue = (value: string, type: 'animals' | 'characteristics'): string => {
    if (type === 'animals') {
      // Mapeo de nombres comunes a los valores permitidos en la BD
      const animalMapping: Record<string, string> = {
        'Perros': 'perro(s)',
        'Gatos': 'gato(s)',
        'Aves': 'pájaro(s)',
        'Caballos': 'otros',
        'Otros animales domésticos': 'otros',
        'Animales de granja': 'animales de corral',
        'Sin animales': 'sin animales'
      };
      return animalMapping[value] || value;
    }
    return value;
  };

  // Función mejorada para manejar cambios en checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'characteristics' | 'animals') => {
    const { value, checked } = e.target;
    
    // Asegurarnos que siempre trabajamos con arrays normalizados
    const currentValues = normalizeArray(safeTempUserData.property[field]);
    
    let newValues: string[];
    let normalizedValue = normalizeToDbValue(value, field === 'characteristics' ? 'characteristics' : 'animals');
    
    if (checked && !currentValues.includes(normalizedValue)) {
      newValues = [...currentValues, normalizedValue];
    } else if (!checked) {
      newValues = currentValues.filter(item => item !== normalizedValue);
    } else {
      newValues = currentValues;
    }
    
    // Actualizar directamente el estado de tempUserData
    const updatedProperty = {
      ...safeTempUserData.property,
      [field]: newValues
    };
    
    handleChange({
      target: {
        name: 'property',
        value: updatedProperty
      }
    } as any);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    const updatedProperty = {
      ...safeTempUserData.property,
      description: value
    };
    
    handleChange({
      target: {
        name: 'property',
        value: updatedProperty
      }
    } as any);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const updatedProperty = {
      ...safeTempUserData.property,
      surfaceArea: parseInt(value) || 0
    };
    
    handleChange({
      target: {
        name: 'property',
        value: updatedProperty
      }
    } as any);
  };

  return (
    <motion.div
      className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
      variants={itemVariants}
    >
      <h3 className="text-xl font-semibold mb-4 text-green-700">Casa y Jardín</h3>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Características de tu casa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded border-gray-300 bg-white">
              {characteristicOptions.map(characteristic => {
                // Verificar con normalización
                const characteristicsArray = normalizeArray(safeTempUserData.property.characteristics);
                const isChecked = characteristicsArray.some(item => 
                  normalizeForComparison(item) === normalizeForComparison(characteristic)
                );
                
                return (
                  <div key={characteristic} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`characteristic-${characteristic}`}
                      value={characteristic}
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(e, 'characteristics')}
                      className="h-4 w-4 accent-green-600 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`characteristic-${characteristic}`} className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-green-700">
                      {characteristic}
                    </label>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Seleccione las características de su vivienda
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mascotas
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded border-gray-300 bg-white">
              {animalOptions.map(animal => {
                // Verificar con normalización
                const animalsArray = normalizeArray(safeTempUserData.property.animals);
                const isChecked = animalsArray.some(item => 
                  normalizeForComparison(item) === normalizeForComparison(animal)
                );
                
                return (
                  <div key={animal} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`animal-${animal}`}
                      value={animal}
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(e, 'animals')}
                      className="h-4 w-4 accent-green-600 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`animal-${animal}`} className="ml-2 text-sm text-gray-700 cursor-pointer hover:text-green-700">
                      {animal}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>          
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveSection}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mostrar mensaje si no hay información de propiedad */}
          {!safeUserData.property.characteristics?.length && 
           !safeUserData.property.animals?.length && 
           !safeUserData.property.description && 
           !safeUserData.property.surfaceArea ? (
            <div className="p-3 bg-gray-50 rounded text-gray-500 italic">
              No hay información de Casa y Jardín disponible
            </div>
          ) : null}
          
          {(safeUserData.property.characteristics?.length > 0) && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium mb-1">Características de tu casa:</div>
              <div className="flex flex-wrap gap-1">
                {safeUserData.property.characteristics.map(item => (
                  <span key={item} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {(safeUserData.property.animals?.length > 0) && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium mb-1">Mascotas:</div>
              <div className="flex flex-wrap gap-1">
                {safeUserData.property.animals.map(item => (
                  <span key={item} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {safeUserData.property.description && (
            <div className="p-3 bg-gray-50 rounded">
              <div className="font-medium mb-1">Descripción:</div>
              <p className="text-gray-700">{safeUserData.property.description}</p>
            </div>
          )}
          
          {(typeof safeUserData.property.surfaceArea === 'number' && safeUserData.property.surfaceArea > 0) && (
            <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
              <div>
                <span className="font-medium">Superficie del terreno:</span> {safeUserData.property.surfaceArea} m²
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={startEditing}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900"
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PropertyInfoEditor;
