import React from "react";
import { motion } from "framer-motion";
// Importar los prefijos telefónicos desde el archivo JSON
import phonePrefixesData from '@/data/phonePrefixes.json';
import { PLACEHOLDERS } from '@/lib/config';

interface ContactInfoProps {
  formData: {
    email: string;
    phonePrefix: string;
    phone: string;
  };
  errors: {
    [key: string]: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  inputVariants: any;
  serverErrors?: {   // Nuevo prop para errores del servidor
    email?: string;
    phone?: string;
    general?: string;
  };
}

const ContactInfo: React.FC<ContactInfoProps> = ({
  formData,
  errors,
  handleChange,
  inputVariants,
  serverErrors,  // Recibimos los errores del servidor
}) => {
  return (
    <>
      <motion.div variants={inputVariants}>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Información de contacto</h3>
      </motion.div>
      
      {/* Mensaje de error general del servidor */}
      {serverErrors?.general && (
        <motion.div 
          variants={inputVariants}
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {serverErrors.general}
        </motion.div>
      )}
      
      <motion.div variants={inputVariants}>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <motion.input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
            errors.email || serverErrors?.email ? 'border-red-500' : 'border-gray-300'
          }`}
          whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
          transition={{ duration: 0.2 }}
        />
        {errors.email && <p className="text-green-500 text-xs italic mt-1">{errors.email}</p>}
        {serverErrors?.email && <p className="text-red-500 text-xs italic mt-1">{serverErrors.email}</p>}
      </motion.div>
      
      <motion.div variants={inputVariants}>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        
        <div className="flex">
          <motion.select
            id="phonePrefix"
            name="phonePrefix"
            value={formData.phonePrefix}
            onChange={handleChange}
            className={`p-2 border rounded-l focus:ring-2 focus:ring-green-500 focus:outline-none ${
              errors.phone || serverErrors?.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ minWidth: '140px' }}
            whileFocus={{ borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
          >
            {phonePrefixesData.map((regionData, index) => (
              <optgroup key={index} label={regionData.region}>
                {regionData.prefixes.map((prefix) => (
                  <option key={prefix.value} value={prefix.value}>
                    {prefix.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </motion.select>
          <motion.input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={PLACEHOLDERS.phone}
            className={`w-full p-2 border rounded-r focus:ring-2 focus:ring-green-500 focus:outline-none ${
              errors.phone || serverErrors?.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
          />
        </div>
        {errors.phone && <p className="text-green-500 text-xs italic mt-1">{errors.phone}</p>}
        {serverErrors?.phone && <p className="text-red-500 text-xs italic mt-1">{serverErrors.phone}</p>}
        <p className="text-gray-500 text-xs italic mt-1">Solo números, sin espacios ni guiones</p>
      </motion.div>
    </>
  );
};

export default ContactInfo;