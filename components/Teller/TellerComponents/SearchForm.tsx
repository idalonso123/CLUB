import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import { SearchFormProps } from "@/types/teller";

const SearchForm: React.FC<SearchFormProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  searching,
  error,
}) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md mb-6"
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
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // Disparar búsqueda automática al escribir
              handleSearch(e);
            }}
            placeholder="Buscar por nombre, apellidos, correo o teléfono"
            className="pl-10 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
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
