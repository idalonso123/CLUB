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
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, apellidos, correo o teléfono"
            className="pl-10 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <motion.button
          type="submit"
          className="px-4 py-2 bg-green-700 text-white rounded-md shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
          disabled={searching}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {searching ? (
            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"></div>
          ) : (
            <>
              <i className="fas fa-search mr-2"></i>
              Buscar
            </>
          )}
        </motion.button>
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
