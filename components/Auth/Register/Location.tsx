import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { countriesData } from "@/lib/utils/countries";

interface LocationProps {
  formData: {
    city: string;
    province: string;
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
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [postalCodePlaceholder, setPostalCodePlaceholder] = useState("00000");
  const [postalCodeFormat, setPostalCodeFormat] = useState("");
  const [locationLookupError, setLocationLookupError] = useState("");

  // Referencia para el timeout
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ordenar países alfabéticamente usando useMemo para evitar ordenar en cada renderizado
  const sortedCountries = useMemo(() => {
    return [...countriesData.countries].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, []);

  // Efecto para actualizar el formato del código postal cuando cambia el país
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = countriesData.countries.find(
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

    // Limpiar el campo de código postal, provincia y ciudad cuando se cambia el país
    setFormData((prev: any) => ({
      ...prev,
      postalCode: "",
      province: "",
      city: "",
    }));

    // Limpiar posibles errores anteriores
    setLocationLookupError("");
  };

  // Función para obtener la longitud esperada del código postal basado en su formato
  const getExpectedPostalCodeLength = (country: string): number => {
    const selectedCountry = countriesData.countries.find((c) => c.code === country);
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

  // Función para buscar la provincia y ciudad por código postal usando Nominatim
  const handlePostalCodeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange(e); // Mantener el comportamiento original

    const postalCode = e.target.value.trim();
    const country = formData.country;

    if (!country) return; // No hacer nada si no hay país seleccionado

    // Limpiar errores anteriores
    setLocationLookupError("");

    // Cancelar cualquier búsqueda pendiente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (postalCode.length === 0) {
      // Limpiar el campo de provincia y ciudad si se borra el código postal
      setFormData((prev: any) => ({
        ...prev,
        province: "",
        city: "",
      }));
      return;
    }

    // Solo buscar cuando el código postal esté completo
    if (isPostalCodeComplete(postalCode, country)) {
      // Esperar un poco antes de buscar para evitar múltiples solicitudes
      timeoutRef.current = setTimeout(async () => {
        setIsLoadingLocation(true);

        try {
          // Utilizamos nuestra API local que actúa como proxy a Nominatim
          const response = await fetch(
            `/api/location/postalcode?code=${postalCode}&country=${country}`
          );

          if (response.ok) {
            const result = await response.json();

            if (result.success && result.data) {
              // Actualizar provincia y ciudad desde Nominatim
              const newData: any = {
                city: result.data.city || "",
              };
              
              // Usar state como provincia (Nominatim lo llama state, pero es la provincia/comunidad autónoma)
              if (result.data.state) {
                newData.province = result.data.state;
              }

              setFormData((prev: any) => ({
                ...prev,
                ...newData,
              }));

              // Crear eventos sintéticos para asegurar que los cambios se propaguen correctamente
              if (result.data.city) {
                const cityEvent = {
                  target: {
                    name: 'city',
                    value: result.data.city
                  }
                };
                handleChange(cityEvent as any);
              }

              if (result.data.state) {
                const provinceEvent = {
                  target: {
                    name: 'province',
                    value: result.data.state
                  }
                };
                handleChange(provinceEvent as any);
              }
            } else {
              setLocationLookupError(
                "No se encontró información para el código postal proporcionado."
              );

              // Limpiar los campos si no se encontró
              setFormData((prev: any) => ({
                ...prev,
                province: "",
                city: "",
              }));
            }
          } else {
            const errorData = await response.json();
            setLocationLookupError(
              errorData.message ||
                "Error al buscar información por código postal."
            );

            // Limpiar los campos en caso de error
            setFormData((prev: any) => ({
              ...prev,
              province: "",
              city: "",
            }));
          }
        } catch (error) {
          console.error("Error al buscar información por código postal:", error);
          setLocationLookupError("Error al buscar información por código postal.");

          // Limpiar los campos en caso de error
          setFormData((prev: any) => ({
            ...prev,
            province: "",
            city: "",
          }));
        } finally {
          setIsLoadingLocation(false);
        }
      }, 500); // Retraso de 500ms para evitar demasiadas solicitudes mientras se escribe
    } else {
      // Si el código postal no está completo, limpiar provincia y ciudad
      if (formData.city || formData.province) {
        setFormData((prev: any) => ({
          ...prev,
          province: "",
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

      {/* Fila 1: Código Postal (1/3) + Ciudad (2/3) */}
      <motion.div variants={inputVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Código Postal - 1/3 */}
        <div>
          <label
            htmlFor="postalCode"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Código Postal
          </label>
          <div className="relative">
            <input
              id="postalCode"
              type="text"
              name="postalCode"
              value={formData.postalCode}
              onChange={handlePostalCodeChange}
              placeholder={postalCodePlaceholder}
              disabled={!formData.country}
              className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none 
                ${errors.postalCode ? "border-green-500" : "border-gray-300"}
                ${!formData.country ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {isLoadingLocation && (
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
        </div>

        {/* Ciudad - 2/3 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="city"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ciudad
          </label>
          <input
            id="city"
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Ciudad"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
              errors.city ? "border-green-500" : "border-gray-300"
            }`}
          />
          {errors.city && (
            <p className="text-green-500 text-xs italic mt-1">{errors.city}</p>
          )}
        </div>
      </motion.div>

      {/* Fila 2: País (1/3) + Provincia (2/3) */}
      <motion.div variants={inputVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* País - 1/3 */}
        <div>
          <label
            htmlFor="country"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            País
          </label>
          <select
            id="country"
            name="country"
            value={formData.country || ""}
            onChange={handleCountryChange}
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
              errors.country ? "border-green-500" : "border-gray-300"
            }`}
          >
            <option value="">Selecciona</option>
            {sortedCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p className="text-green-500 text-xs italic mt-1">{errors.country}</p>
          )}
        </div>

        {/* Provincia - 2/3 */}
        <div className="sm:col-span-2">
          <label
            htmlFor="province"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Provincia
          </label>
          <input
            id="province"
            type="text"
            name="province"
            value={formData.province || ""}
            onChange={handleChange}
            placeholder="Provincia"
            className={`w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
              errors.province ? "border-green-500" : "border-gray-300"
            }`}
          />
          {errors.province && (
            <p className="text-green-500 text-xs italic mt-1">{errors.province}</p>
          )}
        </div>
      </motion.div>

      {/* Mensaje de error de búsqueda */}
      {locationLookupError && (
        <p className="text-red-500 text-xs italic mt-2">
          {locationLookupError}
        </p>
      )}
    </>
  );
};

export default Location;
