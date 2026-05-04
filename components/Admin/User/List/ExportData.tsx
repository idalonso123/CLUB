import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiltersType } from '@/components/Admin/User/Service/userService';
import { motion } from 'framer-motion';

interface ExportDataProps {
  filters: FiltersType;
  searchTerm: string;
  onClose: () => void;
}

const ExportData: React.FC<ExportDataProps> = ({ filters, searchTerm, onClose }) => {
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({
    csv: false,
    excel: false,
    pdf: false
  });

  // Construir los parámetros de consulta para la exportación
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.append('query', searchTerm);
    if (filters.role) params.append('role', filters.role);
    if (filters.status !== undefined) params.append('status', String(filters.status));
    if (filters.minPoints) params.append('minPoints', filters.minPoints);
    if (filters.maxPoints) params.append('maxPoints', filters.maxPoints);
    
    return params.toString();
  };

  // Función para iniciar una descarga
  const startDownload = (url: string) => {
    // Crear un enlace temporal para la descarga
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.setAttribute('download', 'true');
    downloadLink.setAttribute('target', '_blank');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Función para exportar a CSV
  const exportToCSV = async () => {
    try {
      setIsLoading({...isLoading, csv: true});
      
      const queryParams = buildQueryParams();
      const downloadUrl = `/api/admin/users/export/csv?${queryParams}`;
      
      startDownload(downloadUrl);
      
      // Añadir un tiempo para permitir que comience la descarga
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading({...isLoading, csv: false});
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      setIsLoading({...isLoading, csv: false});
      toast.error('Error al exportar a CSV. Inténtalo de nuevo.');
    }
  };

  // Función para exportar a Excel
  const exportToExcel = async () => {
    try {
      setIsLoading({...isLoading, excel: true});
      
      const queryParams = buildQueryParams();
      const downloadUrl = `/api/admin/users/export/excel?${queryParams}`;
      
      startDownload(downloadUrl);
      
      // Añadir un tiempo para permitir que comience la descarga
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading({...isLoading, excel: false});
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      setIsLoading({...isLoading, excel: false});
      toast.error('Error al exportar a Excel. Inténtalo de nuevo.');
    }
  };

  // Función para exportar a PDF
  const exportToPDF = async () => {
    try {
      setIsLoading({...isLoading, pdf: true});
      
      const queryParams = buildQueryParams();
      const downloadUrl = `/api/admin/users/export/pdf?${queryParams}`;
      
      startDownload(downloadUrl);
      
      // Añadir un tiempo para permitir que comience la descarga
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading({...isLoading, pdf: false});
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      setIsLoading({...isLoading, pdf: false});
      toast.error('Error al exportar a PDF. Inténtalo de nuevo.');
    }
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {searchTerm ? `Exportando resultados de "${searchTerm}"` : "Exportando todos los usuarios"}
        {Object.values(filters).some(val => val !== '') && " con filtros aplicados"}
      </p>
      
      <div className="space-y-3">
        <motion.button
          onClick={exportToCSV}
          disabled={isLoading.csv}
          className={`flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg 
            ${isLoading.csv ? 'bg-gray-100' : 'hover:bg-green-50 hover:border-green-300'}`}
          variants={buttonVariants}
          whileHover={!isLoading.csv ? "hover" : undefined}
          whileTap={!isLoading.csv ? "tap" : undefined}
        >
          <span className="flex items-center">
            <i className="fas fa-file-csv text-green-600 mr-3 text-lg"></i>
            <span>Exportar a CSV</span>
          </span>
          {isLoading.csv ? (
            <i className="fas fa-circle-notch fa-spin text-green-600"></i>
          ) : (
            <i className="fas fa-download text-green-600"></i>
          )}
        </motion.button>
        
        <motion.button
          onClick={exportToExcel}
          disabled={isLoading.excel}
          className={`flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg 
            ${isLoading.excel ? 'bg-gray-100' : 'hover:bg-green-50 hover:border-green-300'}`}
          variants={buttonVariants}
          whileHover={!isLoading.excel ? "hover" : undefined}
          whileTap={!isLoading.excel ? "tap" : undefined}
        >
          <span className="flex items-center">
            <i className="fas fa-file-excel text-green-600 mr-3 text-lg"></i>
            <span>Exportar a Excel</span>
          </span>
          {isLoading.excel ? (
            <i className="fas fa-circle-notch fa-spin text-green-600"></i>
          ) : (
            <i className="fas fa-download text-green-600"></i>
          )}
        </motion.button>
        
        <motion.button
          onClick={exportToPDF}
          disabled={isLoading.pdf}
          className={`flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg 
            ${isLoading.pdf ? 'bg-gray-100' : 'hover:bg-green-50 hover:border-green-300'}`}
          variants={buttonVariants}          whileHover={!isLoading.pdf ? "hover" : undefined}
          whileTap={!isLoading.pdf ? "tap" : undefined}
        >
          <span className="flex items-center">
            <i className="fas fa-file-pdf text-green-600 mr-3 text-lg"></i>
            <span>Exportar a PDF</span>
          </span>
          {isLoading.pdf ? (
            <i className="fas fa-circle-notch fa-spin text-green-600"></i>
          ) : (
            <i className="fas fa-download text-green-600"></i>
          )}
        </motion.button>
      </div>
      
      <div className="pt-2 mt-4 border-t border-gray-400 text-center">
        <p className="text-xs text-gray-500">
          Los datos exportados respetarán todos los filtros y criterios de búsqueda actuales.
        </p>
      </div>
    </div>
  );
};

export default ExportData;
