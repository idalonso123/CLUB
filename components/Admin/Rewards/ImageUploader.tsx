import React, { useState, useRef, useEffect } from 'react';

interface ImageInfo {
  name: string;
  url: string;
  size: number;
  type: string;
  modifiedAt: string;
}

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [existingImages, setExistingImages] = useState<ImageInfo[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value) {
      setError(null);
    }
  }, [value]);

  const loadExistingImages = async () => {
    setLoadingGallery(true);
    try {
      const response = await fetch('/api/uploads/rewards-list');
      const data = await response.json();
      if (data.success) {
        setExistingImages(data.images);
      } else {
        setExistingImages([]);
      }
    } catch (err) {
      console.error('Error al cargar imágenes:', err);
      setExistingImages([]);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleOpenGallery = () => {
    loadExistingImages();
    setShowGallery(true);
  };

  const handleSelectImage = (url: string) => {
    onChange(url);
    setShowGallery(false);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use: JPG, PNG, GIF o WebP';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `El archivo es demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        setUploadProgress(100);

        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            onChange(response.imageUrl);
          } else {
            setError(response.error || 'Error al subir la imagen');
          }
        } else {
          setError('Error al subir la imagen');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setError('Error de conexión al subir la imagen');
      };

      xhr.open('POST', '/api/uploads/rewards-image');
      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      setError('Error al subir la imagen');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleRemoveImage = async () => {
    onChange('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      {/* Área de subida */}
      {(!value || isUploading) && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            dragActive 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-600">Subiendo imagen...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-cloud-upload-alt text-2xl text-gray-400"></i>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="text-green-600 font-medium">Haz clic para subir</span> o arrastra la imagen aquí
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF o WebP • Máx. 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botón para ver galería */}
      {!value && !isUploading && (
        <button
          type="button"
          onClick={handleOpenGallery}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-images"></i>
          <span>Ver imágenes existentes</span>
        </button>
      )}

      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {/* Preview de imagen */}
      {value && !isUploading && (
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={value}
              alt="Vista previa"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {value.split('/').pop()}
            </span>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={disabled}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                <i className="fas fa-images mr-1"></i>
                Galería
              </button>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                <i className="fas fa-exchange-alt mr-1"></i>
                Cambiar
              </button>
              
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled}
                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                <i className="fas fa-trash-alt mr-1"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de galería */}
      {showGallery && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGallery(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                <i className="fas fa-images mr-2 text-green-600"></i>
                Imágenes existentes
              </h3>
              <button
                onClick={() => setShowGallery(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingGallery ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
                  <span className="ml-3 text-gray-600">Cargando imágenes...</span>
                </div>
              ) : existingImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <i className="fas fa-image text-4xl mb-3 text-gray-300"></i>
                  <p>No hay imágenes subidas todavía</p>
                  <p className="text-sm mt-1">Sube una imagen usando el formulario de arriba</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {existingImages.map((image) => (
                    <div
                      key={image.name}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        value === image.url 
                          ? 'border-green-500 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:border-green-400'
                      }`}
                      onClick={() => handleSelectImage(image.url)}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs truncate">{image.name}</p>
                        <p className="text-white text-xs opacity-75">{formatFileSize(image.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {existingImages.length} imagen{existingImages.length !== 1 ? 'es' : ''} disponible{existingImages.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setShowGallery(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
