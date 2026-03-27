import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Input from '@/components/Common/Forms/Input';
import Select from '@/components/Common/Forms/Select';
import { User } from '@/types/user';

interface Role {
  value: string;
  label: string;
}

interface BasicInfoFormProps {
  formData: User;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEnabledChange: (isEnabled: boolean) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({
  formData,
  onChange,
  onEnabledChange
}) => {
  // Roles estáticos predefinidos
  const STATIC_ROLES: Role[] = [
    { value: "usuario", label: "Usuario" },
    { value: "cajero", label: "Cajero" },
    { value: "administrador", label: "Administrador" }
  ];
  
  // Estado para almacenar roles, incluyendo el del usuario si no está en la lista
  const [roleOptions, setRoleOptions] = useState<Role[]>(STATIC_ROLES);

  // Efecto para asegurar que el rol del usuario esté en las opciones
  useEffect(() => {
    // Si el usuario tiene un rol asignado
    if (formData.role) {
      const userRoleLower = formData.role.toLowerCase();
      
      // Verificar si el rol ya existe en nuestras opciones
      const roleExists = STATIC_ROLES.some(
        role => role.value.toLowerCase() === userRoleLower
      );
      
      // Si el rol no existe en las opciones predefinidas, añadirlo
      if (!roleExists) {
        // Crear una etiqueta formateada a partir del valor del rol
        const formattedLabel = formData.role
          // Separar palabras por guiones bajos o espacios
          .split(/[_\s]+/)
          // Capitalizar cada palabra
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          // Unir las palabras con espacios
          .join(' ');
        
        // Añadir el nuevo rol a las opciones
        setRoleOptions([
          ...STATIC_ROLES,
          { value: formData.role, label: formattedLabel }
        ]);
      }
    }
  }, [formData.role]);

  // Opciones para el select de estado
  const statusOptions = [
    { value: "1", label: "Habilitada" },
    { value: "0", label: "Deshabilitada" }
  ];

  // Handler específico para el cambio de estado
  const handleEnabledChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const statusValue = e.target.value === "1" ? 1 : 0;
    const isEnabled = statusValue === 1;
    
    // También actualizar status en el formulario principal
    onChange({
      ...e,
      target: {
        ...e.target,
        name: 'status',
        value: statusValue.toString()
      }
    });
    
    // Llamar a onEnabledChange para actualizar enabled
    onEnabledChange(isEnabled);
  };

  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
      className="grid grid-cols-1 gap-4 mb-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="edit-firstName"
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={onChange}
          required
        />
        
        <Input
          id="edit-lastName"
          label="Apellidos"
          name="lastName"
          value={formData.lastName}
          onChange={onChange}
          required
        />
      </div>
      
      <Input
        id="edit-email"
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={onChange}
        required
      />
      
      <Select
        id="edit-role"
        label="Rol"
        name="role"
        value={formData.role || ""}
        onChange={onChange}
        options={roleOptions}
        required
        helpText="Selecciona el rol que tendrá este usuario"
      />
      
      <div>
        <Select
          id="edit-enabled"
          label="Estado de la cuenta"
          name="enabled"
          value={
            // Determinar el valor basado en ambas propiedades
            (formData.status === 0 || formData.enabled === false) ? "0" : "1"
          }
          onChange={handleEnabledChange}
          options={statusOptions}
        />
        
        {(formData.status === 0 || formData.enabled === false) && (
          <p className="mt-1 text-sm text-yellow-600">
            <i className="fas fa-exclamation-triangle mr-1"></i>
            El usuario no podrá iniciar sesión mientras la cuenta esté deshabilitada.
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default BasicInfoForm;