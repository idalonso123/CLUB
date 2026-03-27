import { useState, useEffect, useCallback } from "react";
import { LogFilters, LogPagination } from "@/types/logs";
import toast from "react-hot-toast";

// Tipos de logs
export const LOG_TYPES = [
  { key: "all", label: "Todos", endpoint: "/api/admin/logs/all" },
  { key: "admin", label: "Administración", endpoint: "/api/admin/logs" },
  { key: "auth", label: "Autenticación", endpoint: "/api/admin/logs/auth" },
  { key: "export", label: "Exportaciones", endpoint: "/api/admin/logs/exports" },
  { key: "points", label: "Puntos", endpoint: "/api/admin/logs/points" },
  { key: "rewards", label: "Recompensas", endpoint: "/api/admin/logs/rewards" },
];

// Mapeo de columnas por tipo de log
export const LOG_COLUMNS: Record<string, { key: string; label: string }[]> = {
  all: [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Usuario/Admin" },
    { key: "action", label: "Acción" },
    { key: "entity_type", label: "Entidad/Tipo" },
    { key: "created_at", label: "Fecha" },
    { key: "details", label: "Detalles" },
  ],
  admin: [
    { key: "id", label: "ID" },
    { key: "admin_name", label: "Administrador" },
    { key: "action", label: "Acción" },
    { key: "entity_type", label: "Entidad" },
    { key: "entity_id", label: "ID Entidad" },
    { key: "created_at", label: "Fecha" },
  ],
  auth: [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Usuario" },
    { key: "action", label: "Acción" },
    { key: "ip_address", label: "IP" },
    { key: "user_agent", label: "Agente" },
    { key: "created_at", label: "Fecha" },
  ],
  export: [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Usuario" },
    { key: "export_type", label: "Tipo" },
    { key: "format", label: "Formato" },
    { key: "record_count", label: "Registros" },
    { key: "created_at", label: "Fecha" },
  ],
  points: [
    { key: "id", label: "ID" },
    { key: "actor_name", label: "Actor" },
    { key: "persona_name", label: "Usuario" },
    { key: "tipo", label: "Tipo" },
    { key: "puntos", label: "Puntos" },
    { key: "fecha", label: "Fecha" },
  ],
  rewards: [
    { key: "id", label: "ID" },
    { key: "user_name", label: "Usuario" },
    { key: "action", label: "Acción" },
    { key: "reward_name", label: "Recompensa" },
    { key: "created_at", label: "Fecha" },
    { key: "details", label: "Detalles" },
  ],
};

const DEFAULT_LIMIT = 20;

// Valores predeterminados para filtros y ordenación
const DEFAULT_FILTERS: LogFilters = {
  action: "",
  userId: "",
  adminId: "",
  exportType: "",
  format: "",
  personaId: "",
  actorId: "",
  tipo: "",
  fromDate: "",
  toDate: "",
  ipAddress: "",
  rewardId: ""
  // sortBy y sortOrder eliminados
};

const useLogs = () => {
  // Estados básicos para los logs
  const [logType, setLogType] = useState(LOG_TYPES[0].key);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para filtros y paginación
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<LogPagination | null>(null);

  // Función para filtrar logs por texto
  const filterLogsByText = useCallback((logsList: any[], text: string) => {
    if (!text) return logsList;
    
    const lowercasedTerm = text.toLowerCase().trim();
    
    return logsList.filter(log => {
      // Búsqueda por ID exacto si es un número
      if (!isNaN(Number(lowercasedTerm)) && log.id !== undefined) {
        const logId = String(log.id);
        if (logId === lowercasedTerm) {
          return true;
        }
      }
      
      // Buscar en todos los campos del log
      return Object.entries(log).some(([key, value]) => {
        // Evitar búsqueda en propiedades que son objetos anidados
        if (value === null || value === undefined || typeof value === 'object') {
          return false;
        }
        
        // Convertir el valor a string y buscar
        return String(value).toLowerCase().includes(lowercasedTerm);
      });
    });
  }, []);

  // Cargar logs según tipo y filtros
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = LOG_TYPES.find((t) => t.key === logType)?.endpoint || LOG_TYPES[0].endpoint;
      const params = new URLSearchParams();

      // Parámetros de paginación
      params.append("limit", String(DEFAULT_LIMIT));
      params.append("page", String(page));

      // Añadir todos los filtros disponibles
      Object.entries(filters).forEach(([key, value]) => {
        // Solo agregar los filtros que tengan valor
        if (value && key !== 'dateRange') {
          params.append(key, String(value));
        }
      });

      // Añadir ordenación
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);

      // Manejar fechas específicamente
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      const res = await fetch(`${endpoint}?${params.toString()}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Error al cargar logs");
      }
      
      const logsData = data.logs || [];
      
      // Guardar los logs completos
      setLogs(logsData);
      
      // Inicialmente mostrar todos los logs
      setFilteredLogs(logsData);
      
      // Guardar información de paginación
      setPagination(data.pagination || null);
    } catch (err) {
      const errorMessage = (err as Error).message || "Error desconocido al cargar logs";
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [logType, filters, page, sortBy, sortOrder]);

  // Efecto para recargar cuando cambian los parámetros importantes
  useEffect(() => {
    fetchLogs();
  }, [logType, filters, page, fetchLogs]);

  // Manejo de búsqueda local
  const handleSearch = useCallback((term: string) => {
    const searchString = term || '';
    if (!searchString.trim()) {
      setFilteredLogs(logs);
      return;
    }
    const filtered = filterLogsByText(logs, searchString);
    setFilteredLogs(filtered);
  }, [logs, filterLogsByText]);

  // Función para cambiar el tipo de log (con reset de filtros)
  const handleTypeChange = useCallback((type: string) => {
    setLogType(type);
    setPage(1);
    setFilters(DEFAULT_FILTERS);
    setSortBy("created_at");
    setSortOrder("desc");
  }, []);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters: LogFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
    setPage(1); // Volver a la primera página al cambiar filtros
  }, []);

  // Función para aplicar filtros
  const applyFilters = useCallback(() => {
    setPage(1);
    fetchLogs();
  }, [fetchLogs]);

  // Función para resetear filtros
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Función para cambiar ordenación
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  }, []);

  // Función para cambiar el campo de ordenación
  const changeSortBy = useCallback((field: string) => {
    setSortBy(field);
    setPage(1);
  }, []);

  return {
    // Estado básico
    logs,
    filteredLogs,
    loading,
    error,
    
    // Búsqueda y filtros
    handleSearch,
    filters,
    setFilters,
    updateFilters,
    applyFilters,
    resetFilters,
    
    // Paginación
    page,
    setPage,
    pagination,
    
    // Tipo de log
    logType,
    handleTypeChange,
    
    // Ordenación
    sortBy,
    sortOrder,
    toggleSortOrder,
    changeSortBy,
    
    // Funciones auxiliares
    fetchLogs
  };
};

export default useLogs;
