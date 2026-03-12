import React, { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal/Modal';
import { Reward, BarCode } from '@/types/rewards';
import BarcodeManager from './BarcodeManager';
import { PLACEHOLDERS } from '@/lib/config';

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'add' | 'edit';
  reward?: Reward;
  onSubmit: (formData: Reward) => Promise<void>;
}

const initialRewardState: Reward = {
  id: 0,
  name: '',
  description: '',
  points: 0,
  imageUrl: '',
  available: true,
  category: '',
  stock: 0,
  canjeoMultiple: false,
  expiracionActiva: false,
  duracionMeses: 1,
  cooldownHoras: 24,
  barcodes: []
};

const categoryOptions = [
  'Accesorios', 
  'Descuentos', 
  'Jardinería', 
  'Electrónica', 
  'Alimentación', 
  'Experiencias', 
  'Sostenibilidad', 
  'Otros'
];

const RewardFormModal: React.FC<RewardFormModalProps> = ({
  isOpen,
  onClose,
  type,
  reward,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Reward>(initialRewardState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBarcodeError, setShowBarcodeError] = useState(false);

  useEffect(() => {
    // Inicializar el formulario con los datos de la recompensa si estamos editando
    if (type === 'edit' && reward) {
      // Si estamos editando, cargar los códigos de barras de la recompensa
      if (reward.id) {
        fetch(`/api/admin/rewards/${reward.id}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.reward) {
              // Asegurarse de que los códigos de barras se carguen correctamente
              setFormData({
                ...reward,
                barcodes: data.reward.barcodes || []
              });
            } else {
              setFormData(reward);
            }
          })
          .catch(error => {
            console.error('Error al cargar los códigos de barras:', error);
            setFormData(reward);
          });
      } else {
        setFormData(reward);
      }
    } else {
      setFormData(initialRewardState);
    }
  }, [type, reward]);

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ 
        ...formData, 
        [name]: (e.target as HTMLInputElement).checked 
      });
    } else if (type === 'number') {
      setFormData({
        ...formData,
        [name]: name === 'points' || name === 'stock' ? parseInt(value) || 0 : value
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que haya al menos un código de barras
    if (!formData.barcodes || formData.barcodes.length === 0) {
      setShowBarcodeError(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = type === 'add' ? 'Añadir Nueva Recompensa' : 'Editar Recompensa';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      maxWidth="max-w-md"
      title={modalTitle}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Nombre de la recompensa"
              className="w-full p-2 border border-gray-300 rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleFormChange}
              placeholder="Descripción detallada de la recompensa"
              className="w-full p-2 border border-gray-300 rounded h-24"
            />
          </div>
          
          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntos <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleFormChange}
                min="0"
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock
              </label>
              <div className="flex">
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleFormChange}
                  min="-1"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, stock: -1})}
                className="text-xs bg-green-700 text-white px-2 py-1 rounded mt-1 hover:bg-green-800 flex items-center"
              >
                <i className="fas fa-infinity mr-1"></i>
                Establecer stock ilimitado
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleFormChange}
              className="w-full p-2 border border-gray-300 rounded"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de la imagen
            </label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl || ''}
              onChange={handleFormChange}
              placeholder={PLACEHOLDERS.imageUrl}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              name="available"
              checked={formData.available}
              onChange={handleFormChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
              Disponible para canje
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="canjeoMultiple"
              name="canjeoMultiple"
              checked={formData.canjeoMultiple}
              onChange={handleFormChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="canjeoMultiple" className="ml-2 block text-sm text-gray-700">
              Permitir canjeo múltiple
            </label>
          </div>
          
          {formData.canjeoMultiple && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de espera entre canjeos (horas)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="cooldownHoras"
                  value={formData.cooldownHoras !== undefined ? formData.cooldownHoras : 24}
                  onChange={handleFormChange}
                  min="1"
                  max="720"
                  className="w-24 p-2 border border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-500">
                  Horas que debe esperar un usuario para volver a canjear esta recompensa
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="expiracionActiva"
              name="expiracionActiva"
              checked={formData.expiracionActiva}
              onChange={handleFormChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="expiracionActiva" className="ml-2 block text-sm text-gray-700">
              Activar expiración de recompensa
            </label>
          </div>
          
          {formData.expiracionActiva && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración de la recompensa (meses)
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  name="duracionMeses"
                  value={formData.duracionMeses || 1}
                  onChange={handleFormChange}
                  min="1"
                  max="12"
                  className="w-24 p-2 border border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-500">
                  Meses hasta que expire si no se utiliza
                </span>
              </div>
            </div>
          )}
          
          {/* Sección de códigos de barras */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-700">Códigos de Barras</h3>
            </div>
            <BarcodeManager
              barcodes={formData.barcodes || []}
              onChange={(barcodes) => {
                setFormData({...formData, barcodes});
                if (barcodes.length > 0) {
                  setShowBarcodeError(false);
                }
              }}
            />
            {showBarcodeError && (
              <p className="mt-2 text-sm text-red-600">Debes añadir al menos un código de barras</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.points || !formData.category || (formData.barcodes?.length === 0)}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 flex items-center disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RewardFormModal;
