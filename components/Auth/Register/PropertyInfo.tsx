import React from "react";
import { motion } from "framer-motion";

interface PropertyInfoProps {
  formData: {
    caracteristicas_vivienda?: string[];
    animales?: string[];
  };
  errors: {
    [key: string]: string;
  };
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  inputVariants: any;
}

const CARACTERISTICAS = [
  "terraza",
  "balcón",
  "huerto",
  "césped",
  "jardín",
  "estanque",
  "marquesina",
  "piscina",
];
const ANIMALES = [
  "sin animales",
  "perro(s)",
  "gato(s)",
  "pájaro(s)",
  "pez (peces)",
  "roedor(es)",
  "otros",
  "animales de corral",
];

const PropertyInfo: React.FC<PropertyInfoProps> = ({
  formData,
  errors,
  handleChange,
  inputVariants,
}) => {
  // Inicializamos los arrays si no existen en formData
  const caracteristicas = formData.caracteristicas_vivienda || [];
  const animales = formData.animales || [];
  
  // Handler para los campos tipo set (checkbox múltiple)
  const handleSetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    let updatedArr: string[] = [];
    
    if (name === "caracteristicas_vivienda") {
      updatedArr = [...caracteristicas];
    } else if (name === "animales") {
      updatedArr = [...animales];
    }
    
    if (checked) {
      // Evitamos duplicados de manera estable
      if (!updatedArr.includes(value)) updatedArr.push(value);
    } else {
      updatedArr = updatedArr.filter((v) => v !== value);
    }
    
    // Usamos un objeto literal en lugar de "as any" para mejorar la tipificación
    const syntheticEvent = {
      target: {
        name,
        value: updatedArr,
      },
    };
    
    handleChange(syntheticEvent as any);
  };

  return (
    <>
      <motion.div variants={inputVariants} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Características de la vivienda
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded border-gray-300 bg-white">
          {CARACTERISTICAS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer hover:text-green-700"
            >
              <input
                type="checkbox"
                name="caracteristicas_vivienda"
                value={opt}
                checked={caracteristicas.includes(opt)}
                onChange={handleSetChange}
                className="h-4 w-4 accent-green-600 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              {opt}
            </label>
          ))}
        </div>
        {errors.caracteristicas_vivienda && (
          <p className="text-green-500 text-xs italic mt-1">
            {errors.caracteristicas_vivienda}
          </p>
        )}
      </motion.div>

      <motion.div variants={inputVariants} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Animales
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-gray-300 rounded bg-white">
          {ANIMALES.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer hover:text-green-700"
            >
              <input
                type="checkbox"
                name="animales"
                value={opt}
                checked={animales.includes(opt)}
                onChange={handleSetChange}
                className="h-4 w-4 accent-green-600 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              {opt}
            </label>
          ))}
        </div>
        {errors.animales && (
          <p className="text-green-500 text-xs italic mt-1">
            {errors.animales}
          </p>
        )}
      </motion.div>
    </>
  );
};

export default PropertyInfo;
