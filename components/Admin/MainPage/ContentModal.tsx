import React, { useState, useEffect } from "react";
import SliderForm from './SliderForm';
import CardForm from './CardForm';
import { ContentType } from "@/types/mainPage";

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: string, data: any) => void;
  modalType: ContentType | null;
  editItem: any;
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleActive: () => void;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  modalType,
  editItem,
  formData,
  onChange,
  onToggleActive,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  
  // Controlar el scroll y resetear errores cuando cambia el estado del modal
  useEffect(() => {
    if (isOpen) {
      // Deshabilitar scroll cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    } else {
      // Habilitar scroll cuando el modal está cerrado
      document.body.style.overflow = 'auto';
      setErrors({});
      setAttemptedSubmit(false);
    }
    
    // Cleanup cuando el componente se desmonta
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  if (!isOpen || !modalType) return null;

  const getTitle = () => {
    const action = editItem ? 'Editar' : 'Crear';
    const type = modalType === 'slider' ? 'Slide' : 
                 modalType === 'card' ? 'Tarjeta' : 'Destacado';
    return `${action} ${type}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h2 className="text-xl font-bold mb-4">{getTitle()}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            setAttemptedSubmit(true);
            
            // Validar todos los campos obligatorios antes de guardar
            const newErrors: Record<string, string> = {};
            
            if (modalType === 'slider') {
              if (!formData.title?.trim()) newErrors.title = "El título es obligatorio";
              if (!formData.description?.trim()) newErrors.description = "La descripción es obligatoria";
              if (!formData.imageUrl?.trim()) newErrors.imageUrl = "La URL de la imagen es obligatoria";
            } else if (modalType === 'card') {
              if (!formData.title?.trim()) newErrors.title = "El título es obligatorio";
              if (!formData.content?.trim()) newErrors.content = "El contenido es obligatorio";
              if (!formData.iconClass?.trim()) newErrors.iconClass = "El icono es obligatorio";
              if (!formData.buttonText?.trim()) newErrors.buttonText = "El texto del botón es obligatorio";
              if (!formData.contactUrl?.trim()) newErrors.contactUrl = "La URL de contacto es obligatoria";
            }
            
            // Actualizar errores
            setErrors(newErrors);
            
            // Verificar si hay errores
            const hasErrors = Object.keys(newErrors).length > 0;
            
            if (!hasErrors) {
              onSave(modalType, formData);
            }
          }}
          className="space-y-4"
        >
          {modalType === 'slider' && (
            <SliderForm 
              formData={formData} 
              onChange={onChange} 
              onToggleActive={onToggleActive} 
              errors={errors} 
              setErrors={attemptedSubmit ? () => {} : setErrors} 
            />
          )}
          {modalType === 'card' && (
            <CardForm 
              formData={formData} 
              onChange={onChange} 
              errors={errors} 
              setErrors={attemptedSubmit ? () => {} : setErrors} 
            />
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`px-4 py-2 rounded ${Object.keys(errors).length > 0 ? 'bg-green-700/30 text-white/70 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-green-800'}`}
              disabled={Object.keys(errors).length > 0}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentModal;
