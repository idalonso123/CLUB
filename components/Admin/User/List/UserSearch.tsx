import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserFilters from '@/components/Admin/User/List/UserFilters';
import { FiltersType } from '@/components/Admin/User/Service/userService';
import ExportData from '@/components/Admin/User/List/ExportData';
import Modal from '@/components/Common/Modal/Modal';

interface UserSearchProps {
  searchTerm: string;
  handleSearch: (term: string) => void;
  filters: FiltersType;
  setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
  applyFilters: () => void;
  resetFilters: () => void;
  variants?: any;
}

const UserSearch: React.FC<UserSearchProps> = ({
  searchTerm,
  handleSearch,
  filters,
  setFilters,
  applyFilters,
  resetFilters,
  variants
}) => {
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Manejador para pasar el valor, no el evento
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value);
  };

  // Función para invertir la dirección de ordenación
  const toggleSortOrder = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({
      ...filters,
      sortOrder: newOrder
    });
    
    // Aplicar el cambio inmediatamente
    setTimeout(() => applyFilters(), 0);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Barra de búsqueda principal */}
      <motion.div
        className="bg-white p-4 rounded-lg shadow-sm"
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Búsqueda general - ocupa más espacio */}
          <div className="relative md:col-span-9">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className={`fas fa-search ${searchTerm ? 'text-green-500' : 'text-gray-400'}`}></i>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Buscar por nombre, email o ID..."
              className={`pl-10 w-full p-2 border ${
                searchTerm 
                  ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } rounded`}
            />
            
            {/* Botón para limpiar la búsqueda si hay texto */}
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => handleSearch('')}
                aria-label="Limpiar búsqueda"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          {/* Botones de acción */}
          <div className="md:col-span-3 flex items-center justify-end space-x-2">
          
          {/* Botón para mostrar/ocultar filtros avanzados */}
          <div className="relative">
            <button 
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Filtros avanzados"
            >
              <i className={`fas fa-filter ${isAdvancedSearchOpen ? 'text-green-600' : 'text-gray-600'}`}></i>
            </button>
          </div>
          
          {/* Botón para filtrar y cambiar orden */}
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100" 
              title={filters.sortOrder === 'asc' ? 'Ordenar descendente' : 'Ordenar ascendente'}
              onClick={toggleSortOrder}
            >
              <i className={`fas fa-sort-${filters.sortOrder === 'asc' ? 'up' : 'down'} text-gray-600`}></i>
            </button>
          </div>
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-gray-100"
              title="Exportar datos"
              onClick={() => setIsExportModalOpen(true)}
            >
              <i className="fas fa-file-export text-gray-600"></i>
            </button>
            
            <Modal
              isOpen={isExportModalOpen}
              onClose={() => setIsExportModalOpen(false)}
              title="Exportar datos"
              maxWidth="max-w-md"
            >
              <ExportData
                filters={filters}
                searchTerm={searchTerm}
                onClose={() => setIsExportModalOpen(false)}
              />
            </Modal>
          </div>
          </div>
        </div>
      </motion.div>
      
      {/* Sección de búsqueda avanzada desplegable como elemento separado */}
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isAdvancedSearchOpen ? 1 : 0,
          height: isAdvancedSearchOpen ? "auto" : 0
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="mt-2">
          <UserFilters
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            isOpen={true}
            toggleOpen={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default UserSearch;