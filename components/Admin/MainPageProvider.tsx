import React, { useState, ReactNode } from 'react';
import { MainPageContext } from '@/components/Admin/MainPageContext';
import SliderForm from '@/components/Admin/MainPage/SliderForm';
import CardForm from '@/components/Admin/MainPage/CardForm';

interface MainPageProviderProps {
  children: ReactNode;
}

interface ModalState {
  type: 'slider' | 'card' | null;
  isOpen: boolean;
}

const MainPageProvider: React.FC<MainPageProviderProps> = ({ children }) => {
  const [modal, setModal] = useState<ModalState>({
    type: null,
    isOpen: false
  });
  const [formData, setFormData] = useState<any>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Funciones para abrir los modales
  const openAddSliderModal = () => {
    setFormData({ title: '', description: '', imageUrl: '', buttonText: '', buttonUrl: '', active: true });
    setFormErrors({});
    setModal({ type: 'slider', isOpen: true });
  };

  const openAddCardModal = () => {
    setFormData({ title: '', content: '', iconClass: '', contactUrl: '' });
    setFormErrors({});
    setModal({ type: 'card', isOpen: true });
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModal({ type: null, isOpen: false });
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Manejar toggle de activo (para sliders)
  const handleToggleActive = () => {
    setFormData((prev: any) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  // Guardar los datos
  const handleSave = async () => {
    // Verificar si hay errores antes de guardar
    if (Object.keys(formErrors).length > 0) {
      return; // No guardar si hay errores
    }
    
    try {
      // Aquí iría la lógica de guardar los datos usando fetch
      await fetch('/api/admin/mainpage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: modal.type, 
          data: formData 
        }),
      });
      closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  return (
    <MainPageContext.Provider value={{ openAddSliderModal, openAddCardModal }}>
      {children}
      
      {/* Modal para crear nuevas entradas */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={closeModal}>
              <i className="fas fa-times"></i>
            </button>
            <h2 className="text-xl font-bold mb-4">
              Crear {modal.type === 'slider' ? 'Slide' : 'Tarjeta'}
            </h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-4"
            >
              {modal.type === 'slider' && (
                <SliderForm 
                  formData={formData} 
                  onChange={handleFormChange} 
                  onToggleActive={handleToggleActive} 
                  errors={formErrors}
                  setErrors={setFormErrors}
                />
              )}
              {modal.type === 'card' && (
                <CardForm 
                  formData={formData} 
                  onChange={handleFormChange} 
                  errors={formErrors}
                  setErrors={setFormErrors}
                />
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-green-700 text-white hover:bg-green-800">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainPageContext.Provider>
  );
};

export default MainPageProvider;
