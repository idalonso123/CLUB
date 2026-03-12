import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface OldCustomerOptionProps {
  formData: {
    isOldCustomer: boolean | null;
    tarjeta_cliente?: string;
  };
  errors: {
    isOldCustomer?: string;
    tarjeta_cliente?: string;
  };
  handleChange: (e: { target: { name: string; value: any } }) => void;
  inputVariants: any;
}

const OldCustomerOption: React.FC<OldCustomerOptionProps> = ({ 
  formData, 
  errors, 
  handleChange, 
  inputVariants 
}) => {
  const [welcomePoints, setWelcomePoints] = useState<number>(5);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.config && data.config.puntosBienvenida) {
            setWelcomePoints(data.config.puntosBienvenida);
          }
        }
      } catch (error) {
        console.error('Error al cargar la configuración de puntos de bienvenida:', error);
      }
    };
    
    fetchConfig();
  }, []);
  const handleOptionChange = (value: boolean) => {
    // Asegurarse de que el valor sea un booleano verdadero
    const boolValue = value === true;
    console.log("OldCustomerOption - Valor seleccionado:", boolValue, typeof boolValue);
    
    handleChange({
      target: {
        name: "isOldCustomer",
        value: boolValue
      }
    });
  };

  return (
    <motion.div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200" variants={inputVariants}>
      <p className="text-sm text-gray-700 mb-2 font-medium">
        ¿Has sido cliente de ViveVerde anteriormente?
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Si es así, podríamos recuperar tus puntos acumulados.
      </p>
      <div className="flex space-x-4">
        <div className="flex items-center">
          <input
            id="oldCustomer-no"
            type="radio"
            name="isOldCustomer"
            checked={formData.isOldCustomer === false}
            onChange={() => handleOptionChange(false)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="oldCustomer-no" className="ml-2 text-sm text-gray-700">
            No
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="oldCustomer-yes"
            type="radio"
            name="isOldCustomer"
            checked={formData.isOldCustomer === true}
            onChange={() => handleOptionChange(true)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <label htmlFor="oldCustomer-yes" className="ml-2 text-sm text-gray-700">
            Sí
          </label>
        </div>
      </div>
      {errors.isOldCustomer && (
        <p className="text-green-500 text-xs italic mt-1">{errors.isOldCustomer}</p>
      )}
      
      {formData.isOldCustomer === false && (
        <motion.div 
          className="mt-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-green-50 border border-green-100 rounded-md p-3 flex items-center shadow-sm">
            <div className="bg-green-100 rounded-full p-1 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                ¡Como cliente nuevo recibirás {welcomePoints} puntos de bienvenida!
              </p>
              <p className="text-xs text-green-800 mt-0.5">
                Los puntos se añadirán automáticamente a tu cuenta al completar el registro
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {formData.isOldCustomer === true && (
        <motion.div 
          className="mt-3 pt-3 border-t border-gray-200"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-green-50 border border-green-100 rounded-md p-4 shadow-sm mb-3">
            <div className="flex items-start mb-2">
              <div className="flex-shrink-0 mr-2 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm text-green-800">
                Si tienes tu tarjeta de cliente, puedes ingresarla para verificar tus puntos
                <span className="text-xs text-green-600 ml-1">(opcional)</span>
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="text"
                name="tarjeta_cliente"
                value={formData.tarjeta_cliente || ''}
                onChange={(e) => handleChange({
                  target: {
                    name: "tarjeta_cliente",
                    value: e.target.value
                  }
                })}
                placeholder="Ingresa tu código de tarjeta"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            {errors.tarjeta_cliente && (
              <p className="text-green-500 text-xs italic mt-1">{errors.tarjeta_cliente}</p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OldCustomerOption;
