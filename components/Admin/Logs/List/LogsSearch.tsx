import React, { useState } from "react";
import { motion } from "framer-motion";
import { LOG_TYPES } from "../Hooks/useLogs";
import { LogFilters } from "@/types/logs";
import LogsFilterMenu from "./LogsFilterMenu";

interface LogsSearchProps {
  logType: string;
  search: string;
  filters: LogFilters;
  onTypeChange: (type: string) => void;
  onSearchChange: (search: string) => void;
  onFiltersChange: (filters: LogFilters) => void;
  onReset: () => void;
  variants?: any;
}

const LogsSearch: React.FC<LogsSearchProps> = ({
  logType,
  search,
  filters,
  onTypeChange,
  onSearchChange,
  onFiltersChange,
  onReset,
  variants,
}) => {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <motion.div
      className="mb-6 bg-white p-4 rounded-lg shadow-sm"
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-list-ul text-gray-400"></i>
            </div>
            <select
              className="pl-10 w-full p-2 border border-gray-300 appearance-none bg-white rounded focus:ring-blue-500 focus:border-blue-500"
              value={logType}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              {LOG_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        <div className="relative md:col-span-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i
              className={`fas fa-search ${
                search ? "text-green-500" : "text-gray-400"
              }`}
            ></i>
          </div>
          <input
            type="text"
            placeholder="Buscar en los logs..."
            className={`pl-10 w-full p-2 border ${
              search
                ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            } rounded`}
            value={search}
            onChange={handleInputChange}
          />

          {search && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="md:col-span-3 flex items-center justify-end space-x-2">
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Filtros avanzados"
              disabled={logType === "all"}
            >
              <i
                className={`fas fa-filter ${
                  logType === "all" ? "text-gray-300" : "text-gray-600"
                }`}
              ></i>
            </button>
            {isFilterMenuOpen && logType !== "all" && (
              <LogsFilterMenu
                logType={logType}
                filters={filters}
                onFiltersChange={onFiltersChange}
                onReset={onReset}
                onClose={() => setIsFilterMenuOpen(false)}
              />
            )}
          </div>

          <button
            className="p-2 rounded-full hover:bg-gray-100"
            title="Refrescar"
            onClick={onReset}
          >
            <i className="fas fa-sync-alt text-gray-600"></i>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default LogsSearch;
