import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { User, PropertyData } from "@/types/user";

// Componentes comunes
import Modal from "@/components/Common/Modal/Modal";
import TabNav from "@/components/Common/Forms/TabNav";
import ActionButtons from "@/components/Common/Modal/ActionButtons";

// Componentes específicos para formularios de usuario
import BasicInfoForm from "@/components/Admin/User/Forms/BasicInfoForm";
import ContactForm from "@/components/Admin/User/Forms/ContactForm";
import PropertyPetForm from "@/components/Admin/User/Forms/PropertyPetForm";

interface EditUserModalProps {
  user: User | null;
  onSave: (formData: User) => void;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onSave,
  onClose,
}) => {
  // Estado del formulario
  const [formData, setFormData] = useState<User>({

    id: 0,
    firstName: "",
    lastName: "",
    nombre: "",
    email: "",
    role: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    status: 1,
    enabled: true,
    points: 0,
    registrationDate: new Date().toISOString(),
  });

  // Estado de la pestaña activa
  const [activeTab, setActiveTab] = useState("basic");
  
  // Estado para los datos de vivienda y animales
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);

  // Inicializar el formulario cuando cambia el usuario
  useEffect(() => {
    if (user) {
      // Determinar el estado basado en status y enabled
      const isActive = user.status === 1 || user.enabled === true || user.enabled === 1;
      
      setFormData({
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        nombre: user.nombre || "",
        email: user.email || "",
        role: user.role || "Usuario",
        phone: user.phone || "",
        address: user.address || "",
        city: user.city || "",
        postalCode: user.postalCode || "",
        country: user.country || "",
        // Asegurarse de que ambos status y enabled tienen valores consistentes
        status: isActive ? 1 : 0,
        enabled: isActive,
        points: user.points || 0,
        registrationDate: user.registrationDate || new Date().toISOString(),
        ...(user.birthDate && { birthDate: user.birthDate }),
        ...(user.photoUrl && { photoUrl: user.photoUrl }),
      });
    }
  }, [user]);

  // Handler para cambios en inputs y selects
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handler específico para el cambio del estado (enabled)
  const handleEnabledChange = (isEnabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: isEnabled ? 1 : 0,  // Actualizar status (numérico)
      enabled: isEnabled,        // Actualizar enabled (booleano)
    }));
  };

  // Handler para cambios en los datos de vivienda y animales
  const handlePropertyDataChange = (data: PropertyData) => {
    setPropertyData(data);
  };

  // Handler para envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Primero guardamos la información del usuario
    onSave(formData);
    
    // Luego guardamos los datos de vivienda y animales si existen
    if (propertyData && formData.id) {
      try {
        await fetch(`/api/admin/users/${formData.id}/property`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(propertyData)
        });
      } catch (error) {
        console.error('Error saving property data:', error);
      }
    }
  };

  // Definición de pestañas
  const tabs = [
    { id: "basic", label: "Información Básica", icon: "fas fa-user" },
    { id: "contact", label: "Contacto y Ubicación", icon: "fas fa-address-card" },
    { id: "property", label: "Vivienda y Animales", icon: "fas fa-home" }
  ];

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title="Editar Usuario"
    >
      <TabNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <form onSubmit={handleSubmit} method="dialog">
        <AnimatePresence mode="wait">
          {activeTab === "basic" && (
            <BasicInfoForm
              formData={formData}
              onChange={handleChange}
              onEnabledChange={handleEnabledChange}
            />
          )}
          
          {activeTab === "contact" && (
            <ContactForm
              formData={formData}
              onChange={handleChange}
            />
          )}

          {activeTab === "property" && (
            <PropertyPetForm
              userId={formData.id}
              onPropertyDataChange={handlePropertyDataChange}
            />
          )}
        </AnimatePresence>

        <ActionButtons
          onSave={handleSubmit} 
          onCancel={onClose}
          saveText="Guardar"
          cancelText="Cancelar"
          saveIcon="fas fa-save"
          cancelIcon="fas fa-times"
        />
      </form>
    </Modal>
  );
};

export default EditUserModal;