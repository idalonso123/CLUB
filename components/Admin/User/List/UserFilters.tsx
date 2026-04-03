import React, { useState } from 'react';
import { FiltersType, availableRoles } from '@/components/Admin/User/Service/userService';
import { motion } from 'framer-motion';

interface UserFiltersProps {
  filters: FiltersType;
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
  applyFilters: () => void;
  resetFilters: () => void;
  isOpen: boolean;
  toggleOpen: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  setFilters,
  applyFilters,
  resetFilters,
  isOpen,
  toggleOpen
}) => {
  const [localFilters, setLocalFilters] = useState<FiltersType>({...filters});
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejador para checkboxes de selección múltiple
  const handleMultipleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setLocalFilters(prev => {
      // Asegurar que currentValues siempre sea un array válido
      const currentValues = Array.isArray(prev[name as 'animal' | 'property']) 
        ? (prev[name as 'animal' | 'property'] as string[]) 
        : [];
      
      let newValues: string[];
      
      if (checked) {
        // Añadir el valor si está marcado
        newValues = [...currentValues, value];
      } else {
        // Eliminar el valor si está desmarcado
        newValues = currentValues.filter(item => item !== value);
      }
      
      return {
        ...prev,
        [name]: newValues
      };
    });
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange || { from: '', to: '' },
        [field]: value
      }
    }));
  };

  // Función para limpiar todos los filtros incluyendo los campos numéricos
  const handleResetFilters = () => {
    // Valores predeterminados para resetear filtros
    const defaultFilters: FiltersType = {
      role: '',
      status: '',
      minPoints: '',
      maxPoints: '',
      animal: [], // Asegurar que sea un array vacío
      property: [], // Asegurar que sea un array vacío
      minAge: '',
      maxAge: '',
      postalCode: '',
      sortBy: 'registrationDate',
      sortOrder: 'desc',
      dateRange: {
        from: '',
        to: ''
      }
    };
    
    // Crear una copia profunda para evitar referencias compartidas
    const resetValues = JSON.parse(JSON.stringify(defaultFilters));
    
    setLocalFilters(resetValues);
    setFilters(resetValues);
    resetFilters();
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    applyFilters();
  };

  return (
    <div className="w-full">
      {/* Contenedor del filtro desplegable con animación */}
      <motion.div 
        initial="collapsed"
        animate={isOpen ? "open" : "collapsed"}
        variants={{
          open: { opacity: 1, height: "auto", marginBottom: 16 },
          collapsed: { opacity: 0, height: 0, marginBottom: 0 }
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden bg-white rounded-md border border-gray-200 shadow-sm"
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-3 border-b border-gray-400 pb-2">
            <h3 className="font-semibold text-green-800">Filtros y ordenación</h3>
          </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
        {/* Columna izquierda */}
        <div>
          {/* Filtro por rol */}
          <div className="mb-3">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rol de usuario
            </label>
            <select
              id="role"
              name="role"
              value={localFilters.role}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Filtro por estado */}
          <div className="mb-3">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Estado de cuenta
            </label>
            <select
              id="status"
              name="status"
              value={localFilters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Todos los estados</option>
              <option value="enabled">Activo</option>
              <option value="disabled">Desactivado</option>
            </select>
          </div>
          
          {/* Filtro por rango de puntos */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de puntos
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  id="minPoints"
                  name="minPoints"
                  type="number"
                  value={localFilters.minPoints}
                  onChange={handleFilterChange}
                  placeholder="Mínimo"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <input
                  id="maxPoints"
                  name="maxPoints"
                  type="number"
                  value={localFilters.maxPoints}
                  onChange={handleFilterChange}
                  placeholder="Máximo"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Filtro por rango de edad */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de edad
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  id="minAge"
                  name="minAge"
                  type="number"
                  value={localFilters.minAge}
                  onChange={handleFilterChange}
                  placeholder="Mínima"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <input
                  id="maxAge"
                  name="maxAge"
                  type="number"
                  value={localFilters.maxAge}
                  onChange={handleFilterChange}
                  placeholder="Máxima"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Filtro por código postal */}
          <div className="mb-3">
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              value={localFilters.postalCode}
              onChange={handleFilterChange}
              placeholder="Código postal"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
        
        {/* Columna derecha */}
        <div>
          {/* Filtro por rango de fechas */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rango de fechas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Fecha inicial
                </label>
                <input
                  id="dateFrom"
                  type="date"
                  value={localFilters.dateRange?.from || ''}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Fecha final
                </label>
                <input
                  id="dateTo"
                  type="date"
                  value={localFilters.dateRange?.to || ''}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
          
          {/* Opciones de ordenación */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordenación
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <select
                  id="sortBy"
                  name="sortBy"
                  value={localFilters.sortBy}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="id">ID</option>
                  <option value="name">Nombre</option>
                  <option value="email">Email</option>
                  <option value="points">Puntos</option>
                  <option value="role">Rol</option>
                  <option value="registrationDate">Fecha registro</option>
                </select>
              </div>
              <div>
                <select
                  id="sortOrder"
                  name="sortOrder"
                  value={localFilters.sortOrder}
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Filtro por animal */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animal
            </label>
            <div className="grid grid-cols-2 gap-2 p-2 border border-gray-300 rounded h-32 overflow-y-auto">
              {[
                { value: 'sin animales', label: 'Sin animales' },
                { value: 'perro', label: 'Perro(s)' },
                { value: 'gato', label: 'Gato(s)' },
                { value: 'pájaro', label: 'Pájaro(s)' },
                { value: 'pez', label: 'Pez (peces)' },
                { value: 'roedor', label: 'Roedor(es)' },
                { value: 'animales de corral', label: 'Animales de corral' },
                { value: 'otros', label: 'Otros' }
              ].map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`animal-${option.value}`}
                    type="checkbox"
                    checked={Array.isArray(localFilters.animal) && localFilters.animal.includes(option.value)}
                    onChange={(e) => handleMultipleCheckboxChange('animal', option.value, e.target.checked)}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor={`animal-${option.value}`} className="text-sm text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Filtro por propiedad */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Características de vivienda
            </label>
            <div className="grid grid-cols-2 gap-2 p-2 border border-gray-300 rounded h-32 overflow-y-auto">
              {[
                { value: 'terraza', label: 'Terraza' },
                { value: 'balcón', label: 'Balcón' },
                { value: 'huerto', label: 'Huerto' },
                { value: 'césped', label: 'Césped' },
                { value: 'jardín', label: 'Jardín' },
                { value: 'estanque', label: 'Estanque' },
                { value: 'marquesina', label: 'Marquesina' },
                { value: 'piscina', label: 'Piscina' }
              ].map(option => (
                <div key={option.value} className="flex items-center">
                  <input
                    id={`property-${option.value}`}
                    type="checkbox"
                    checked={Array.isArray(localFilters.property) && localFilters.property.includes(option.value)}
                    onChange={(e) => handleMultipleCheckboxChange('property', option.value, e.target.checked)}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500"
                  />
                  <label htmlFor={`property-${option.value}`} className="text-sm text-gray-700">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mt-4 pt-1">
        <button
          onClick={handleResetFilters}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100"
        >
          Limpiar filtros
        </button>
        <button
          onClick={handleApplyFilters}
          className="px-3 py-1.5 bg-green-600 rounded text-sm text-white hover:bg-green-700"
        >
          Aplicar filtros
        </button>
      </div>
        </div>
      </motion.div>
      </div>
  );
};

export default UserFilters;