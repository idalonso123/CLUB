import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/Common/LoadingSpinner";
import ErrorMessage from "@/components/Common/ErrorMessage";

// Hooks y componentes específicos para la sección de logs
import useLogs from "@/components/Admin/Logs/Hooks/useLogs";
import LogsSearch from "@/components/Admin/Logs/List/LogsSearch";
import LogsTable from "@/components/Admin/Logs/List/LogsTable";

const LogsSection: React.FC = () => {
  // Definir variantes de animación
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  // Utilizamos nuestro hook personalizado para toda la lógica de logs
  const {
    logs,
    filteredLogs,
    loading,
    error,
    handleSearch,
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    pagination,
    page,
    setPage,
    logType,
    handleTypeChange,
    fetchLogs
  } = useLogs();

  // Estado local para la búsqueda (igual que en UsersSection)
  const [search, setSearch] = React.useState('');

  // Handler para búsqueda (filtra localmente)
  const handleSearchChange = (term: string) => {
    setSearch(term);
    handleSearch(term);
  };

  React.useEffect(() => {
    // Cuando se recargan los logs, resetear la búsqueda local
    setSearch('');
  }, [logType, filters, page]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-15rem)] flex flex-col items-center justify-center">
        <LoadingSpinner
          variant="leaf"
          theme="success"
          size="lg"
          message="Cargando logs..."
          className="mb-8"
        />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-2xl font-bold text-green-800 mb-6"
        variants={itemVariants}
      >
        Logs del sistema
      </motion.h1>

      {/* Componente de búsqueda y filtros */}
      <LogsSearch
        logType={logType}
        search={search}
        filters={filters}
        onTypeChange={handleTypeChange}
        onSearchChange={handleSearchChange}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
        variants={itemVariants}
      />
      
      {error ? (
        <ErrorMessage message={error} onRetry={fetchLogs} />
      ) : (
        <LogsTable
          logs={filteredLogs}
          logType={logType}
          pagination={pagination}
          page={page}
          setPage={setPage}
          variants={itemVariants}
        />
      )}
    </motion.div>
  );
};

export default LogsSection;
