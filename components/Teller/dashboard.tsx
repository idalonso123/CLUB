import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { User } from "@/types/user";
import { SearchFormProps, SacoItem, AddBalanceResult, PetCard } from "@/types/teller";
import SearchForm from "@/components/Teller/TellerComponents/SearchForm";
import UsersTable from "@/components/Teller/TellerComponents/UsersTable";
import AddBalanceModal from "@/components/Teller/TellerComponents/AddBalanceModal";
import RedemptionsModal from "@/components/Teller/TellerComponents/RedemptionsModal";
import OfferRewardsModal from "@/components/Teller/TellerComponents/OfferRewardsModal";
import PetCardModal from "@/components/Teller/TellerComponents/PetCardModal";

interface TellerDashboardProps {
  userRole?: string | null;
}

const TellerDashboard: React.FC<TellerDashboardProps> = ({ userRole }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isCarnetAnimal, setIsCarnetAnimal] = useState(false);
  const [sacos, setSacos] = useState<SacoItem[]>([]);
  const [addPointsResult, setAddPointsResult] = useState<{
    success: boolean;
    message: string;
    puntosAñadidos?: number;
    puntosTotales?: number;
  } | null>(null);
  const [userRedemptions, setUserRedemptions] = useState<any[]>([]);
  const [redemptionMsg, setRedemptionMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedemptionsModalOpen, setIsRedemptionsModalOpen] = useState(false);
  const [isOfferRewardsModalOpen, setIsOfferRewardsModalOpen] = useState(false);
  const [isPetCardModalOpen, setIsPetCardModalOpen] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCards, setPetCards] = useState<PetCard[]>([]);
  const [petCardResult, setPetCardResult] = useState<{success: boolean; message: string} | null>(null);
  const [petCardLoading, setPetCardLoading] = useState(false);

  // Función de búsqueda con debounce
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError("");
      return;
    }
    
    setSearching(true);
    try {
      const res = await fetch(`/api/cajero/search-user?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        const users = (data.users || []).map((u: any) => ({
          ...u,
          id: u.id ?? u.codigo,
        }));
        setResults(users);
        setSelectedUser(null);
        setAddPointsResult(null);
        setError("");
      } else {
        setError(data.message || "No se encontraron resultados");
      }
    } catch {
      setError("Error al buscar usuarios");
    } finally {
      setSearching(false);
    }
  }, []);

  // Efecto para debounce en la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      } else {
        setResults([]);
        setError("");
      }
    }, 300); // 300ms de delay

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Handler para la búsqueda (disparado desde el input)
  // La búsqueda real se maneja con el useEffect de arriba
  // Este handler está aquí para compatibilidad con el componente SearchForm
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent): Promise<void> => {
    // La búsqueda se maneja con el useEffect de arriba
    // Simplemente esperamos sin hacer nada
    return Promise.resolve();
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setAddPointsResult(null);
    setAmount("");
    setIsCarnetAnimal(false);
    setSacos([]); 
    setIsModalOpen(true);
  };

  const handleViewRedemptions = (user: any) => {
    setSelectedUser(user);
    fetchUserRedemptions(user.id);
    setIsRedemptionsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeRedemptionsModal = () => {
    setIsRedemptionsModalOpen(false);
  };

  const handleOfferRewards = (user: any) => {
    setSelectedUser(user);
    setRedeemResult(null);
    setIsOfferRewardsModalOpen(true);
  };

  const closeOfferRewardsModal = () => {
    setIsOfferRewardsModalOpen(false);
  };

  const handleManagePetCards = async (user: any) => {
    setSelectedUser(user);
    setPetCardResult(null);
    await fetchUserPetCards(user.id);
    setIsPetCardModalOpen(true);
  };

  const closePetCardModal = () => {
    setIsPetCardModalOpen(false);
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

  const handleAddPetCard = async (petName: string, petType: string, productName: string) => {
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
          productName
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

  const handleRedeemReward = async (rewardId: number) => {
    if (!selectedUser || !selectedUser.id) return;
    
    setRedeemResult(null);
    
    try {
      // Llamada a la API para canjear la recompensa en nombre del usuario
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId,
          userId: selectedUser.id, // Pasar el ID del usuario seleccionado
          byAdmin: true, // Indicar que el canjeo lo hace un admin/cajero
          notes: 'Canjeado por cajero en tienda'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar los puntos del usuario en la lista de resultados
        setResults(prevResults =>
          prevResults.map(u =>
            u.id === selectedUser.id ? { ...u, points: data.redemption.remainingPoints } : u
          )
        );

        // Actualizar los puntos del usuario seleccionado
        setSelectedUser({
          ...selectedUser,
          points: data.redemption.remainingPoints
        });

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

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPointsResult(null);

    if (!selectedUser || !selectedUser.id || !amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAddPointsResult({ success: false, message: "Introduce un importe válido" });
      return;
    }

    if (isCarnetAnimal && sacos.length === 0) {
      setAddPointsResult({ success: false, message: "Añade al menos un saco con precio válido" });
      return;
    }
    
    if (isCarnetAnimal && sacos.some(saco => !saco.price.trim() || isNaN(Number(saco.price)) || Number(saco.price) <= 0)) {
      setAddPointsResult({ success: false, message: "Todos los sacos deben tener precios válidos" });
      return;
    }

    try {
      const totalSacos = isCarnetAnimal ? 
        sacos.reduce((total, saco) => total + Number(saco.price), 0) : 0;
      
      const importeParaPuntos = isCarnetAnimal ? 
        Math.max(0, Number(amount) - totalSacos) : 
        Number(amount);

      let puntosAGanar = 0;
      
      if (importeParaPuntos > 0) {
        const configResponse = await fetch(`/api/config?monto=${importeParaPuntos}`);
        if (!configResponse.ok) {
          throw new Error("Error al consultar la configuración de puntos");
        }
        const configData = await configResponse.json();
        if (!configData.success) {
          throw new Error(configData.message || "No se pudo obtener la configuración de puntos");
        }
        puntosAGanar = Math.round(configData.puntos);
      }

      // Enviar los puntos calculados al endpoint del cajero
      const res = await fetch(`/api/cajero/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          puntos: puntosAGanar,
          isCarnetAnimal,
          sacos: isCarnetAnimal ? sacos : []
        }),
      });

      const data = await res.json();
      setAddPointsResult(data);

      if (data.success) {
        // Actualizar los puntos del usuario en la lista de resultados y en el usuario seleccionado
        const updatedPoints = data.puntosTotales;
        
        setResults(prevResults =>
          prevResults.map(u =>
            u.id === selectedUser.id ? { ...u, points: updatedPoints } : u
          )
        );

        const updatedUser = {
          ...selectedUser,
          points: updatedPoints,
        };
        setSelectedUser(updatedUser);
        
        // Si el usuario tiene 50 o más puntos, preparar para mostrar el modal de recompensas
        if (updatedPoints >= 50) {
          setRedeemResult(null);
          // Cerrar suavemente el modal de añadir saldo y luego mostrar el de recompensas
          setTimeout(() => {
            setIsModalOpen(false);
            // Esperar a que termine la animación de cierre del primer modal
            setTimeout(() => {
              setIsOfferRewardsModalOpen(true);
            }, 500);
          }, 1200); // Dar tiempo para que el usuario vea el mensaje de éxito
        } else {
          // Si no tiene suficientes puntos, solo cerrar el modal de saldo
          setTimeout(() => {
            setIsModalOpen(false);
          }, 1200);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      setAddPointsResult({ success: false, message: errorMessage || "Error al añadir saldo" });
    }
  };

  useEffect(() => {
    if (selectedUser && selectedUser.id) {
      fetchUserRedemptions(selectedUser.id);
    } else {
      setUserRedemptions([]);
    }
    setRedemptionMsg("");
  }, [selectedUser]);

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

  const handleChangeRedemptionStatus = async (redemptionId: number, newStatus: string, notes?: string) => {
    setRedemptionMsg("");
    try {
      const res = await fetch(`/api/cajero/redemption-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redemptionId, status: newStatus, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setRedemptionMsg(data.message || "Estado actualizado correctamente");
        fetchUserRedemptions(selectedUser.id);
      } else {
        setRedemptionMsg(data.message || "No se pudo actualizar el estado");
      }
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      setRedemptionMsg(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : "Error al actualizar el estado");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-green-800 mb-2">Panel de Cajero</h1>
        <p className="text-gray-600">Busca usuarios para añadir saldo o gestionar sus recompensas canjeadas.</p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <SearchForm 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            searching={searching}
            error={error}
          />
        </div>
        
        <div className="md:col-span-3">
          {results.length > 0 ? (
            <UsersTable 
              users={results}
              onSelectUser={handleSelectUser}
              onViewRedemptions={handleViewRedemptions}
              onOfferRewards={handleOfferRewards}
              onManagePetCards={handleManagePetCards}
            />
          ) : (!searching && !error && (
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md text-center w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <i className="fas fa-search text-green-200 text-5xl mb-4"></i>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No hay resultados</h3>
              <p className="text-gray-500">
                Utiliza el buscador para encontrar usuarios por nombre, apellidos, correo o teléfono.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
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
      />

      <RedemptionsModal
        isOpen={isRedemptionsModalOpen}
        onClose={closeRedemptionsModal}
        user={selectedUser}
        redemptions={userRedemptions}
        handleChangeRedemptionStatus={handleChangeRedemptionStatus}
        redemptionMsg={redemptionMsg}
        userRole={userRole}
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
        userRole={userRole}
      />
    </div>
  );
};

export default TellerDashboard;
