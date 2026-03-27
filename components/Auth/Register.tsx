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
      {/* Modal de Éxito Grande y Centrado */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-auto p-8 text-center border-2 border-green-200"
          >
            {/* Icono de check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" as const, stiffness: 200 }}
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4"
            >
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            {/* Título */}
            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-green-800 mb-4"
            >
              ¡Registro Exitoso!
            </motion.h3>

            {/* Mensaje */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <p className="text-gray-700 text-base">
                {successMessage}
              </p>

              {/* Instrucciones adicionales */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Próximos pasos:</p>
                    <ul className="text-left space-y-1">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        Revisa tu bandeja de entrada
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        Haz clic en el enlace de verificación
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        Inicia sesión con tus credenciales
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botón para ir al login */}
              <div className="mt-6">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-800 hover:bg-green-900 text-white font-medium rounded-lg transition-colors w-full"
                >
                  Ir a Iniciar Sesión
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

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