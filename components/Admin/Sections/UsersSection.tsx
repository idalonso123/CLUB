import React from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

// Importar el tipo User
import { User } from '@/types/user';

// Componentes comunes
import LoadingSpinner from '@/components/Common/LoadingSpinner';
import ErrorMessage from '@/components/Common/ErrorMessage';

// Componentes específicos para la sección de usuarios
import UserSearch from '@/components/Admin/User/List/UserSearch';
import UserTable from '@/components/Admin/User/List/UserTable';
import useUsers from '@/components/Admin/User/Hooks/useUsers';

// Importar componentes modales de forma dinámica para mejorar el rendimiento
const UserDetailsModal = dynamic(() => import('@/components/Admin/User/infoModal'));
const EditUserModal = dynamic(() => import('@/components/Admin/User/userModal'));
const AdjustPointsModal = dynamic(() => import('@/components/Admin/User/pointsModal'));
const DeleteConfirmationModal = dynamic(() => import('@/components/Admin/User/delModal'));
const StatusChangeModal = dynamic(() => import('@/components/Admin/User/statusModal'));
const PetCardModal = dynamic(() => import('@/components/Teller/TellerComponents/PetCardModal'));

const UsersSection: React.FC = () => {
  // Estado para el modal de carnets animales
  const [isPetCardModalOpen, setIsPetCardModalOpen] = React.useState(false);
  const [petCards, setPetCards] = React.useState<any[]>([]);
  const [petCardResult, setPetCardResult] = React.useState<{ success: boolean; message: string } | null>(null);
  const [petCardLoading, setPetCardLoading] = React.useState(false);

  // Definir variantes de animación
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  // Utilizamos nuestro hook personalizado para toda la lógica de usuarios
  const {
    users,
    filteredUsers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    handleSearch,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    setUsers,
    
    // Acciones sobre usuarios
    handleSaveUser, 
    handleSavePoints,
    confirmDeleteUser,
    handleToggleUserStatus,
    
    // Estado para modales
    selectedUser,
    setSelectedUser,
    isModalOpen,
    setIsModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isPointsModalOpen,
    setIsPointsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    userToDelete,
    setUserToDelete,
    userToUpdateStatus,
    setUserToUpdateStatus,
    isStatusModalOpen,
    setIsStatusModalOpen
  } = useUsers();

  // Handlers para acciones de usuarios
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  // Handler para gestionar carnets animales
  const handleManagePetCards = async (user: User) => {
    setSelectedUser(user);
    setPetCardResult(null);
    await fetchUserPetCards(user.id);
    setIsPetCardModalOpen(true);
  };

  // Función para obtener los carnets animales del usuario
  const fetchUserPetCards = async (userId: number) => {
    try {
      setPetCardLoading(true);
      const response = await fetch(`/api/cajero/pet-cards?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los carnets animales');
      }
      
      const data = await response.json();
      setPetCards(data.petCards || []);
    } catch (error) {
      console.error('Error fetching pet cards:', error);
      toast.error('No se pudieron cargar los carnets animales');
      setPetCards([]);
    } finally {
      setPetCardLoading(false);
    }
  };

  // Función para añadir un nuevo carnet animal
  const handleAddPetCard = async (petName: string, petType: string, productName: string) => {
    try {
      setPetCardLoading(true);
      const response = await fetch('/api/cajero/pet-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser?.id,
          petName,
          petType,
          productName
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el carnet animal');
      }
      
      const result = await response.json();
      setPetCardResult({
        success: true,
        message: 'Carnet animal creado correctamente'
      });
      
      // Recargar los carnets
      await fetchUserPetCards(selectedUser!.id);
    } catch (error) {
      console.error('Error adding pet card:', error);
      setPetCardResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  // Función para añadir un sello a un carnet
  const handleAddStamp = async (petCardId: number) => {
    try {
      setPetCardLoading(true);
      const response = await fetch(`/api/cajero/pet-cards/${petCardId}/stamp`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al añadir sello');
      }
      
      const result = await response.json();
      setPetCardResult({
        success: true,
        message: 'Sello añadido correctamente'
      });
      
      // Recargar los carnets
      await fetchUserPetCards(selectedUser!.id);
    } catch (error) {
      console.error('Error adding stamp:', error);
      setPetCardResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  // Función para eliminar un sello de un carnet
  const handleRemoveStamp = async (petCardId: number) => {
    try {
      setPetCardLoading(true);
      const response = await fetch(`/api/cajero/pet-cards/${petCardId}/remove-stamp`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar sello');
      }
      
      const result = await response.json();
      setPetCardResult({
        success: true,
        message: 'Sello eliminado correctamente'
      });
      
      // Recargar los carnets
      await fetchUserPetCards(selectedUser!.id);
    } catch (error) {
      console.error('Error removing stamp:', error);
      setPetCardResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  // Función para completar un carnet
  const handleCompletePetCard = async (petCardId: number) => {
    try {
      setPetCardLoading(true);
      const response = await fetch(`/api/cajero/pet-cards/${petCardId}/complete`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al completar el carnet');
      }
      
      const result = await response.json();
      setPetCardResult({
        success: true,
        message: 'Carnet completado correctamente'
      });
      
      // Recargar los carnets
      await fetchUserPetCards(selectedUser!.id);
    } catch (error) {
      console.error('Error completing pet card:', error);
      setPetCardResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  // Función para eliminar un carnet
  const handleDeletePetCard = async (petCardId: number) => {
    try {
      setPetCardLoading(true);
      const response = await fetch(`/api/cajero/pet-cards/${petCardId}/delete`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el carnet');
      }
      
      const result = await response.json();
      setPetCardResult({
        success: true,
        message: 'Carnet eliminado correctamente'
      });
      
      // Recargar los carnets
      await fetchUserPetCards(selectedUser!.id);
    } catch (error) {
      console.error('Error deleting pet card:', error);
      setPetCardResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    setIsModalOpen(false); // Cerrar el modal de detalles si está abierto
  };

  const handleAdjustPoints = (user: User) => {
    setSelectedUser(user);
    setIsPointsModalOpen(true);
    setIsModalOpen(false); // Cerrar el modal de detalles si está abierto
  };

  const handleDeleteUserBtn = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
    setIsModalOpen(false); // Cerrar el modal de detalles si está abierto
  };

  const handleUpdateStatusBtn = (user: User) => {
    setUserToUpdateStatus(user);
    setIsStatusModalOpen(true);
    setIsModalOpen(false); // Cerrar el modal de detalles si está abierto
  };

  // Función auxiliar para aplicar filtros (soluciona el problema de pasar argumentos)
  const handleApplyFilters = () => {
    applyFilters();
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col items-center justify-center">
        <LoadingSpinner 
          variant="leaf"
          theme="success"
          size="lg"
          message="Cargando usuarios..."
          className="mb-8"
        />
      </div>
    );
  }
  
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1 
        className="text-2xl font-bold text-green-800"
        variants={itemVariants}
      >
        Gestión de Usuarios
      </motion.h1>
      
      {/* Componente de búsqueda avanzada */}
      <UserSearch 
        searchTerm={searchTerm || ''}
        handleSearch={handleSearch}
        filters={filters}
        setFilters={setFilters}
        applyFilters={handleApplyFilters}
        resetFilters={resetFilters}
        variants={itemVariants}
      />
      
      {/* Tabla de usuarios */}
      <UserTable
        users={filteredUsers}
        onView={handleUserSelect}
        onEdit={handleEditUser}
        onAdjustPoints={handleAdjustPoints}
        onDelete={handleDeleteUserBtn}
        onUpdateStatus={handleUpdateStatusBtn}
        onManagePetCards={handleManagePetCards}
        variants={itemVariants}
      />
      
      {/* Modales */}
      {isModalOpen && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => setIsModalOpen(false)}
          onEdit={handleEditUser}
          onAdjustPoints={handleAdjustPoints}
          onDelete={handleDeleteUserBtn}
          onUpdateStatus={handleUpdateStatusBtn}
          onManagePetCards={handleManagePetCards}
        />
      )}

      {/* Modal de edición de usuario */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}

      {/* Modal de ajuste de puntos */}
      {isPointsModalOpen && selectedUser && (
        <AdjustPointsModal 
          user={selectedUser} 
          onClose={() => setIsPointsModalOpen(false)}
          onSave={handleSavePoints}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && userToDelete && (
        <DeleteConfirmationModal 
          user={userToDelete} 
          onConfirm={confirmDeleteUser}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
        />
      )}

      {/* Modal de cambio de estado (activar/desactivar) */}
      {isStatusModalOpen && userToUpdateStatus && (
        <StatusChangeModal
          user={userToUpdateStatus}
          onConfirm={handleToggleUserStatus}
          onCancel={() => {
            setIsStatusModalOpen(false);
            setUserToUpdateStatus(null);
          }}
        />
      )}
      
      {/* Modal de carnets animales */}
      {isPetCardModalOpen && selectedUser && (
        <PetCardModal
          isOpen={isPetCardModalOpen}
          onClose={() => setIsPetCardModalOpen(false)}
          user={selectedUser}
          petCards={petCards}
          onAddPetCard={handleAddPetCard}
          onAddStamp={handleAddStamp}
          onRemoveStamp={handleRemoveStamp}
          onCompletePetCard={handleCompletePetCard}
          onDeletePetCard={handleDeletePetCard}
          loading={petCardLoading}
          result={petCardResult}
          userRole="admin"
        />
      )}
    </motion.div>
  );
};

export default UsersSection;