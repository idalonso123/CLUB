import React, { useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";

interface PasswordFieldsProps {
  formData: {
    password: string;
    confirmPassword: string;
  };
  errors: {
    password?: string;
    confirmPassword?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputVariants: any;
}

const PasswordFields: React.FC<PasswordFieldsProps> = ({ formData, errors, handleChange, inputVariants }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Manejar el tabulador para que salte al siguiente campo de entrada
  const handleTabOnVisibilityButton = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Si es el botón de mostrar password, vamos a confirmPassword
      if (e.currentTarget.id === 'toggle-password') {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        confirmPasswordInput?.focus();
      }
      // Si es el botón de mostrar confirmPassword, mantenemos el comportamiento predeterminado
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <motion.div variants={inputVariants}>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <div className="relative">
          <motion.input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Contraseña"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
            autoComplete="new-password"
          />
          {formData.password && (
            <button
              type="button"
              id="toggle-password"
              onClick={togglePasswordVisibility}
              onKeyDown={handleTabOnVisibilityButton}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              tabIndex={-1} // Establecemos tabIndex a -1 para que no sea parte del orden de tabulación
              aria-label="Mostrar/ocultar contraseña"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {errors.password && <p className="text-red-500 text-xs italic mt-1">{errors.password}</p>}
      </motion.div>
      <motion.div variants={inputVariants}>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar contraseña
        </label>
        <div className="relative">
          <motion.input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirmar contraseña"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
            autoComplete="new-password"
          />
          {formData.confirmPassword && (
            <button
              type="button"
              id="toggle-confirm-password"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
              tabIndex={-1} // Establecemos tabIndex a -1 para que no sea parte del orden de tabulación
              aria-label="Mostrar/ocultar confirmación de contraseña"
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs italic mt-1">{errors.confirmPassword}</p>}
      </motion.div>
    </div>
  );
};

export default PasswordFields;