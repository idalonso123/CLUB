import React from 'react';
import { motion } from 'framer-motion';
import phonePrefixesData from '@/data/phonePrefixes.json';
import useUserProfile from '@/components/DashBoard/hooks/useUserProfile';
import { PLACEHOLDERS } from '@/lib/config';

interface ContactData {
  phonePrefix: string;
  phone: string;
}

interface ContactInfoEditorProps {
  userData: ContactData;
  tempUserData: ContactData;
  isEditing: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  startEditing: () => void;
  saveSection: () => Promise<void>;
  cancelEdit: () => void;
  itemVariants: any;
  phoneError?: string | null;
}

const ContactInfoEditor: React.FC<ContactInfoEditorProps> = ({
  userData,
  tempUserData,
  isEditing,
  handleChange,
  startEditing,
  saveSection,
  cancelEdit,
  itemVariants,
  phoneError
}) => {
  // Usar el hook para obtener la función de formateo y la función para recargar datos
  const { getFormattedPhone, fetchUserProfile } = useUserProfile();
  
  // Función para validar que solo se ingresen números
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Eliminar cualquier caracter que no sea un número
    const numericValue = value.replace(/\D/g, '');
    
    // Crear un evento sintético con el valor limpio
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: e.target.name,
        value: numericValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Llamar al manejador original con el evento modificado
    handleChange(syntheticEvent);
  };

  return (
    <motion.div
      className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
      variants={itemVariants}
    >
      <h3 className="text-xl font-semibold mb-4 text-green-700">Información de Contacto</h3>
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <div className="flex">
              <select
                id="phonePrefix"
                name="phonePrefix"
                value={tempUserData.phonePrefix}
                onChange={handleChange}
                className="p-2 border rounded-l focus:ring-2 focus:ring-green-500 focus:outline-none border-gray-300"
                style={{ minWidth: '140px' }}
              >
                {phonePrefixesData.map((regionData, idx) => (
                  <optgroup key={idx} label={regionData.region}>
                    {regionData.prefixes.map((prefix) => (
                      <option key={prefix.value} value={prefix.value}>
                        {prefix.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={tempUserData.phone}
                onChange={handlePhoneChange}
                placeholder={PLACEHOLDERS.phone}
                pattern="[0-9]*"
                inputMode="numeric"
                className={`w-full p-2 border rounded-r focus:ring-2 focus:ring-green-500 focus:outline-none ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            <p className="text-gray-500 text-xs italic mt-1">Solo números, sin espacios ni guiones</p>
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={async () => {
                await saveSection();
                await fetchUserProfile(); 
              }}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">Teléfono:</span> {getFormattedPhone()}
            </div>
          </div>
          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={startEditing}
              className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900"
            >
              Editar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ContactInfoEditor;