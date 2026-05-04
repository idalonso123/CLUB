import React from "react";
import { motion } from "framer-motion";
import { LOG_COLUMNS } from "../Hooks/useLogs";
import DataTable from "@/components/Common/Tables/DataTable";
import { LogsTableProps } from "@/types/logs";

const LogsTable: React.FC<LogsTableProps> = ({ 
  logs, 
  logType, 
  pagination, 
  page, 
  setPage, 
  variants 
}) => {
  if (logs.length === 0) {
    return (
      <motion.div 
        className="bg-white rounded-lg shadow p-6 text-center"
        variants={variants}
      >
        <i className="fas fa-database text-gray-300 text-5xl mb-4"></i>
        <p className="text-gray-500">No hay logs para mostrar</p>
      </motion.div>
    );
  }
  
  const columns = logType === "all" 
    ? Object.keys(logs[0]).map(k => ({ key: k, label: k }))
    : LOG_COLUMNS[logType] || Object.keys(logs[0]).slice(0, 6).map(k => ({ key: k, label: k }));

  return (
    <>
      <DataTable
        columns={columns}
        data={logs}
        variants={variants}
        renderRow={(log, idx) => (
          <tr key={log.id || idx} className="hover:bg-green-50">
            {columns.map((col) => (
              <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                {typeof log[col.key] === "object"
                  ? JSON.stringify(log[col.key])
                  : col.key.includes("fecha") || col.key.includes("created_at")
                    ? (log[col.key] ? new Date(log[col.key]).toLocaleString("es-ES") : "")
                    : String(log[col.key] ?? "")}
              </td>
            ))}
          </tr>
        )}
        emptyMessage="No hay logs para mostrar"
      />
      
      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div 
          className="flex justify-between items-center mt-4 bg-white rounded-lg shadow p-3"
          variants={variants}
        >
          <div className="text-sm text-gray-700">
            <span>Mostrando </span>
            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
            <span> - </span>
            <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            <span> de </span>
            <span className="font-medium">{pagination.total}</span>
            <span> registros</span>
          </div>
          
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 border border-gray-300 bg-white text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page <= 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <i className="fas fa-chevron-left mr-1"></i> Anterior
            </button>
            <button
              className="px-3 py-1 border border-gray-300 bg-white text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            >
              Siguiente <i className="fas fa-chevron-right ml-1"></i>
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default LogsTable;
