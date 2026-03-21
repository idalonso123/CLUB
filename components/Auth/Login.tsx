import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface LoginProps {
  onOpenHelpModal?: () => void;
}

const Login: React.FC<LoginProps> = ({ onOpenHelpModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);

  const { login } = useAuth();
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAccountDisabled(false);
    setIsSubmitting(true);
    
    try {
      await login(email, password, rememberMe);
      // No necesitamos redirección aquí, el contexto se encarga
    } catch (err) {
      console.error('Error durante el login:', err);
      
      // Verificar si es un error de cuenta deshabilitada
      if ((err as any)?.accountDisabled) {
        setIsAccountDisabled(true);
        setError('La cuenta se encuentra desactivada. Póngase en contacto con nuestro equipo.');
      } else {
        // Mostrar el mensaje de error específico que viene del servidor o un mensaje genérico
        const errorMessage = (err as any)?.message || 'Ocurrió un error durante el inicio de sesión';
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputVariants = {
    focus: {
      scale: 1.02,
      borderColor: '#166534', // green-800
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };
  
  return (
    <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
      {error && (
        <motion.div
          className={`mb-4 p-3 rounded-md ${isAccountDisabled ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-700'} text-sm`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <div className="flex">
            {isAccountDisabled ? (
              <>
                <i className="fas fa-exclamation-triangle mr-2 mt-0.5"></i>
                <div>
                  <p className="font-medium">Cuenta desactivada</p>
                  <p>{error}</p>
                  <p className="mt-1">
                    <Link href="/contact" className="underline hover:text-yellow-900">
                      Contactar soporte
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <p>{error}</p>
            )}
          </div>
        </motion.div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico
          </label>
          <motion.input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@correo.com"
            required
            className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            whileFocus="focus"
            variants={inputVariants}
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <motion.input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
              whileFocus="focus"
              variants={inputVariants}
              disabled={isSubmitting}
            />
            {/* Icono para mostrar/ocultar la contraseña */}
            {password && (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
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
        </div>
        
        <div>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-green-800 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-600">Recordar sesión</span>
          </label>
        </div>
        
        <motion.button
          type="submit"
          className="w-full p-2.5 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </motion.button>
        
        <div className="flex justify-between items-center text-sm mt-4">
          <Link href="/reset-password" className="text-green-800 hover:underline hover:text-green-700 transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
          <button 
            onClick={onOpenHelpModal} 
            className="text-gray-500 hover:underline hover:text-gray-700 transition-colors"
            type="button"
          >
            Ayuda
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default Login;