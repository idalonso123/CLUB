import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import { SearchFormProps, User } from "@/types/teller";

const SearchForm: React.FC<SearchFormProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  searching,
  error,
  onResultsChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Efecto para notificar al padre sobre cambios en resultados
  // (Los resultados se pasan desde el componente padre)
  useEffect(() => {
    if (onResultsChange) {
      // Esta función se llamará desde el padre cuando los resultados cambien
    }
  }, [onResultsChange]);

  // Handler para detectar cuando se presiona Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // El debounce del padre maneja la búsqueda
      // Aquí solo prevenimos el comportamiento por defecto del formulario
    }
  };

  return (
    <motion.div
      className="bg-white p-4 rounded-lg shadow-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {searching ? (
              <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
            ) : (
              <i className="fas fa-search text-gray-400"></i>
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Disparar búsqueda automática al escribir
              handleSearch(e);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por nombre, apellidos, correo o teléfono"
            className="pl-10 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            autoFocus
          />
        </div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 text-red-600 text-sm bg-red-50 p-2 rounded-md"
        >
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchForm;
