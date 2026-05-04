import React, { useState } from "react";
import { LogFilters } from "@/types/logs";
import { LogsFilterMenuProps } from "@/types/logs";

const LogsFilterMenu: React.FC<LogsFilterMenuProps> = ({
  logType,
  filters,
  onFiltersChange,
  onReset,
  onClose
}) => {
  // Estado local para los filtros (igual que en UserFilters)
  const [localFilters, setLocalFilters] = useState<LogFilters>({ ...filters });

  // Handler genérico para campos de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setLocalFilters(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handler para fechas
  const handleDateChange = (field: "fromDate" | "toDate", value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Aplicar filtros
  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Limpiar filtros
  const handleResetFilters = () => {
    // Filtros por defecto (igual que en useLogs)
    const defaultFilters: LogFilters = {
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
    setLocalFilters(defaultFilters);
    onReset();
    onClose();
  };

  // Renderizar filtros específicos según el tipo de log
  const renderFilterFields = () => {
    if (logType === "all") return null;
    switch (logType) {
      case "admin":
        return (
          <>
            <div className="mb-3">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <input
                id="action"
                type="text"
                placeholder="Acción"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.action || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="adminId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Admin
              </label>
              <input
                id="adminId"
                type="text"
                placeholder="ID Admin"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.adminId || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      case "auth":
        return (
          <>
            <div className="mb-3">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <input
                id="action"
                type="text"
                placeholder="Acción"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.action || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Usuario
              </label>
              <input
                id="userId"
                type="text"
                placeholder="ID Usuario"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.userId || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección IP
              </label>
              <input
                id="ipAddress"
                type="text"
                placeholder="IP"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.ipAddress || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      case "export":
        return (
          <>
            <div className="mb-3">
              <label htmlFor="exportType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de exportación
              </label>
              <input
                id="exportType"
                type="text"
                placeholder="Tipo exportación"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.exportType || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                Formato
              </label>
              <input
                id="format"
                type="text"
                placeholder="Formato"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.format || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Usuario
              </label>
              <input
                id="userId"
                type="text"
                placeholder="ID Usuario"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.userId || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      case "points":
        return (
          <>
            <div className="mb-3">
              <label htmlFor="personaId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Usuario
              </label>
              <input
                id="personaId"
                type="text"
                placeholder="ID Usuario"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.personaId || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="actorId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Actor
              </label>
              <input
                id="actorId"
                type="text"
                placeholder="ID Actor" 
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.actorId || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <input
                id="tipo"
                type="text"
                placeholder="Tipo"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.tipo || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      case "rewards":
        return (
          <>
            <div className="mb-3">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Usuario
              </label>
              <input
                id="userId"
                type="text"
                placeholder="ID Usuario"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.userId || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Acción
              </label>
              <input
                id="action"
                type="text"
                placeholder="Acción"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.action || ""}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="rewardId" className="block text-sm font-medium text-gray-700 mb-1">
                ID Recompensa
              </label>
              <input
                id="rewardId"
                type="text"
                placeholder="ID Recompensa"
                className="w-full p-2 border border-gray-300 rounded"
                value={localFilters.rewardId || ""}
                onChange={handleInputChange}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-10 p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-3 border-b border-gray-400 pb-2">
        <h3 className="font-semibold text-green-800">Filtros avanzados</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* Filtros específicos según tipo de log */}
      {renderFilterFields()}
      
      {/* Fechas */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Desde
          </label>
          <input
            id="fromDate"
            type="date"
            value={localFilters.fromDate || ''}
            onChange={e => handleDateChange("fromDate", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Hasta
          </label>
          <input
            id="toDate"
            type="date"
            value={localFilters.toDate || ''}
            onChange={e => handleDateChange("toDate", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex justify-between mt-4 pt-1">
        <button
          onClick={handleResetFilters}
          className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100"
        >
          Limpiar filtros
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 bg-green-600 rounded text-sm text-white hover:bg-green-700"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default LogsFilterMenu;
