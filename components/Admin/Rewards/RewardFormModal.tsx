import React, { useState, useEffect } from 'react';
import Modal from '@/components/Common/Modal/Modal';
import { Reward, BarCode } from '@/types/rewards';
import BarcodeManager from './BarcodeManager';
import ImageUploader from './ImageUploader';
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
  tipoRecompensa: 'puntos',
  imageUrl: '',
  available: true,
  category: '',
  stock: 0,
  canjeoMultiple: false,
  expiracionActiva: false,
  duracionMeses: 1,
  cooldownHoras: 24,
  cooldownMode: '24_hours',
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
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    // Inicializar el formulario con los datos de la recompensa si estamos editando
    if (type === 'edit' && reward && reward.id) {
      setIsLoadingData(true);
      // Siempre cargar desde la API para obtener los datos completos incluyendo cooldownMode
      fetch(`/api/admin/rewards/${reward.id}`)
        .then(response => response.json())
        .then(data => {
          console.log('=== DEBUG: Datos recibidos de API ===');
          console.log('data.success:', data.success);
          console.log('data.reward:', JSON.stringify(data.reward, null, 2));
          console.log('cooldownMode de API:', data.reward?.cooldownMode);
          console.log('cooldownHoras de API:', data.reward?.cooldownHoras);
          
          if (data.success && data.reward) {
            // Usar directamente el cooldownMode de la BD si existe y es válido
            const cooldownHoras = data.reward.cooldownHoras !== undefined ? data.reward.cooldownHoras : 24;
            
            // Verificar si cooldownMode es un valor válido de nuestros 3 opciones
            const cooldownModeFromDB = data.reward.cooldownMode;
            const validModes = ['same_day', '24_hours', 'custom'];
            const isValidMode = cooldownModeFromDB && validModes.includes(cooldownModeFromDB);
            
            let cooldownMode;
            if (isValidMode) {
              // Usar el valor de la BD directamente
              cooldownMode = cooldownModeFromDB;
            } else {
              // Calcular basándose en cooldownHoras
              if (cooldownHoras === 0) {
                cooldownMode = 'same_day';
              } else if (cooldownHoras === 24) {
                cooldownMode = '24_hours';
              } else {
                cooldownMode = 'custom';
              }
            }
            
            console.log('cooldownMode final usado:', cooldownMode);
            console.log('cooldownHoras final usado:', cooldownHoras);
            
            setFormData({
              ...data.reward,
              cooldownMode: cooldownMode,
              cooldownHoras: cooldownHoras,
              barcodes: data.reward.barcodes || []
            });
          } else {
            console.log('No se pudieron cargar los datos, usando fallback');
            setFormData(reward);
          }
          setIsLoadingData(false);
        })
        .catch(error => {
          console.error('Error al cargar los datos de la recompensa:', error);
          setFormData(reward);
          setIsLoadingData(false);
        });
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
          {/* Selector de tipo de recompensa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de recompensa <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col space-y-2">
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.tipoRecompensa === 'puntos' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="tipoRecompensa"
                  value="puntos"
                  checked={formData.tipoRecompensa === 'puntos'}
                  onChange={() => setFormData({...formData, tipoRecompensa: 'puntos', points: 0})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Por puntos</span>
                  <span className="block text-xs text-gray-500">El usuario necesita acumular puntos para canjear esta recompensa</span>
                </div>
              </label>
              <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.tipoRecompensa === 'carnet' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="tipoRecompensa"
                  value="carnet"
                  checked={formData.tipoRecompensa === 'carnet'}
                  onChange={() => setFormData({...formData, tipoRecompensa: 'carnet', points: 0})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-700">Por carnet completado</span>
                  <span className="block text-xs text-gray-500">Se genera cuando el usuario completa un carnet de mascota</span>
                </div>
              </label>
            </div>
          </div>

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
            {/* Campo puntos: solo visible para recompensas por puntos */}
            {formData.tipoRecompensa === 'puntos' && (
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
            )}
            {/* Si es tipo carnet, mostrar mensaje informativo en lugar del campo puntos */}
            {formData.tipoRecompensa === 'carnet' && (
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puntos
                </label>
                <div className="p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
                  <i className="fas fa-info-circle mr-1"></i>
                  No aplica (generada por carnet)
                </div>
              </div>
            )}
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
              Imagen de la recompensa
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Sube una imagen desde tu ordenador. Formatos: JPG, PNG, GIF, WebP
            </p>
            <ImageUploader
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              disabled={isSubmitting}
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
          
          {formData.canjeoMultiple && !isLoadingData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de restricción entre canjeos
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="cooldownMode"
                    value="same_day"
                    checked={formData.cooldownMode === 'same_day'}
                    onChange={() => setFormData({...formData, cooldownMode: 'same_day', cooldownHoras: 0})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-700">Mismo día</span>
                    <span className="block text-xs text-gray-500">Permitir canjear varias veces el mismo día sin esperar</span>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="cooldownMode"
                    value="24_hours"
                    checked={formData.cooldownMode === '24_hours'}
                    onChange={() => setFormData({...formData, cooldownMode: '24_hours', cooldownHoras: 24})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-700">24 horas</span>
                    <span className="block text-xs text-gray-500">El usuario debe esperar 24 horas entre cada canje</span>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="cooldownMode"
                    value="custom"
                    checked={formData.cooldownMode === 'custom'}
                    onChange={() => setFormData({...formData, cooldownMode: 'custom', cooldownHoras: formData.cooldownHoras || 24})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-700">Personalizado</span>
                    <span className="block text-xs text-gray-500">Establecer un tiempo de espera personalizado (horas)</span>
                  </div>
                </label>
              </div>
              
              {formData.cooldownMode === 'custom' && (
                <div className="mt-3 ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas de espera personalizadas
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
                      horas
                    </span>
                  </div>
                </div>
              )}
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
            disabled={isSubmitting || !formData.name || (formData.tipoRecompensa === 'puntos' && !formData.points) || !formData.category || (formData.barcodes?.length === 0)}
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
