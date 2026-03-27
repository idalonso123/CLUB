import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import countries from "@/data/countries.json";

interface LocationProps {
  formData: {
    city: string;
    postalCode: string;
    country?: string;
    [key: string]: any;
  };
  errors: {
    [key: string]: string;
  };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  inputVariants: any;
}

const Location: React.FC<LocationProps> = ({
  formData,
  errors,
  handleChange,
  setFormData,
  inputVariants,
}) => {
  const [isLoadingCity, setIsLoadingCity] = useState(false);
  const [postalCodePlaceholder, setPostalCodePlaceholder] = useState("00000");
  const [postalCodeFormat, setPostalCodeFormat] = useState("");
  const [cityLookupError, setCityLookupError] = useState("");

  // Referencia para el timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ordenar países alfabéticamente usando useMemo para evitar ordenar en cada renderizado
  const sortedCountries = useMemo(() => {
    return [...countries.countries].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, []);

  // Efecto para actualizar el formato del código postal cuando cambia el país
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countries.countries.find(
        (c) => c.code === formData.country
      );
      if (selectedCountry) {
        setPostalCodePlaceholder(selectedCountry.example);
        setPostalCodeFormat(selectedCountry.format);
      }
    }
  }, [formData.country]);

  // Función para manejar el cambio de país
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Llamar al handleChange original para actualizar formData en el componente padre
    handleChange(e);

    // Limpiar el campo de código postal y provincia cuando se cambia el país
    setFormData((prev: any) => ({
      ...prev,
      postalCode: "",
      city: "",
    }));

    // Limpiar posibles errores anteriores
    setCityLookupError("");
  };

  // Función para obtener la longitud esperada del código postal basado en su formato
  const getExpectedPostalCodeLength = (country: string): number => {
    const selectedCountry = countries.countries.find((c) => c.code === country);
    if (!selectedCountry) return 5; // Valor por defecto

    // Eliminar los espacios en blanco y guiones para obtener la longitud real
    const formatWithoutSpaces = selectedCountry.format.replace(/[\s-]/g, "");
    return formatWithoutSpaces.length;
  };

  // Función para verificar si el código postal está completo
  const isPostalCodeComplete = (
    postalCode: string,
    country: string
  ): boolean => {
    const expectedLength = getExpectedPostalCodeLength(country);

    // Limpiar espacios y guiones para la comparación
    const cleanPostalCode = postalCode.replace(/[\s-]/g, "");

    // Casos especiales para ciertos países
    if (country === "GB") {
      // Reino Unido
      return cleanPostalCode.length >= 5; // Permitir búsqueda con al menos la parte del área
    }

    return cleanPostalCode.length === expectedLength;
  };

  // Función para buscar la ciudad/provincia por código postal usando nuestra API local
  const handlePostalCodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange(e); // Mantener el comportamiento original

    const postalCode = e.target.value.trim();
    const country = formData.country;

    if (!country) return; // No hacer nada si no hay país seleccionado

    // Limpiar errores anteriores
    setCityLookupError("");

    // Cancelar cualquier búsqueda pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (postalCode.length === 0) {
      // Limpiar el campo de provincia si se borra el código postal
      setFormData((prev: any) => ({
        ...prev,
        city: "",
      }));
      return;
    }

    // Solo buscar cuando el código postal esté completo
    if (isPostalCodeComplete(postalCode, country)) {
      // Esperar un poco antes de buscar para evitar múltiples solicitudes
      timeoutRef.current = setTimeout(async () => {
        setIsLoadingCity(true);

        try {
          // Utilizamos nuestra API local que actúa como proxy a Zippopotam
          const response = await fetch(
            `/api/location/postalcode?code=${postalCode}&country=${country}`
          );

          if (response.ok) {
            const result = await response.json();

            if (result.success && result.data && result.data.city) {
              // Aquí estamos usando el campo "city" para almacenar la provincia
              setFormData((prev: any) => ({
                ...prev,
                city: result.data.city,
              }));
              
              // Crear un evento sintético para asegurar que el cambio se propague correctamente
              const syntheticEvent = {
                target: {
                  name: 'city',
                  value: result.data.city
                }
              };
              handleChange(syntheticEvent as any);
            } else {
              setCityLookupError(
                "No se encontró la provincia para el código postal proporcionado."
              );

              // Limpiar el campo provincia si no se encontró
              setFormData((prev: any) => ({
                ...prev,
                city: "",
              }));
            }
          } else {
            const errorData = await response.json();
            setCityLookupError(
              errorData.message ||
                "Error al buscar provincia por código postal."
            );

            // Limpiar el campo provincia en caso de error
            setFormData((prev: any) => ({
              ...prev,
              city: "",
            }));
          }
        } catch (error) {
          console.error("Error al buscar provincia por código postal:", error);
          setCityLookupError("Error al buscar provincia por código postal.");

          // Limpiar el campo provincia en caso de error
          setFormData((prev: any) => ({
            ...prev,
            city: "",
          }));
        } finally {
          setIsLoadingCity(false);
        }
      }, 500); // Retraso de 500ms para evitar demasiadas solicitudes mientras se escribe
    } else {
      // Si el código postal no está completo, limpiar la provincia
      if (formData.city) {
        setFormData((prev: any) => ({
          ...prev,
          city: "",
        }));
      }
    }
  };

  return (
    <>
      <motion.div variants={inputVariants}>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Ubicación</h3>
      </motion.div>

      {/* Selector de país */}
      <motion.div variants={inputVariants} className="mb-4">
        <label
          htmlFor="country"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          País
        </label>
        <motion.select
          id="country"
          name="country"
          value={formData.country || ""}
          onChange={handleCountryChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
            errors.country ? "border-green-500" : "border-gray-300"
          }`}
          whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
          transition={{ duration: 0.2 }}
        >
          <option value="">Selecciona un país</option>
          {sortedCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </motion.select>
        {errors.country && (
          <p className="text-green-500 text-xs italic mt-1">{errors.country}</p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div variants={inputVariants}>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Código Postal
          </label>
          <motion.input
            id="postalCode"
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handlePostalCodeChange}
            placeholder={postalCodePlaceholder}
            disabled={!formData.country} // Deshabilitar hasta que se seleccione un país
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none 
              ${errors.postalCode ? "border-green-500" : "border-gray-300"}
              ${!formData.country ? "bg-gray-100 cursor-not-allowed" : ""}`}
            whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
            transition={{ duration: 0.2 }}
          />
          {errors.postalCode && (
            <p className="text-green-500 text-xs italic mt-1">
              {errors.postalCode}
            </p>
          )}
          <p className="text-gray-500 text-xs italic mt-1">
            {formData.country
              ? `Formato: ${postalCodeFormat}`
              : "Primero selecciona un país"}
          </p>
          {postalCodeFormat &&
            formData.postalCode &&
            !isPostalCodeComplete(formData.postalCode, formData.country!) && (
              <p className="text-amber-500 text-xs italic mt-1">
                Completa el código postal (
                {getExpectedPostalCodeLength(formData.country!)} caracteres)
                para buscar la provincia
              </p>
            )}
        </motion.div>

        <motion.div variants={inputVariants}>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Provincia
          </label>
          <div className="relative">
            <motion.input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Provincia"
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
                errors.city ? "border-green-500" : "border-gray-300"
              }`}
              whileFocus={{ scale: 1.01, borderColor: "#22c55e" }}
              transition={{ duration: 0.2 }}
            />
            {isLoadingCity && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                  className="animate-spin h-5 w-5 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>
          {errors.city && (
            <p className="text-green-500 text-xs italic mt-1">{errors.city}</p>
          )}
          {cityLookupError && (
            <p className="text-red-500 text-xs italic mt-1">
              {cityLookupError}
            </p>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default Location;
