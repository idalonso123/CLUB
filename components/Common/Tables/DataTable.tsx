import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Column, DataTableProps } from '@/types/table';

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  renderRow,
  emptyMessage = "No hay datos para mostrar",
  headerClassName = "bg-green-50",
  variants,
  className = "bg-white rounded-lg shadow-sm overflow-hidden",
}) => {
  return (
    <motion.div 
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className={headerClassName}>
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm font-medium text-green-900 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-green-200">
            {data.length > 0 ? (
              data.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-4 px-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default DataTable;
