import React, { useRef, RefObject } from "react";
import { motion } from "framer-motion";
import Image from 'next/image';

interface ProfilePhotoProps {
  photoPreview: string | null;
  errors: {
    photo?: string;
  };
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (e: React.MouseEvent) => void;
  inputVariants: any;
}

// Límite de tamaño para la foto de perfil (2 MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB en bytes
// Formatos de imagen permitidos
const ALLOWED_FORMATS = ['image/jpeg', 'image/png'];

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  photoPreview,
  errors,
  handlePhotoChange,
  removePhoto,
  inputVariants
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Función modificada para validar el tamaño y formato del archivo
  const validateAndHandlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setFileError(null);
    
    if (file) {
      // Comprobar formato del archivo
      if (!ALLOWED_FORMATS.includes(file.type)) {
        setFileError('Formato no válido. Solo se permiten archivos JPG y PNG.');
        // Resetear input de archivo
        e.target.value = '';
        return;
      }
      
      // Comprobar tamaño del archivo
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`La imagen es demasiado grande. El tamaño máximo es ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
        // Resetear input de archivo
        e.target.value = '';
        return;
      }
      
      // Si pasa la validación, llamar a la función original
      handlePhotoChange(e);
    }
  };
  
  return (
    <motion.div
      variants={inputVariants}
      className="flex flex-col items-center mb-4"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Foto de perfil
      </label>
      <div className="relative">
        <div
          onClick={triggerFileInput}
          className="cursor-pointer w-32 h-32 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-all duration-200"
        >
          {photoPreview ? (
            <motion.div 
              className="w-full h-full relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={photoPreview}
                alt="Vista previa"
                fill
                className="object-cover"
                sizes="128px"
                unoptimized={true}
                onError={(e) => {
                  console.error('Error al cargar la imagen:', photoPreview);
                  // Si hay error al cargar la imagen, mostrar un icono como fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Mostrar un contenedor con un icono
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex items-center justify-center text-green-600';
                    fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </motion.div>
          ) : (
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs mt-2 block">Añadir foto</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png" // Restringir a JPG y PNG desde el input
            onChange={validateAndHandlePhotoChange}
            className="hidden"
          />
        </div>
        {photoPreview && (
          <motion.button
            type="button"
            className="absolute -top-3 -right-3 bg-green-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-green-600 transition-colors"
            onClick={removePhoto}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fa-solid fa-xmark"></i>
          </motion.button>
        )}
      </div>
      {(errors.photo || fileError) && (
        <p className="text-red-500 text-xs italic mt-1">{fileError || errors.photo}</p>
      )}
      <p className="text-gray-500 text-xs italic mt-1">
        Tamaño máximo: 2 MB. Formatos: JPG, PNG
      </p>
    </motion.div>
  );
};

export default ProfilePhoto;