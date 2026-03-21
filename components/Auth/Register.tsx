import React, { useState } from "react";
import { motion } from "framer-motion";
import ProfilePhoto from "@/components/Auth/Register/ProfilePhoto";
import PersonalInfo from "@/components/Auth/Register/PersonalInfo";
import PasswordFields from "@/components/Auth/Register/PasswordFields";
import ContactInfo from "@/components/Auth/Register/ContactInfo";
import PropertyInfo from "@/components/Auth/Register/PropertyInfo";
import Location from "@/components/Auth/Register/Location";
import TermsAndConditions from "@/components/Auth/Register/TermsAndConditions";
import OldCustomerOption from "@/components/Auth/Register/OldCustomerOption";
import SubmitButton from "@/components/Auth/Register/SubmitButton";
import useRegister from "@/components/Auth/hooks/useRegister";

const Register: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    formData,
    photoPreview,
    errors,
    isSubmitting,
    serverErrors,
    successMessage,
    errorMessage,
    handleChange,
    handlePhotoChange,
    removePhoto,
    handleSubmit,
    setFormData,
    inputVariants,
    buttonVariants,
  } = useRegister();

  // Campos que corresponden a la primera página
  const firstPageFields = [
    'firstName', 'lastName', 'email', 'password', 'confirmPassword', 
    'phone', 'photo', 'country', 'city', 'postalCode', 
    'terms', 'birthDate', 'isOldCustomer', 'tarjeta_cliente'
  ];

  // Campos que corresponden a la segunda página
  const secondPageFields = [
    'caracteristicas_vivienda', 'animales'
  ];

  // Verificar si hay errores en la primera página
  const hasFirstPageErrors = () => {
    return Object.keys(errors).some(key => firstPageFields.includes(key));
  };

  // Verificar si hay errores en la segunda página
  const hasSecondPageErrors = () => {
    return Object.keys(errors).some(key => secondPageFields.includes(key));
  };

  // Obtener los errores de la primera página para mostrarlos en la segunda
  const getFirstPageErrorMessages = () => {
    return Object.entries(errors)
      .filter(([key]) => firstPageFields.includes(key))
      .map(([key, value]) => {
        // Convertir claves a nombres más legibles
        const fieldNameMap: Record<string, string> = {
          'firstName': 'Nombre',
          'lastName': 'Apellido',
          'email': 'Correo electrónico',
          'password': 'Contraseña',
          'confirmPassword': 'Confirmación de contraseña',
          'phone': 'Número de teléfono',
          'photo': 'Foto de perfil',
          'country': 'País',
          'postalCode': 'Código postal',
          'city': 'Ciudad',
          'terms': 'Términos y condiciones',
          'birthDate': 'Fecha de nacimiento',
          'isOldCustomer': 'Cliente antiguo',
          'tarjeta_cliente': 'Tarjeta de cliente'
        };
        
        const fieldName = fieldNameMap[key] || key;
        return `${fieldName}: ${value}`;
      });
  };

  // Obtener los errores de la segunda página
  const getSecondPageErrorMessages = () => {
    return Object.entries(errors)
      .filter(([key]) => secondPageFields.includes(key))
      .map(([key, value]) => {
        // Convertir claves a nombres más legibles
        const fieldNameMap: Record<string, string> = {
          'caracteristicas_vivienda': 'Características de la vivienda',
          'animales': 'Animales'
        };
        
        const fieldName = fieldNameMap[key] || key;
        return `${fieldName}: ${value}`;
      });
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const goToNextPage = () => setCurrentPage(2);
  const goToPreviousPage = () => setCurrentPage(1);

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
      {/* Mensaje de error general */}
      {errorMessage && (
        <motion.div
          className="p-3 bg-red-50 text-red-700 text-sm rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Mensaje de éxito */}
      {successMessage && (
        <motion.div
          className="p-3 bg-green-50 text-green-700 text-sm rounded-md"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {successMessage}
        </motion.div>
      )}

      {currentPage === 1 ? (
        <>
          <ProfilePhoto
            photoPreview={photoPreview}
            errors={errors}
            handlePhotoChange={handlePhotoChange}
            removePhoto={removePhoto}
            inputVariants={inputVariants}
          />

          <PersonalInfo
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
          />

          <PasswordFields
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
          />

          <ContactInfo
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
            serverErrors={serverErrors}
          />

          <Location
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            setFormData={setFormData}
            inputVariants={inputVariants}
          />

          <OldCustomerOption
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
          />
          
          <TermsAndConditions
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
          />

          <motion.div 
            className="flex justify-end"
            variants={buttonVariants}
          >
            <button
              type="button"
              onClick={goToNextPage}
              className="py-2 px-6 bg-green-800 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Siguiente
            </button>
          </motion.div>
        </>
      ) : (
        <>
          {/* Alerta de errores combinada */}
          {(hasFirstPageErrors() || hasSecondPageErrors() || serverErrors.email || serverErrors.phone || serverErrors.general) && (
            <motion.div
              className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-yellow-800 font-medium">Hay errores que debes corregir</h3>
              </div>
              <div className="text-sm text-yellow-700 mb-2">
                Por favor, corrige los siguientes errores antes de continuar:
                <ul className="list-disc pl-5 mt-1">
                  {/* Errores de la primera página */}
                  {getFirstPageErrorMessages().map((error, index) => (
                    <li key={`first-${index}`}>{error}</li>
                  ))}
                  
                  {/* Errores de la segunda página */}
                  {getSecondPageErrorMessages().map((error, index) => (
                    <li key={`second-${index}`}>{error}</li>
                  ))}
                  
                  {/* Errores del servidor */}
                  {serverErrors.email && <li>Correo electrónico: {serverErrors.email}</li>}
                  {serverErrors.phone && <li>Teléfono: {serverErrors.phone}</li>}
                  {serverErrors.general && <li>{serverErrors.general}</li>}
                </ul>
              </div>
              
              {(hasFirstPageErrors() || serverErrors.email || serverErrors.phone || serverErrors.general) && (
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1 px-3 rounded transition-colors"
                >
                  Volver a la información personal
                </button>
              )}
            </motion.div>
          )}

          <motion.h2 
            className="text-xl font-bold mb-4 text-green-700"
            variants={inputVariants}
          >
            Información Personal
          </motion.h2>
          
          <PropertyInfo
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            inputVariants={inputVariants}
          />

          <div className="flex justify-between mt-6">
            <motion.button
              type="button"
              onClick={goToPreviousPage}
              variants={buttonVariants}
              className="py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Regresar
            </motion.button>

            <SubmitButton
              buttonText={isSubmitting ? "Procesando..." : "Registrarse"}
              buttonVariants={buttonVariants}
              isSubmitting={isSubmitting}
              isDisabled={isSubmitting || hasFirstPageErrors() || hasSecondPageErrors()}
            />
          </div>
        </>
      )}
    </motion.form>
    </>
  );
};

export default Register;