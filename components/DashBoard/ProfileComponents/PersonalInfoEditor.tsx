import React from 'react';
import { motion } from 'framer-motion';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PersonalInfoEditorProps {
  userData: UserData;
  tempUserData: UserData;
  isEditing: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startEditing: () => void;
  saveSection: () => void;
  cancelEdit: () => void;
  itemVariants: any;
  emailError?: string | null;
}

const PersonalInfoEditor: React.FC<PersonalInfoEditorProps> = ({
  userData,
  tempUserData,
  isEditing,
  handleChange,
  startEditing,
  saveSection,
  cancelEdit,
  itemVariants,
  emailError
}) => {
  const [fieldErrors, setFieldErrors] = React.useState({
    firstName: false,
    lastName: false
  });
  
  const validateField = (name: string, value: string) => {
    if (name === 'firstName' || name === 'lastName') {
      setFieldErrors(prev => ({ ...prev, [name]: value.trim() === '' }));
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    validateField(e.target.name, e.target.value);
  };
  
  const handleSaveSection = () => {
    // Validate all fields before saving
    const newErrors = {
      firstName: tempUserData.firstName.trim() === '',
      lastName: tempUserData.lastName.trim() === ''
    };
    
    setFieldErrors(newErrors);
    
    // If no errors, proceed with saving
    if (!newErrors.firstName && !newErrors.lastName) {
      saveSection();
    }
  };
  return (
    <motion.div
      className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
      variants={itemVariants}
    >
      <h3 className="text-xl font-semibold mb-4 text-green-700">Información Personal</h3>
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={tempUserData.firstName}
                onChange={handleInputChange}
                className={`w-full p-2 border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
              />
              {fieldErrors.firstName && (
                <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={tempUserData.lastName}
                onChange={handleInputChange}
                className={`w-full p-2 border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
              />
              {fieldErrors.lastName && (
                <p className="text-red-500 text-sm mt-1">Este campo es obligatorio</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={tempUserData.email}
              onChange={handleChange}
              className={`w-full p-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded focus:ring-2 focus:ring-green-500 focus:outline-none`}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
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
              onClick={handleSaveSection}
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
              <span className="font-medium">Nombre:</span> {userData.firstName} {userData.lastName}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">Email:</span> {userData.email}
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

export default PersonalInfoEditor;