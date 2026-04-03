import React, { useState, useEffect } from "react";

interface SliderFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleActive: () => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const SliderForm: React.FC<SliderFormProps> = ({ formData, onChange, onToggleActive, errors, setErrors }) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Validar campos solo cuando el usuario ha interactuado con ellos
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    
    if (touched.title && !formData.title?.trim()) newErrors.title = "El título es obligatorio";
    if (touched.description && !formData.description?.trim()) newErrors.description = "La descripción es obligatoria";
    if (touched.imageUrl && !formData.imageUrl?.trim()) newErrors.imageUrl = "La URL de la imagen es obligatoria";
    
    // Texto del botón y URL del botón ya no son obligatorios
    
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
      <label className="block font-medium mb-1">Descripción</label>
      <textarea
        name="description"
        value={formData.description || ''}
        onChange={onChange}
        onBlur={() => handleBlur('description')}
        className={`w-full border rounded p-2 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
        rows={3}
      />
      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
    </div>
    <div>
      <label className="block font-medium mb-1">Imagen (URL)</label>
      <input
        type="text"
        name="imageUrl"
        value={formData.imageUrl || ''}
        onChange={onChange}
        onBlur={() => handleBlur('imageUrl')}
        className={`w-full border rounded p-2 ${errors.imageUrl ? 'border-red-500' : 'border-gray-300'}`}
      />
      {errors.imageUrl && <p className="text-red-500 text-xs mt-1">{errors.imageUrl}</p>}
    </div>
    <div className="flex gap-2">
      <div className="flex-1">
        <label className="block font-medium mb-1">Texto del botón</label>
        <input
          type="text"
          name="buttonText"
          value={formData.buttonText || ''}
          onChange={onChange}
          onBlur={() => handleBlur('buttonText')}
          className={`w-full border rounded p-2 ${errors.buttonText ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.buttonText && <p className="text-red-500 text-xs mt-1">{errors.buttonText}</p>}
      </div>
      <div className="flex-1">
        <label className="block font-medium mb-1">URL del botón</label>
        <input
          type="text"
          name="buttonUrl"
          value={formData.buttonUrl || ''}
          onChange={onChange}
          onBlur={() => handleBlur('buttonUrl')}
          className={`w-full border rounded p-2 ${errors.buttonUrl ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.buttonUrl && <p className="text-red-500 text-xs mt-1">{errors.buttonUrl}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <label className="font-medium">Activo</label>
      <input
        type="checkbox"
        checked={formData.active}
        onChange={onToggleActive}
      />
    </div>
  </div>
);
}

export default SliderForm;
