import React from "react";
import { motion } from "framer-motion";

interface PersonalInfoProps {
  formData: {
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    birthDate?: string; // Añadido campo de fecha de nacimiento
  };
  errors: {
    firstName?: string;
    lastName?: string;
    dni?: string;
    email?: string;
    birthDate?: string; // Añadido posible error para fecha de nacimiento
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputVariants: any;
}

const PersonalInfo: React.FC<PersonalInfoProps> = ({ formData, errors, handleChange, inputVariants }) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={inputVariants}>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <motion.input
            id="firstName"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Nombre"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.firstName ? 'border-green-500' : 'border-gray-300'}`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
          />
          {errors.firstName && <p className="text-green-500 text-xs italic mt-1">{errors.firstName}</p>}
        </motion.div>
        <motion.div variants={inputVariants}>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos
          </label>
          <motion.input
            id="lastName"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Apellidos"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.lastName ? 'border-green-500' : 'border-gray-300'}`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
          />
          {errors.lastName && <p className="text-green-500 text-xs italic mt-1">{errors.lastName}</p>}
        </motion.div>
      </div>

      {/* Campo de DNI */}
      <motion.div variants={inputVariants} className="mt-4">
        <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
          DNI
        </label>
        <motion.input
          id="dni"
          type="text"
          name="dni"
          value={formData.dni}
          onChange={handleChange}
          placeholder="Documento de Identidad (DNI, NIE, Pasaporte, etc.)"
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.dni ? 'border-green-500' : 'border-gray-300'}`}
          whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
          transition={{ duration: 0.2 }}
        />
        {errors.dni && <p className="text-green-500 text-xs italic mt-1">{errors.dni}</p>}
        <p className="text-gray-500 text-xs italic mt-1">Introduce tu documento de identidad (obligatorio)</p>
      </motion.div>
      
      {/* Campo de fecha de nacimiento */}
      <motion.div variants={inputVariants} className="mt-4">
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de Nacimiento
        </label>
        <motion.input
          id="birthDate"
          type="date"
          name="birthDate"
          value={formData.birthDate || ''}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.birthDate ? 'border-green-500' : 'border-gray-300'}`}
          whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
          transition={{ duration: 0.2 }}
          max={new Date().toISOString().split('T')[0]} // Limitar a la fecha actual
        />
        {errors.birthDate && <p className="text-green-500 text-xs italic mt-1">{errors.birthDate}</p>}
        <p className="text-gray-500 text-xs italic mt-1">Debe ser mayor de edad para registrarse</p>
      </motion.div>
    </>
  );
};

export default PersonalInfo;