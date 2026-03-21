import React, { useEffect, useState } from "react";
import { SITE_CONFIG } from "@/lib/config";

interface CardFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const CardForm: React.FC<CardFormProps> = ({ formData, onChange, errors, setErrors }) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Validar campos solo cuando el usuario ha interactuado con ellos
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (touched.title && !formData.title?.trim()) newErrors.title = "El título es obligatorio";
    if (touched.content && !formData.content?.trim()) newErrors.content = "El contenido es obligatorio";
    if (touched.iconClass && !formData.iconClass?.trim()) newErrors.iconClass = "El icono es obligatorio";
    if (touched.buttonText && !formData.buttonText?.trim()) newErrors.buttonText = "El texto del botón es obligatorio";
    if (touched.contactUrl && !formData.contactUrl?.trim()) newErrors.contactUrl = "La URL de contacto es obligatoria";
    
    setErrors(newErrors);
  }, [formData, setErrors, touched]);
  
  // Función para marcar un campo como tocado
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  return (
  <div className="space-y-4">
    <div>
      <label className="block font-medium mb-1">Título</label>
      <input
        type="text"
        name="title"
        value={formData.title || ''}
        onChange={onChange}
        onBlur={() => handleBlur('title')}
        className={`w-full border rounded p-2 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
    </div>
    <div>
      <label className="block font-medium mb-1">Contenido</label>
      <textarea
        name="content"
        value={formData.content || ''}
        onChange={onChange}
        onBlur={() => handleBlur('content')}
        className={`w-full border rounded p-2 ${errors.content ? 'border-red-500' : 'border-gray-300'}`}
        rows={3}
      />
      {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
    </div>
    <div>
      <label className="block font-medium mb-1">Icono (clase FontAwesome)</label>
      <input
        type="text"
        name="iconClass"
        value={formData.iconClass || ''}
        onChange={onChange}
        onBlur={() => handleBlur('iconClass')}
        className={`w-full border rounded p-2 ${errors.iconClass ? 'border-red-500' : 'border-gray-300'}`}
        placeholder="Ej: fa-leaf"
      />
      {errors.iconClass && <p className="text-red-500 text-xs mt-1">{errors.iconClass}</p>}
    </div>
    <div>
      <label className="block font-medium mb-1">Texto del Botón</label>
      <input
        type="text"
        name="buttonText"
        value={formData.buttonText || ''}
        onChange={onChange}
        onBlur={() => handleBlur('buttonText')}
        className={`w-full border rounded p-2 ${errors.buttonText ? 'border-red-500' : 'border-gray-300'}`}
        placeholder="Contactar"
      />
      {errors.buttonText && <p className="text-red-500 text-xs mt-1">{errors.buttonText}</p>}
    </div>
    <div>
      <label className="block font-medium mb-1">URL de Contacto</label>
      <input
        type="text"
        name="contactUrl"
        value={formData.contactUrl || ''}
        onChange={onChange}
        onBlur={() => handleBlur('contactUrl')}
        className={`w-full border rounded p-2 ${errors.contactUrl ? 'border-red-500' : 'border-gray-300'}`}
        placeholder={SITE_CONFIG.external.contactPage}
      />
      {errors.contactUrl && <p className="text-red-500 text-xs mt-1">{errors.contactUrl}</p>}
    </div>
  </div>
);
}

export default CardForm;
