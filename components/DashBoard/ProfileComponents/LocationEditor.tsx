import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAutoLocation } from "../hooks/useAutoLocation";
import { countriesData } from "@/lib/utils/countries";

interface LocationData {
  address?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

interface LocationEditorProps {
  userData: LocationData;
  tempUserData: LocationData;
  isEditing: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  startEditing: () => void;
  saveSection: () => void;
  cancelEdit: () => void;
  itemVariants: any;
}

const LocationEditor: React.FC<LocationEditorProps> = ({
  userData,
  tempUserData,
  isEditing,
  handleChange,
  startEditing,
  saveSection,
  cancelEdit,
  itemVariants,
}) => {
  // Estado local para país, ciudad y errores
  const [country, setCountry] = useState(() => {
    // Si ya tenemos un país guardado, buscar su código correspondiente
    if (tempUserData.country) {
      const foundCountry = countriesData.countries.find(c => c.name === tempUserData.country);
      return foundCountry ? foundCountry.code : "ES";
    }
    return "ES";
  });
  const [city, setCity] = useState(tempUserData.city || "");
  const [province, setProvince] = useState(tempUserData.province || "");
  const [autoError, setAutoError] = useState("");

  // Ordenar países alfabéticamente
  const sortedCountries = useMemo(() => {
    return [...countriesData.countries].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" })
    );
  }, []);

  const { isLoading, handlePostalCodeChange } = useAutoLocation({
    postalCode: tempUserData.postalCode,
    country,
    setCity: (ciudad) => {
      setCity(ciudad);
      // Propagar el cambio al padre
      handleChange({ target: { name: "city", value: ciudad } } as any);
    },
    setProvince: (provincia) => {
      setProvince(provincia);
      // Propagar el cambio al padre
      handleChange({ target: { name: "province", value: provincia } } as any);
    },
    setError: setAutoError,
  });

  // Cuando cambia el país, propagarlo y limpiar ciudad/código postal
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    setCountry(countryCode);
    
    // Buscar el nombre del país a partir del código seleccionado
    const selectedCountry = countriesData.countries.find(c => c.code === countryCode);
    const countryName = selectedCountry ? selectedCountry.name : countryCode;
    
    // Enviar el nombre del país en lugar del código al componente padre
    handleChange({ target: { name: "country", value: countryName } } as any);
    
    handleChange({ target: { name: "city", value: "" } } as any);
    handleChange({ target: { name: "province", value: "" } } as any);
    handleChange({ target: { name: "postalCode", value: "" } } as any);
    setCity("");
    setProvince("");
    setAutoError("");
  };

  // Cuando cambia el código postal, lanzar autocompletado
  const handlePostalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    handlePostalCodeChange(e.target.value);
  };

  // Buscar el nombre del país a partir del código guardado
  const countryName = useMemo(() => {
    // Si userData.country ya es un nombre completo (como "España"), usarlo directamente
    if (userData.country && userData.country.length > 2) {
      return userData.country;
    }
    // Si no, buscar el nombre a partir del código
    const found = countriesData.countries.find((c) => c.code === (userData.country || country));
    return found ? found.name : userData.country || country;
  }, [userData.country, country]);

  return (
    <motion.div
      className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm"
      variants={itemVariants}
    >
      <h3 className="text-xl font-semibold mb-4 text-green-700">Ubicación</h3>
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Dirección
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={tempUserData.address || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  value={tempUserData.postalCode}
                  onChange={handlePostalChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                  pattern="[0-9]{5}"
                  title="El código postal debe tener 5 dígitos"
                />
                {isLoading && (
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
              {autoError && (
                <p className="text-red-500 text-xs italic mt-1">{autoError}</p>
              )}
            </div>
            <div className="col-span-2">
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
                value={tempUserData.city}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
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
                value={country}
                onChange={handleCountryChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
              >
                {sortedCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
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
                value={tempUserData.province}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
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
              onClick={saveSection}
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
              <span className="font-medium">Dirección:</span> {userData.address || "No especificada"}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">Código Postal:</span> {userData.postalCode}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">Ciudad:</span> {userData.city}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">País:</span> {countryName}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div>
              <span className="font-medium">Provincia:</span> {userData.province}
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

export default LocationEditor;