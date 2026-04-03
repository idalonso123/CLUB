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

  // Requisitos de contraseña robusta
  const passwordRequirements = [
    { id: 'length', label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
    { id: 'upper', label: 'Al menos una mayúscula', test: (p: string) => /[A-Z]/.test(p) },
    { id: 'lower', label: 'Al menos una minúscula', test: (p: string) => /[a-z]/.test(p) },
    { id: 'number', label: 'Al menos un número', test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: 'Al menos un carácter especial (!@#$%^&*)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const getPasswordStrength = () => {
    const passed = passwordRequirements.filter(req => req.test(formData.password)).length;
    return passed;
  };

  const strength = getPasswordStrength();

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
        
        {/* Indicador de requisitos de contraseña */}
        {formData.password && (
          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">La contraseña debe cumplir:</p>
            <ul className="text-xs space-y-0.5">
              {passwordRequirements.map((req) => (
                <li 
                  key={req.id}
                  className={`flex items-center ${req.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {req.test(formData.password) ? (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
            {/* Barra de progreso de fortaleza */}
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    strength <= 2 ? 'bg-red-500' : 
                    strength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(strength / passwordRequirements.length) * 100}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${
                strength <= 2 ? 'text-red-600' : 
                strength <= 4 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {strength <= 2 ? 'Débil' : strength <= 4 ? 'Media' : 'Fuerte'}
              </p>
            </div>
          </div>
        )}
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