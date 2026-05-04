import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProfilePhotoEditorProps {
  photoPreview: string;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: () => void;
  cancelPhotoChange: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  saveSection: () => void;
  itemVariants: any;
  userName?: {
    firstName: string;
    lastName: string;
  };
  isPhotoChanged?: boolean;
  isDeleteConfirmOpen?: boolean;
  setIsDeleteConfirmOpen?: (isOpen: boolean) => void;
}

const ProfilePhotoEditor: React.FC<ProfilePhotoEditorProps> = ({
  photoPreview,
  handlePhotoChange,
  removePhoto,
  cancelPhotoChange,
  fileInputRef,
  saveSection,
  itemVariants,
  userName = { firstName: 'U', lastName: 'S' },
  isPhotoChanged = false,
  isDeleteConfirmOpen = false,
  setIsDeleteConfirmOpen = () => {}
}) => {
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determinar si estamos usando una foto real o debemos mostrar iniciales
  const isDefaultPhoto = !photoPreview || photoPreview === '/default-avatar.jpg';

  return (
    <motion.div
      className="bg-white p-5 border border-gray-300 rounded-lg mb-4 shadow-sm flex flex-col items-center"
      variants={itemVariants}
    >
      <div className="relative">
        <div
          onClick={isDeleteConfirmOpen ? undefined : triggerFileInput}
          className={`w-32 h-32 rounded-full border-2 border-dashed border-green-500 flex items-center justify-center overflow-hidden bg-gray-50 ${isDeleteConfirmOpen ? 'opacity-70' : 'cursor-pointer hover:bg-gray-100'} transition-all duration-200`}
        >
          {!isDefaultPhoto ? (
            // Mostrar la imagen seleccionada
            <div className="w-full h-full relative">
              <Image
                src={photoPreview}
                alt="Foto de perfil"
                className="object-cover"
                fill
                sizes="128px"
                priority
                unoptimized={true}
                onError={(e) => {
                  console.error('Error al cargar la imagen:', photoPreview);
                  // Si hay error al cargar la imagen, mostrar las iniciales como fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Mostrar un contenedor con las iniciales
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-4xl';
                    fallback.textContent = `${userName.firstName.charAt(0) || 'U'}${userName.lastName.charAt(0) || 'S'}`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
          ) : (
            // Mostrar las iniciales como en infoModal
            <div className="w-full h-full bg-green-100 flex items-center justify-center text-green-800 font-bold text-4xl">
              {userName.firstName.charAt(0)}{userName.lastName.charAt(0)}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={isDeleteConfirmOpen ? undefined : handlePhotoChange}
            disabled={isDeleteConfirmOpen}
            className="hidden"
          />
        </div>

        {/* Mostrar el botón de eliminar solo cuando se ha seleccionado una foto personalizada y no está en modo de edición */}
        {!isDefaultPhoto && !isPhotoChanged && (
          <motion.button
            type="button"
            className="absolute -top-3 -right-3 bg-green-800 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:bg-green-600 transition-colors"
            onClick={() => setIsDeleteConfirmOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-xmark"></i>
          </motion.button>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-2">Haz clic para cambiar tu foto</p>

      {/* Botones para guardar o cancelar cuando se cambia la foto */}
      {isPhotoChanged && (
        <motion.div
          className="w-full text-center mt-2 flex justify-center gap-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={saveSection}
            className="px-4 py-1.5 mt-1 bg-green-700 text-white text-sm rounded hover:bg-green-800 transition-colors"
          >
            <i className="fas fa-check mr-1"></i>
            Guardar foto
          </button>
          <button
            type="button"
            onClick={cancelPhotoChange}
            className="px-4 py-1.5 mt-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <i className="fas fa-times mr-1"></i>
            Cancelar
          </button>
        </motion.div>
      )}

      {/* Confirmación para eliminar foto */}
      {isDeleteConfirmOpen && (
        <motion.div
          className="w-full text-center mt-2 flex justify-center gap-2"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={removePhoto}
            className="px-4 py-1.5 mt-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            <i className="fas fa-trash mr-1"></i>
            Eliminar foto
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(false)}
            className="px-4 py-1.5 mt-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          >
            <i className="fas fa-times mr-1"></i>
            Cancelar
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfilePhotoEditor;