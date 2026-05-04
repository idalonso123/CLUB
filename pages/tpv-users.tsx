/**
 * Club ViveVerde TPV - Página de Gestión de Usuarios Standalone
 * 
 * Esta página está diseñada para ejecutarse como aplicación Electron Standalone.
 * Muestra una ventana flotante con la tabla de usuarios del sistema TPV.
 * 
 * Características:
 * - Ventana flotante pequeña
 * - Siempre visible sobre el ERP (alwaysOnTop)
 * - Copia exacta de UsersTable con toda su funcionalidad
 * - Gestión completa de usuarios (añadir saldo, recompensas, carnets)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { User, SacoBarrasItem } from "@/types/teller";
import AddBalanceModal from "@/components/Teller/TellerComponents/AddBalanceModal";
import RedemptionsModal from "@/components/Teller/TellerComponents/RedemptionsModal";
import OfferRewardsModal from "@/components/Teller/TellerComponents/OfferRewardsModal";
import PetCardModal from "@/components/Teller/TellerComponents/PetCardModal";

interface TPVUsersStandaloneProps {}

const TPVUsersStandalone: React.FC<TPVUsersStandaloneProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState(false);
  const [isOfferRewardsModalOpen, setIsOfferRewardsModalOpen] = useState(false);
  const [isPetCardModalOpen, setIsPetCardModalOpen] = useState(false);
  
  const [addPointsResult, setAddPointsResult] = useState<{
    success: boolean;
    message: string;
    puntosAñadidos?: number;
    puntosTotales?: number;
  } | null>(null);
  
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [redemptionMsg, setRedemptionMsg] = useState("");
  const [redeemResult, setRedeemResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCards, setPetCards] = useState<any[]>([]);
  const [petCardResult, setPetCardResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCardLoading, setPetCardLoading] = useState(false);
  const [isCarnetAnimal, setIsCarnetAnimal] = useState(false);
  const [sacos, setSacos] = useState<SacoBarrasItem[]>([]);
  const [preselectedProduct, setPreselectedProduct] = useState<any>(null);

  // Cargar usuarios al iniciar
  useEffect(() => {
    fetchUsers();
    
    // Escuchar eventos de selección de usuario desde otras ventanas
    if (window.electronAPI?.onUserSelected) {
      window.electronAPI.onUserSelected((user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
      });
    }

    if (window.electronAPI?.onUserSelectedFromSearch) {
      window.electronAPI.onUserSelectedFromSearch((user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
      });
    }

    return () => {
      window.electronAPI?.removeAllListeners('user-selected');
      window.electronAPI?.removeAllListeners('user-selected-from-search');
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/cajero/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setAddPointsResult(null);
    setAmount("");
    setIsCarnetAnimal(false);
    setSacos([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    fetchUsers(); // Refrescar la lista de usuarios
  };

  const handleViewRedemptions = async (user: User) => {
    setSelectedUser(user);
    await fetchUserRedemptions(user.id);
    setIsRedemptionsModalOpen(true);
  };

  const closeRedemptionsModal = () => {
    setIsRedemptionsModalOpen(false);
  };

  const handleOfferRewards = (user: User) => {
    setSelectedUser(user);
    setRedeemResult(null);
    setIsOfferRewardsModalOpen(true);
  };

  const closeOfferRewardsModal = () => {
    setIsOfferRewardsModalOpen(false);
  };

  const handleManagePetCards = async (user: User) => {
    setSelectedUser(user);
    setPetCardResult(null);
    await fetchUserPetCards(user.id);
    setIsPetCardModalOpen(true);
  };

  const closePetCardModal = () => {
    setIsPetCardModalOpen(false);
    setPreselectedProduct(null);
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPointsResult(null);

    if (!selectedUser || !selectedUser.id || !amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAddPointsResult({ success: false, message: "Introduce un importe válido" });
      return;
    }

    try {
      const importe = Number(amount);
      
      const configResponse = await fetch(`/api/config?monto=${importe}`);
      if (!configResponse.ok) {
        throw new Error("Error al consultar la configuración de puntos");
      }
      const configData = await configResponse.json();
      if (!configData.success) {
        throw new Error(configData.message || "No se pudo obtener la configuración de puntos");
      }
      const puntosAGanar = Math.round(configData.puntos);

      const res = await fetch(`/api/cajero/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          puntos: puntosAGanar,
          isCarnetAnimal,
          sacos: isCarnetAnimal ? sacos.map(s => ({
            codigoBarras: s.codigoBarras,
            pvp: s.pvp,
            petCardId: s.petCardId,
            petName: s.petName
          })) : []
        }),
      });

      const data = await res.json();
      setAddPointsResult(data);

      if (data.success) {
        // Actualizar puntos del usuario en la lista
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === selectedUser.id ? { ...u, points: data.puntosTotales } : u
          )
        );
        
        setTimeout(() => {
          setIsModalOpen(false);
          fetchUsers();
        }, 1200);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setAddPointsResult({ success: false, message: errorMessage || "Error al añadir saldo" });
    }
  };

  const fetchUserRedemptions = async (userId: number) => {
    try {
      const res = await fetch(`/api/rewards/history?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setUserRedemptions(data.redemptions || []);
      } else {
        setUserRedemptions([]);
      }
    } catch {
      setUserRedemptions([]);
    }
  };

  const fetchUserPetCards = async (userId: number) => {
    try {
      const res = await fetch(`/api/cajero/pet-cards?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setPetCards(data.petCards || []);
      } else {
        setPetCards([]);
      }
    } catch (error) {
      console.error("Error al obtener carnets animales:", error);
      setPetCards([]);
    }
  };

  const handleRedeemReward = async (rewardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setRedeemResult(null);
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          userId: selectedUser.id,
          byAdmin: true,
          notes: 'Canjeado por cajero en tienda'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === selectedUser.id ? { ...u, points: data.redemption.remainingPoints } : u
          )
        );
        setRedeemResult({
          success: true,
          message: `Recompensa canjeada correctamente. Puntos restantes: ${data.redemption.remainingPoints}`
        });
      } else {
        setRedeemResult({
          success: false,
          message: data.message || 'Error al canjear la recompensa'
        });
      }
    } catch (error) {
      console.error('Error al canjear recompensa:', error);
      setRedeemResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al canjear la recompensa'
      });
    }
  };

  const handleAddPetCard = async (petName: string, petType: string, productName: string, codigoBarras?: string) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch('/api/cajero/pet-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          petName,
          petType,
          productName,
          codigoBarras: codigoBarras || null
        }),
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet animal creado correctamente' : 'Error al crear el carnet animal')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al crear el carnet animal'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleAddStamp = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/stamp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Sello añadido correctamente' : 'Error al añadir el sello')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al añadir el sello'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleCompletePetCard = async (petCardId: number) => {
    if (!selectedUser) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet completado correctamente' : 'Error al completar el carnet')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al completar el carnet'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleRemoveStamp = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/remove-stamp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Sello eliminado correctamente' : 'Error al eliminar el sello')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al eliminar el sello'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  const handleDeletePetCard = async (petCardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setPetCardLoading(true);
    setPetCardResult(null);
    
    try {
      const res = await fetch(`/api/cajero/pet-cards/${petCardId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setPetCardResult({
        success: data.success,
        message: data.message || (data.success ? 'Carnet eliminado correctamente' : 'Error al eliminar el carnet')
      });
      
      if (data.success) {
        fetchUserPetCards(selectedUser.id);
      }
    } catch (error) {
      setPetCardResult({
        success: false,
        message: 'Error al eliminar el carnet'
      });
    } finally {
      setPetCardLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Club ViveVerde - Gestión de Usuarios TPV</title>
        <meta name="description" content="Gestión de usuarios para el sistema TPV" />
      </Head>

      <div className="min-h-screen bg-gray-100 p-4">
        {/* Título */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-green-800">Club ViveVerde - Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600">Selecciona un usuario para gestionar su saldo o recompensas</p>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-green-800 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, idx) => (
                  <motion.tr 
                    key={user.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium">
                          {user.firstName?.charAt(0) || ''}{user.lastName?.charAt(0) || ''}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <i className="fas fa-star text-yellow-400 mr-1"></i>
                        {typeof user.points === 'number' ? user.points : 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <motion.button
                        onClick={() => handleSelectUser(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-coins mr-1"></i>
                        Añadir saldo
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleViewRedemptions(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-gift mr-1"></i>
                        Recompensas
                      </motion.button>
                      
                      <motion.button
                        onClick={() => handleManagePetCards(user)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className="fas fa-paw mr-1"></i>
                        Carnet
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <i className="fas fa-users text-4xl mb-4 text-gray-300"></i>
              <p>No hay usuarios registrados</p>
            </div>
          )}
        </div>

        {/* Modales */}
        <AddBalanceModal
          isOpen={isModalOpen}
          onClose={closeModal}
          user={selectedUser}
          amount={amount}
          setAmount={setAmount}
          handleAddBalance={handleAddBalance}
          addPointsResult={addPointsResult}
          isCarnetAnimal={isCarnetAnimal}
          setIsCarnetAnimal={setIsCarnetAnimal}
          sacos={sacos}
          setSacos={setSacos}
          onCarnetCompletado={() => {}}
          autoFocusAmount={true}
        />

        <RedemptionsModal
          isOpen={isRedemptionsModalOpen}
          onClose={closeRedemptionsModal}
          user={selectedUser}
          redemptions={userRedemptions}
          handleChangeRedemptionStatus={async () => {}}
          redemptionMsg={redemptionMsg}
          userRole="cajero"
        />

        <OfferRewardsModal
          isOpen={isOfferRewardsModalOpen}
          onClose={closeOfferRewardsModal}
          user={selectedUser}
          onRedeemReward={handleRedeemReward}
          redeemResult={redeemResult}
        />

        <PetCardModal
          isOpen={isPetCardModalOpen}
          onClose={closePetCardModal}
          user={selectedUser}
          petCards={petCards}
          onAddPetCard={handleAddPetCard}
          onAddStamp={handleAddStamp}
          onRemoveStamp={handleRemoveStamp}
          onCompletePetCard={handleCompletePetCard}
          onDeletePetCard={handleDeletePetCard}
          loading={petCardLoading}
          result={petCardResult}
          userRole="cajero"
          preselectedProduct={preselectedProduct}
        />
      </div>
    </>
  );
};

export default TPVUsersStandalone;
