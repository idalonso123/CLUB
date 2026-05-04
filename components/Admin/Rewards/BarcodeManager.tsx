import React, { useState } from 'react';
import { BarCode } from '@/types/rewards';

interface BarcodeManagerProps {
  barcodes: BarCode[];
  onChange: (barcodes: BarCode[]) => void;
}

const BarcodeManager: React.FC<BarcodeManagerProps> = ({ barcodes = [], onChange }) => {
  const [newBarcode, setNewBarcode] = useState<BarCode>({ codigo: '', descripcion: '' });
  const [error, setError] = useState('');

  const handleAddBarcode = () => {
    setError('');
    
    // Validación básica
    if (!newBarcode.codigo.trim()) {
      setError('El código de barras no puede estar vacío');
      return;
    }
    
    // Verificar si el código ya existe
    if (barcodes.some(code => code.codigo === newBarcode.codigo)) {
      setError('Este código de barras ya existe');
      return;
    }
    
    // Añadir el nuevo código
    const updatedBarcodes = [...barcodes, { ...newBarcode, id: Date.now() }];
    onChange(updatedBarcodes);
    
    // Limpiar el formulario
    setNewBarcode({ codigo: '', descripcion: '' });
  };

  const handleRemoveBarcode = (index: number) => {
    const updatedBarcodes = [...barcodes];
    updatedBarcodes.splice(index, 1);
    onChange(updatedBarcodes);
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewBarcode({
      ...newBarcode,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Añade códigos de barras predefinidos para esta recompensa. Estos códigos se asignarán automáticamente cuando los usuarios canjeen la recompensa.
      </p>
      <p className="text-sm text-gray-500 mt-1">
        <i className="fas fa-info-circle mr-1 text-blue-500"></i>
        Recomendación: Utiliza códigos alfanuméricos de 8-12 caracteres para mayor compatibilidad con los sistemas de escaneo.
      </p>
      
      {/* Lista de códigos existentes */}
      {barcodes.length > 0 ? (
        <div className="mt-3 border border-gray-200 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {barcodes.map((barcode, index) => (
                <tr key={barcode.id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {barcode.codigo}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {barcode.descripcion || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleRemoveBarcode(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-500 text-sm">No hay códigos de barras definidos</p>
        </div>
      )}
      
      {/* Formulario para añadir nuevos códigos */}
      <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Añadir nuevo código</h4>
        
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="codigo"
              value={newBarcode.codigo}
              onChange={handleBarcodeChange}
              placeholder="Ej: ABC123"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              name="descripcion"
              value={newBarcode.descripcion}
              onChange={handleBarcodeChange}
              placeholder="Descripción opcional"
              className="w-full p-2 border border-gray-300 rounded text-sm"
            />
          </div>
          
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddBarcode}
              className="w-full p-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm flex items-center justify-center"
            >
              <i className="fas fa-plus mr-1"></i>
              Añadir código
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeManager;
